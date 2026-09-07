import { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { Role } from "@prisma/client";
import { logActivity } from "@/lib/activityLogger";

export const authOptions: AuthOptions = {
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
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

        // Support lookup by email, exact phone, or matching phone digits
        let user = await prisma.user.findFirst({
          where: {
            OR: [
              { email: input },
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
        let isValid = await bcrypt.compare(typedPassword, user.passwordHash);

        // Flexible fallback matching for phone numbers (e.g. +91 9840123456 vs 9840123456)
        if (!isValid && user.phone) {
          const passDigits = typedPassword.replace(/\D/g, "");
          const phoneDigits = user.phone.replace(/\D/g, "");

          // 1. Try bcrypt compare with raw user phone or phone digits
          if (!isValid && user.phone) {
            isValid = await bcrypt.compare(user.phone.trim(), user.passwordHash).catch(() => false);
          }
          if (!isValid && phoneDigits) {
            isValid = await bcrypt.compare(phoneDigits, user.passwordHash).catch(() => false);
          }

          // 2. Direct digit comparison for student default password (registered phone)
          if (!isValid && passDigits.length >= 7 && phoneDigits.length >= 7) {
            if (passDigits === phoneDigits || phoneDigits.endsWith(passDigits) || passDigits.endsWith(phoneDigits)) {
              isValid = true;
            }
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
        await logActivity({
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
        });
      }
    },
  },
  pages: {
    signIn: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET || "shine26-fallback-secret-key-development",
};
