import type { Metadata, Viewport } from "next";
import { Gabarito, Hanken_Grotesk } from "next/font/google";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { AppShell } from "@/components/shell/app-shell";
import { ThemeProvider } from "@/components/theme-provider";
import { routing } from "@/i18n/routing";
import { THEME_COLOR } from "@/lib/theme";
import "../globals.css";

// Headings and the wordmark: chunky and warm, like a hand-painted stall sign.
const heading = Gabarito({
  variable: "--font-gabarito",
  subsets: ["latin"],
});

// Everything else: calm and very readable at small sizes.
const body = Hanken_Grotesk({
  variable: "--font-hanken",
  subsets: ["latin"],
});

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: LayoutProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({
    locale: hasLocale(routing.locales, locale) ? locale : routing.defaultLocale,
    namespace: "Metadata",
  });

  return {
    title: { default: t("title"), template: "%s · Tapaulahh" },
    description: t("description"),
    applicationName: "Tapaulahh",
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: THEME_COLOR.light },
    { media: "(prefers-color-scheme: dark)", color: THEME_COLOR.dark },
  ],
};

export default async function LocaleLayout({
  children,
  params,
}: LayoutProps<"/[locale]">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  return (
    <html
      lang={locale}
      className={`${heading.variable} ${body.variable} antialiased`}
      suppressHydrationWarning
    >
      <body>
        <NextIntlClientProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <AppShell>{children}</AppShell>
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
