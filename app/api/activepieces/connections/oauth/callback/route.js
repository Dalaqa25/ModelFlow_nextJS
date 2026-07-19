import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

function getTargetOrigin(request) {
  const configured =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.MODELGROW_APP_URL ||
    process.env.APP_URL ||
    '';

  if (configured) {
    return new URL(configured).origin;
  }

  return new URL(request.url).origin;
}

function callbackHtml({ targetOrigin, code, error, errorDescription }) {
  const payload = {
    type: 'modelgrow_activepieces_oauth',
    code: code || null,
    error: error || null,
    errorDescription: errorDescription || null,
  };

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>ModelGrow connection</title>
    <style>
      body {
        align-items: center;
        background: radial-gradient(circle at top left, #7c3aed33, transparent 32rem), #070817;
        color: #f8fafc;
        display: flex;
        font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        justify-content: center;
        min-height: 100vh;
        margin: 0;
      }
      main {
        border: 1px solid rgba(168, 85, 247, 0.28);
        border-radius: 24px;
        background: rgba(15, 23, 42, 0.72);
        box-shadow: 0 24px 80px rgba(0, 0, 0, 0.28);
        max-width: 28rem;
        padding: 2rem;
        text-align: center;
      }
      p { color: #cbd5e1; line-height: 1.6; }
    </style>
  </head>
  <body>
    <main>
      <h1>${error ? 'Connection did not finish' : 'Connection finished'}</h1>
      <p>${error ? 'You can close this window and try again from ModelGrow.' : 'You can close this window. ModelGrow will continue setup automatically.'}</p>
    </main>
    <script>
      const payload = ${JSON.stringify(payload).replace(/</g, '\\u003c')};
      const targetOrigin = ${JSON.stringify(targetOrigin)};
      if (window.opener && !window.opener.closed) {
        window.opener.postMessage(payload, targetOrigin);
        window.setTimeout(() => window.close(), 250);
      }
    </script>
  </body>
</html>`;
}

export async function GET(request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code') || '';
  const error = url.searchParams.get('error') || '';
  const errorDescription = url.searchParams.get('error_description') || url.searchParams.get('errorDescription') || '';

  return new NextResponse(callbackHtml({
    targetOrigin: getTargetOrigin(request),
    code,
    error,
    errorDescription,
  }), {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}
