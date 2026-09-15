"use client";

import { useRouter } from "next/navigation";
import { localeCookieMaxAge, localeCookieName, type Locale } from "@/lib/i18n/config";

type LanguageSwitchProps = {
  locale: Locale;
  groupLabel: string;
  switchToEnglish: string;
  switchToThai: string;
  currentLanguageEnglish: string;
  currentLanguageThai: string;
};

export function LanguageSwitch({
  locale,
  groupLabel,
  switchToEnglish,
  switchToThai,
  currentLanguageEnglish,
  currentLanguageThai,
}: LanguageSwitchProps) {
  const router = useRouter();

  const switchTo = (next: Locale) => {
    if (next === locale) return;
    document.cookie = `${localeCookieName}=${next}; Path=/; Max-Age=${localeCookieMaxAge}; SameSite=Lax`;
    router.refresh();
  };

  return (
    <div className="lang-switch" role="group" aria-label={groupLabel}>
      <button
        type="button"
        className="lang-switch__option"
        aria-current={locale === "th" ? "true" : undefined}
        aria-label={locale === "th" ? currentLanguageThai : switchToThai}
        onClick={() => switchTo("th")}
      >
        TH
      </button>
      <span aria-hidden="true" className="lang-switch__divider">|</span>
      <button
        type="button"
        className="lang-switch__option"
        aria-current={locale === "en" ? "true" : undefined}
        aria-label={locale === "en" ? currentLanguageEnglish : switchToEnglish}
        onClick={() => switchTo("en")}
      >
        EN
      </button>
    </div>
  );
}
