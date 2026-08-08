import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // `camera=()` é uma allowlist **vazia**: nega a câmara a toda a gente,
  // incluindo à própria origem. O Chromium aplica isto ao documento de topo, o
  // que faz `getUserMedia({video})` rejeitar — e o scanner de QR em
  // /admin/operacao/scan depende dele. `self` autoriza só esta origem.
  {
    key: "Permissions-Policy",
    value: "camera=(self), microphone=(), geolocation=()",
  },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "connect-src 'self' https://*.supabase.co https://www.google-analytics.com https://region1.google-analytics.com",
      "media-src 'self' https://*.supabase.co",
      "font-src 'self'",
      "frame-src 'none'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; "),
  },
];

/**
 * URLs do site WordPress antigo que continuam indexados no Google e hoje
 * devolvem 404. Quando o domínio expirou e o site foi reconstruído em Next.js,
 * a estrutura de URLs mudou por completo sem redirects — toda a autoridade
 * acumulada nesses endereços evaporou.
 *
 * `permanent: true` emite 308 (equivalente permanente do 301, preservando o
 * método do pedido). Acrescentar aqui os restantes à medida que aparecerem no
 * relatório de cobertura do Search Console.
 */
const LEGACY_REDIRECTS = [
  // Confirmado indexado e a devolver 404 em produção.
  { from: "/agendamentos", to: "/" },
  // Padrões prováveis do site antigo. Inofensivos se nunca existiram: só
  // passam a responder quando alguém os pedir.
  { from: "/contactos", to: "/" },
  { from: "/contacto", to: "/" },
  { from: "/equipa", to: "/" },
  { from: "/sobre", to: "/" },
  { from: "/sobre-nos", to: "/" },
  { from: "/produtos", to: "/" },
  { from: "/servicos", to: "/" },
];

/** Áreas privadas: nunca indexar, nunca cachear. */
const privatePaths = ["/admin/:path*", "/login", "/cliente/:path*"];

const nextConfig: NextConfig = {
  async headers() {
    return [
      { source: "/(.*)", headers: securityHeaders },
      // `X-Robots-Tag` complementa o noindex do metadata: cobre respostas que
      // não passam pelo pipeline de metadata (redirects de auth, por exemplo).
      ...privatePaths.map((source) => ({
        source,
        headers: [
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
          { key: "Cache-Control", value: "private, no-store, max-age=0" },
        ],
      })),
      {
        // Assets versionados por query string (`?v=2`). Sem `immutable` porque
        // os ficheiros em si podem ser substituídos.
        source: "/:file(logo.png|favicon.ico|favicon-32x32.png|favicon-192x192.png)",
        headers: [
          { key: "Cache-Control", value: "public, max-age=0, must-revalidate" },
          { key: "CDN-Cache-Control", value: "public, s-maxage=86400" },
        ],
      },
    ];
  },
  async redirects() {
    return LEGACY_REDIRECTS.map(({ from, to }) => ({
      source: from,
      destination: to,
      permanent: true,
    }));
  },
  // cacheComponents is opt-in PPR. Re-enable once Suspense boundaries are added
  // around all dynamic data fetches.
  // cacheComponents: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
  experimental: {
    optimizePackageImports: ["lucide-react", "framer-motion"],
  },
};

export default nextConfig;
