import { SignupView } from "@/app/signup/SignupView";
import { getEnabledOAuthProviders } from "@/lib/auth-providers";

export const metadata = {
  title: "Create account",
  description: "Sign up for a YCompany account to track orders and check out faster.",
};

export default function SignupPage() {
  const oauthProviders = getEnabledOAuthProviders();
  return <SignupView oauthProviders={oauthProviders} />;
}
