"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Critical Layout Exception:", error);
  }, [error]);

  return (
    <html lang="en">
      <head>
        <title>SHINE 26 • System Recovery</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <style>{`
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            background-color: #0A0908;
            color: #F8FAFC;
            min-height: 100vh;
            min-height: 100dvh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 16px;
            overflow-x: hidden;
            position: relative;
          }
          .grid-bg {
            position: fixed;
            inset: 0;
            background-image: 
              linear-gradient(to right, rgba(255,255,255,0.06) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(255,255,255,0.06) 1px, transparent 1px);
            background-size: 32px 32px;
            transform: perspective(600px) rotateX(60deg) translateY(-80px) scale(2.2);
            transform-origin: top center;
            opacity: 0.7;
            pointer-events: none;
          }
          .card {
            position: relative;
            z-index: 10;
            max-width: 480px;
            width: 100%;
            text-align: center;
            background: rgba(18, 16, 15, 0.85);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            padding: 36px 24px;
            border-radius: 24px;
            border: 1px solid rgba(255,255,255,0.1);
            box-shadow: 0 25px 50px -12px rgba(0,0,0,0.8);
          }
          .badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 9999px;
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.15em;
            background: rgba(244, 63, 94, 0.15);
            color: #FB7185;
            border: 1px solid rgba(244, 63, 94, 0.3);
            margin-bottom: 18px;
          }
          h1 {
            font-family: Georgia, serif;
            font-size: clamp(28px, 6vw, 40px);
            font-weight: 400;
            line-height: 1.15;
            color: #FFFFFF;
            margin-bottom: 12px;
          }
          p {
            font-size: clamp(13px, 3.5vw, 15px);
            color: #A1A1AA;
            line-height: 1.6;
            margin-bottom: 24px;
          }
          .btn-group {
            display: flex;
            gap: 10px;
            justify-content: center;
            flex-direction: column;
          }
          @media (min-width: 480px) {
            .btn-group {
              flex-direction: row;
            }
          }
          .btn-primary {
            background-color: #FF6B1A;
            color: #FFFFFF;
            border: none;
            padding: 12px 24px;
            border-radius: 9999px;
            font-size: 13px;
            font-weight: 600;
            cursor: pointer;
            text-decoration: none;
            transition: opacity 0.2s;
            min-height: 44px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
          }
          .btn-primary:hover { opacity: 0.9; }
          .btn-secondary {
            background: rgba(255, 255, 255, 0.08);
            color: #E4E4E7;
            border: 1px solid rgba(255, 255, 255, 0.15);
            padding: 12px 24px;
            border-radius: 9999px;
            font-size: 13px;
            font-weight: 600;
            cursor: pointer;
            text-decoration: none;
            min-height: 44px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
          }
          .btn-secondary:hover { background: rgba(255, 255, 255, 0.12); }
          .digest {
            margin-top: 20px;
            font-family: monospace;
            font-size: 11px;
            color: #71717A;
            word-break: break-all;
          }
        `}</style>
      </head>
      <body>
        <div className="grid-bg" />
        <div className="card">
          <div className="badge">Critical Error</div>
          <h1>System Failure</h1>
          <p>
            The root layout failed to initialize. We have preserved your session data and can attempt an immediate recovery.
          </p>
          <div className="btn-group">
            <button className="btn-primary" onClick={() => reset()}>
              Reload & Recover
            </button>
            <a className="btn-secondary" href="/">
              Return Home
            </a>
          </div>
          {error?.digest && (
            <div className="digest">Trace: {error.digest}</div>
          )}
        </div>
      </body>
    </html>
  );
}
