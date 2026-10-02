import { AccountButton } from "./account-button";
import { LanguageToggle } from "./language-toggle";
import { TopNavTabs } from "./nav-tabs";
import { ThemeToggle } from "./theme-toggle";
import { Wordmark } from "./wordmark";

export function SiteHeader() {
  return (
    <header className="relative z-20 border-b bg-card">
      <div className="flex h-12 items-center gap-6 pr-1 pl-4 lg:h-14 lg:pr-3 lg:pl-6">
        <Wordmark />
        <div className="hidden lg:block">
          <TopNavTabs />
        </div>
        <div className="ml-auto flex items-center">
          <LanguageToggle />
          <ThemeToggle />
          {/* Mobile has the Akaun tab in the bottom bar instead. */}
          <div className="ml-2 hidden lg:block">
            <AccountButton />
          </div>
        </div>
      </div>
    </header>
  );
}
