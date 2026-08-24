import { ResetPasswordView } from "@/app/reset-password/[token]/ResetPasswordView";
import type { Metadata } from "next";
import { getTranslations } from "@/i18n/server";

const { dict } = getTranslations();

export const metadata: Metadata = {
  title: dict.resetPassword.metaTitle,
  description: dict.resetPassword.metaDescription,
};

// Next.js 16: dynamic route params are async. The page is a server
// component that simply unwraps the token and forwards it to the client
// view. We don't pre-validate here because tokens are in-memory only
// and would need a request hit anyway — let the API route do the
// authoritative check when the user submits the new password.
type Params = { params: Promise<{ token: string }> };

export default async function ResetPasswordPage({ params }: Params) {
  const { token } = await params;
  return <ResetPasswordView token={token} />;
}
