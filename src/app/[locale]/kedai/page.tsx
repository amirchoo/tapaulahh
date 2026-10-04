import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { KedaiExplorer } from "@/components/kedai/kedai-explorer";
import { getPathname } from "@/i18n/navigation";
import { initLocale } from "@/i18n/server";
import { getBusinesses } from "@/lib/kedai/queries";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/kedai">): Promise<Metadata> {
  const locale = await initLocale(params);
  const t = await getTranslations({ locale, namespace: "Kedai" });
  return { title: t("title"), description: t("subtitle") };
}

export default async function KedaiPage({
  params,
}: PageProps<"/[locale]/kedai">) {
  const locale = await initLocale(params);
  const businesses = await getBusinesses();
  const signUpHref = getPathname({
    href: {
      pathname: "/daftar",
      query: { next: getPathname({ href: "/akaun/kedai", locale }) },
    },
    locale,
  });

  return <KedaiExplorer businesses={businesses} signUpHref={signUpHref} />;
}
