import { useTranslations } from "next-intl";
import { ContentPage } from "@/components/layout/content-page";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";

export default function NotFound() {
  const t = useTranslations("NotFound");

  return (
    <ContentPage title={t("title")} subtitle={t("body")}>
      <Button asChild className="h-11 px-5 font-semibold">
        <Link href="/">{t("home")}</Link>
      </Button>
    </ContentPage>
  );
}
