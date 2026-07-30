import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Retorno do OAuth (Google).
 *
 * O Supabase devolve um `code` de uso único que trocamos por uma sessão em
 * cookie. Só depois disso o utilizador está autenticado do lado do servidor.
 *
 * O `next` permite retomar de onde o utilizador estava — em especial voltar
 * ao cartão que ele estava a tentar reclamar quando lhe pedimos login.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  const rawNext = searchParams.get("next") ?? "/minha-conta";
  // Só caminhos internos: `//evil.com` é um URL absoluto disfarçado.
  let next =
    rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/minha-conta";

  // A unidade pode ter-se perdido no caminho: o Supabase descarta o
  // `redirectTo` inteiro quando ele não bate certo com a lista de Redirect
  // URLs, e o `next` volta vazio. O cookie gravado antes do login não passa
  // pelo Supabase, por isso chega cá intacto — é a rede de segurança que
  // impede a pessoa de aterrar no ecrã a escolher a barbearia de onde veio.
  const unidade = request.cookies.get("ob_unidade")?.value;
  const shouldRestoreUnit =
    !!unidade && next.startsWith("/minha-conta") && !next.includes("unidade=");
  if (shouldRestoreUnit) {
    next += `${next.includes("?") ? "&" : "?"}unidade=${encodeURIComponent(unidade!)}`;
  }

  /** Redirecciona e limpa o cookie da unidade — já cumpriu o que tinha a fazer. */
  function go(url: URL) {
    const res = NextResponse.redirect(url);
    if (unidade) res.cookies.delete("ob_unidade");
    return res;
  }

  // O utilizador cancelou no ecrã da Google, ou o provider recusou.
  if (error) {
    const url = new URL("/entrar", origin);
    url.searchParams.set("erro", errorDescription ?? error);
    return go(url);
  }

  if (!code) {
    return go(new URL("/entrar", origin));
  }

  const supabase = await createClient();
  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

  if (exchangeError) {
    const url = new URL("/entrar", origin);
    url.searchParams.set("erro", exchangeError.message);
    return go(url);
  }

  return go(new URL(next, origin));
}
