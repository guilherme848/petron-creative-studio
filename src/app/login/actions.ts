"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createErpServerClient, resolveCreativeRole } from "@/lib/supabase-erp-auth";

export interface LoginResult {
  success: boolean;
  error?: string;
}

/**
 * Server action: valida credenciais no Supabase ERP, checa role do team_member,
 * e seta cookies de sessão. Retorna erro se:
 *   - Credenciais inválidas
 *   - Team member inativo
 *   - Role não está no allowlist do Creative Studio
 */
export async function loginAction(formData: FormData): Promise<LoginResult> {
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");

  if (!email || !password) {
    return { success: false, error: "Email e senha são obrigatórios" };
  }

  const cookieStore = await cookies();
  const erp = createErpServerClient({
    getAll: () => cookieStore.getAll().map((c) => ({ name: c.name, value: c.value })),
    set: (name, value, options) => {
      try {
        cookieStore.set({ name, value, ...options });
      } catch {
        // Read-only context
      }
    },
  });

  // 1. Autentica no Supabase ERP
  const { data: authData, error: authError } = await erp.auth.signInWithPassword({
    email,
    password,
  });

  if (authError || !authData.user) {
    return { success: false, error: authError?.message || "Credenciais inválidas" };
  }

  // 2. Busca team_member + role
  const { data: teamMember } = await erp
    .from("team_members")
    .select("id, name, active, role_id, job_roles(name)")
    .eq("auth_user_id", authData.user.id)
    .maybeSingle();

  if (!teamMember) {
    await erp.auth.signOut();
    return {
      success: false,
      error: "Usuário não encontrado no ERP Petron. Fale com o administrador.",
    };
  }

  if (!teamMember.active) {
    await erp.auth.signOut();
    return {
      success: false,
      error: "Sua conta está inativa. Fale com o administrador.",
    };
  }

  // 3. Valida role no allowlist do Creative Studio
  const rawRole = teamMember.job_roles as unknown as { name: string } | null;
  const erpRoleName = rawRole?.name || "";
  const creativeRole = resolveCreativeRole(erpRoleName);

  if (!creativeRole) {
    await erp.auth.signOut();
    return {
      success: false,
      error: `Seu cargo "${erpRoleName || "sem definição"}" não tem acesso ao Creative Studio. Fale com o administrador.`,
    };
  }

  return { success: true };
}

/**
 * Server action: encerra a sessão no Supabase ERP e redireciona pra /login.
 */
export async function logoutAction() {
  const cookieStore = await cookies();
  const erp = createErpServerClient({
    getAll: () => cookieStore.getAll().map((c) => ({ name: c.name, value: c.value })),
    set: (name, value, options) => {
      try {
        cookieStore.set({ name, value, ...options });
      } catch {
        // Read-only
      }
    },
  });

  await erp.auth.signOut();
  redirect("/login");
}
