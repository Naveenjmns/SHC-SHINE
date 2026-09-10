"use client";

import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Link from "next/link";
import {
  AlertCircle,
  Eye,
  EyeOff,
  Lock,
  Mail,
  ArrowLeft,
  Sparkles,
  ShieldCheck,
  Smartphone,
  ArrowRight,
} from "lucide-react";
import { safeJson } from "@/lib/safeFetch";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    try {
      const res = await signIn("credentials", {
        email: email.trim(),
        password,
        redirect: false,
      });

      if (!res || res.error) {
        setErrorMsg(res?.error || "Invalid email/mobile or password. Please verify credentials.");
        setLoading(false);
        return;
      }

      if (callbackUrl) {
        window.location.href = callbackUrl;
      } else {
        let role: string | null | undefined = null;
        try {
          const sessionRes = await fetch("/api/auth/session");
          const session = await safeJson(sessionRes, null);
          role = session?.user?.role;
        } catch {
          // ignore session fetch error
        }

        let target = "/dashboard";
        const normalizedInput = email.toLowerCase().trim();
        if (role === "ADMIN" || normalizedInput.includes("admin")) {
          target = "/admin";
        } else if (role === "COORDINATOR" || normalizedInput.includes("coord")) {
          target = "/coordinator";
        }
        window.location.href = target;
      }
    } catch (err) {
      console.error("Login error:", err);
      setErrorMsg("An unexpected connection error occurred. Please check network.");
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Outer Card with Glassmorphic Border and Glow */}
      <div className="relative rounded-3xl bg-white/95 backdrop-blur-xl border border-stone-200/90 shadow-xl shadow-stone-900/5 p-6 sm:p-8 overflow-hidden">
        {/* Subtle Top Gradient Edge */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[var(--fest-ember)] via-[var(--fest-gold)] to-[var(--fest-ember)]" />

        {/* Header Branding */}
        <div className="text-center mb-7">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--fest-ember)]/10 text-[var(--fest-ember)] border border-[var(--fest-ember)]/20 text-[11px] font-bold uppercase tracking-wider mb-3">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Secure Portal Access</span>
          </div>

          <h1
            className="text-2xl sm:text-3xl font-extrabold text-[#1C1917] tracking-tight"
            style={{ fontFamily: "var(--font-outfit), Outfit, sans-serif" }}
          >
            Sign In to <span className="hero-wordmark-gradient">SHINE 26</span>
          </h1>
          <p className="text-xs sm:text-sm text-[#78716C] mt-1.5 leading-relaxed max-w-xs mx-auto">
            Access your verified delegate badge, event registrations, or coordination desk.
          </p>
        </div>

        {/* Error Alert Box */}
        {errorMsg && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs p-3.5 rounded-2xl mb-5 flex items-start gap-2.5 animate-fade-in shadow-2xs">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span className="leading-relaxed font-medium">{errorMsg}</span>
          </div>
        )}

        {/* Main Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          {/* Email or Phone Input */}
          <div>
            <label
              htmlFor="login-identifier"
              className="block text-xs font-bold text-[#1C1917] mb-1.5"
            >
              Email Address or Mobile Number
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#78716C]">
                <Mail className="w-4 h-4" />
              </div>
              <input
                id="login-identifier"
                type="text"
                required
                autoComplete="username"
                placeholder="you@college.edu or 9876543210"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-12 pl-10 pr-3.5 bg-stone-50/70 border border-stone-300/80 rounded-xl text-sm text-[#1C1917] placeholder-[#A8A29E] focus:bg-white focus:outline-none focus:border-[var(--fest-ember)] focus:ring-2 focus:ring-[var(--fest-ember)]/15 transition-all shadow-2xs"
              />
            </div>
          </div>

          {/* Password Input with Show/Hide Toggle */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="login-password"
                className="block text-xs font-bold text-[#1C1917]"
              >
                Password
              </label>
              <span className="text-[11px] text-[#78716C]">
                Delegate: mobile number
              </span>
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#78716C]">
                <Lock className="w-4 h-4" />
              </div>
              <input
                id="login-password"
                type={showPassword ? "text" : "password"}
                required
                autoComplete="current-password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-12 pl-10 pr-12 bg-stone-50/70 border border-stone-300/80 rounded-xl text-sm text-[#1C1917] placeholder-[#A8A29E] focus:bg-white focus:outline-none focus:border-[var(--fest-ember)] focus:ring-2 focus:ring-[var(--fest-ember)]/15 transition-all shadow-2xs"
              />
              {/* Password View Toggle Button */}
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center justify-center text-[#78716C] hover:text-[#1C1917] transition-colors tap-target"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>

            {/* Delegate Password Helper Callout */}
            <div className="mt-2 p-2.5 rounded-xl bg-amber-50/80 border border-amber-200/60 text-[11px] text-amber-900 flex items-start gap-2">
              <Smartphone className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
              <p className="leading-snug">
                <strong>Registered Student Delegates:</strong> Use your registered 10-digit mobile number as your default password.
              </p>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="btn-ember w-full text-sm font-bold h-12 py-3 mt-3 shadow-md shadow-orange-500/20 disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Authenticating...</span>
              </>
            ) : (
              <>
                <span>Sign In to Portal</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Footer Navigation Strip */}
        <div className="mt-6 pt-5 border-t border-stone-200/80 text-center space-y-3 text-xs text-[#57534E]">
          <div>
            New student delegate or team?{" "}
            <Link
              href="/register"
              className="text-[var(--fest-ember)] font-bold hover:underline inline-flex items-center gap-0.5"
            >
              <span>Register for Events</span>
              <Sparkles className="w-3 h-3 text-[var(--fest-gold)]" />
            </Link>
          </div>

          <div>
            <Link
              href="/"
              className="text-[#78716C] hover:text-[#1C1917] transition inline-flex items-center gap-1 font-medium"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Main Stage</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <main className="min-h-screen flex flex-col bg-[#FAF8F5] text-[#1C1917] relative overflow-x-hidden">
      {/* Background Decorative Ambient Radial Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[450px] bg-gradient-to-b from-[var(--fest-ember)]/10 via-[var(--fest-gold)]/5 to-transparent blur-3xl pointer-events-none z-0" />

      <Navbar />

      <div className="relative z-10 pt-28 pb-16 px-4 sm:px-6 flex-1 flex items-center justify-center">
        <Suspense
          fallback={
            <div className="text-center py-12 text-sm text-[#78716C] flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-[var(--fest-ember)] border-t-transparent rounded-full animate-spin" />
              <span>Loading secure sign in...</span>
            </div>
          }
        >
          <LoginForm />
        </Suspense>
      </div>

      <Footer />
    </main>
  );
}
