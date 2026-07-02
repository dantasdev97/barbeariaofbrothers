import "server-only";
import { cookies, headers } from "next/headers";
import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE,
  isLocale,
  localeFromAcceptLanguage,
  type Locale,
} from "./config";
import { dictionaries, type Dictionary } from "./dictionaries";

/** Reads the visitor's locale: cookie first, `Accept-Language` fallback, `pt` default. */
export async function getLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get(LOCALE_COOKIE)?.value;
  if (isLocale(cookieLocale)) return cookieLocale;

  const headerList = await headers();
  return localeFromAcceptLanguage(headerList.get("accept-language"));
}

export async function getServerI18n(): Promise<{ locale: Locale; dict: Dictionary }> {
  const locale = await getLocale();
  return { locale, dict: dictionaries[locale] ?? dictionaries[DEFAULT_LOCALE] };
}
