import { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { Role } from "@prisma/client";
import { logActivity } from "@/lib/activityLogger";

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
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Please provide both email/mobile and password.");
        }

        const input = credentials.email.toLowerCase().trim();
        const inputDigits = input.replace(/\D/g, "");

        const emailVariants = Array.from(
          new Set(
            [
              input,
              input.endsWith("@gmail") ? `${input}.com` : null,
              input.endsWith("@gmail.com") ? input.replace(/@gmail\.com$/, "@gmail") : null,
            ].filter(Boolean) as string[]
          )
        );

        // Support lookup by email, exact phone, or matching phone digits
        let user = await prisma.user.findFirst({
          where: {
            OR: [
              ...emailVariants.map((e) => ({ email: e })),
              { phone: input },
              ...(inputDigits.length >= 7
                ? [
                    { phone: { endsWith: inputDigits } },
                    { phone: { contains: inputDigits } },
                  ]
                : []),
            ],
          },
        });

        if (!user) {
          throw new Error("No user found with this email address or mobile number.");
        }

        if (!user.passwordHash) {
          throw new Error("Account has no password set. Please register or contact support.");
        }

        const typedPassword = credentials.password.trim();

        // SECURITY: Only use bcrypt.compare for password verification.
        // The phone number is the default password for students — it must match
        // exactly as hashed during registration. No plaintext digit comparison.
        let isValid = await bcrypt.compare(typedPassword, user.passwordHash);

        // Fallback: If the student's default password was hashed from the raw
        // phone string (e.g. "+91 9840123456"), try comparing against the
        // raw phone and just the digits.
        if (!isValid && user.phone) {
          const rawPhone = user.phone.trim();
          const phoneDigits = rawPhone.replace(/\D/g, "");

          // Try bcrypt compare with raw phone string
          if (!isValid) {
            isValid = await bcrypt.compare(rawPhone, user.passwordHash).catch(() => false);
          }
          // Try bcrypt compare with just the digits
          if (!isValid && phoneDigits !== rawPhone) {
            isValid = await bcrypt.compare(phoneDigits, user.passwordHash).catch(() => false);
          }
        }

        if (!isValid) {
          throw new Error("Incorrect password. (For student delegates, your default password is your registered Mobile Number)");
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
