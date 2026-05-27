import http from 'node:http';
import nodemailer from 'nodemailer';

const smtpUser = process.env.SMTP_USER || '';
const smtpAppPassword = process.env.SMTP_APP_PASSWORD || '';
const recipientEmail = process.env.PILOT_FORM_TO || smtpUser;
const serverPort = Number(process.env.PILOT_FORM_PORT || 8787);
const allowedOrigins = (process.env.PILOT_FORM_ORIGIN || 'http://127.0.0.1:5173,http://localhost:5173')
  .split(',')
  .map((item) => item.trim())
  .filter(Boolean);

function getCorsHeaders(origin) {
  const allowOrigin = origin && allowedOrigins.includes(origin) ? origin : allowedOrigins[0];
  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
}

function sendJson(response, origin, statusCode, payload) {
  response.writeHead(statusCode, {
    ...getCorsHeaders(origin),
    'Content-Type': 'application/json; charset=utf-8',
  });
  response.end(JSON.stringify(payload));
}

async function readBody(request) {
  const chunks = [];
  for await (const chunk of request) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString('utf8');
}

function validatePayload(payload) {
  if (!payload || typeof payload !== 'object') {
    return 'Invalid request payload.';
  }

  if (!payload.email || !payload.message) {
    return 'Missing required fields.';
  }

  return '';
}

function createTransporter() {
  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: smtpUser,
      pass: smtpAppPassword,
    },
  });
}

function assertRecipientAccepted(info, recipient, label) {
  const accepted = Array.isArray(info?.accepted) ? info.accepted : [];
  const rejected = Array.isArray(info?.rejected) ? info.rejected : [];
  const normalizedRecipient = String(recipient || '').trim().toLowerCase();
  const acceptedNormalized = accepted.map((item) => String(item).trim().toLowerCase());
  const rejectedNormalized = rejected.map((item) => String(item).trim().toLowerCase());

  if (acceptedNormalized.length === 0 || !acceptedNormalized.includes(normalizedRecipient)) {
    throw new Error(`${label} was not accepted by SMTP.`);
  }

  if (rejectedNormalized.includes(normalizedRecipient)) {
    throw new Error(`${label} was rejected by SMTP.`);
  }
}

async function sendInternalNotification(payload, transporter) {
  const clubName = typeof payload.clubName === 'string' && payload.clubName.trim().length > 0 ? payload.clubName.trim() : '-';
  const lines = [
    'New BasePitch pilot request',
    '',
    `Club: ${clubName}`,
    `Email: ${payload.email}`,
    `Message: ${payload.message || '-'}`,
    `Intent: ${payload.leadIntent || '-'}`,
    `Source: ${payload.source || '-'}`,
    `Submitted at: ${payload.submittedAt || '-'}`,
  ];

  const info = await transporter.sendMail({
    from: `"BasePitch Pilot Form" <${smtpUser}>`,
    to: recipientEmail,
    subject: `BasePitch pilot request: ${clubName}`,
    text: lines.join('\n'),
    replyTo: payload.email,
  });

  assertRecipientAccepted(info, recipientEmail, 'Internal notification');
}

async function sendCustomerAutoReply(payload, transporter) {
  const lines = [
    'Hi,',
    'Thank you for your request — we received it successfully.',
    'We will contact you as soon as possible.',
    'Best regards,',
    'Denis Nadymov',
    'BasePitch',
  ];

  const info = await transporter.sendMail({
    from: `"BasePitch" <${smtpUser}>`,
    to: payload.email,
    subject: 'We received your BasePitch request',
    text: lines.join('\n'),
    replyTo: smtpUser,
  });

  assertRecipientAccepted(info, payload.email, 'Customer auto-reply');

  console.log('Customer auto-reply accepted by SMTP:', {
    accepted: info.accepted,
    rejected: info.rejected,
    response: info.response,
    messageId: info.messageId,
  });
}

const server = http.createServer(async (request, response) => {
  const origin = request.headers.origin || '';

  if (request.method === 'OPTIONS') {
    response.writeHead(204, getCorsHeaders(origin));
    response.end();
    return;
  }

  if (request.url !== '/api/pilot-request' || request.method !== 'POST') {
    sendJson(response, origin, 404, { ok: false, error: 'Not found' });
    return;
  }

  if (!smtpUser || !smtpAppPassword || !recipientEmail) {
    sendJson(response, origin, 500, { ok: false, error: 'SMTP server is not configured.' });
    return;
  }

  try {
    const rawBody = await readBody(request);
    const payload = JSON.parse(rawBody || '{}');
    const validationError = validatePayload(payload);

    if (validationError) {
      sendJson(response, origin, 400, { ok: false, error: validationError });
      return;
    }

    const transporter = createTransporter();
    await sendInternalNotification(payload, transporter);
    await sendCustomerAutoReply(payload, transporter);
    sendJson(response, origin, 200, { ok: true });
  } catch (error) {
    sendJson(response, origin, 500, { ok: false, error: String(error) });
  }
});

server.listen(serverPort, () => {
  console.log(`Pilot form SMTP API is running on http://127.0.0.1:${serverPort}`);
});
