"use client";

import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Link from "next/link";
import { AlertCircle } from "lucide-react";
import { safeJson } from "@/lib/safeFetch";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    try {
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (!res || res.error) {
        setErrorMsg(res?.error || "Invalid email or password. Please try again.");
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
      setErrorMsg("An unexpected connection error occurred.");
      setLoading(false);
    }
  };

  return (
    <div className="container-shine py-12 max-w-md mx-auto">
      <div className="fest-card p-6 sm:p-8">
        <div className="text-center mb-8">
          <span className="inline-block px-3 py-1 rounded-full bg-[#FF6B1A]/10 text-[#FF6B1A] border border-[#FF6B1A]/20 text-xs font-bold uppercase tracking-wider mb-2">
            Portal Access
          </span>
          <h1
            className="text-fluid-h2 font-extrabold text-[#1C1917]"
            style={{ fontFamily: "var(--font-outfit), Outfit, sans-serif" }}
          >
            Sign In to <span className="hero-wordmark-gradient">SHINE 26</span>
          </h1>
          <p className="text-xs text-[#57534E] mt-1">
            Access your registrations, coordinator events, or fest control panel.
          </p>
        </div>

        {errorMsg && (
          <div className="bg-rose-500/10 border border-rose-500/30 text-rose-700 text-xs p-3 rounded-xl mb-6 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#1C1917] mb-1.5">
              Email Address or Mobile Number
            </label>
            <input
              type="text"
              required
              placeholder="you@example.com or 9840123456"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full h-11 bg-white border border-[#1C1917]/15 rounded-xl px-3.5 text-sm text-[#1C1917] placeholder-[#78716C] focus:outline-none focus:border-[#FF6B1A] transition-colors shadow-2xs"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#1C1917] mb-1.5">
              Password
            </label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full h-11 bg-white border border-[#1C1917]/15 rounded-xl px-3.5 text-sm text-[#1C1917] placeholder-[#78716C] focus:outline-none focus:border-[#FF6B1A] transition-colors shadow-2xs"
            />
            <p className="text-[10px] text-[#78716C] mt-1">
              💡 For registered student delegates, your default password is your registered Mobile Number.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-ember w-full text-sm font-bold py-3 mt-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Signing In...
              </>
            ) : (
              "Sign In to Account"
            )}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-[#1C1917]/10 text-center text-xs text-[#57534E]">
          New student participant?{" "}
          <Link href="/register" className="text-[#FF6B1A] font-bold hover:underline">
            Register for Events
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <main className="min-h-screen flex flex-col bg-[#FAF8F5] text-[#1C1917]">
      <Navbar />
      <div className="pt-24 flex-1 flex items-center justify-center">
        <Suspense fallback={<div className="text-xs text-[#57534E]">Loading sign in...</div>}>
          <LoginForm />
        </Suspense>
      </div>
      <Footer />
    </main>
  );
}
