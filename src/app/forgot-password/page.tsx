import { ForgotPasswordView } from "@/app/forgot-password/ForgotPasswordView";

export const metadata = {
  title: "Forgot password",
  description: "Request a password-reset link for your YCompany account.",
};

export default function ForgotPasswordPage() {
  return <ForgotPasswordView />;
}
