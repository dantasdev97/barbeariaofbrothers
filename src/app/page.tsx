import Image from "next/image";
import Link from "next/link";
import { ArrowRight, MapPin, Scissors } from "lucide-react";
import { getAllUnits } from "@/lib/data";
import { homeMetadata } from "@/lib/seo";
import { getServerI18n } from "@/lib/i18n/server";

export const metadata = homeMetadata();

export default async function HomePage() {
  const [units, { dict: t }] = await Promise.all([getAllUnits(), getServerI18n()]);

  return (
    <main className="min-h-[100dvh] bg-background text-foreground">
      <section className="mx-auto flex min-h-[100dvh] w-full max-w-6xl flex-col px-4 py-8 sm:px-6 lg:px-8">
        <header className="flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-3">
            <Image
              src="/logo.png"
              alt="Barbearia Of Brothers"
              width={44}
              height={44}
              priority
              className="h-10 w-auto"
            />
            <div>
              <p className="font-heading text-base font-semibold leading-tight">
                Barbearia Of Brothers
              </p>
              <p className="text-xs uppercase tracking-[0.14em] text-brand">
                {t.home.tagline}
              </p>
            </div>
          </Link>
        </header>

        <div className="grid flex-1 items-center gap-10 py-14 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-bg-surface px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-brand">
              <Scissors className="h-3.5 w-3.5" />
              Leiria
            </div>
            <h1 className="font-heading text-5xl font-semibold leading-[0.98] tracking-tight sm:text-6xl lg:text-7xl">
              {t.home.title}
            </h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              {t.home.subtitle}
            </p>
          </div>

          <div>
            {units.length === 0 ? (
              <div className="rounded-2xl border border-border bg-bg-surface p-6 sm:p-8">
                <h2 className="font-heading text-2xl font-semibold">
                  {t.home.noUnitsTitle}
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {t.home.noUnitsDesc}
                </p>
              </div>
            ) : (
              <div className="grid gap-3">
                {units.map((unit) => (
                  <Link
                    key={unit.id}
                    href={`/${unit.slug}`}
                    className="group rounded-2xl border border-border bg-bg-surface p-5 transition hover:-translate-y-0.5 hover:border-brand/40 hover:bg-card hover:shadow-premium sm:p-6"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <h2 className="truncate font-heading text-2xl font-semibold">
                          {unit.name}
                        </h2>
                        <div className="mt-3 flex gap-2 text-sm leading-relaxed text-muted-foreground">
                          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                          <span>{unit.address ?? `/${unit.slug}`}</span>
                        </div>
                      </div>
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-background text-brand transition group-hover:bg-brand group-hover:text-primary-foreground">
                        <ArrowRight className="h-5 w-5" />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
