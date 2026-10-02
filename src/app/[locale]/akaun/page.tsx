import { ChevronRight, LogOut, Shield, Store } from "lucide-react";
import type { Metadata } from "next";
import { getFormatter, getTranslations } from "next-intl/server";
import { Avatar } from "@/components/auth/avatar";
import { NameForm } from "@/components/auth/name-form";
import { ContentPage } from "@/components/layout/content-page";
import { Placeholder } from "@/components/layout/panel";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { initLocale } from "@/i18n/server";
import { signOutAction } from "@/lib/auth/actions";
import { getProfile, requireUser } from "@/lib/auth/session";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/akaun">): Promise<Metadata> {
  const locale = await initLocale(params);
  const t = await getTranslations({ locale, namespace: "Akaun" });
  return { title: t("title"), robots: { index: false } };
}

export default async function AkaunPage({
  params,
}: PageProps<"/[locale]/akaun">) {
  const locale = await initLocale(params);
  const user = await requireUser(locale, "/akaun");
  const profile = await getProfile(user.id);
  const t = await getTranslations("Akaun");
  const format = await getFormatter();

  const name = profile?.displayName ?? "";
  const links = [
    { href: "/akaun/kedai" as const, icon: Store, label: t("manageKedai") },
    ...(profile?.role === "admin"
      ? [{ href: "/admin" as const, icon: Shield, label: t("admin") }]
      : []),
  ];

  return (
    <ContentPage title={t("title")}>
      <section className="flex items-center gap-4 rounded-2xl border bg-card p-4">
        <Avatar
          name={name || (user.email ?? "")}
          url={profile?.avatarUrl}
          className="size-14 text-xl"
        />
        <div className="min-w-0">
          <p className="truncate text-lg font-extrabold">
            {name || t("noName")}
          </p>
          <p className="truncate text-sm text-muted-foreground">{user.email}</p>
          {profile && (
            <p className="text-xs text-muted-foreground">
              {t("memberSince", {
                date: format.dateTime(new Date(profile.createdAt), {
                  month: "long",
                  year: "numeric",
                }),
              })}
            </p>
          )}
        </div>
      </section>

      <ul className="divide-y overflow-hidden rounded-2xl border bg-card">
        {links.map(({ href, icon: Icon, label }) => (
          <li key={href}>
            <Link
              href={href}
              className="flex h-14 items-center gap-3 px-4 font-semibold outline-none hover:bg-muted focus-visible:bg-muted"
            >
              <Icon className="size-5 text-muted-foreground" aria-hidden />
              {label}
              <ChevronRight
                className="ml-auto size-5 text-muted-foreground"
                aria-hidden
              />
            </Link>
          </li>
        ))}
      </ul>

      <section className="space-y-3">
        <h2 className="text-lg font-extrabold">{t("favouritesTitle")}</h2>
        <Placeholder>{t("favouritesPlaceholder")}</Placeholder>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-extrabold">{t("profileTitle")}</h2>
        <NameForm defaultName={name} submitLabel={t("save")} />
      </section>

      <form action={signOutAction} className="border-t pt-4">
        <Button type="submit" variant="ghost" className="h-11 gap-2 px-3">
          <LogOut className="size-4" aria-hidden />
          {t("signOut")}
        </Button>
      </form>
    </ContentPage>
  );
}
