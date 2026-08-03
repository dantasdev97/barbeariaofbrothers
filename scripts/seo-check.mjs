#!/usr/bin/env node
/**
 * seo:check — valida em HTTP real as invariantes de SEO que já partiram uma vez
 * em produção.
 *
 * Não substitui o `lint`: a maioria destes bugs (canonical herdado, og:image a
 * 404, URLs do sitemap que redirecionam) só é observável numa resposta HTTP.
 *
 *   npm run build && npm run seo:check          # arranca `next start` local
 *   npm run seo:check -- --base=https://www...  # valida um deploy real
 *
 * Sai com código 1 se houver ERROs. WARNs são informativos.
 */
import { spawn } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

const args = process.argv.slice(2);
const baseArg = args.find((a) => a.startsWith("--base="))?.slice("--base=".length);
const requireCatalog = args.includes("--require-catalog");
const PORT = 4321;

const errors = [];
const warnings = [];
const err = (where, msg) => errors.push(`${where} — ${msg}`);
const warn = (where, msg) => warnings.push(`${where} — ${msg}`);

// ── helpers de HTML ────────────────────────────────────────────────────────
const canonicalsOf = (html) =>
  [...html.matchAll(/<link[^>]+rel="canonical"[^>]*>/gi)].map(
    (m) => m[0].match(/href="([^"]*)"/i)?.[1] ?? "",
  );
const robotsOf = (html) =>
  [...html.matchAll(/<meta[^>]+name="robots"[^>]*>/gi)].map(
    (m) => (m[0].match(/content="([^"]*)"/i)?.[1] ?? "").toLowerCase(),
  );
const ogOf = (html, prop) =>
  html.match(new RegExp(`<meta[^>]+property="og:${prop}"[^>]*>`, "i"))?.[0]
    ?.match(/content="([^"]*)"/i)?.[1] ?? null;
const jsonLdOf = (html) =>
  [...html.matchAll(
    /<script[^>]+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi,
  )].map((m) => m[1]);

const get = (url, redirect = "manual") =>
  fetch(url, { redirect, headers: { "user-agent": "seo-check" } });

// ── arranque do servidor ───────────────────────────────────────────────────
async function startServer() {
  if (!existsSync(".next")) {
    console.error("✖ Falta a build. Corre `npm run build` primeiro.");
    process.exit(1);
  }
  const base = `http://localhost:${PORT}`;

  // Se a porta já responde, estamos prestes a validar um servidor que não é o
  // nosso — provavelmente um órfão de uma execução anterior, com env diferente.
  // Um falso verde aqui é pior do que não correr de todo.
  try {
    await get(`${base}/`);
    console.error(
      `✖ A porta ${PORT} já está ocupada. Termina esse processo antes de correr o seo:check.`,
    );
    process.exit(1);
  } catch {
    // porta livre — segue
  }

  // `detached` para podermos matar o grupo inteiro: `next start` cria um
  // processo-filho próprio, e um kill só no pai deixava o servidor a correr.
  const child = spawn("./node_modules/.bin/next", ["start", "-p", String(PORT)], {
    env: { ...process.env },
    stdio: "ignore",
    detached: true,
  });

  const deadline = Date.now() + 60_000;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) {
      console.error(`✖ O servidor terminou com código ${child.exitCode}.`);
      process.exit(1);
    }
    try {
      await get(`${base}/`);
      return { base, child };
    } catch {
      await new Promise((r) => setTimeout(r, 500));
    }
  }
  stopServer(child);
  console.error("✖ O servidor não arrancou em 60s.");
  process.exit(1);
}

function stopServer(child) {
  if (!child?.pid) return;
  try {
    process.kill(-child.pid, "SIGTERM"); // o grupo todo, não só o pai
  } catch {
    try {
      child.kill("SIGTERM");
    } catch {
      /* já morreu */
    }
  }
}

