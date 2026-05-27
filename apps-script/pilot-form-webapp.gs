const CONFIG = {
  internalRecipient: 'nadymov.ds@gmail.com',
  allowedOrigins: [
    'https://basepitch.scribeit.tech',
    'https://www.basepitch.scribeit.tech',
    'http://localhost:5173',
    'http://127.0.0.1:5173',
  ],
};

function doPost(e) {
  try {
    const raw = e && e.postData && e.postData.contents ? String(e.postData.contents) : '{}';
    const payload = JSON.parse(raw);
    const requestedOrigin =
      (e && e.parameter && typeof e.parameter.origin === 'string' && e.parameter.origin) ||
      (payload && typeof payload.origin === 'string' && payload.origin) ||
      '';

    if (!isAllowedOrigin(requestedOrigin)) {
      return jsonResponse(403, { ok: false, error: 'Origin is not allowed.' });
    }

    const validationError = validatePayload(payload);
    if (validationError) {
      return jsonResponse(400, { ok: false, error: validationError });
    }

    sendInternalNotification(payload);
    sendCustomerAutoReply(payload);

    return jsonResponse(200, { ok: true });
  } catch (error) {
    return jsonResponse(500, { ok: false, error: String(error) });
  }
}

function doGet() {
  return jsonResponse(200, { ok: true, service: 'basepitch-pilot-form' });
}

function validatePayload(payload) {
  if (!payload || typeof payload !== 'object') {
    return 'Invalid request payload.';
  }

  const email = String(payload.email || '').trim();
  const message = String(payload.message || '').trim();

  if (!email || !message) {
    return 'Missing required fields.';
  }

  return '';
}

function isAllowedOrigin(origin) {
  const value = String(origin || '').trim();
  if (CONFIG.allowedOrigins.indexOf('*') !== -1) {
    return true;
  }
  return value && CONFIG.allowedOrigins.indexOf(value) !== -1;
}

function sendInternalNotification(payload) {
  const clubName = String(payload.clubName || '').trim() || '-';
  const lines = [
    'New BasePitch pilot request',
    '',
    'Club: ' + clubName,
    'Email: ' + String(payload.email || '-'),
    'Message: ' + String(payload.message || '-'),
    'Intent: ' + String(payload.leadIntent || '-'),
    'Source: ' + String(payload.source || '-'),
    'Submitted at: ' + String(payload.submittedAt || '-'),
  ];

  MailApp.sendEmail({
    to: CONFIG.internalRecipient,
    subject: 'BasePitch pilot request: ' + clubName,
    body: lines.join('\n'),
    replyTo: String(payload.email || ''),
    name: 'BasePitch Pilot Form',
  });
}

function sendCustomerAutoReply(payload) {
  const lines = [
    'Hi,',
    'Thank you for your request — we received it successfully.',
    'We will contact you as soon as possible.',
    'Best regards,',
    'Denis Nadymov',
    'BasePitch',
  ];

  MailApp.sendEmail({
    to: String(payload.email || ''),
    subject: 'We received your BasePitch request',
    body: lines.join('\n'),
    replyTo: CONFIG.internalRecipient,
    name: 'BasePitch',
  });
}

function jsonResponse(statusCode, payload) {
  const body = JSON.stringify({
    status: statusCode,
    ...payload,
  });

  return ContentService.createTextOutput(body).setMimeType(ContentService.MimeType.JSON);
}
