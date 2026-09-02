import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { db, schema } from "@/db";
import { eq } from "drizzle-orm";

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  // Necesario para correr en producción detrás de cualquier host (Railway,
  // un VPS propio, Docker, etc.) y no solo en Vercel, que confía en el host
  // automáticamente. Es seguro acá porque la app se sirve desde un único
  // dominio controlado por la institución.
  trustHost: true,
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Contraseña", type: "password" },
      },
      authorize: async (credentials) => {
        const email = credentials?.email as string | undefined;
        const password = credentials?.password as string | undefined;
        if (!email || !password) return null;

        const user = await db.query.users.findFirst({
          where: eq(schema.users.email, email.toLowerCase().trim()),
        });
        if (!user || !user.active) return null;

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return null;

        return {
          id: user.id,
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
          role: user.role,
          avatarUrl: user.avatarUrl ?? undefined,
          institutionId: user.institutionId ?? null,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.role = (user as { role: "admin" | "teacher" | "student" | "institution" }).role;
        token.avatarUrl = (user as { avatarUrl?: string }).avatarUrl;
        token.institutionId = (user as { institutionId?: string | null }).institutionId ?? null;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as "admin" | "teacher" | "student" | "institution";
        session.user.avatarUrl = token.avatarUrl as string | undefined;
        session.user.institutionId = (token.institutionId as string | null | undefined) ?? null;
      }
      return session;
    },
  },
  secret: process.env.AUTH_SECRET,
});
