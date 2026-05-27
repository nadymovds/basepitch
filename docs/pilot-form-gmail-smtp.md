# Pilot Form via Local Node SMTP API (Fallback)

This is a local fallback setup.  
For static GitHub + subdomain deployment without your own backend, use:

- [`docs/deploy-github-apps-script.md`](./deploy-github-apps-script.md)

This setup sends landing form submissions directly to your Gmail inbox using your Google App Password.

## 1) Environment setup

Create `.env` in the project root:

```bash
VITE_PILOT_FORM_ENDPOINT=http://127.0.0.1:8787/api/pilot-request
VITE_OFFICIAL_KEY_HELP_URL=https://tuki.palloliitto.fi/fi/support/solutions/articles/103000036813-tason-rajapinta

SMTP_USER=your-address@gmail.com
SMTP_APP_PASSWORD=your-16-char-app-password
PILOT_FORM_TO=your-address@gmail.com
PILOT_FORM_PORT=8787
PILOT_FORM_ORIGIN=http://127.0.0.1:5173,http://localhost:5173
```

Notes:

- `SMTP_USER` is the Gmail address that sends emails.
- `SMTP_APP_PASSWORD` is your Google App Password.
- `PILOT_FORM_TO` can be another recipient mailbox. If omitted, it falls back to `SMTP_USER`.

## 2) Install dependencies

```bash
npm install
```

## 3) Run both processes

Terminal 1:

```bash
npm run dev:api
```

Terminal 2:

```bash
npm run dev
```

## 4) Test

1. Open the landing page.
2. Open the form with `Request a pilot` or `Contact`.
3. Submit with required fields: `Club name`, `Email`, `Message`.
3. Confirm success state in UI.
4. Confirm email arrives in `PILOT_FORM_TO`.