// ── asserções ──────────────────────────────────────────────────────────────
async function checkIndexable(base, url, expectedOrigin) {
  const { pathname } = new URL(url);
  const where = pathname;
  // O pedido vai para onde estamos a testar (servidor local ou --base); as
  // asserções de host comparam com a origem que a app declara.
  const res = await get(`${base}${pathname}`);
  if (res.status !== 200) {
    err(where, `esperado 200 no sitemap, recebido ${res.status}`);
    return;
  }
  const html = await res.text();

  const canonicals = canonicalsOf(html);
  if (canonicals.length !== 1) {
    err(where, `esperado exatamente 1 canonical, encontrado ${canonicals.length}`);
  } else {
    const c = canonicals[0];
    if (!c.startsWith("http")) err(where, `canonical não é absoluto: ${c}`);
    else {
      const got = new URL(c);
      if (got.origin !== expectedOrigin) {
        err(where, `canonical no host errado: ${got.origin} (esperado ${expectedOrigin})`);
      }
      // Auto-referência: foi exatamente isto que falhou em produção, com todas
      // as páginas a declararem a homepage como canónico.
      if (got.pathname.replace(/\/$/, "") !== pathname.replace(/\/$/, "")) {
        err(where, `canonical não é auto-referente: aponta para ${got.pathname}`);
      }
    }
  }

  const robots = robotsOf(html);
  if (robots.length > 1) err(where, `${robots.length} metas robots em conflito`);
  if (robots.some((r) => r.includes("noindex"))) {
    err(where, "está no sitemap mas emite noindex");
  }

  const ogUrl = ogOf(html, "url");
  if (ogUrl && canonicals[0] && ogUrl !== canonicals[0]) {
    warn(where, `og:url (${ogUrl}) difere do canonical`);
  }

  for (const block of jsonLdOf(html)) {
    try {
      const parsed = JSON.parse(block);
      if (JSON.stringify(parsed).includes("aggregateRating")) {
        err(where, "JSON-LD voltou a conter aggregateRating (avaliações não verificáveis)");
      }
    } catch {
      err(where, "bloco JSON-LD inválido");
    }
  }

  const title = html.match(/<title>([^<]*)<\/title>/i)?.[1] ?? "";
  if (!title) err(where, "sem <title>");
  else if (title.length > 65) warn(where, `title com ${title.length} caracteres (>65)`);

  const desc = html
    .match(/<meta[^>]+name="description"[^>]*>/i)?.[0]
    ?.match(/content="([^"]*)"/i)?.[1];
  if (!desc) err(where, "sem meta description");
  else if (desc.length < 50 || desc.length > 165) {
    warn(where, `description com ${desc.length} caracteres (fora de 50–165)`);
  }

  return { html, ogImage: ogOf(html, "image") };
}

async function checkNoindex(base, path) {
  const res = await get(`${base}${path}`);
  const html = await res.text();
  const robots = robotsOf(html);
  const headerTag = res.headers.get("x-robots-tag") ?? "";
  const noindexed =
    robots.some((r) => r.includes("noindex")) || headerTag.includes("noindex");
  if (!noindexed) err(path, "devia ser noindex e não é");

  const canonicals = canonicalsOf(html);
  if (canonicals.length && new URL(canonicals[0]).pathname === "/") {
    err(path, "declara a homepage como canonical (o bug original)");
  }
}

/**
 * Verificações estáticas sobre o código-fonte.
 *
 * Existem porque as verificações HTTP dependem do catálogo: sem credenciais do
 * Supabase não há páginas de unidade nem de produto no sitemap, e as asserções
 * de JSON-LD nunca chegam a correr — um verde vazio. Estas duas apanham as
 * causas-raiz originais em qualquer ambiente, com ou sem base de dados.
 *
 * Procuram a chave (`nome:`), não a palavra, para não disparar em comentários.
 */
function checkSource() {
  const seoSrc = existsSync("src/lib/seo.ts")
    ? readFileSync("src/lib/seo.ts", "utf8")
    : "";
  if (/^\s*aggregateRating\s*:/m.test(seoSrc) || /"aggregateRating"\s*:/.test(seoSrc)) {
    err(
      "src/lib/seo.ts",
      "aggregateRating voltou ao JSON-LD — avaliações têm de ser reais e visíveis na página",
    );
  }

  const layoutSrc = existsSync("src/app/layout.tsx")
    ? readFileSync("src/app/layout.tsx", "utf8")
    : "";
  if (/^\s*alternates\s*:/m.test(layoutSrc)) {
    err(
      "src/app/layout.tsx",
      "o root layout voltou a declarar `alternates` — é herdado por todas as rotas que não o sobrescrevam (a causa raiz original)",
    );
  }
}

