import { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { Role } from "@prisma/client";
import { logActivity } from "@/lib/activityLogger";
import { checkRateLimit, getClientIpFromHeaders } from "@/lib/security";

const INVALID_CREDENTIALS_MESSAGE =
  "Invalid email/mobile or password. (Student delegates: your default password is your registered 10-digit mobile number)";

export const authOptions: AuthOptions = {
  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60, // 7 days (reduced from 30 for better security)
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Please provide both email/mobile and password.");
        }

        const input = credentials.email.toLowerCase().trim();
        const inputDigits = input.replace(/\D/g, "");

        // SECURITY: Throttle brute-force attempts per IP and per account identifier
        const clientIp = getClientIpFromHeaders(req?.headers as Record<string, string | string[] | undefined> | undefined);
        const ipCheck = checkRateLimit(`login-ip:${clientIp}`, 20, 20 / 300);
        const accountCheck = checkRateLimit(`login-account:${input}`, 10, 10 / 600);
        if (!ipCheck.allowed || !accountCheck.allowed) {
          throw new Error("Too many login attempts. Please wait a few minutes and try again.");
        }

        const emailVariants = Array.from(
          new Set(
            [
              input,
              input.endsWith("@gmail") ? `${input}.com` : null,
              input.endsWith("@gmail.com") ? input.replace(/@gmail\.com$/, "@gmail") : null,
            ].filter(Boolean) as string[]
          )
        );

        // SECURITY: Look up by email or by a full 10-digit mobile number only.
        // Partial-digit matching would let a fragment of a number resolve to an arbitrary account.
        const phoneLast10 = inputDigits.length >= 10 ? inputDigits.slice(-10) : null;
        const candidates = await prisma.user.findMany({
          where: {
            OR: [
              ...emailVariants.map((e) => ({ email: e })),
              { phone: input },
              ...(phoneLast10 ? [{ phone: { endsWith: phoneLast10 } }] : []),
            ],
          },
          take: 5,
        });

        // Prefer an exact email match; for phone logins require the number to identify exactly one account
        const user =
          candidates.find((u) => emailVariants.includes(u.email.toLowerCase())) ||
          (candidates.length === 1 ? candidates[0] : null);

        const typedPassword = credentials.password.trim();

        // SECURITY: Verify only the password the user typed. Same generic error for
        // unknown accounts and wrong passwords to avoid account enumeration.
        const isValid =
          !!user?.passwordHash && (await bcrypt.compare(typedPassword, user.passwordHash));

        if (!user || !isValid) {
          throw new Error(INVALID_CREDENTIALS_MESSAGE);
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          college: user.college,
          phone: user.phone,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.college = user.college;
        token.phone = user.phone;
      }
      if (token.id) {
        // SECURITY: Re-read role from the database so demoted or deleted users lose access immediately
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { role: true, college: true, phone: true },
        });
        if (!dbUser) {
          // Account was deleted: strip all identity claims so every role/ID check fails closed
          return {} as typeof token;
        }
        token.role = dbUser.role;
        token.college = dbUser.college;
        token.phone = dbUser.phone;

        const isAssigned = await prisma.event.findFirst({
          where: {
            OR: [
              { staffCoordinatorId: token.id as string },
              { studentCoordinatorId: token.id as string },
              { coordinatorId: token.id as string },
            ],
          },
          select: { id: true },
        });
        token.isEventCoordinator = !!isAssigned;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token) {
        session.user.id = token.id as string;
        session.user.role = token.role as Role;
        session.user.college = token.college as string | null;
        session.user.phone = token.phone as string | null;
        (session.user as any).isEventCoordinator = !!token.isEventCoordinator;
      }
      return session;
    },
  },
  events: {
    async signIn({ user }) {
      if (user) {
        logActivity({
          action: "USER_LOGIN",
          actorId: user.id,
          actorName: user.name,
          actorEmail: user.email,
          actorRole: (user as any).role,
          targetType: "Auth",
          targetTitle: `User Login (${user.email})`,
          details: {
            role: (user as any).role,
            college: (user as any).college,
          },
        }).catch((err) => console.error("Login activity log error:", err));
      }
    },
  },
  pages: {
    signIn: "/login",
  },
  // SECURITY: Require NEXTAUTH_SECRET from environment.
  // In development, fall back to a dev-only key with a warning.
  secret: (() => {
    const secret = process.env.NEXTAUTH_SECRET;
    if (!secret) {
      if (process.env.NODE_ENV === "production") {
        throw new Error(
          "CRITICAL: NEXTAUTH_SECRET environment variable is required in production!"
        );
      }
      console.warn(
        "WARNING: NEXTAUTH_SECRET is not set. Using dev-only fallback. NEVER deploy like this!"
      );
      return "dev-only-insecure-secret-do-not-use-in-production";
    }
    return secret;
  })(),
};
