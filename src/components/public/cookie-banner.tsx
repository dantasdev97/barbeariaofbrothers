"use client";

import { useState, useEffect } from "react";
import Script from "next/script";
import Link from "next/link";

const KEY = "cookie_consent";

export function CookieBanner() {
  const [consent, setConsent] = useState<"accepted" | "rejected" | null>(null);
  const [visible, setVisible] = useState(false);
  const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

  useEffect(() => {
    const stored = localStorage.getItem(KEY) as "accepted" | "rejected" | null;
    if (stored) setConsent(stored);
    else setVisible(true);
  }, []);

  function accept() {
    localStorage.setItem(KEY, "accepted");
    setConsent("accepted");
    setVisible(false);
  }

  function reject() {
    localStorage.setItem(KEY, "rejected");
    setConsent("rejected");
    setVisible(false);
  }

  return (
    <>
      {/* GA4 — só carrega após consentimento explícito */}
      {consent === "accepted" && gaId && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
            strategy="afterInteractive"
          />
          <Script id="ga-init" strategy="afterInteractive">{`
            window.dataLayer=window.dataLayer||[];
            function gtag(){dataLayer.push(arguments)}
            gtag('js',new Date());
            gtag('config','${gaId}',{anonymize_ip:true});
          `}</Script>
        </>
      )}

      {/* Banner */}
      {visible && (
        <div
          role="dialog"
          aria-label="Consentimento de cookies"
          className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-2xl rounded-2xl border border-white/10 bg-[#0b1115]/95 p-5 shadow-[0_8px_40px_rgba(0,0,0,0.4)] backdrop-blur-sm sm:flex sm:items-center sm:gap-5"
        >
          <p className="flex-1 text-sm leading-relaxed text-white/70">
            Usamos cookies e análise de tráfego para melhorar a experiência.{" "}
            <Link
              href="/privacidade"
              className="text-white/90 underline underline-offset-2 transition hover:text-brand"
            >
              Política de privacidade
            </Link>
            .
          </p>
          <div className="mt-4 flex shrink-0 gap-2 sm:mt-0">
            <button
              onClick={reject}
              className="rounded-xl border border-white/20 px-4 py-2 text-sm text-white/70 transition hover:border-white/40 hover:text-white active:scale-[0.96]"
            >
              Rejeitar
            </button>
            <button
              onClick={accept}
              className="rounded-xl bg-brand px-5 py-2 text-sm font-semibold text-[#1a1410] transition hover:bg-brand-hover active:scale-[0.96]"
            >
              Aceitar todos
            </button>
          </div>
        </div>
      )}
    </>
  );
}
