"use client";

import { useState } from "react";
import NotFound from "../not-found";
import Error500 from "../error";
import Forbidden from "../forbidden";
import Unauthorized from "../unauthorized";
import MaintenancePage from "../maintenance/page";
import { Eye, ShieldAlert, AlertTriangle, KeyRound, Wrench } from "lucide-react";

type ErrorType = "404" | "500" | "403" | "401" | "503";

export default function ErrorPreviewPage() {
  const [activeType, setActiveType] = useState<ErrorType>("404");

  return (
    <div className="relative min-h-[100dvh] bg-canvas text-ink overflow-x-hidden">
      {/* Floating Responsive Switcher Dock (Light) */}
      <div className="fixed bottom-3 sm:bottom-6 left-1/2 -translate-x-1/2 z-50 max-w-[94vw] sm:max-w-max">
        <aside
          aria-label="Error showcase switcher"
          className="p-1 sm:p-1.5 rounded-full bg-surface/95 backdrop-blur-xl border border-border shadow-popover flex items-center gap-1 overflow-x-auto no-scrollbar text-xs"
        >
          <div className="px-2.5 py-1 flex items-center gap-1.5 text-ink-muted font-semibold border-r border-border hidden md:flex whitespace-nowrap flex-shrink-0">
            <Eye className="w-3.5 h-3.5 text-accent" />
            <span>Showcase:</span>
          </div>

          <button
            onClick={() => setActiveType("404")}
            className={`flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-full font-medium transition whitespace-nowrap flex-shrink-0 ${
              activeType === "404"
                ? "bg-accent text-accent-ink"
                : "text-ink-muted hover:text-ink hover:bg-surface-raised"
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
            <span>404 Not Found</span>
          </button>

          <button
            onClick={() => setActiveType("500")}
            className={`flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-full font-medium transition whitespace-nowrap flex-shrink-0 ${
              activeType === "500"
                ? "bg-danger text-white"
                : "text-ink-muted hover:text-ink hover:bg-surface-raised"
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5 flex-shrink-0" />
            <span>500 Server</span>
          </button>

          <button
            onClick={() => setActiveType("403")}
            className={`flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-full font-medium transition whitespace-nowrap flex-shrink-0 ${
              activeType === "403"
                ? "bg-warning-ink text-white"
                : "text-ink-muted hover:text-ink hover:bg-surface-raised"
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5 flex-shrink-0" />
            <span>403 Forbidden</span>
          </button>

          <button
            onClick={() => setActiveType("401")}
            className={`flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-full font-medium transition whitespace-nowrap flex-shrink-0 ${
              activeType === "401"
                ? "bg-info-ink text-white"
                : "text-ink-muted hover:text-ink hover:bg-surface-raised"
            }`}
          >
            <KeyRound className="w-3.5 h-3.5 flex-shrink-0" />
            <span>401 Auth</span>
          </button>

          <button
            onClick={() => setActiveType("503")}
            className={`flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-full font-medium transition whitespace-nowrap flex-shrink-0 ${
              activeType === "503"
                ? "bg-success-ink text-white"
                : "text-ink-muted hover:text-ink hover:bg-surface-raised"
            }`}
          >
            <Wrench className="w-3.5 h-3.5 flex-shrink-0" />
            <span>503 Status</span>
          </button>
        </aside>
      </div>

      {/* Render selected error component */}
      <div className="pb-16 sm:pb-20">
        {activeType === "404" && <NotFound />}
        {activeType === "500" && (
          <Error500
            error={new Error("PrismaConnectionPoolTimeout: Database replica cluster took > 15000ms")}
            reset={() => alert("Reset callback triggered successfully!")}
          />
        )}
        {activeType === "403" && <Forbidden />}
        {activeType === "401" && <Unauthorized />}
        {activeType === "503" && <MaintenancePage />}
      </div>
    </div>
  );
}
