import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { PasarExplorer } from "@/components/pasar/pasar-explorer";
import { initLocale } from "@/i18n/server";
import { getPasars } from "@/lib/pasar/queries";

// Pasar data comes from Supabase; rebuild the page at most every 5 minutes.
export const revalidate = 300;

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/pasar">): Promise<Metadata> {
  const locale = await initLocale(params);
  const t = await getTranslations({ locale, namespace: "PasarMap" });
  return { title: t("metaTitle") };
}

export default async function PasarMapPage({
  params,
}: PageProps<"/[locale]/pasar">) {
  await initLocale(params);
  const pasars = await getPasars();

  return <PasarExplorer pasars={pasars} />;
}
