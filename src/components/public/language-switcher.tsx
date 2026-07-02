"use client";

import { useRouter } from "next/navigation";
import { Check, Globe } from "lucide-react";
import {
  LOCALES,
  LOCALE_FLAGS,
  LOCALE_LABELS,
  setLocaleCookie,
  type Locale,
} from "@/lib/i18n/config";
import { useT } from "@/components/public/locale-provider";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

export function LanguageSwitcher() {
  const router = useRouter();
  const { locale, t } = useT();

  function switchLocale(next: Locale) {
    if (next === locale) return;
    setLocaleCookie(next);
    router.refresh();
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-bg-surface text-foreground transition hover:bg-border"
        aria-label={t.header.language}
      >
        <Globe className="h-4 w-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        {LOCALES.map((l) => (
          <DropdownMenuItem
            key={l}
            onClick={() => switchLocale(l)}
            className="flex items-center justify-between gap-2"
          >
            <span className="flex items-center gap-2">
              <span aria-hidden="true">{LOCALE_FLAGS[l]}</span>
              {LOCALE_LABELS[l]}
            </span>
            {l === locale ? <Check className="h-4 w-4 text-brand" /> : null}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
