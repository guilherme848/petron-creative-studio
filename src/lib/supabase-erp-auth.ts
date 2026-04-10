/**
 * SUPABASE ERP AUTH CLIENT — Petron Creative Studio
 *
 * Cross-project auth via Supabase do ERP Petron. O Creative Studio usa o
 * Supabase do ERP APENAS pra autenticação (login/session/logout) e pra
 * consultar team_members/job_roles. Os dados operacionais do Creative
 * Studio (clients, products, creatives, usage_events) continuam no
 * Supabase próprio (NEXT_PUBLIC_SUPABASE_URL).
 *
 * Fluxo de auth:
 *   1. Usuário abre Creative Studio → middleware checa cookie de sessão
 *   2. Se não logado → redireciona /login
 *   3. Login com email+senha → valida no Supabase ERP → cookie salvo
 *   4. Middleware valida cookie em toda request
 *   5. Server actions buscam team_member do ERP pra resolver role
 *
 * Env vars necessárias:
 *   - PETRON_ERP_SUPABASE_URL       (já existe — usado pelo webhook)
 *   - PETRON_ERP_ANON_KEY           (NOVA — anon key público do Supabase ERP)
 */

import { createBrowserClient, createServerClient } from "@supabase/ssr";
import type { CookieOptions } from "@supabase/ssr";

const ERP_URL = process.env.PETRON_ERP_SUPABASE_URL || process.env.NEXT_PUBLIC_PETRON_ERP_SUPABASE_URL!;
const ERP_ANON_KEY = process.env.PETRON_ERP_ANON_KEY || process.env.NEXT_PUBLIC_PETRON_ERP_ANON_KEY!;

/**
 * Cliente usado no browser (client components) pra auth no ERP Supabase.
 * Persiste sessão em cookies automaticamente.
 */
export function createErpBrowserClient() {
  return createBrowserClient(ERP_URL, ERP_ANON_KEY);
}

/**
 * Cliente usado em server components, server actions e route handlers.
 * Lê/escreve cookies via o store de cookies do Next.js.
 *
 * @param cookieStore — o return de `cookies()` do Next.js 15+ (já awaited)
 */
export function createErpServerClient(cookieStore: {
  getAll: () => { name: string; value: string }[];
  set: (name: string, value: string, options?: CookieOptions) => void;
}) {
  return createServerClient(ERP_URL, ERP_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Chamado de Server Component — o middleware cuida de refresh
        }
      },
    },
  });
}

/**
 * Lista de roles permitidos no Creative Studio (case-insensitive match por nome).
 * Usada pra gatekeeping no middleware e no login action.
 */
export const ALLOWED_ROLES = {
  admin: ["administrador", "admin", "diretor", "diretora"],
  gerente: ["gerente"],
  trafego: ["tráfego", "trafego", "traffic", "ads", "gestor de tráfego", "gestora de tráfego"],
  cs: ["cs", "customer success", "atendimento", "atendimento ao cliente"],
} as const;

/** Resolve o role interno do Creative Studio a partir do nome do role no ERP */
export function resolveCreativeRole(erpRoleName: string | null | undefined): keyof typeof ALLOWED_ROLES | null {
  if (!erpRoleName) return null;
  const normalized = erpRoleName.trim().toLowerCase();
  for (const [creativeRole, patterns] of Object.entries(ALLOWED_ROLES)) {
    for (const pattern of patterns) {
      if (normalized === pattern || normalized.includes(pattern)) {
        return creativeRole as keyof typeof ALLOWED_ROLES;
      }
    }
  }
  return null;
}

/** True se o role do usuário tem acesso ao painel /admin */
export function isAdminRole(role: keyof typeof ALLOWED_ROLES | null): boolean {
  return role === "admin";
}
