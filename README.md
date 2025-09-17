# Vercel Voice Web SDK

A minimal Next.js app that hosts Vapi Web SDK controls in a top-level page (best for microphone permissions).

## Deploy

1. Push this folder to a new GitHub repo or import directly in Vercel.
2. On Vercel, set Environment Variables (Production + Preview):
   - `NEXT_PUBLIC_VAPI_PUBLIC_KEY` = your Vapi Public key
3. Deploy.

## Usage

Open your deployed URL with optional query params:

- `?assistantId=YOUR_ASSISTANT_ID`
- `?publicKey=YOUR_PUBLIC_KEY` (overrides env)

Example:

`https://your-app.vercel.app/?assistantId=abc123&publicKey=pk_live_xxx`

Buttons provided: Start / End / Mute / Unmute. Transcript lines stream into the log area.

## Notes

- Top-level page → browsers show mic prompts reliably.
- If blocked, check browser mic permissions and OS privacy settings.
