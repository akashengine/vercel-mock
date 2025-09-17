/* eslint-disable @next/next/no-sync-scripts */
export default function Document() {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>UPSC Interview – Voice</title>
        <style>{`
          :root{color-scheme:dark}
          body{margin:0;font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;background:#0b0b0b;color:#f2f2f2}
          main{max-width:960px;margin:0 auto;padding:16px}
          #controls{display:flex;gap:8px;flex-wrap:wrap;margin:12px 0}
          button{background:#14B8A6;color:#001314;border:0;padding:10px 14px;border-radius:6px;cursor:pointer}
          button.secondary{background:#333;color:#eee}
          pre{height:220px;overflow:auto;background:#111;padding:8px;border-radius:6px}
        `}</style>
        <script src="https://unpkg.com/@vapi-ai/web/dist/index.umd.js" async></script>
      </head>
      <body><main id="root"/></body>
    </html>
  );
}
