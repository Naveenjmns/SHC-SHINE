"use client";

import { useState, useEffect, Suspense } from "react";
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
import { isSafeRelativePath } from "@/lib/validators";
import { festTitle } from "@/lib/editionDefaults";

/** Active edition's fest title ("<name> <edition>"), with a neutral fallback until it loads */
function useFestTitle() {
  const [eventTitle, setEventTitle] = useState(() => festTitle(null));

  useEffect(() => {
    let isMounted = true;
    fetch("/api/edition/active")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (isMounted && data?.success && data?.edition) {
          setEventTitle(festTitle(data.edition));
        }
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, []);

  return eventTitle;
}

function LoginForm({ eventTitle }: { eventTitle: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  // SECURITY: Only honour same-origin relative callback paths (blocks open redirects and javascript: URIs)
  const rawCallbackUrl = searchParams.get("callbackUrl");
  const callbackUrl = isSafeRelativePath(rawCallbackUrl) ? rawCallbackUrl : null;
  const emailParam = searchParams.get("email") || "";

  const [email, setEmail] = useState(emailParam);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (emailParam && !email) {
      setEmail(emailParam);
    }
  }, [emailParam, email]);

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

        // Route by the account's real role only (guessing from words in the email sent e.g. a
        // coordinator with "food" in their address to /food, which then bounced them away)
        let target = "/dashboard";
        if (role === "ADMIN") {
          target = "/admin";
        } else if (role === "FOOD_COORDINATOR") {
          target = "/food";
        } else if (role === "COORDINATOR") {
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
    <div className="w-full">
      <div className="relative rounded-3xl bg-surface border border-border shadow-elevated p-6 sm:p-8">
        {/* Header Branding */}
        <div className="mb-7">
          <span className="pill-badge mb-4">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Secure Portal Access</span>
          </span>

          <h2 className="text-xl sm:text-2xl font-bold text-ink tracking-tight">
            Sign in to <span className="text-accent">{eventTitle}</span>
          </h2>
          <p className="text-[15px] text-ink-muted mt-1.5 leading-relaxed">
            Access your verified delegate badge, event registrations, or coordination desk.
          </p>
        </div>

        {/* Error Alert Box */}
        {errorMsg && (
          <div
            role="alert"
            className="bg-danger-surface border border-danger-border text-danger-ink text-[15px] p-3.5 rounded-[8px] mb-5 flex items-start gap-2.5 animate-fade-in"
          >
            <AlertCircle className="w-4 h-4 text-danger shrink-0 mt-0.5" />
            <span className="leading-relaxed font-medium">{errorMsg}</span>
          </div>
        )}

        {/* Main Form */}
        <form onSubmit={handleLogin} className="space-y-5">
          {/* Email or Phone Input */}
          <div>
            <label
              htmlFor="login-identifier"
              className="block text-[15px] font-semibold text-ink mb-1.5"
            >
              Email Address or Mobile Number
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-ink-subtle">
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
                className="w-full h-12 pl-10 pr-3.5 bg-surface border border-border-strong rounded-[8px] text-base text-ink placeholder:text-ink-subtle focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-colors"
              />
            </div>
          </div>

          {/* Password Input with Show/Hide Toggle */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="login-password"
                className="block text-[15px] font-semibold text-ink"
              >
                Password
              </label>
              <span className="text-sm text-ink-subtle">
                Delegate: mobile number
              </span>
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-ink-subtle">
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
                className="w-full h-12 pl-10 pr-12 bg-surface border border-border-strong rounded-[8px] text-base text-ink placeholder:text-ink-subtle focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-colors"
              />
              {/* Password View Toggle Button */}
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center justify-center text-ink-subtle hover:text-ink transition-colors tap-target"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>

            {/* Delegate Password Helper Callout */}
            <div className="mt-3 p-3 rounded-[8px] bg-surface-raised text-sm text-ink-muted flex items-start gap-2">
              <Smartphone className="w-3.5 h-3.5 text-accent shrink-0 mt-0.5" />
              <p className="leading-snug">
                <strong className="text-ink">Registered Student Delegates:</strong> Use your registered 10-digit mobile number as your default password.
              </p>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full text-base font-semibold h-12 py-3 mt-2 disabled:opacity-60 flex items-center justify-center gap-2"
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
        <div className="mt-6 pt-5 border-t border-border space-y-3 text-[15px] text-ink-muted">
          <div>
            New student delegate or team?{" "}
            <Link
              href="/register"
              className="text-accent font-semibold hover:underline inline-flex items-center gap-1"
            >
              <span>Register for Events</span>
              <Sparkles className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div>
            <Link
              href="/"
              className="text-ink-muted hover:text-accent transition-colors inline-flex items-center gap-1 font-medium"
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
  const eventTitle = useFestTitle();

  return (
    <main className="min-h-screen flex flex-col bg-canvas text-ink relative overflow-x-hidden">
      <Navbar />

      <div className="relative z-10 flex-1 pt-28 pb-20 lg:pt-36 lg:pb-28">
        <div className="container-shine grid grid-cols-1 lg:grid-cols-[1fr_minmax(0,460px)] gap-12 lg:gap-16 items-center">
          {/* Left column — headline + copy */}
          <div className="flex flex-col items-start text-left">
            <span className="eyebrow mb-4">Delegate &amp; staff portal</span>
            <h1 className="text-fluid-h1 text-ink">
              Welcome back to <span className="text-accent">{eventTitle}</span>
            </h1>
            <p className="mt-5 text-lg text-ink-muted leading-relaxed max-w-lg">
              Sign in to view your digital delegate pass, track event registrations, or open your coordination desk.
            </p>
            <ul className="mt-8 space-y-3 text-base text-ink-muted">
              <li className="flex items-center gap-3">
                <ShieldCheck className="w-5 h-5 text-accent shrink-0" />
                <span>Verified delegate badge with QR check-in</span>
              </li>
              <li className="flex items-center gap-3">
                <Sparkles className="w-5 h-5 text-accent shrink-0" />
                <span>Live event schedule and registrations</span>
              </li>
              <li className="flex items-center gap-3">
                <Smartphone className="w-5 h-5 text-accent shrink-0" />
                <span>Delegates sign in with their registered mobile number</span>
              </li>
            </ul>
          </div>

          {/* Right column — form card over decorative blobs */}
          <div className="blob-stage w-full max-w-md mx-auto lg:max-w-none">
            <div
              aria-hidden="true"
              className="blob blob-magenta w-56 h-56 sm:w-72 sm:h-72 -top-10 -right-6 sm:-right-12"
            />
            <div
              aria-hidden="true"
              className="blob blob-cyan w-48 h-48 sm:w-64 sm:h-64 -bottom-12 -left-6 sm:-left-14"
            />
            <Suspense
              fallback={
                <div className="relative rounded-3xl bg-surface border border-border shadow-elevated p-8 text-center text-[15px] text-ink-muted flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                  <span>Loading secure sign in...</span>
                </div>
              }
            >
              <LoginForm eventTitle={eventTitle} />
            </Suspense>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
}
