import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

// ─── Security Headers applied to every response ────────────────────────────
const SECURITY_HEADERS: Record<string, string> = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "X-XSS-Protection": "1; mode=block",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy":
    "camera=(self), microphone=(), geolocation=(), interest-cohort=()",
  "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
  "X-DNS-Prefetch-Control": "on",
};

function applySecurityHeaders(response: NextResponse): NextResponse {
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    response.headers.set(key, value);
  }
  // Remove the server header to hide backend technology
  response.headers.delete("x-powered-by");
  response.headers.delete("server");
  return response;
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Paths that require authentication
  const isDashboard = pathname.startsWith("/dashboard");
  const isCoordinator = pathname.startsWith("/coordinator");
  const isFood = pathname.startsWith("/food");
  const isAdmin = pathname.startsWith("/admin");

  // For non-protected routes, just add security headers and pass through
  if (!isDashboard && !isCoordinator && !isFood && !isAdmin) {
    const response = NextResponse.next();
    return applySecurityHeaders(response);
  }

  // SECURITY: Require NEXTAUTH_SECRET — never use a hardcoded fallback
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) {
    console.error(
      "CRITICAL: NEXTAUTH_SECRET is not set. Authentication cannot proceed securely."
    );
    // In production, refuse to serve protected pages without a proper secret
    if (process.env.NODE_ENV === "production") {
      return new NextResponse("Internal Server Error", { status: 500 });
    }
    // In development, warn but allow with a dev-only fallback
    console.warn(
      "WARNING: Using development-only fallback secret. Set NEXTAUTH_SECRET in .env!"
    );
  }

  const effectiveSecret =
    secret || "dev-only-insecure-secret-do-not-use-in-production";

  // 1. Try standard auto-detection
  let token = await getToken({ req, secret: effectiveSecret });

  // 2. Try explicit secureCookie (HTTPS behind Railway reverse proxies)
  if (!token) {
    token = await getToken({ req, secret: effectiveSecret, secureCookie: true });
  }

  // 3. Try explicit non-secure cookie fallback
  if (!token) {
    token = await getToken({
      req,
      secret: effectiveSecret,
      secureCookie: false,
    });
  }

  // If not authenticated, redirect to login
  if (!token) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    const response = NextResponse.redirect(loginUrl);
    return applySecurityHeaders(response);
  }

  const role = token.role;

  // Admin route protection: ADMIN only
  if (isAdmin && role !== "ADMIN") {
    let redirectUrl: URL;
    if (role === "COORDINATOR") {
      redirectUrl = new URL("/coordinator", req.url);
    } else if (role === "FOOD_COORDINATOR") {
      redirectUrl = new URL("/food", req.url);
    } else {
      redirectUrl = new URL("/dashboard", req.url);
    }
    const response = NextResponse.redirect(redirectUrl);
    return applySecurityHeaders(response);
  }

  // Food Coordinator route protection: FOOD_COORDINATOR or ADMIN
  if (isFood && role !== "FOOD_COORDINATOR" && role !== "ADMIN") {
    const response = NextResponse.redirect(new URL("/dashboard", req.url));
    return applySecurityHeaders(response);
  }

  // Coordinator route protection: COORDINATOR, ADMIN, or assigned event coordinator
  if (
    isCoordinator &&
    role !== "COORDINATOR" &&
    role !== "ADMIN" &&
    !token.isEventCoordinator
  ) {
    let redirectUrl: URL;
    if (role === "FOOD_COORDINATOR") {
      redirectUrl = new URL("/food", req.url);
    } else {
      redirectUrl = new URL("/dashboard", req.url);
    }
    const response = NextResponse.redirect(redirectUrl);
    return applySecurityHeaders(response);
  }

  // Dashboard route: STUDENT, COORDINATOR, FOOD_COORDINATOR, or ADMIN are allowed
  const response = NextResponse.next();
  return applySecurityHeaders(response);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico, images, etc.
     */
    "/dashboard/:path*",
    "/coordinator/:path*",
    "/food/:path*",
    "/admin/:path*",
    "/api/:path*",
    "/login",
    "/register",
    "/",
  ],
};