async function main() {
  checkSource();

  let child = null;
  let base = baseArg;
  if (!base) ({ base, child } = await startServer());

  try {
    // ── robots.txt ─────────────────────────────────────────────────────────
    const robotsRes = await get(`${base}/robots.txt`);
    if (robotsRes.status !== 200) err("/robots.txt", `status ${robotsRes.status}`);
    const robotsTxt = await robotsRes.text();
    if (!robotsTxt.includes("Sitemap:")) err("/robots.txt", "sem linha Sitemap:");
    if (!/Allow:\s*\/api\/og\//.test(robotsTxt)) {
      err("/robots.txt", "/api/og/ tem de ficar permitido (gera as imagens OG)");
    }

    // ── sitemap ────────────────────────────────────────────────────────────
    const smRes = await get(`${base}/sitemap.xml`);
    if (smRes.status !== 200) {
      err("/sitemap.xml", `status ${smRes.status}`);
      return;
    }
    const smXml = await smRes.text();
    const locs = [...smXml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);

    if (locs.length === 0) {
      err("/sitemap.xml", "sitemap vazio");
      return;
    }
    if (new Set(locs).size !== locs.length) err("/sitemap.xml", "contém URLs duplicados");

    // O `sitemap.xml` é pré-renderizado no build, por isso a origem que traz é a
    // que a app foi construída para declarar. É essa que todas as outras
    // asserções de host usam como referência.
    const expectedOrigin = new URL(locs[0]).origin;
    if (!expectedOrigin.startsWith("http://localhost")) {
      // A invariante que interessa: o apex redireciona para www, portanto
      // declarar o apex mandaria o Google seguir um redirect a partir do
      // próprio URL canónico — a causa raiz de toda esta investigação.
      if (!expectedOrigin.startsWith("https://www.")) {
        err("/sitemap.xml", `origem declarada não é o host canónico www: ${expectedOrigin}`);
      }
    }

    for (const loc of locs) {
      if (new URL(loc).origin !== expectedOrigin) {
        err("/sitemap.xml", `URL com origem inconsistente: ${loc}`);
      }
      if (/\/(login|admin|cliente|carrinho|agendar)(\/|$)/.test(new URL(loc).pathname)) {
        err("/sitemap.xml", `URL privado/noindex listado: ${loc}`);
      }
    }
    for (const p of ["/privacidade", "/termos", "/"]) {
      if (!locs.some((l) => new URL(l).pathname.replace(/\/$/, "") === p.replace(/\/$/, ""))) {
        err("/sitemap.xml", `falta ${p}`);
      }
    }

    const unitSlugs = [
      ...new Set(
        locs
          .map((l) => new URL(l).pathname.split("/").filter(Boolean)[0])
          .filter((s) => s && !["privacidade", "termos"].includes(s)),
      ),
    ];
    if (unitSlugs.length === 0) {
      const msg =
        "nenhuma unidade no sitemap — define NEXT_PUBLIC_SUPABASE_* para validar o catálogo";
      if (requireCatalog) err("/sitemap.xml", msg);
      else warn("/sitemap.xml", msg);
    }

    // ── páginas indexáveis ─────────────────────────────────────────────────
    const ogImages = new Set();
    for (const loc of locs) {
      const out = await checkIndexable(base, loc, expectedOrigin);
      if (out?.ogImage) ogImages.add(out.ogImage);
    }

    // Cada og:image tem de responder 200: foi assim que /og-image.png passou
    // meses declarado no layout e a devolver 404.
    for (const img of ogImages) {
      const abs = img.startsWith("http")
        ? `${base}${new URL(img).pathname}`
        : `${base}${img}`;
      try {
        const r = await get(abs, "follow");
        if (r.status !== 200) err("og:image", `${abs} devolveu ${r.status}`);
      } catch {
        err("og:image", `${abs} inacessível`);
      }
    }

    // ── páginas que têm de ser noindex ─────────────────────────────────────
    const noindexPaths = ["/login", "/rota-que-nao-existe-12345"];
    if (unitSlugs[0]) {
      noindexPaths.push(
        `/${unitSlugs[0]}/carrinho`,
        `/${unitSlugs[0]}/barbeiros/nao-existe-12345`,
      );
    }
    for (const p of noindexPaths) await checkNoindex(base, p);

    // ── redirects legados (lidos do artefacto de build, não duplicados) ────
    const manifestPath = ".next/routes-manifest.json";
    if (existsSync(manifestPath)) {
      const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
      const legacy = manifest.redirects.filter((r) => !r.internal);
      if (legacy.length === 0) warn("redirects", "nenhum redirect legado configurado");

      for (const r of legacy) {
        // Colisão com o segmento dinâmico /[unidade]: `redirects()` corre antes
        // do routing, portanto um source igual a um slug de unidade esconderia
        // essa unidade permanentemente.
        const sourceSlug = r.source.split("/").filter(Boolean)[0];
        if (unitSlugs.includes(sourceSlug)) {
          err("redirects", `"${r.source}" colide com a unidade "${sourceSlug}"`);
        }
        if (r.statusCode !== 308 && r.statusCode !== 301) {
          err("redirects", `"${r.source}" devolve ${r.statusCode}, devia ser permanente`);
        }
        if (!r.source.includes(":")) {
          const res = await get(`${base}${r.source}`);
          if (![301, 308].includes(res.status)) {
            err("redirects", `${r.source} devolveu ${res.status} em vez de um redirect permanente`);
          }
        }
      }
    }
  } finally {
    stopServer(child);
  }

  // ── relatório ──────────────────────────────────────────────────────────
  if (warnings.length) {
    console.log(`\n⚠ ${warnings.length} aviso(s):`);
    for (const w of warnings) console.log(`  ${w}`);
  }
  if (errors.length) {
    console.log(`\n✖ ${errors.length} erro(s):`);
    for (const e of errors) console.log(`  ${e}`);
    console.log("");
    process.exit(1);
  }
  console.log(`\n✓ SEO check passou${warnings.length ? ` (${warnings.length} aviso(s))` : ""}.\n`);
}

main().catch((e) => {
  console.error("✖ seo:check rebentou:", e);
  process.exit(1);
});
