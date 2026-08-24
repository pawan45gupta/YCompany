import { AppLoader } from "@/components/AppLoader";
import { getTranslations } from "@/i18n/server";

export default function Loading() {
  const { t } = getTranslations();
  return <AppLoader label={t("common.loading")} />;
}
