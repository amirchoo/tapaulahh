"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";

const ORDER = ["system", "light", "dark"] as const;
type Mode = (typeof ORDER)[number];

const ICONS = { system: Monitor, light: Sun, dark: Moon } satisfies Record<
  Mode,
  unknown
>;

const noopSubscribe = () => () => {};

export function ThemeToggle() {
  const t = useTranslations("Theme");
  const { theme, setTheme } = useTheme();
  // The stored theme is only known on the client; render a neutral icon until then.
  const mounted = useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );

  const mode: Mode =
    mounted && ORDER.includes(theme as Mode) ? (theme as Mode) : "system";
  const next = ORDER[(ORDER.indexOf(mode) + 1) % ORDER.length];
  const Icon = ICONS[mode];

  return (
    <Button
      variant="ghost"
      size="icon"
      className="size-11"
      onClick={() => setTheme(next)}
      aria-label={t("label", { mode: t(mode) })}
      title={t(mode)}
    >
      <Icon className="size-5" aria-hidden />
    </Button>
  );
}
