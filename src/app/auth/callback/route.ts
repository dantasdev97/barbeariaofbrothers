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
  const next =
    rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/minha-conta";

  // O utilizador cancelou no ecrã da Google, ou o provider recusou.
  if (error) {
    const url = new URL("/entrar", origin);
    url.searchParams.set("erro", errorDescription ?? error);
    return NextResponse.redirect(url);
  }

  if (!code) {
    return NextResponse.redirect(new URL("/entrar", origin));
  }

  const supabase = await createClient();
  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

  if (exchangeError) {
    const url = new URL("/entrar", origin);
    url.searchParams.set("erro", exchangeError.message);
    return NextResponse.redirect(url);
  }

  return NextResponse.redirect(new URL(next, origin));
}
