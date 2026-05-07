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
  return (
    <footer className="mt-24 border-t border-white/10 bg-bg-surface">
      <div className="container-page grid gap-8 py-12 md:grid-cols-4">
        <div>
          <Image
            src="/logo.png"
            alt="Barbearia Of Brothers"
            width={56}
            height={56}
            className="h-14 w-auto"
          />
          <p className="mt-4 text-sm text-muted-foreground">
            Corte, barba e estilo desde 2012.
          </p>
        </div>

        <div>
          <h4 className="mb-3 font-heading text-sm uppercase tracking-wider text-foreground">
            Navegação
          </h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link className="hover:text-brand" href={base}>Início</Link></li>
            <li><Link className="hover:text-brand" href={`${base}/barbeiros`}>Barbeiros</Link></li>
            <li><Link className="hover:text-brand" href={`${base}/produtos`}>Produtos</Link></li>
            <li><Link className="hover:text-brand" href={`${base}/contato`}>Contacto</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="mb-3 font-heading text-sm uppercase tracking-wider text-foreground">
            Contacto
          </h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            {unit.address && (
              <li className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                <span>{unit.address}</span>
              </li>
            )}
            {unit.phone && (
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-brand" />
                <a href={`tel:${unit.phone}`} className="hover:text-brand">
                  {formatPhonePT(unit.phone)}
                </a>
              </li>
            )}
            {unit.whatsapp && (
              <li className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4 text-brand" />
                <a
                  href={`https://wa.me/${unit.whatsapp.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-brand"
                >
                  WhatsApp
                </a>
              </li>
            )}
          </ul>
        </div>

        <div>
          <h4 className="mb-3 font-heading text-sm uppercase tracking-wider text-foreground">
            Redes sociais
          </h4>
          <div className="flex gap-2">
            {unit.socials?.instagram && (
              <a
                href={unit.socials.instagram}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/5 text-foreground transition hover:bg-brand hover:text-primary-foreground"
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
                className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/5 text-foreground transition hover:bg-brand hover:text-primary-foreground"
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
                className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/5 text-foreground transition hover:bg-brand hover:text-primary-foreground"
              >
                <TikTokIcon className="h-4 w-4" />
              </a>
            )}
          </div>
        </div>
      </div>

      <div className="border-t border-white/5">
        <div className="container-page flex flex-col items-center justify-between gap-2 py-6 text-xs text-muted-foreground sm:flex-row">
          <span>© {new Date().getFullYear()} Barbearia Of Brothers. Todos os direitos reservados.</span>
          <Link href="/" className="hover:text-brand">
            Trocar de unidade
          </Link>
        </div>
      </div>
    </footer>
  );
}
