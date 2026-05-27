# Deploy BasePitch as Static Site (GitHub + Subdomain + Apps Script)

This setup runs BasePitch as a static frontend without your own backend server.

## 1) Create and deploy Google Apps Script web app

1. Open [Google Apps Script](https://script.google.com) and create a new standalone project.
2. Paste contents of [`apps-script/pilot-form-webapp.gs`](../apps-script/pilot-form-webapp.gs).
3. Update `CONFIG`:
   - `internalRecipient`: mailbox where you receive incoming requests (for you: `nadymov.ds@gmail.com`).
   - `allowedOrigins`: production domain(s) and local dev origins (for you: `https://basepitch.scribeit.tech`, optional `https://www.basepitch.scribeit.tech`, plus localhost entries).
4. Deploy:
   - `Deploy` -> `New deployment` -> `Web app`
   - Execute as: **Me**
   - Who has access: **Anyone**
5. Copy the web app URL (`.../exec`).

## 2) Configure frontend endpoint

Create `.env` from `.env.example` and set:

```bash
VITE_PILOT_FORM_ENDPOINT=https://script.google.com/macros/s/REPLACE_WITH_YOUR_WEB_APP_ID/exec
VITE_OFFICIAL_KEY_HELP_URL=https://tuki.palloliitto.fi/fi/support/solutions/articles/103000036813-tason-rajapinta
```

Build:

```bash
npm install
npm run build
```

## 3) Publish on GitHub Pages

1. Push repo to GitHub.
2. Enable Pages in repository settings (deploy from branch or Actions).
3. If you host from subdomain root, current asset paths work as-is.

## 4) Connect custom subdomain

1. In GitHub Pages settings, set custom domain (example: `landing.oldstartup.com`).
2. Add DNS record at your DNS provider:
   - `CNAME landing.oldstartup.com -> <your-github-username>.github.io`
3. Enable HTTPS in GitHub Pages settings after DNS propagation.

## 5) Verify production

1. Open landing on your subdomain and ensure screenshots/logo load.
2. Submit form with email + message.
3. Confirm:
   - internal notification email arrives to `internalRecipient`;
   - sender receives auto-reply.
4. Submit with empty club name and confirm it still succeeds.

## Notes

- The frontend sends form payload as `text/plain` JSON to improve Apps Script compatibility.
- The legacy local Node SMTP API (`server/pilot-form-smtp.mjs`) can still be used for local fallback.
