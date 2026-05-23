import Credentials from "next-auth/providers/credentials";
import Facebook from "next-auth/providers/facebook";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import Apple from "next-auth/providers/apple";
import bcrypt from "bcryptjs";
import type { Provider } from "next-auth/providers";
import { z } from "zod";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1).max(200),
});

export const OAUTH_PROVIDER_IDS = ["google", "github", "facebook", "apple"] as const;
export type OAuthProviderId = (typeof OAUTH_PROVIDER_IDS)[number];

export function getEnabledOAuthProviders(): OAuthProviderId[] {
  const enabled: OAuthProviderId[] = [];
  if (process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET) {
    enabled.push("google");
  }
  if (process.env.AUTH_GITHUB_ID && process.env.AUTH_GITHUB_SECRET) {
    enabled.push("github");
  }
  if (process.env.AUTH_FACEBOOK_ID && process.env.AUTH_FACEBOOK_SECRET) {
    enabled.push("facebook");
  }
  if (process.env.AUTH_APPLE_ID && process.env.AUTH_APPLE_SECRET) {
    enabled.push("apple");
  }
  return enabled;
}

export function buildAuthProviders(): Provider[] {
  const providers: Provider[] = [];

  if (process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET) {
    providers.push(
      Google({
        clientId: process.env.AUTH_GOOGLE_ID,
        clientSecret: process.env.AUTH_GOOGLE_SECRET,
      }),
    );
  }

  if (process.env.AUTH_GITHUB_ID && process.env.AUTH_GITHUB_SECRET) {
    providers.push(
      GitHub({
        clientId: process.env.AUTH_GITHUB_ID,
        clientSecret: process.env.AUTH_GITHUB_SECRET,
      }),
    );
  }

  if (process.env.AUTH_FACEBOOK_ID && process.env.AUTH_FACEBOOK_SECRET) {
    providers.push(
      Facebook({
        clientId: process.env.AUTH_FACEBOOK_ID,
        clientSecret: process.env.AUTH_FACEBOOK_SECRET,
      }),
    );
  }

  if (process.env.AUTH_APPLE_ID && process.env.AUTH_APPLE_SECRET) {
    providers.push(
      Apple({
        clientId: process.env.AUTH_APPLE_ID,
        clientSecret: process.env.AUTH_APPLE_SECRET,
      }),
    );
  }

  providers.push(
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
  );

  return providers;
}
