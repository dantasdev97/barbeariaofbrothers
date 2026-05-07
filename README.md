# Barbearia Of Brothers

Plataforma web premium para a **Barbearia Of Brothers** — multi-unidade, agendamentos via Buk.pt, loja com checkout via WhatsApp, e painel administrativo completo.

> **Identidade**: dark, premium, masculina · verde `#22c55e` sobre fundo `#1D252B` · *Since 2012*.

## Stack

- **Next.js 16** (App Router · Turbopack · TypeScript)
- **TailwindCSS v4** + **shadcn/ui** + **Framer Motion**
- **Supabase** (Auth + Postgres + Storage + RLS)
- **Vercel Analytics** + tabela `events` (analytics próprio)
- Forms: `react-hook-form` + `zod`
- Estado: `zustand` (carrinho persistente, unidade ativa)

## Estrutura

```
src/
├── app/
│   ├── (public)/[unidade]/        # site público multi-unidade
│   ├── admin/                     # painel admin (auth-gated)
│   ├── login/
│   ├── api/{analytics, og/[unit]} # eventos + OG dinâmica
│   ├── sitemap.ts, robots.ts
│   └── page.tsx                   # landing → escolha de unidade
├── components/
│   ├── ui/                        # shadcn primitives
│   ├── public/                    # Header, Footer, UnitPicker, Cards, ...
│   └── admin/                     # Sidebar, MetricCard
├── lib/
│   ├── supabase/{client,server,admin,public}.ts
│   ├── data.ts, admin-actions.ts
│   ├── analytics.ts, whatsapp.ts, seo.ts, utils.ts
├── hooks/{useCart,useUnidade}.ts
├── proxy.ts                       # Next.js 16 proxy (auth + cookies)
└── types/database.types.ts
supabase/
├── migrations/0001_init.sql       # schema + RLS + buckets
└── seed.sql                       # 2 unidades + sample data
```

## Setup local

### 1. Variáveis de ambiente

```bash
cp .env.example .env.local
```

Preencha:

```bash
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=https://YOUR.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

### 2. Provisionar Supabase via Vercel Marketplace (recomendado)

```bash
npm i -g vercel
vercel login
vercel link --project barbearia-brothers
vercel integration add supabase
vercel env pull .env.local --yes
```

Ou crie o projeto manualmente em [supabase.com](https://supabase.com) e copie as keys.

### 3. Aplicar a migração

No SQL editor do Supabase Dashboard, cole o conteúdo de `supabase/migrations/0001_init.sql` e execute.
Em seguida, opcionalmente o `supabase/seed.sql` para criar 2 unidades de exemplo.

### 4. Criar o admin

No Supabase Dashboard → **Authentication → Users → Add user** com email/password.
Depois, no SQL editor:

```sql
insert into public.profiles (id, role)
values ('<auth_user_id>', 'super_admin');
```

### 5. Correr

```bash
npm install
npm run dev
```

Abre http://localhost:3000.

## Comandos

| Comando | O que faz |
|---|---|
| `npm run dev` | Servidor de desenvolvimento (Turbopack) |
| `npm run build` | Build de produção |
| `npm run start` | Servidor de produção local |
| `npm run lint` | ESLint |

## Deploy (Vercel)

1. `vercel link`
2. Adicionar as env vars na dashboard ou via Marketplace (Supabase).
3. `vercel deploy --prod` (ou push para `main`).

A configuração `next.config.ts` já cobre `images.remotePatterns` para Supabase Storage e `optimizePackageImports` para `lucide-react` e `framer-motion`.

## Funcionalidades

- ✅ Multi-unidade (cookie `unit_slug` + escolha persistida)
- ✅ Header/Footer dinâmicos por unidade
- ✅ Catálogo de barbeiros (lista + detalhe + agendamento direto)
- ✅ Catálogo de produtos (lista + detalhe + carrinho)
- ✅ Checkout via WhatsApp (mensagem pré-formatada)
- ✅ JSON-LD `HairSalon` por unidade
- ✅ OG images dinâmicas por unidade (`/api/og/[unit]`)
- ✅ Sitemap + robots
- ✅ Painel admin: Dashboard, Unidades, Barbeiros, Produtos, Categorias, SEO/Configurações
- ✅ Analytics customizado (page_view, booking_click, product_view, barber_view, whatsapp_checkout, add_to_cart)
- ✅ Auth via Supabase + middleware proxy guard
- ✅ Identidade dark forçada (Space Grotesk + Poppins)

## Próximos passos sugeridos

- Activar **Cache Components** (`cacheComponents: true` em `next.config.ts`) e wrappar fetches dinâmicos em `<Suspense>` para PPR.
- Adicionar upload de imagens diretamente nos forms admin (já existe `lib/admin-actions.ts → uploadImage`).
- Adicionar gráficos no dashboard com `recharts` (já instalado).
- Animações Framer Motion em transições de página.

## Licença

Privado — Barbearia Of Brothers © 2012–presente.
