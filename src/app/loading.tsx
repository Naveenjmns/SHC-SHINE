export default function Loading() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#0C0A09] px-4">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[400px] pointer-events-none">
        <div className="w-full h-full rounded-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#FF6B1A]/10 via-[#D9A441]/5 to-transparent blur-3xl opacity-80" />
      </div>

      <div className="relative z-10 flex flex-col items-center gap-6">
        {/* Animated Spinner */}
        <div className="relative w-16 h-16">
          {/* Outer ring */}
          <div
            className="absolute inset-0 rounded-full border-2 border-stone-800"
          />
          {/* Spinning arc */}
          <div
            className="absolute inset-0 rounded-full border-2 border-transparent border-t-[#FF6B1A] border-r-[#D9A441] animate-spin"
          />
          {/* Inner glow dot */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-[#FF6B1A] shadow-[0_0_12px_rgba(255,107,26,0.6)]" />
        </div>

        {/* Loading Text */}
        <div className="text-center space-y-1.5">
          <p
            className="text-sm font-bold text-stone-300 tracking-wide uppercase"
            style={{ fontFamily: "var(--font-outfit), Outfit, sans-serif" }}
          >
            Loading
          </p>
          <p className="text-xs text-stone-600">
            Preparing your experience...
          </p>
        </div>

        {/* Skeleton Content Preview */}
        <div className="w-full max-w-sm space-y-3 mt-4">
          <div className="h-3 w-3/4 mx-auto rounded-full skeleton" />
          <div className="h-3 w-1/2 mx-auto rounded-full skeleton" />
          <div className="h-3 w-2/3 mx-auto rounded-full skeleton" />
        </div>
      </div>
    </div>
  );
}
