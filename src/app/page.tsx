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

const WHATSAPP_1 = "351962862257";
const WHATSAPP_2 = "351962862257";
const INSTAGRAM = "https://www.instagram.com/barbearia.ofbrothers";
const FACEBOOK = "https://www.facebook.com/barbeariaofbrothers";

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
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-brand/30 bg-brand/10 px-4 py-2 text-[12px] font-semibold uppercase tracking-[0.16em] text-brand">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand" />
          Em desenvolvimento
        </div>

        {/* Heading */}
        <h1 className="font-heading text-4xl font-semibold leading-tight tracking-tight text-white sm:text-5xl">
          Estamos a modernizar
          <br />
          <span className="text-brand">o nosso site.</span>
        </h1>

        {/* Subtext */}
        <p className="mt-6 text-[17px] leading-relaxed text-white/50">
          Estamos a trabalhar para te oferecer uma experiência ainda melhor.
          Brevemente de volta, melhor do que nunca.
        </p>

        {/* Divider */}
        <div className="my-10 h-px w-full bg-white/8" />

        {/* Contact */}
        <p className="mb-5 text-[13px] font-medium uppercase tracking-[0.14em] text-white/30">
          Enquanto isso, fala connosco
        </p>

        <div className="flex flex-col items-center gap-3 sm:flex-row">
          <a
            href={`https://wa.me/${WHATSAPP_1}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2.5 rounded-full bg-[#25D366]/10 px-6 py-3 text-sm font-semibold text-[#25D366] transition hover:bg-[#25D366]/20"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
              <path d="M12 0C5.373 0 0 5.373 0 12c0 2.125.557 4.126 1.535 5.857L0 24l6.273-1.535A11.95 11.95 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.816 9.816 0 0 1-5.006-1.372l-.359-.214-3.727.912.93-3.618-.234-.372A9.818 9.818 0 0 1 2.182 12C2.182 6.57 6.57 2.182 12 2.182S21.818 6.57 21.818 12 17.43 21.818 12 21.818z" />
            </svg>
            Unidade 1
          </a>

          <a
            href={`https://wa.me/${WHATSAPP_2}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2.5 rounded-full bg-[#25D366]/10 px-6 py-3 text-sm font-semibold text-[#25D366] transition hover:bg-[#25D366]/20"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
              <path d="M12 0C5.373 0 0 5.373 0 12c0 2.125.557 4.126 1.535 5.857L0 24l6.273-1.535A11.95 11.95 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.816 9.816 0 0 1-5.006-1.372l-.359-.214-3.727.912.93-3.618-.234-.372A9.818 9.818 0 0 1 2.182 12C2.182 6.57 6.57 2.182 12 2.182S21.818 6.57 21.818 12 17.43 21.818 12 21.818z" />
            </svg>
            Unidade 2
          </a>
        </div>

        {/* Social */}
        <div className="mt-6 flex items-center gap-3">
          <a
            href={INSTAGRAM}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instagram"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/5 text-white/50 transition hover:bg-brand hover:text-primary-foreground"
          >
            <InstagramIcon className="h-4 w-4" />
          </a>
          <a
            href={FACEBOOK}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Facebook"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/5 text-white/50 transition hover:bg-brand hover:text-primary-foreground"
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
