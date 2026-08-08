import { requireRole } from "@/lib/admin-auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  AlertTriangle,
  CalendarCheck,
  Check,
  ChevronRight,
  Download,
  Eye,
  Loader2,
  Package,
  Plus,
  Scissors,
  Search,
  Settings,
  Trash2,
  User,
} from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";
import { MetricCard } from "@/components/admin/metric-card";
import { EmptyState } from "@/components/admin/empty-state";
import { staggerIndex } from "@/lib/motion";

/** Série de exemplo para os sparklines desta página de referência. */
const DEMO_SERIES = [4, 6, 5, 8, 7, 9, 12, 10, 8, 11, 14, 13, 9, 12, 15];

export default async function FrontendDesignPage() {
  // Esta página não tinha guarda nenhuma: dependia só da sessão exigida pelo
  // layout, que não olha ao role.
  await requireRole(["super_admin"]);

  return (
    <div className="space-y-14">
      <PageHeader
        eyebrow="Referência interna"
        title="Design System"
        description="Tokens, componentes e padrões visuais do painel administrativo."
        className="mb-0"
      />

      {/* ── Colors ── */}
      <section>
        <SectionTitle>Paleta de cores</SectionTitle>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {[
            { name: "brand", cls: "bg-brand" },
            { name: "brand-hover", cls: "bg-brand-hover" },
            { name: "background", cls: "bg-background border border-border" },
            { name: "bg-surface", cls: "bg-bg-surface border border-border" },
            { name: "foreground", cls: "bg-foreground" },
            { name: "muted-foreground", cls: "bg-muted-foreground" },
            { name: "border", cls: "bg-border" },
            { name: "destructive", cls: "bg-destructive" },
            { name: "popover", cls: "bg-popover border border-border" },
            { name: "accent", cls: "bg-accent border border-border" },
            { name: "muted", cls: "bg-muted border border-border" },
          ].map(({ name, cls }) => (
            <div key={name} className="space-y-2">
              <div className={`h-12 rounded-xl ${cls}`} />
              <p className="font-mono text-xs text-muted-foreground">{name}</p>
            </div>
          ))}
        </div>
      </section>

      <Separator />

      {/* ── Typography ── */}
      <section>
        <SectionTitle>Tipografia</SectionTitle>
        <div className="space-y-4 rounded-2xl border border-border bg-bg-surface p-6">
          <div>
            <p className="mb-1 font-mono text-[10px] text-muted-foreground">font-heading · text-[32px] · semibold</p>
            <p className="font-heading text-[32px] font-semibold leading-none tracking-tight">
              Heading principal
            </p>
          </div>
          <div>
            <p className="mb-1 font-mono text-[10px] text-muted-foreground">font-heading · text-xl · semibold</p>
            <p className="font-heading text-xl font-semibold">Heading secundário</p>
          </div>
          <div>
            <p className="mb-1 font-mono text-[10px] text-muted-foreground">text-base · medium</p>
            <p className="text-base font-medium">Texto de destaque</p>
          </div>
          <div>
            <p className="mb-1 font-mono text-[10px] text-muted-foreground">text-sm · normal</p>
            <p className="text-sm text-muted-foreground">
              Texto de suporte e legendas. Usado em descrições e metadados secundários.
            </p>
          </div>
          <div>
            <p className="mb-1 font-mono text-[10px] text-muted-foreground">text-xs · uppercase · tracking</p>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand">
              Eyebrow / Label de secção
            </p>
          </div>
          <div>
            <p className="mb-1 font-mono text-[10px] text-muted-foreground">font-mono · text-xs</p>
            <code className="rounded bg-background px-2 py-1 font-mono text-xs text-brand">
              /slug-exemplo
            </code>
          </div>
        </div>
      </section>

      <Separator />

      {/* ── Buttons ── */}
      <section>
        <SectionTitle>Botões</SectionTitle>
        <div className="space-y-4 rounded-2xl border border-border bg-bg-surface p-6">
          <div>
            <p className="mb-3 font-mono text-[10px] text-muted-foreground">Variantes</p>
            <div className="flex flex-wrap gap-3">
              <Button className="bg-brand text-primary-foreground hover:bg-brand-hover">
                Brand (primário)
              </Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="destructive">Destructive</Button>
              <Button variant="link">Link</Button>
            </div>
          </div>
          <div>
            <p className="mb-3 font-mono text-[10px] text-muted-foreground">Tamanhos</p>
            <div className="flex flex-wrap items-center gap-3">
              <Button size="lg" className="bg-brand text-primary-foreground hover:bg-brand-hover">Large</Button>
              <Button className="bg-brand text-primary-foreground hover:bg-brand-hover">Default</Button>
              <Button size="sm" className="bg-brand text-primary-foreground hover:bg-brand-hover">Small</Button>
              <Button size="icon" className="bg-brand text-primary-foreground hover:bg-brand-hover">
                <Plus />
              </Button>
            </div>
          </div>
          <div>
            <p className="mb-3 font-mono text-[10px] text-muted-foreground">Estados</p>
            <div className="flex flex-wrap gap-3">
              <Button className="bg-brand text-primary-foreground hover:bg-brand-hover">
                <Plus className="mr-2 h-4 w-4" />
                Com ícone
              </Button>
              <Button disabled className="bg-brand text-primary-foreground">
                Desactivado
              </Button>
              <Button disabled className="bg-brand text-primary-foreground">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                A guardar…
              </Button>
            </div>
          </div>
        </div>
      </section>

      <Separator />

      {/* ── Badges ── */}
      <section>
        <SectionTitle>Badges</SectionTitle>
        <div className="flex flex-wrap gap-3 rounded-2xl border border-border bg-bg-surface p-6">
          <Badge className="bg-brand/15 text-brand">Activo</Badge>
          <Badge variant="secondary">Inactivo</Badge>
          <Badge variant="outline">Outline</Badge>
          <Badge variant="destructive">Erro</Badge>
          <Badge className="bg-emerald-500/15 text-emerald-400">Sucesso</Badge>
          <Badge className="bg-amber-500/15 text-amber-400">Aviso</Badge>
        </div>
      </section>

      <Separator />

      {/* ── Form controls ── */}
      <section>
        <SectionTitle>Controlos de formulário</SectionTitle>
        <div className="max-w-lg space-y-5 rounded-2xl border border-border bg-bg-surface p-6">
          <div className="space-y-1.5">
            <Label htmlFor="ds-input">Input de texto</Label>
            <Input id="ds-input" placeholder="Escreva algo…" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ds-search">Input com ícone</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input id="ds-search" className="pl-9" placeholder="Pesquisar…" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ds-textarea">Textarea</Label>
            <Textarea id="ds-textarea" rows={3} placeholder="Descrição…" />
          </div>
          <div className="space-y-1.5">
            <Label>Toggle acessível</Label>
            <label className="inline-flex cursor-pointer items-center gap-3 text-sm">
              <div
                role="checkbox"
                aria-checked={true}
                tabIndex={0}
                className="relative h-5 w-9 rounded-full bg-brand transition-colors focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 focus:ring-offset-bg-surface"
              >
                <span className="absolute top-0.5 left-0.5 h-4 w-4 translate-x-4 rounded-full bg-white shadow transition-transform" />
              </div>
              Activo (visível no site)
            </label>
          </div>
        </div>
      </section>

      <Separator />

      {/* ── Cards ── */}
      <section>
        <SectionTitle>Cards</SectionTitle>
        <p className="mb-4 text-sm text-muted-foreground">
          Usar sempre <Code>MetricCard</Code>. O <Code>icon</Code> entra já
          renderizado (<Code>{"<Gift className=\"h-4 w-4\" />"}</Code>), nunca
          como componente — o cartão é client component e páginas server não
          conseguem passar funções através da fronteira. Omitir{" "}
          <Code>series</Code> quando a métrica não tem histórico: é melhor não
          mostrar gráfico nenhum do que desenhar um padrão inventado.
        </p>
        <div className="stagger grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div {...staggerIndex(0)}>
            <MetricCard
              label="Agendamentos"
              value={128}
              hint="+12%"
              tone="brand"
              icon={<CalendarCheck className="h-4 w-4" />}
              series={DEMO_SERIES}
            />
          </div>
          <div {...staggerIndex(1)}>
            <MetricCard
              label="Visualizações"
              value={4231}
              hint="+8%"
              tone="green"
              icon={<Eye className="h-4 w-4" />}
              series={DEMO_SERIES.map((v) => 20 - v)}
            />
          </div>
          <div {...staggerIndex(2)}>
            <MetricCard label="Produtos" value={34} hint="no catálogo" tone="blue" icon={<Package className="h-4 w-4" />} />
          </div>
          <div {...staggerIndex(3)}>
            <MetricCard label="Barbeiros" value={6} hint="2 unidades" tone="mute" icon={<Scissors className="h-4 w-4" />} />
          </div>
        </div>
      </section>

      <Separator />

      {/* ── Movimento ── */}
      <section>
        <SectionTitle>Movimento</SectionTitle>
        <p className="mb-4 max-w-2xl text-sm text-muted-foreground">
          Regra base: <strong>animação previsível vai em CSS</strong>, não em
          JavaScript. O CSS corre fora da main thread e mantém-se fluido
          enquanto o browser carrega uma página nova — que é justamente quando
          a navegação anima. Reservar JS para o que é genuinamente dinâmico
          (contadores, gestos interrompíveis).
        </p>

        <div className="overflow-hidden rounded-2xl border border-border bg-bg-surface">
          <table className="w-full text-sm">
            <thead className="border-b border-border text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-5 py-3 text-left font-medium">Token</th>
                <th className="px-5 py-3 text-left font-medium">Valor</th>
                <th className="px-5 py-3 text-left font-medium">Quando usar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {[
                ["ease-out-strong", "cubic-bezier(.23,1,.32,1)", "Tudo que entra ou responde ao utilizador"],
                ["ease-in-out-strong", "cubic-bezier(.77,0,.175,1)", "Elementos que já estão no ecrã e se movem de A para B"],
                ["ease-drawer", "cubic-bezier(.32,.72,0,1)", "Painéis que deslizam (gaveta lateral)"],
              ].map(([name, value, use]) => (
                <tr key={name} className="transition-colors duration-150 hover-fine:hover:bg-background">
                  <td className="px-5 py-3"><Code>{name}</Code></td>
                  <td className="px-5 py-3 font-mono text-xs text-muted-foreground">{value}</td>
                  <td className="px-5 py-3 text-[13px] text-muted-foreground">{use}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-border bg-bg-surface p-4">
            <p className="mb-1.5 text-sm font-semibold">Durações</p>
            <p className="text-[13px] text-muted-foreground">
              Toque em botão 100–160ms · dropdown 150–250ms · gaveta 200–300ms.
              Abaixo de 300ms para UI. Quanto mais vezes por dia o utilizador
              vê, mais curta tem de ser. Nunca <Code>ease-in</Code>: começa
              devagar e faz a interface parecer lenta.
            </p>
          </div>
          <div className="rounded-xl border border-border bg-bg-surface p-4">
            <p className="mb-1.5 text-sm font-semibold">Regras</p>
            <p className="text-[13px] text-muted-foreground">
              Animar só <Code>transform</Code> e <Code>opacity</Code>. Nunca{" "}
              <Code>transition</Code> sozinho — anima tudo, incluindo coisas que
              não se quer. Nada entra de <Code>scale(0)</Code>: começar em 0.95.
            </p>
          </div>
        </div>
      </section>

      <Separator />

      {/* ── Cascata ── */}
      <section>
        <SectionTitle>Entrada em cascata</SectionTitle>
        <p className="mb-4 max-w-2xl text-sm text-muted-foreground">
          <Code>.stagger</Code> no contentor e <Code>{"{...staggerIndex(i)}"}</Code>{" "}
          em cada filho. Atraso de 34ms entre itens, com teto no 12º — atrasos
          longos fazem a interface parecer lenta e numa lista grande os últimos
          itens apareceriam tarde demais.
        </p>
        <div className="stagger grid gap-2 sm:grid-cols-3">
          {["Primeiro", "Segundo", "Terceiro"].map((t, i) => (
            <div
              key={t}
              {...staggerIndex(i)}
              className="rounded-xl border border-border bg-bg-surface px-4 py-3 text-sm"
            >
              {t}
            </div>
          ))}
        </div>
      </section>

      <Separator />

      {/* ── Toque ── */}
      <section>
        <SectionTitle>Toque e hover</SectionTitle>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-border bg-bg-surface p-4">
            <p className="mb-1.5 text-sm font-semibold">Alvo mínimo: 44px</p>
            <p className="text-[13px] text-muted-foreground">
              O painel é usado no telemóvel. Onde a densidade visual não permite
              engordar o botão, alargar só a zona clicável com{" "}
              <Code>before:absolute before:-inset-1.5</Code> — é o que{" "}
              <Code>RowActions</Code> faz.
            </p>
          </div>
          <div className="rounded-xl border border-border bg-bg-surface p-4">
            <p className="mb-1.5 text-sm font-semibold">
              Hover só com <Code>hover-fine:</Code>
            </p>
            <p className="text-[13px] text-muted-foreground">
              Em ecrã táctil o toque dispara <Code>:hover</Code> e o estado fica
              colado depois de levantar o dedo. A variante limita o hover a
              ponteiros finos (rato).
            </p>
          </div>
        </div>
      </section>

      <Separator />

      {/* ── Estado vazio ── */}
      <section>
        <SectionTitle>Estado vazio</SectionTitle>
        <p className="mb-4 max-w-2xl text-sm text-muted-foreground">
          Nunca deixar uma lista vazia como um parágrafo solto. <Code>EmptyState</Code>{" "}
          diz o que aconteceu e oferece a acção que resolve.
        </p>
        <EmptyState
          icon={<User className="h-6 w-6" />}
          title="Sem registos"
          description="Explica porque está vazio e o que fazer a seguir."
          action={<Button variant="secondary">Acção sugerida</Button>}
        />
      </section>

      <Separator />

      {/* ── Table ── */}
      <section>
        <SectionTitle>Tabela</SectionTitle>
        <div className="overflow-hidden rounded-2xl border border-border bg-bg-surface">
          <table className="w-full text-sm">
            <thead className="border-b border-border text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-5 py-4 text-left font-medium">Nome</th>
                <th className="hidden px-5 py-4 text-left font-medium sm:table-cell">Unidade</th>
                <th className="px-5 py-4 text-left font-medium">Estado</th>
                <th className="px-5 py-4" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {[
                { name: "João Silva", unit: "Brothers 1", active: true },
                { name: "Carlos Santos", unit: "Brothers 2", active: true },
                { name: "Miguel Costa", unit: "Brothers 1", active: false },
              ].map((row) => (
                <tr key={row.name} className="transition-colors duration-150 hover-fine:hover:bg-background">
                  <td className="px-5 py-4 font-medium">{row.name}</td>
                  <td className="hidden px-5 py-4 text-muted-foreground sm:table-cell">
                    {row.unit}
                  </td>
                  <td className="px-5 py-4">
                    <Badge
                      variant={row.active ? "default" : "secondary"}
                      className={row.active ? "bg-brand/15 text-brand" : ""}
                    >
                      {row.active ? "Activo" : "Inactivo"}
                    </Badge>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex justify-end gap-1">
                      <Button size="sm" variant="ghost">
                        <Settings className="mr-1 h-3.5 w-3.5" />
                        Editar
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 className="mr-1 h-3.5 w-3.5" />
                        Eliminar
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <Separator />

      {/* ── States ── */}
      <section>
        <SectionTitle>Estados</SectionTitle>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-bg-surface py-14 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-background">
              <User className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="font-heading text-base font-semibold">Estado vazio</p>
            <p className="mt-1 text-sm text-muted-foreground">Ainda não há registos aqui.</p>
            <Button className="mt-6 bg-brand text-primary-foreground hover:bg-brand-hover">
              <Plus className="mr-2 h-4 w-4" />
              Criar primeiro
            </Button>
          </div>

          <div className="space-y-3">
            <div className="flex items-start gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 p-4">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
              <div>
                <p className="text-sm font-medium text-destructive">Erro ao guardar</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Verifique a ligação e tente novamente.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-4">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
              <div>
                <p className="text-sm font-medium text-emerald-400">Guardado com sucesso</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  As alterações foram aplicadas.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-2xl border border-brand/30 bg-brand/5 p-4">
              <Download className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
              <div>
                <p className="text-sm font-medium">Informação</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Nota informativa neutra.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Separator />

      {/* ── Breadcrumb ── */}
      <section>
        <SectionTitle>Breadcrumb</SectionTitle>
        <div className="rounded-2xl border border-border bg-bg-surface p-6">
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <span className="hover:text-foreground cursor-pointer">Admin</span>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="hover:text-foreground cursor-pointer">Barbeiros</span>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="text-foreground font-medium">João Silva</span>
          </div>
        </div>
      </section>

      {/* ── Fieldset ── */}
      <section>
        <SectionTitle>Fieldset / Secções de formulário</SectionTitle>
        <fieldset className="max-w-lg rounded-2xl border border-border bg-bg-surface p-6">
          <legend className="px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Secção de exemplo
          </legend>
          <div className="mt-1 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="ds-field-1">Campo obrigatório *</Label>
              <Input id="ds-field-1" required placeholder="Valor…" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ds-field-2">
                Campo opcional{" "}
                <span className="font-normal text-muted-foreground">(auto)</span>
              </Label>
              <Input id="ds-field-2" placeholder="Preenchido automaticamente" />
            </div>
          </div>
        </fieldset>
      </section>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-4 font-heading text-xl font-semibold">{children}</h2>
  );
}

function Code({ children }: { children: React.ReactNode }) {
  return (
    <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[0.85em] text-brand">
      {children}
    </code>
  );
}
