import NextAuth from "next-auth";
import { buildAuthProviders } from "@/lib/auth-providers";
import { bootstrapAuthSiteUrl } from "@/lib/site-url";

bootstrapAuthSiteUrl();

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  providers: buildAuthProviders(),
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 7 },
  pages: { signIn: "/login" },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.sub = user.id ?? token.sub;
        token.email = user.email ?? token.email;
        token.name = user.name ?? token.name;
        token.picture = user.image ?? token.picture;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? "";
        if (token.email) session.user.email = token.email;
        if (token.name) session.user.name = token.name;
        if (token.picture) session.user.image = token.picture as string;
      }
      return session;
    },
  },
});
