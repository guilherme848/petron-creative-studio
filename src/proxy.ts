import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

/**
 * PROXY — Petron Creative Studio
 *
 * (proxy.ts é o novo nome do antigo middleware.ts no Next 16+)
 *
 * Protege todas as rotas do Creative Studio exceto /login e endpoints de
 * webhook. Valida a sessão do Supabase ERP (cross-project auth). Se não
 * autenticado, redireciona pra /login.
 *
 * IMPORTANTE: este proxy valida APENAS se existe uma sessão ativa no
 * Supabase ERP. A validação do role (está no allowlist de Creative?)
 * é feita em server actions (login) e em getAuthUser() nos route handlers.
 */

const PUBLIC_ROUTES = ["/login"];
const PUBLIC_API_PREFIXES = [
  "/api/webhooks/",       // webhook do ERP sync (tem auth própria via secret)
  "/api/auth/",           // rotas de auth
];

const ERP_URL = process.env.PETRON_ERP_SUPABASE_URL || process.env.NEXT_PUBLIC_PETRON_ERP_SUPABASE_URL || "";
const ERP_ANON = process.env.PETRON_ERP_ANON_KEY || process.env.NEXT_PUBLIC_PETRON_ERP_ANON_KEY || "";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Bypass pra rotas públicas
  if (PUBLIC_ROUTES.includes(pathname)) {
    return NextResponse.next();
  }
  for (const prefix of PUBLIC_API_PREFIXES) {
    if (pathname.startsWith(prefix)) {
      return NextResponse.next();
    }
  }

  // Se o ERP_URL ou ERP_ANON não estão configurados, middleware fica inerte
  // pra não quebrar o build/preview. O app roda sem auth até as envs serem setadas.
  if (!ERP_URL || !ERP_ANON) {
    return NextResponse.next();
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(ERP_URL, ERP_ANON, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  const { data: { user } } = await supabase.auth.getUser();

  // Não autenticado → redireciona pra login
  if (!user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Matches all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, *.svg, *.png, etc (public assets)
     * - files with file extensions (assets)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\..*$).*)",
  ],
};
