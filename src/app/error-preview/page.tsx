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
    <div className="relative min-h-[100dvh] bg-[#0A0908] text-stone-100 overflow-x-hidden">
      {/* Floating Responsive Switcher Dock (Pure Dark) */}
      <div className="fixed bottom-3 sm:bottom-6 left-1/2 -translate-x-1/2 z-50 max-w-[94vw] sm:max-w-max">
        <aside
          aria-label="Error showcase switcher"
          className="p-1 sm:p-1.5 rounded-full bg-stone-950/95 backdrop-blur-xl border border-stone-800 shadow-2xl flex items-center gap-1 overflow-x-auto no-scrollbar text-xs"
        >
          <div className="px-2.5 py-1 flex items-center gap-1.5 text-stone-400 font-semibold border-r border-stone-800 hidden md:flex whitespace-nowrap flex-shrink-0">
            <Eye className="w-3.5 h-3.5 text-[#FF6B1A]" />
            <span>Showcase:</span>
          </div>

          <button
            onClick={() => setActiveType("404")}
            className={`flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-full font-medium transition whitespace-nowrap flex-shrink-0 ${
              activeType === "404"
                ? "bg-[#FF6B1A] text-white shadow-md shadow-orange-500/30"
                : "text-stone-400 hover:text-white hover:bg-stone-900"
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
            <span>404 Not Found</span>
          </button>

          <button
            onClick={() => setActiveType("500")}
            className={`flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-full font-medium transition whitespace-nowrap flex-shrink-0 ${
              activeType === "500"
                ? "bg-rose-600 text-white shadow-md shadow-rose-500/30"
                : "text-stone-400 hover:text-white hover:bg-stone-900"
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5 flex-shrink-0" />
            <span>500 Server</span>
          </button>

          <button
            onClick={() => setActiveType("403")}
            className={`flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-full font-medium transition whitespace-nowrap flex-shrink-0 ${
              activeType === "403"
                ? "bg-amber-600 text-white shadow-md shadow-amber-500/30"
                : "text-stone-400 hover:text-white hover:bg-stone-900"
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5 flex-shrink-0" />
            <span>403 Forbidden</span>
          </button>

          <button
            onClick={() => setActiveType("401")}
            className={`flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-full font-medium transition whitespace-nowrap flex-shrink-0 ${
              activeType === "401"
                ? "bg-blue-600 text-white shadow-md shadow-blue-500/30"
                : "text-stone-400 hover:text-white hover:bg-stone-900"
            }`}
          >
            <KeyRound className="w-3.5 h-3.5 flex-shrink-0" />
            <span>401 Auth</span>
          </button>

          <button
            onClick={() => setActiveType("503")}
            className={`flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-full font-medium transition whitespace-nowrap flex-shrink-0 ${
              activeType === "503"
                ? "bg-emerald-600 text-white shadow-md shadow-emerald-500/30"
                : "text-stone-400 hover:text-white hover:bg-stone-900"
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
