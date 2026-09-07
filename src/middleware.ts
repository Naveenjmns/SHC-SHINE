import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Paths that require authentication
  const isDashboard = pathname.startsWith("/dashboard");
  const isCoordinator = pathname.startsWith("/coordinator");
  const isAdmin = pathname.startsWith("/admin");

  if (!isDashboard && !isCoordinator && !isAdmin) {
    return NextResponse.next();
  }

  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET || "shine26-fallback-secret-key-development",
  });

  // If not authenticated, redirect to login
  if (!token) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const role = token.role;

  // Admin route protection: ADMIN only
  if (isAdmin && role !== "ADMIN") {
    if (role === "COORDINATOR") {
      return NextResponse.redirect(new URL("/coordinator", req.url));
    }
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // Coordinator route protection: COORDINATOR, ADMIN, or assigned event coordinator
  if (isCoordinator && role !== "COORDINATOR" && role !== "ADMIN" && !token.isEventCoordinator) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // Dashboard route: STUDENT, COORDINATOR, or ADMIN are allowed
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/coordinator/:path*", "/admin/:path*"],
};
