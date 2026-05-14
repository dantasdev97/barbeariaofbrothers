import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Termos de Utilização",
  description: "Termos e condições de utilização do site da Barbearia Of Brothers.",
  robots: { index: true, follow: false },
};

export default function TermosPage() {
  const updated = "14 de maio de 2026";

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
        <h1 className="font-heading text-4xl font-semibold tracking-tight">Termos de Utilização</h1>
        <p className="mt-3 text-sm text-muted-foreground">Última atualização: {updated}</p>

        <div className="mt-10 space-y-10 text-[15px] leading-relaxed text-foreground/80">

          <section>
            <h2 className="mb-3 font-heading text-xl font-semibold text-foreground">1. Objeto e aceitação</h2>
            <p>
              Os presentes Termos de Utilização regulam o acesso e a utilização do site{" "}
              <strong className="text-foreground">barbeariaofbrothers.pt</strong>, operado pela{" "}
              <strong className="text-foreground">Barbearia Of Brothers</strong>, com sede em Leiria, Portugal.
            </p>
            <p className="mt-3">
              Ao aceder ou utilizar este site, aceitas integralmente estes Termos. Se não concordares
              com algum ponto, deves cessar a utilização do site.
            </p>
          </section>

          <section>
            <h2 className="mb-3 font-heading text-xl font-semibold text-foreground">2. Descrição do serviço</h2>
            <p>Este site tem carácter informativo e comercial e permite:</p>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-muted-foreground">
              <li>
                <strong className="text-foreground">Consultar o catálogo de produtos</strong> — preços e
                disponibilidade indicativos, sujeitos a confirmação no momento da encomenda.
              </li>
              <li>
                <strong className="text-foreground">Encomendar produtos via WhatsApp</strong> — as encomendas
                são confirmadas manualmente pela equipa; a Barbearia Of Brothers reserva-se o direito
                de recusar ou cancelar pedidos em caso de indisponibilidade de stock.
              </li>
              <li>
                <strong className="text-foreground">Agendar serviços via Buk.pt</strong> — o agendamento
                é processado pela plataforma Buk.pt, sujeita aos seus próprios termos e condições.
              </li>
              <li>
                <strong className="text-foreground">Obter informação sobre a equipa e localização</strong> — horários,
                moradas e contactos das nossas unidades.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 font-heading text-xl font-semibold text-foreground">3. Encomendas e pagamentos</h2>
            <p>
              As encomendas realizadas via WhatsApp constituem uma proposta de compra sujeita a
              aceitação pela Barbearia Of Brothers. O contrato de compra e venda considera-se
              celebrado apenas após confirmação expressa da nossa parte (via mensagem de resposta).
            </p>
            <p className="mt-3">
              O pagamento é efectuado presencialmente na barbearia no momento do levantamento, ou
              via método acordado no momento da confirmação. Não processamos pagamentos online
              directamente neste site.
            </p>
            <p className="mt-3">
              Os preços apresentados incluem IVA à taxa legal em vigor e podem ser alterados sem
              aviso prévio. O preço aplicável é o vigente no momento da confirmação da encomenda.
            </p>
          </section>

          <section>
            <h2 className="mb-3 font-heading text-xl font-semibold text-foreground">4. Propriedade intelectual</h2>
            <p>
              Todo o conteúdo deste site — incluindo logótipo, textos, fotografias, vídeos,
              design e código — é propriedade da Barbearia Of Brothers ou dos seus licenciadores,
              e está protegido pela legislação portuguesa e europeia de direitos de autor e
              propriedade intelectual.
            </p>
            <p className="mt-3">
              É proibida a reprodução, distribuição, modificação ou utilização comercial de qualquer
              conteúdo sem autorização escrita prévia. A utilização para fins pessoais e não
              comerciais é permitida, desde que seja indicada a fonte.
            </p>
          </section>

          <section>
            <h2 className="mb-3 font-heading text-xl font-semibold text-foreground">5. Limitação de responsabilidade</h2>
            <p>
              A Barbearia Of Brothers esforça-se por manter a informação do site atualizada e
              correta, mas não garante a ausência de erros ou omissões. As fotografias dos produtos
              são meramente ilustrativas — a apresentação final pode variar ligeiramente.
            </p>
            <p className="mt-3">
              O site é disponibilizado "tal como está". Não nos responsabilizamos por danos
              diretos ou indiretos resultantes da utilização ou impossibilidade de utilização
              do site, salvo em caso de dolo ou negligência grave da nossa parte.
            </p>
            <p className="mt-3">
              A disponibilidade do site pode ser interrompida para manutenção ou por razões
              técnicas fora do nosso controlo, sem que tal constitua incumprimento.
            </p>
          </section>

          <section>
            <h2 className="mb-3 font-heading text-xl font-semibold text-foreground">6. Links externos</h2>
            <p>
              Este site contém links para plataformas externas como Buk.pt, Google Maps e WhatsApp.
              Esses serviços são operados por terceiros independentes e regidos pelos seus próprios
              termos e políticas de privacidade. A Barbearia Of Brothers não tem controlo sobre
              o conteúdo dessas plataformas e não assume qualquer responsabilidade pelo mesmo.
            </p>
          </section>

          <section>
            <h2 className="mb-3 font-heading text-xl font-semibold text-foreground">7. Conduta do utilizador</h2>
            <p>Ao utilizar este site, comprometes-te a:</p>
            <ul className="mt-3 list-disc space-y-1 pl-5 text-muted-foreground">
              <li>Não utilizar o site para fins ilegais ou não autorizados</li>
              <li>Não tentar aceder a áreas restritas ou sistemas internos</li>
              <li>Não transmitir conteúdo prejudicial, ofensivo ou que viole direitos de terceiros</li>
              <li>Não sobrecarregar a infraestrutura do site de forma intencional</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 font-heading text-xl font-semibold text-foreground">8. Alterações aos termos</h2>
            <p>
              Reservamo-nos o direito de alterar estes Termos de Utilização a qualquer momento.
              As alterações entram em vigor no momento da publicação nesta página. A continuação
              da utilização do site após a publicação de alterações constitui aceitação das mesmas.
            </p>
          </section>

          <section>
            <h2 className="mb-3 font-heading text-xl font-semibold text-foreground">9. Lei aplicável e foro</h2>
            <p>
              Estes Termos de Utilização são regidos pelo direito português. Em caso de litígio,
              as partes submetem-se à jurisdição exclusiva dos tribunais da comarca de{" "}
              <strong className="text-foreground">Leiria</strong>, com expressa renúncia a
              qualquer outro foro.
            </p>
          </section>

          <section>
            <h2 className="mb-3 font-heading text-xl font-semibold text-foreground">10. Contacto</h2>
            <p>
              Para questões relacionadas com estes Termos, contacta-nos em{" "}
              <a
                href="mailto:geral@barbeariaofbrothers.pt"
                className="text-brand underline underline-offset-2 hover:opacity-80"
              >
                geral@barbeariaofbrothers.pt
              </a>{" "}
              ou presencialmente em qualquer das nossas unidades em Leiria.
            </p>
          </section>

        </div>

        <div className="mt-14 border-t border-border pt-8 text-sm text-muted-foreground">
          <p>Barbearia Of Brothers · Leiria, Portugal</p>
          <div className="mt-3 flex gap-4">
            <Link href="/privacidade" className="underline underline-offset-2 transition hover:text-brand">Política de Privacidade</Link>
            <Link href="/" className="underline underline-offset-2 transition hover:text-brand">Voltar ao site</Link>
          </div>
        </div>
      </main>
    </div>
  );
}
