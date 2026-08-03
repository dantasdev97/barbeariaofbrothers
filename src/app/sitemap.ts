import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/utils";
import { LEGAL_UPDATED } from "@/lib/seo";
import { createAdminClient } from "@/lib/supabase/admin";

// Era `force-dynamic`, o que regerava o sitemap (e as queries todas ao Supabase)
// a cada pedido de crawler. Uma hora de cache chega para um catálogo que muda
// pontualmente.
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [
    { url: absoluteUrl("/"), priority: 1, changeFrequency: "weekly" },
    { url: absoluteUrl("/privacidade"), lastModified: LEGAL_UPDATED, changeFrequency: "yearly", priority: 0.2 },
    { url: absoluteUrl("/termos"), lastModified: LEGAL_UPDATED, changeFrequency: "yearly", priority: 0.2 },
  ];

  try {
    const sb = createAdminClient();
    const { data: units } = await sb
      .from("units")
      .select("slug, created_at")
      .eq("active", true);
    const { data: barbers } = await sb
      .from("barbers")
      .select("slug, units!inner(slug)")
      .eq("active", true);
    const { data: products } = await sb
      .from("products")
      .select("slug, units!inner(slug)")
      .eq("active", true);

    for (const u of (units ?? []) as unknown as { slug: string; created_at: string | null }[]) {
      const base = `/${u.slug}`;
      const lastModified = u.created_at ? new Date(u.created_at) : undefined;
      entries.push(
        { url: absoluteUrl(base), lastModified, priority: 0.9, changeFrequency: "weekly" },
        { url: absoluteUrl(`${base}/barbeiros`), lastModified, priority: 0.8, changeFrequency: "weekly" },
        { url: absoluteUrl(`${base}/contato`), lastModified, priority: 0.5, changeFrequency: "monthly" },
      );
    }
    // `barbers` e `products` não têm coluna de timestamp, por isso ficam sem
    // `lastModified` em vez de levarem uma data inventada. Acrescentar
    // `updated_at` a essas tabelas numa migração futura torna isto real.
    for (const b of (barbers ?? []) as unknown as { slug: string; units: { slug: string } }[]) {
      entries.push({
        url: absoluteUrl(`/${b.units.slug}/barbeiros/${b.slug}`),
        priority: 0.7,
        changeFrequency: "monthly",
      });
    }
    for (const p of (products ?? []) as unknown as { slug: string; units: { slug: string } }[]) {
      entries.push({
        url: absoluteUrl(`/${p.units.slug}/produtos/${p.slug}`),
        priority: 0.7,
        changeFrequency: "weekly",
      });
    }
  } catch (e) {
    // No DB configured yet — return just the homepage
    console.error("[sitemap]", e);
  }

  return entries;
}
