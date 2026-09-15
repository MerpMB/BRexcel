import { defaultLocale, type Locale } from "../config";
import { en, type Messages } from "./en";
import { th } from "./th";

export type { Messages };

const dictionaries: Record<Locale, Messages> = { th, en };

export function getDictionary(locale: Locale): Messages {
  return dictionaries[locale] ?? dictionaries[defaultLocale];
}
