export const locales = ["th", "en"] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "th";

export const localeCookieName = "BRX_LOCALE";

export const localeCookieMaxAge = 60 * 60 * 24 * 365;

export function isLocale(value: string | undefined | null): value is Locale {
  return value === "th" || value === "en";
}

export function resolveLocale(cookieValue: string | undefined | null): Locale {
  return isLocale(cookieValue) ? cookieValue : defaultLocale;
}
