/**
 * AUTH HELPERS — Petron Creative Studio
 *
 * Server-side helpers pra obter a sessão atual, o team_member do ERP e
 * o record local de user no Creative Supabase. Usado em:
 *   - Middleware (proteção de rotas)
 *   - Server components (SSR)
 *   - Server actions (login, logout)
 *   - Route handlers (tracking de usage events)
 */

import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import { createErpServerClient, resolveCreativeRole, isAdminRole, type ALLOWED_ROLES } from "./supabase-erp-auth";

export type CreativeRole = keyof typeof ALLOWED_ROLES;

export interface AuthUser {
  /** auth.users.id do Supabase ERP (JWT sub) */
  id: string;
  email: string;
  /** team_members.id no Supabase ERP */
  teamMemberId: string;
  /** team_members.name no ERP */
  name: string;
  /** URL completa da foto de perfil do ERP (já resolvida) */
  avatarUrl: string | null;
  /** Nome original do role vindo do ERP (ex: "Gerente de Tráfego") */
  erpRoleName: string;
  /** Role interno resolvido do Creative Studio */
  creativeRole: CreativeRole;
  /** True se o creativeRole é "admin" */
  isAdmin: boolean;
  /** users.id local no Supabase do Creative */
  localUserId: string;
}

const CREATIVE_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const CREATIVE_SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const CREATIVE_SUPABASE_SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;

const ERP_PROFILE_PHOTO_BASE = `${process.env.PETRON_ERP_SUPABASE_URL || process.env.NEXT_PUBLIC_PETRON_ERP_SUPABASE_URL}/storage/v1/object/public/profile-photos/`;

/**
 * Retorna o usuário autenticado consolidado (ERP session + team_member + local user),
 * ou null se não autenticado ou role não permitido.
 *
 * Esta função é a fonte de verdade única de "quem é o usuário logado".
 */
export async function getAuthUser(): Promise<AuthUser | null> {
  const cookieStore = await cookies();
  const erp = createErpServerClient({
    getAll: () => cookieStore.getAll().map((c) => ({ name: c.name, value: c.value })),
    set: (name, value, options) => {
      try {
        cookieStore.set({ name, value, ...options });
      } catch {
        // Read-only context — ignored
      }
    },
  });

  // 1. Valida sessão no Supabase do ERP
  const { data: { user } } = await erp.auth.getUser();
  if (!user || !user.email) return null;

  // 2. Busca team_member do usuário no ERP
  const { data: teamMember, error } = await erp
    .from("team_members")
    .select("id, name, full_name, email, role_id, active, profile_photo_path, job_roles(name)")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (error || !teamMember || !teamMember.active) return null;

  // 3. Resolve role name + Creative role
  const rawRole = teamMember.job_roles as unknown as { name: string } | null;
  const erpRoleName = rawRole?.name || "";
  const creativeRole = resolveCreativeRole(erpRoleName);
  if (!creativeRole) return null; // role sem acesso ao Creative Studio

  // 4. Sync user local no Creative Supabase
  const creative = createClient(
    CREATIVE_SUPABASE_URL,
    CREATIVE_SUPABASE_SERVICE || CREATIVE_SUPABASE_ANON
  );

  const displayName = (teamMember.full_name || teamMember.name || user.email).trim();
  const avatarUrl = teamMember.profile_photo_path
    ? `${ERP_PROFILE_PHOTO_BASE}${teamMember.profile_photo_path}`
    : null;

  const { data: existing } = await creative
    .from("users")
    .select("id")
    .eq("erp_auth_user_id", user.id)
    .maybeSingle();

  let localUserId: string;

  if (existing) {
    localUserId = existing.id;
    // Atualiza campos que podem ter mudado no ERP
    await creative
      .from("users")
      .update({
        email: user.email,
        name: displayName,
        avatar_url: avatarUrl,
        erp_team_member_id: teamMember.id,
        erp_role_name: erpRoleName,
        creative_role: creativeRole,
        is_active: teamMember.active,
        last_sign_in_at: new Date().toISOString(),
      })
      .eq("id", localUserId);
  } else {
    const { data: created } = await creative
      .from("users")
      .insert({
        erp_auth_user_id: user.id,
        erp_team_member_id: teamMember.id,
        email: user.email,
        name: displayName,
        avatar_url: avatarUrl,
        erp_role_name: erpRoleName,
        creative_role: creativeRole,
        is_active: teamMember.active,
        last_sign_in_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (!created) return null;
    localUserId = created.id;
  }

  return {
    id: user.id,
    email: user.email,
    teamMemberId: teamMember.id,
    name: displayName,
    avatarUrl,
    erpRoleName,
    creativeRole,
    isAdmin: isAdminRole(creativeRole),
    localUserId,
  };
}

/** Usado em route handlers pra gravar eventos com o user_id correto */
export async function getAuthUserOrNull(): Promise<AuthUser | null> {
  try {
    return await getAuthUser();
  } catch {
    return null;
  }
}
