import type { Metadata } from "next";
import { getTranslations } from "@/i18n/server";

const { dict } = getTranslations();

export const metadata: Metadata = {
  title: dict.cart.metaTitle,
  description: dict.cart.metaDescription,
};

export default function CartLayout({ children }: { children: React.ReactNode }) {
  return children;
}
