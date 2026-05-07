import Image from "next/image";
import Link from "next/link";
import { MapPin, MessageCircle, Phone } from "lucide-react";
import type { UnitRow } from "@/types/database.types";
import { formatPhonePT } from "@/lib/utils";
import {
  FacebookIcon,
  InstagramIcon,
  TikTokIcon,
} from "@/components/public/social-icons";

type Props = { unit: UnitRow };

export function Footer({ unit }: Props) {
  const base = `/${unit.slug}`;
  const unitNum =
    unit.name.replace(/\D/g, "") || unit.slug.replace(/\D/g, "") || "1";

  return (
    <footer className="mt-0 bg-[#0b1115]">
      {/* ── Big CTA strip ── */}
      <div className="border-b border-white/10 px-4 py-16 text-center sm:px-6">
        <h2 className="font-heading text-4xl font-semibold leading-tight tracking-tight text-white sm:text-5xl">
          Pronto para o próximo corte?
        </h2>
        {unit.buk_url && (
          <a
            href={unit.buk_url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-8 inline-flex items-center gap-3 rounded-full bg-brand px-8 py-4 text-[17px] font-semibold text-primary-foreground transition hover:bg-brand-hover"
          >
            Agendar agora
            <span>→</span>
          </a>
        )}
      </div>

      {/* ── 4-col grid ── */}
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 md:grid-cols-4">
        {/* Brand */}
        <div>
          <Image
            src="/logo.png"
            alt="Barbearia Of Brothers"
            width={56}
            height={56}
            className="h-14 w-auto brightness-0 invert"
          />
          <p className="mt-4 text-[13px] text-white/60">
            Barbearia Brothers · Desde 2012
          </p>
        </div>

        {/* Unit info */}
        <div>
          <h4 className="mb-3 font-heading text-[14px] font-semibold uppercase tracking-wider text-white">
            Unidade {unitNum}
          </h4>
          <ul className="space-y-2 text-sm text-white/70">
            {unit.address && (
              <li className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                <span>{unit.address}</span>
              </li>
            )}
            {unit.phone && (
              <li>
                <a
                  href={`tel:${unit.phone}`}
                  className="flex items-center gap-2 transition hover:text-brand"
                >
                  <Phone className="h-4 w-4 text-brand" />
                  {formatPhonePT(unit.phone)}
                </a>
              </li>
            )}
            {unit.whatsapp && (
              <li>
                <a
                  href={`https://wa.me/${unit.whatsapp.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 transition hover:text-brand"
                >
                  <MessageCircle className="h-4 w-4 text-brand" />
                  WhatsApp · {unit.whatsapp}
                </a>
              </li>
            )}
            <li className="pt-1 text-white/50">Seg — Sáb · 09:30 — 19:30</li>
          </ul>
        </div>

        {/* Navigation */}
        <div>
          <h4 className="mb-3 font-heading text-[14px] font-semibold uppercase tracking-wider text-white">
            Navegar
          </h4>
          <ul className="space-y-2 text-sm text-white/70">
            {[
              { href: base, label: "Início" },
              { href: `${base}/barbeiros`, label: "Barbeiros" },
              { href: `${base}/produtos`, label: "Produtos" },
              { href: `${base}/contato`, label: "Contacto" },
            ].map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className="transition hover:text-brand"
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Social */}
        <div>
          <h4 className="mb-3 font-heading text-[14px] font-semibold uppercase tracking-wider text-white">
            Social
          </h4>
          <div className="flex gap-2">
            {unit.socials?.instagram && (
              <a
                href={unit.socials.instagram}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white/70 transition hover:bg-brand hover:text-[#1a1410]"
              >
                <InstagramIcon className="h-4 w-4" />
              </a>
            )}
            {unit.socials?.facebook && (
              <a
                href={unit.socials.facebook}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white/70 transition hover:bg-brand hover:text-[#1a1410]"
              >
                <FacebookIcon className="h-4 w-4" />
              </a>
            )}
            {unit.socials?.tiktok && (
              <a
                href={unit.socials.tiktok}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="TikTok"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white/70 transition hover:bg-brand hover:text-[#1a1410]"
              >
                <TikTokIcon className="h-4 w-4" />
              </a>
            )}
          </div>
        </div>
      </div>

      {/* ── Bottom bar ── */}
      <div className="border-t border-white/8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-6 text-[13px] text-white/40 sm:flex-row sm:px-6">
          <span>© {new Date().getFullYear()} Barbearia Brothers. Todos os direitos reservados.</span>
          <span>Feito com ✂ em Leiria</span>
        </div>
      </div>
    </footer>
  );
}
