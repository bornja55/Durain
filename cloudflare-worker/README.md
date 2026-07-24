# LINE Webhook Signature Verifier (Cloudflare Worker)

Fronts *only* the LINE webhook POST endpoint so we can verify
`X-Line-Signature` properly (Google Apps Script's `doPost` cannot read
HTTP headers at all — confirmed platform limitation — so it cannot do
this check itself). The Dashboard/LIFF URLs are unaffected and keep
pointing directly at the GAS `/exec` URL.

## Deploy option A — Cloudflare dashboard (no CLI, no token needed)

1. dash.cloudflare.com → **Workers & Pages** → **Create** → **Create Worker**
2. Give it a name (e.g. `durian-line-verifier`) → Deploy the default template
3. Click **Edit code**, delete everything, paste in the contents of `index.js` → **Save and deploy**
4. Go to **Settings → Variables and Secrets** and add:
   - `LINE_CHANNEL_SECRET` — type **Secret** — same value as the `CHANNEL_SECRET` row in the Config sheet / Script Properties
   - `PROXY_SECRET` — type **Secret** — a new random string you invent (must match what you put in GAS Script Properties as `PROXY_SECRET`)
   - `GAS_EXEC_URL` — type **Text** — your Apps Script Web App `/exec` URL
5. Your webhook URL is now `https://durian-line-verifier.<your-subdomain>.workers.dev`

## Deploy option B — Wrangler CLI

```
cd cloudflare-worker
npx wrangler login          # opens browser, no token needed
npx wrangler deploy
npx wrangler secret put LINE_CHANNEL_SECRET
npx wrangler secret put PROXY_SECRET
```
Then add `GAS_EXEC_URL` either by uncommenting it in `wrangler.toml` before
deploying, or adding it as a plain Variable in the dashboard afterward.

## Cutover (do this LAST, only after both sides are ready)

1. Add a `PROXY_SECRET` row to the GAS Config / Script Properties (must match the Worker's)
2. Deploy the updated Apps Script code (checks `proxy_secret` on every request)
3. Only then: LINE Developers Console → Messaging API → Webhook URL → change to the Worker's URL
4. Use the **Verify** button in the LINE console to confirm it returns success
5. Send a real test message to the bot and confirm it still replies

If you flip the LINE console's Webhook URL before the GAS side checks
`proxy_secret`, the bot will simply stop responding until both sides match.
