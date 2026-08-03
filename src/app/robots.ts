import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/utils";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        // `/api/og/` fica permitido: é o gerador das imagens OG e bloqueá-lo
        // impede os crawlers de as obterem. O `allow` mais específico ganha ao
        // `disallow` mais genérico.
        allow: ["/", "/api/og/"],
        disallow: ["/admin", "/api", "/login", "/cliente"],
      },
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
