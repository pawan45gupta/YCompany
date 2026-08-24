import type { Metadata } from "next";
import { getTranslations } from "@/i18n/server";

const { dict } = getTranslations();

export const metadata: Metadata = {
  title: dict.checkoutSuccess.metaTitle,
  description: dict.checkoutSuccess.metaDescription,
};

export default function CheckoutSuccessLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
