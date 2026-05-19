import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

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

    const { data } = await supabase.auth.getUser();
    user = data.user ?? null;
  }

  const { pathname } = request.nextUrl;

  // Admin guard — block /admin/* without session
  if (pathname.startsWith(ADMIN_PREFIX) && !user) {
    const url = request.nextUrl.clone();
    url.pathname = LOGIN_PATH;
    url.searchParams.set("next", pathname);
    return forwardCookies(NextResponse.redirect(url), response);
  }

  // Already logged in but visiting /login — bounce to /admin
  if (pathname === LOGIN_PATH && user) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin";
    url.search = "";
    return forwardCookies(NextResponse.redirect(url), response);
  }

  return response;
}

// Copy refreshed Supabase cookies from the original response onto a redirect
// response. Without this, the new session cookies are dropped and the next
// request lands without a session — triggering /login ↔ /admin loops.
function forwardCookies(target: NextResponse, source: NextResponse) {
  source.cookies.getAll().forEach((cookie) => {
    target.cookies.set(cookie);
  });
  return target;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|logo.png|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
