import { SignupView } from "@/app/signup/SignupView";
import { getEnabledOAuthProviders } from "@/lib/auth-providers";
import type { Metadata } from "next";
import { getTranslations } from "@/i18n/server";

const { dict } = getTranslations();

export const metadata: Metadata = {
  title: dict.signup.metaTitle,
  description: dict.signup.metaDescription,
};

export default function SignupPage() {
  const oauthProviders = getEnabledOAuthProviders();
  return <SignupView oauthProviders={oauthProviders} />;
}
