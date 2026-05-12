import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/utils";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [
    { url: absoluteUrl("/"), priority: 1, changeFrequency: "weekly" },
  ];

  try {
    const sb = createAdminClient();
    const { data: units } = await sb
      .from("units")
      .select("slug")
      .eq("active", true);
    const { data: barbers } = await sb
      .from("barbers")
      .select("slug, units!inner(slug)")
      .eq("active", true);
    const { data: products } = await sb
      .from("products")
      .select("slug, units!inner(slug)")
      .eq("active", true);

    for (const u of units ?? []) {
      const base = `/${u.slug}`;
      entries.push(
        { url: absoluteUrl(base), priority: 0.9, changeFrequency: "weekly" },
        { url: absoluteUrl(`${base}/barbeiros`), priority: 0.8, changeFrequency: "weekly" },
        { url: absoluteUrl(`${base}/contato`), priority: 0.5, changeFrequency: "monthly" },
      );
    }
    for (const b of (barbers ?? []) as { slug: string; units: { slug: string } }[]) {
      entries.push({
        url: absoluteUrl(`/${b.units.slug}/barbeiros/${b.slug}`),
        priority: 0.7,
        changeFrequency: "monthly",
      });
    }
    for (const p of (products ?? []) as { slug: string; units: { slug: string } }[]) {
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
