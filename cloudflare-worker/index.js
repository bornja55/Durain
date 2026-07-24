/**
 * LINE Webhook Signature Verifier (Cloudflare Worker)
 * ----------------------------------------------------
 * Purpose: Google Apps Script's doPost(e) cannot read HTTP headers
 * (this is an official platform limitation, confirmed by Google), so
 * it cannot check LINE's X-Line-Signature header itself. This Worker
 * sits in front of the GAS web app ONLY for the LINE webhook (POST)
 * traffic, verifies the signature properly using the real Channel
 * Secret, and only forwards genuine requests through.
 *
 * It does NOT touch the Dashboard/LIFF URLs — those keep pointing
 * straight at the GAS exec URL exactly as before.
 *
 * Required environment variables (set in Cloudflare dashboard ->
 * Workers & Pages -> this worker -> Settings -> Variables and Secrets):
 *   - LINE_CHANNEL_SECRET  (Secret)  same value as Config sheet's CHANNEL_SECRET
 *   - PROXY_SECRET         (Secret)  a new random string you invent yourself;
 *                                    must match the PROXY_SECRET you put in
 *                                    GAS (Script Properties)
 *   - GAS_EXEC_URL         (Text)    your Apps Script Web App /exec URL
 */

export default {
  async fetch(request, env, ctx) {
    // Anything that isn't a webhook POST, just answer OK and stop.
    if (request.method !== 'POST') {
      return new Response('OK', { status: 200 });
    }

    const signature = request.headers.get('x-line-signature');
    if (!signature) {
      return new Response('Missing signature', { status: 401 });
    }

    const bodyText = await request.text();

    let valid = false;
    try {
      valid = await verifyLineSignature(bodyText, signature, env.LINE_CHANNEL_SECRET);
    } catch (err) {
      return new Response('Verification error', { status: 500 });
    }

    if (!valid) {
      return new Response('Invalid signature', { status: 401 });
    }

    if (!env.GAS_EXEC_URL) {
      return new Response('Worker misconfigured: GAS_EXEC_URL missing', { status: 500 });
    }

    const gasUrl = new URL(env.GAS_EXEC_URL);
    gasUrl.searchParams.set('proxy_secret', env.PROXY_SECRET || '');

    // Reply to LINE immediately so we never trigger LINE's retry-on-timeout
    // behavior even if Sheets/GAS is slow; forward in the background.
    ctx.waitUntil(
      fetch(gasUrl.toString(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: bodyText,
      }).catch(() => {})
    );

    return new Response('OK', { status: 200 });
  },
};

async function verifyLineSignature(body, signatureBase64, secret) {
  if (!secret || !signatureBase64) return false;

  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const mac = await crypto.subtle.sign('HMAC', key, enc.encode(body));
  const computedBase64 = arrayBufferToBase64(mac);
  return timingSafeEqualStr(computedBase64, signatureBase64);
}

function arrayBufferToBase64(buffer) {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

// Constant-time string comparison so signature checking doesn't leak
// timing information about how many leading characters matched.
function timingSafeEqualStr(a, b) {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}
