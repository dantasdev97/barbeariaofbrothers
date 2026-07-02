import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { LOCALE_COOKIE, isLocale, localeFromAcceptLanguage } from "@/lib/i18n/config";

const ADMIN_PREFIX = "/admin";
const LOGIN_PATH = "/login";

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  let user: { id: string } | null = null;

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
  }

  const { pathname } = request.nextUrl;

  // Admin guard — block /admin/* without session
  if (pathname.startsWith(ADMIN_PREFIX) && !user) {
    const redirect = request.nextUrl.clone();
    redirect.pathname = LOGIN_PATH;
    redirect.searchParams.set("next", pathname);
    return NextResponse.redirect(redirect);
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
