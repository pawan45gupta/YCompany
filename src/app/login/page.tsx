import { LoginView } from "@/app/login/LoginView";
import { getEnabledOAuthProviders } from "@/lib/auth-providers";

export default function LoginPage() {
  const oauthProviders = getEnabledOAuthProviders();
  return <LoginView oauthProviders={oauthProviders} />;
}
