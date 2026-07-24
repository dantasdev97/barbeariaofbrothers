/**
 * Transição de entrada entre secções do admin.
 *
 * O `template.tsx` recebe uma key própria por segmento, por isso remonta ao
 * navegar entre destinos directos (`/admin` → `/admin/clientes`) — que é
 * exactamente a navegação da tab bar — e **não** remonta ao entrar em
 * sub-rotas (`/admin/clientes/[id]`). É o comportamento desejado: quem faz
 * drill-down repete a acção muitas vezes ao dia e não quer animação.
 *
 * A animação é CSS (`.page-enter`) e não Framer Motion, porque corre no
 * momento em que a main thread está ocupada a carregar a página nova.
 */
export default function AdminTemplate({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="page-enter">{children}</div>;
}
