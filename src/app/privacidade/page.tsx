import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { buildPageMetadata, LEGAL_UPDATED_LABEL } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  path: "/privacidade",
  index: true,
  title: "Política de Privacidade",
  description:
    "Informação sobre como a Barbearia Of Brothers trata os teus dados pessoais e utiliza cookies, ao abrigo do RGPD.",
});

export default function PrivacidadePage() {
  const updated = LEGAL_UPDATED_LABEL;

  return (
    <div className="min-h-screen bg-background">
      {/* Nav mínima */}
      <header className="border-b border-border px-4 py-4 sm:px-6">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <Image src="/logo.png" alt="Barbearia Of Brothers" width={36} height={36} className="h-9 w-auto" />
            <span className="font-heading text-sm font-semibold text-foreground">Barbearia Of Brothers</span>
          </Link>
          <Link href="/" className="text-sm text-muted-foreground transition hover:text-brand">
            ← Voltar ao site
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-brand">Legal</p>
        <h1 className="font-heading text-4xl font-semibold tracking-tight">Política de Privacidade</h1>
        <p className="mt-3 text-sm text-muted-foreground">Última atualização: {updated}</p>

        <div className="mt-10 space-y-10 text-[15px] leading-relaxed text-foreground/80">

          <section>
            <h2 className="mb-3 font-heading text-xl font-semibold text-foreground">1. Quem somos</h2>
            <p>
              O responsável pelo tratamento de dados é a <strong className="text-foreground">Barbearia Of Brothers</strong>,
              com sede em Leiria, Portugal. Para questões relacionadas com privacidade, pode contactar-nos
              através do endereço de e-mail{" "}
              <a href="mailto:geral@barbeariaofbrothers.pt" className="text-brand underline underline-offset-2 hover:opacity-80">
                geral@barbeariaofbrothers.pt
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="mb-3 font-heading text-xl font-semibold text-foreground">2. Que dados recolhemos</h2>
            <p className="mb-4">
              Recolhemos apenas os dados estritamente necessários para o funcionamento do site e melhoria da experiência:
            </p>
            <ul className="space-y-3 pl-0">
              {[
                {
                  t: "Google Analytics 4 (com consentimento)",
                  d: "Caso aceite os cookies, o Google Analytics 4 recolhe dados sobre a tua navegação para análise de tráfego. Estes dados são anonimizados (IP mascarado). Podes retirar o consentimento a qualquer momento limpando os dados do browser.",
                },
                {
                  t: "Eventos de interação",
                  d: "Registamos eventos anónimos de interação — como cliques em 'Agendar', visualizações de produto e inícios de checkout via WhatsApp — armazenados em base de dados segura (Supabase). Estes eventos não identificam o utilizador.",
                },
                {
                  t: "Carrinho de compras",
                  d: "O carrinho é guardado no localStorage do teu browser. Esta informação nunca é enviada para os nossos servidores nem partilhada com terceiros. Desaparece quando limpas os dados do browser.",
                },
                {
                  t: "Mensagens WhatsApp",
                  d: "Se inicias uma conversa via WhatsApp para encomendas ou agendamentos, os dados que partilhas (nome, contacto, pedido) são tratados pela Meta/WhatsApp e pela nossa equipa, exclusivamente para responder ao teu pedido.",
                },
              ].map((item) => (
                <li key={item.t} className="rounded-xl border border-border bg-bg-surface p-4">
                  <p className="font-semibold text-foreground">{item.t}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{item.d}</p>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="mb-3 font-heading text-xl font-semibold text-foreground">3. Finalidade do tratamento</h2>
            <p>
              Os dados são tratados para as seguintes finalidades:
            </p>
            <ul className="mt-3 list-disc space-y-1 pl-5 text-muted-foreground">
              <li>Análise estatística de tráfego e melhoria do site</li>
              <li>Gestão de encomendas e agendamentos</li>
              <li>Deteção e prevenção de abusos ou erros técnicos</li>
            </ul>
            <p className="mt-3">
              Não utilizamos os teus dados para fins de marketing direto, não os vendemos a terceiros
              e não tomamos decisões automatizadas com impacto significativo com base neles.
            </p>
          </section>

          <section>
            <h2 className="mb-3 font-heading text-xl font-semibold text-foreground">4. Cookies e tecnologias similares</h2>
            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-bg-surface text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    <th className="px-4 py-3">Tecnologia</th>
                    <th className="px-4 py-3">Tipo</th>
                    <th className="px-4 py-3">Consentimento</th>
                    <th className="px-4 py-3">Finalidade</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-foreground/80">
                  <tr>
                    <td className="px-4 py-3 font-medium">Eventos próprios (Supabase)</td>
                    <td className="px-4 py-3">Análise anónima</td>
                    <td className="px-4 py-3 text-green-600 dark:text-green-400">Não necessário</td>
                    <td className="px-4 py-3">Métricas de tráfego sem PII, sem cookies</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium">Google Analytics 4</td>
                    <td className="px-4 py-3">Cookie de análise</td>
                    <td className="px-4 py-3 text-amber-600 dark:text-amber-400">Necessário</td>
                    <td className="px-4 py-3">Análise de comportamento no site</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium">localStorage (carrinho)</td>
                    <td className="px-4 py-3">Armazenamento local</td>
                    <td className="px-4 py-3 text-green-600 dark:text-green-400">Não necessário</td>
                    <td className="px-4 py-3">Guardar itens no carrinho</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium">localStorage (consentimento)</td>
                    <td className="px-4 py-3">Preferência</td>
                    <td className="px-4 py-3 text-green-600 dark:text-green-400">Estritamente necessário</td>
                    <td className="px-4 py-3">Guardar a tua escolha de cookies</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="mb-3 font-heading text-xl font-semibold text-foreground">5. Partilha com terceiros</h2>
            <p>
              Os teus dados podem ser processados pelos seguintes subcontratantes, exclusivamente para
              prestação dos serviços de infraestrutura:
            </p>
            <ul className="mt-3 list-disc space-y-1 pl-5 text-muted-foreground">
              <li><strong className="text-foreground">Vercel Inc.</strong> — alojamento e CDN (EUA, com garantias adequadas ao abrigo do DPF)</li>
              <li><strong className="text-foreground">Supabase Inc.</strong> — base de dados e armazenamento (EUA, com garantias adequadas)</li>
              <li><strong className="text-foreground">Google LLC</strong> — Google Analytics 4, apenas com consentimento (EUA, certificado no DPF)</li>
            </ul>
            <p className="mt-3">
              Não partilhamos dados com outras entidades sem o teu consentimento explícito.
            </p>
          </section>

          <section>
            <h2 className="mb-3 font-heading text-xl font-semibold text-foreground">6. Os teus direitos (RGPD)</h2>
            <p className="mb-3">
              Ao abrigo do Regulamento Geral de Proteção de Dados (UE) 2016/679, tens os seguintes direitos:
            </p>
            <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
              <li><strong className="text-foreground">Acesso</strong> — saber que dados temos sobre ti (art.º 15.º)</li>
              <li><strong className="text-foreground">Retificação</strong> — corrigir dados incorretos (art.º 16.º)</li>
              <li><strong className="text-foreground">Apagamento</strong> — solicitar a eliminação dos teus dados (art.º 17.º)</li>
              <li><strong className="text-foreground">Limitação</strong> — restringir o tratamento em determinadas circunstâncias (art.º 18.º)</li>
              <li><strong className="text-foreground">Portabilidade</strong> — receber os teus dados num formato estruturado (art.º 20.º)</li>
              <li><strong className="text-foreground">Oposição</strong> — opor-te ao tratamento baseado em interesse legítimo (art.º 21.º)</li>
            </ul>
            <p className="mt-4">
              Para exercer qualquer destes direitos, contacta-nos em{" "}
              <a href="mailto:geral@barbeariaofbrothers.pt" className="text-brand underline underline-offset-2 hover:opacity-80">
                geral@barbeariaofbrothers.pt
              </a>
              . Tens também o direito de apresentar reclamação à{" "}
              <a
                href="https://www.cnpd.pt"
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand underline underline-offset-2 hover:opacity-80"
              >
                CNPD — Comissão Nacional de Proteção de Dados
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="mb-3 font-heading text-xl font-semibold text-foreground">7. Segurança e retenção</h2>
            <p>
              Adotamos medidas técnicas e organizativas adequadas para proteger os dados contra acesso
              não autorizado, alteração ou destruição. Os dados analíticos são retidos por um máximo
              de 14 meses. Os registos de eventos de interação são retidos por 12 meses.
            </p>
          </section>

          <section>
            <h2 className="mb-3 font-heading text-xl font-semibold text-foreground">8. Alterações a esta política</h2>
            <p>
              Podemos atualizar esta Política de Privacidade. Em caso de alterações relevantes,
              publicaremos a nova versão nesta página com a data de atualização. Recomendamos
              que a consultes periodicamente.
            </p>
          </section>

        </div>

        <div className="mt-14 border-t border-border pt-8 text-sm text-muted-foreground">
          <p>Barbearia Of Brothers · Leiria, Portugal</p>
          <div className="mt-3 flex gap-4">
            <Link href="/termos" className="underline underline-offset-2 transition hover:text-brand">Termos de Utilização</Link>
            <Link href="/" className="underline underline-offset-2 transition hover:text-brand">Voltar ao site</Link>
          </div>
        </div>
      </main>
    </div>
  );
}
