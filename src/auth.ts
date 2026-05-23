import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { z } from "zod";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1).max(200),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        const parsed = credentialsSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const demoEmail = process.env.AUTH_DEMO_EMAIL ?? "demo@ycompany.com";
        const rawHash = process.env.AUTH_DEMO_PASSWORD_HASH;
        if (!rawHash) {
          console.error("AUTH_DEMO_PASSWORD_HASH is not set");
          return null;
        }
        // Vercel/dashboard: paste hash without backslashes. Local .env may use \$ escapes.
        const hash = rawHash.replaceAll("\\$", "$");

        if (parsed.data.email.toLowerCase() !== demoEmail.toLowerCase()) {
          return null;
        }

        const valid = await bcrypt.compare(parsed.data.password, hash);
        if (!valid) return null;

        return {
          id: "demo-user",
          name: "YCompany Customer",
          email: demoEmail,
        };
      },
    }),
  ],
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 7 },
  pages: { signIn: "/login" },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        token.email = user.email;
        token.name = user.name;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? "";
      }
      return session;
    },
  },
});
