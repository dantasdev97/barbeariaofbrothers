import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { LOCALE_COOKIE, isLocale, localeFromAcceptLanguage } from "@/lib/i18n/config";

const ADMIN_PREFIX = "/admin";
const LOGIN_PATH = "/login";
/** Para onde mandar quem está autenticado mas não é staff. */
const CLIENT_HOME = "/minha-conta";

export async function proxy(request: NextRequest) {
  // Código de OAuth que aterrou na homepage.
  //
  // Quando o `redirectTo` que pedimos não bate certo com a lista de Redirect
  // URLs do projecto, o Supabase descarta-o em silêncio e devolve o `?code=`
  // ao Site URL — a raiz. A raiz não troca o código por sessão (só o
  // `/auth/callback` o faz), por isso a pessoa voltava da Google ao site sem
  // sessão, sem cartão e sem erro nenhum à vista.
  //
  // Reencaminhar aqui salva o percurso: o código ainda não foi gasto, o
  // `/auth/callback` troca-o e repõe a unidade a partir do cookie
  // `ob_unidade`. Só a raiz, para não tocar em `/redefinir`, que trata do seu
  // código no browser, nem no próprio `/auth/callback`.
  if (
    request.nextUrl.pathname === "/" &&
    request.nextUrl.searchParams.has("code")
  ) {
    const target = request.nextUrl.clone();
    target.pathname = "/auth/callback";
    return NextResponse.redirect(target);
  }

  let response = NextResponse.next({ request });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  let user: { id: string } | null = null;
  // Içado para fora do bloco: o guarda do admin abaixo precisa dele para
  // confirmar o perfil de staff, não só a existência de sessão.
  let supabaseClient: ReturnType<typeof createServerClient> | null = null;

  if (supabaseUrl && supabaseKey) {
    const supabase = createServerClient(supabaseUrl, supabaseKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    });

    // Refresh session cookie + read user
    const { data } = await supabase.auth.getUser();
    user = data.user ?? null;
    supabaseClient = supabase;
  }

  const { pathname } = request.nextUrl;

  // Admin guard — /admin/* exige sessão E perfil de staff.
  //
  // Verificar só a sessão deixou de chegar a partir do momento em que os
  // clientes passaram a ter conta: um cliente autenticado atravessava este
  // guarda, chegava ao requireAdminSession(), não tinha linha em `profiles`
  // e era atirado de volta para /login — logado, mas preso num beco.
  // Aqui mandamo-lo para o cartão dele, que é onde ele queria estar.
  if (pathname.startsWith(ADMIN_PREFIX)) {
    if (!user) {
      const redirect = request.nextUrl.clone();
      redirect.pathname = LOGIN_PATH;
      redirect.searchParams.set("next", pathname);
      return NextResponse.redirect(redirect);
    }

    if (supabaseClient) {
      const { data: profile } = await supabaseClient
        .from("profiles")
        .select("id")
        .eq("id", user.id)
        .maybeSingle();

      if (!profile) {
        const redirect = request.nextUrl.clone();
        redirect.pathname = CLIENT_HOME;
        redirect.search = "";
        return NextResponse.redirect(redirect);
      }
    }
  }

  // Note: Removed automatic /login → /admin redirect to prevent redirect loops
  // Users logging in will stay on /login page after successful auth

  // Locale cookie — first visit only. Googlebot never sends it, so it always
  // falls back to `pt`: the indexed version stays the Portuguese one.
  const currentLocale = request.cookies.get(LOCALE_COOKIE)?.value;
  if (!isLocale(currentLocale)) {
    const guessed = localeFromAcceptLanguage(request.headers.get("accept-language"));
    response.cookies.set(LOCALE_COOKIE, guessed, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    });
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Run on all paths except static files, _next internals, and image assets.
     */
    "/((?!_next/static|_next/image|favicon.ico|logo.png|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
