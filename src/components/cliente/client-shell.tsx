import { Header } from "@/components/public/header";
import { Footer } from "@/components/public/footer";
import type { UnitRow } from "@/types/database.types";

/**
 * Moldura das páginas do cliente — `/programa`, `/minha-conta`, `/entrar`.
 *
 * Estas rotas vivem fora de `(public)/[unidade]/`, que é quem monta o
 * cabeçalho e o rodapé do resto do site. Sem isto eram becos sem saída:
 * a pessoa aterrava no programa de pontos sem forma de voltar.
 *
 * Não dá para resolver com um layout partilhado — os layouts do App Router
 * não recebem `searchParams`, e é de lá (`?unidade=`) que vem a unidade do
 * `/programa`. Cada página resolve a sua e passa-a aqui.
 *
 * Sem `FloatingCTA` de propósito: o botão fixo aponta para `/programa`, e
 * dentro destas páginas seria um atalho para onde já se está.
 */
export function ClientShell({
  unit,
  units,
  hasCard = false,
  children,
}: {
  unit: UnitRow;
  units: UnitRow[];
  /** Estas páginas já sabem a resposta sem consultar nada: passam-na ao nav. */
  hasCard?: boolean;
  children: React.ReactNode;
}) {
  return (
    <>
      <Header unit={unit} units={units} hasCard={hasCard} />
      {/* Coluna flex (o layout público usa só `flex-1`): o `/entrar` é curto
       * e sem isto sobrava um vazio entre o conteúdo e o rodapé em ecrãs
       * altos. Assim o conteúdo cresce e o rodapé assenta no fundo. */}
      <main className="flex flex-1 flex-col">{children}</main>
      <Footer unit={unit} />
    </>
  );
}
