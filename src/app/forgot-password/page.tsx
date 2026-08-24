import { ForgotPasswordView } from "@/app/forgot-password/ForgotPasswordView";
import type { Metadata } from "next";
import { getTranslations } from "@/i18n/server";

const { dict } = getTranslations();

export const metadata: Metadata = {
  title: dict.forgotPassword.metaTitle,
  description: dict.forgotPassword.metaDescription,
};

export default function ForgotPasswordPage() {
  return <ForgotPasswordView />;
}
