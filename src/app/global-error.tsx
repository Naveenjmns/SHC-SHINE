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
            font-family: "Manrope", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            background-color: #F8F9FB;
            color: #0B3558;
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
              linear-gradient(to right, rgba(11,53,88,0.06) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(11,53,88,0.06) 1px, transparent 1px);
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
            background: #FFFFFF;
            padding: 36px 24px;
            border-radius: 24px;
            border: 1px solid #D4E0ED;
            box-shadow: rgba(71, 103, 136, 0.04) 0px 4px 5px 0px, rgba(71, 103, 136, 0.03) 0px 8px 15px 0px, rgba(71, 103, 136, 0.08) 0px 30px 50px 0px;
          }
          .badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 9999px;
            font-size: 11px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            background: #FDF2F2;
            color: #9B1C1C;
            border: 1px solid #FBD5D5;
            margin-bottom: 18px;
          }
          h1 {
            font-size: clamp(28px, 6vw, 40px);
            font-weight: 700;
            line-height: 1.2;
            color: #0B3558;
            margin-bottom: 12px;
          }
          p {
            font-size: clamp(13px, 3.5vw, 15px);
            color: #476788;
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
            background-color: #006BFF;
            color: #FFFFFF;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            text-decoration: none;
            transition: opacity 0.2s;
            min-height: 44px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
          }
          .btn-primary:hover { background-color: #0058D6; }
          .btn-secondary {
            background: #FFFFFF;
            color: #0B3558;
            border: 1px solid #D4E0ED;
            padding: 12px 24px;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            text-decoration: none;
            min-height: 44px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
          }
          .btn-secondary:hover { border-color: #006BFF; color: #006BFF; }
          .digest {
            margin-top: 20px;
            font-family: monospace;
            font-size: 11px;
            color: #56708D;
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
