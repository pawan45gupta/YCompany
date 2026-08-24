import type { Metadata } from "next";
import { getTranslations } from "@/i18n/server";

const { dict } = getTranslations();

export const metadata: Metadata = {
  title: dict.checkout.metaTitle,
  description: dict.checkout.metaDescription,
};

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return children;
}
