import { PasarExplorer } from "@/components/pasar/pasar-explorer";
import { initLocale } from "@/i18n/server";
import { getPasars } from "@/lib/pasar/queries";

export default async function HomePage({ params }: PageProps<"/[locale]">) {
  await initLocale(params);
  const pasars = await getPasars();

  return <PasarExplorer pasars={pasars} />;
}
