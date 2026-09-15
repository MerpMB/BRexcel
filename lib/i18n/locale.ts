import "server-only";
import { cookies } from "next/headers";
import { localeCookieName, resolveLocale, type Locale } from "./config";

export async function getLocale(): Promise<Locale> {
  const store = await cookies();
  return resolveLocale(store.get(localeCookieName)?.value);
}
