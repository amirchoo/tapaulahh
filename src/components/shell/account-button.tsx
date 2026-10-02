"use client";

import type { User } from "@supabase/supabase-js";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Avatar } from "@/components/auth/avatar";
import { Button } from "@/components/ui/button";
import { Link, usePathname } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/client";

/**
 * Desktop header: "Log in", or the user's avatar linking to My account.
 * Checked in the browser so public pages stay static (no cookies on the
 * server). Re-checked on every navigation, which covers signing in and out.
 */
export function AccountButton() {
  const t = useTranslations("Auth");
  const pathname = usePathname();
  // undefined = still checking
  const [user, setUser] = useState<User | null | undefined>(undefined);

  useEffect(() => {
    let active = true;
    createClient()
      .auth.getSession()
      .then(({ data }) => {
        if (active) setUser(data.session?.user ?? null);
      });
    return () => {
      active = false;
    };
  }, [pathname]);

  if (user === undefined) return <span className="size-9" />;

  if (!user) {
    return (
      <Button asChild variant="outline" className="h-9 rounded-lg px-3">
        <Link href="/login">{t("headerLogin")}</Link>
      </Button>
    );
  }

  const meta = user.user_metadata as {
    full_name?: string;
    avatar_url?: string;
  };
  return (
    <Link
      href="/akaun"
      aria-label={t("accountLabel")}
      className="rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <Avatar
        name={meta.full_name ?? user.email ?? ""}
        url={meta.avatar_url}
        className="size-9 text-sm"
      />
    </Link>
  );
}
