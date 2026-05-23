import { Container } from "@mui/material";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AccountDashboard } from "@/components/account/AccountDashboard";
import { getTranslations } from "@/i18n/server";

const { dict } = getTranslations();

export const metadata: Metadata = {
  title: dict.account.title,
  robots: { index: false },
};

export default async function AccountPage() {
  const session = await auth();
  if (!session?.user?.email) {
    redirect("/login?callbackUrl=/account");
  }

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
      <AccountDashboard email={session.user.email} name={session.user.name} />
    </Container>
  );
}
