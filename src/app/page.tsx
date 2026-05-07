import type { Metadata } from "next";
import Image from "next/image";
import {
  InstagramIcon,
  FacebookIcon,
} from "@/components/public/social-icons";

export const metadata: Metadata = {
  title: "Em breve — Barbearia Of Brothers",
  description:
    "Estamos a modernizar o nosso site. Em breve de volta, melhor do que nunca. Barbearia Of Brothers — Leiria, desde 2012.",
};

const BUK_1 = "https://buk.pt/barbearia-of-brothers";
const BUK_2 = "https://buk.pt/barbeariaofbrothers2";
const INSTAGRAM = "https://www.instagram.com/barbeariaofbrothers/";
const FACEBOOK = "https://www.facebook.com/barbeariaofbrothersleiria";

export default function HomePage() {
  return (
    <div className="relative flex min-h-[100dvh] flex-col items-center justify-center overflow-hidden bg-[#0b1115] px-4">

      {/* Ambient glow */}
      <div
        className="pointer-events-none absolute left-1/2 top-1/3 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-10 blur-[120px]"
        style={{ background: "radial-gradient(circle, #F39200 0%, transparent 70%)" }}
      />

      {/* Grid pattern */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
        }}
      />

      <div className="relative z-10 flex max-w-lg flex-col items-center text-center">

        {/* Logo */}
        <Image
          src="/logo.png"
          alt="Barbearia Of Brothers"
          width={72}
          height={72}
          className="mb-8 h-16 w-auto brightness-0 invert"
          priority
        />

        {/* Badge */}
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#F39200]/30 bg-[#F39200]/10 px-4 py-2 text-[12px] font-semibold uppercase tracking-[0.16em] text-[#F39200]">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#F39200]" />
          Em desenvolvimento
        </div>

        {/* Heading */}
        <h1 className="font-heading text-4xl font-semibold leading-tight tracking-tight text-white sm:text-5xl">
          Estamos a modernizar
          <br />
          <span className="text-[#F39200]">o nosso site.</span>
        </h1>

        {/* Subtext */}
        <p className="mt-6 text-[17px] leading-relaxed text-white/50">
          Estamos a trabalhar para te oferecer uma experiência ainda melhor.
          Brevemente de volta, melhor do que nunca.
        </p>

        {/* Divider */}
        <div className="my-10 h-px w-full bg-white/8" />

        {/* Booking CTAs */}
        <p className="mb-5 text-[13px] font-medium uppercase tracking-[0.14em] text-white/30">
          Enquanto isso, agenda online
        </p>

        <div className="flex flex-col items-center gap-3 sm:flex-row">
          <a
            href={BUK_1}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2.5 rounded-full bg-[#F39200]/10 px-6 py-3 text-sm font-semibold text-[#F39200] transition hover:bg-[#F39200]/20"
          >
            {/* Scissors icon */}
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/>
              <line x1="20" y1="4" x2="8.12" y2="15.88"/><line x1="14.47" y1="14.48" x2="20" y2="20"/>
              <line x1="8.12" y1="8.12" x2="12" y2="12"/>
            </svg>
            Agendar · Unidade 1
          </a>

          <a
            href={BUK_2}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2.5 rounded-full bg-[#F39200]/10 px-6 py-3 text-sm font-semibold text-[#F39200] transition hover:bg-[#F39200]/20"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/>
              <line x1="20" y1="4" x2="8.12" y2="15.88"/><line x1="14.47" y1="14.48" x2="20" y2="20"/>
              <line x1="8.12" y1="8.12" x2="12" y2="12"/>
            </svg>
            Agendar · Unidade 2
          </a>
        </div>

        {/* Social */}
        <div className="mt-6 flex items-center gap-3">
          <a
            href={INSTAGRAM}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instagram"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/5 text-white/50 transition hover:bg-[#F39200] hover:text-[#0b1115]"
          >
            <InstagramIcon className="h-4 w-4" />
          </a>
          <a
            href={FACEBOOK}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Facebook"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/5 text-white/50 transition hover:bg-[#F39200] hover:text-[#0b1115]"
          >
            <FacebookIcon className="h-4 w-4" />
          </a>
        </div>

        {/* Footer note */}
        <p className="mt-12 text-[12px] text-white/20">
          Barbearia Of Brothers · Leiria · Desde 2012
        </p>
      </div>
    </div>
  );
}
