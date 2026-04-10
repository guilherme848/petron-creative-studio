import { redirect } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { getAuthUser } from "@/lib/auth";
import { AdminDashboard } from "./AdminDashboard";

export const dynamic = "force-dynamic";

const CREATIVE_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const CREATIVE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export interface UserTotals {
  user_id: string;
  name: string;
  email: string;
  creative_role: string;
  avatar_url: string | null;
  total_creatives: number;
  total_adjustments: number;
  total_exports: number;
  total_cost_usd: number;
  minutes_saved: number;
  last_activity_at: string | null;
}

export interface DailySeriesPoint {
  day: string;
  event_count: number;
  total_cost_usd: number;
}

export interface AdminData {
  currentUser: {
    name: string;
    email: string;
    avatarUrl: string | null;
  };
  totals: {
    users: number;
    creatives: number;
    adjustments: number;
    exports: number;
    costUsd: number;
    minutesSaved: number;
  };
  userRanking: UserTotals[];
  dailySeries: DailySeriesPoint[];
  topClients: { client_id: string | null; client_name: string | null; count: number; cost_usd: number }[];
  styleDistribution: { style_family: number | null; count: number }[];
  alerts: { type: "high_usage" | "high_cost"; user_id: string; name: string; message: string }[];
}

async function fetchAdminData(): Promise<AdminData | null> {
  const user = await getAuthUser();
  if (!user || !user.isAdmin) return null;

  const db = createClient(CREATIVE_SUPABASE_URL, CREATIVE_SERVICE_KEY);

  // 1. Ranking de usuários (usa a view criada na migration)
  const { data: userTotals } = await db
    .from("usage_totals_by_user")
    .select("*")
    .order("total_creatives", { ascending: false });

  const ranking: UserTotals[] = (userTotals as UserTotals[] | null) || [];

  // 2. Totais globais
  const totals = ranking.reduce(
    (acc, u) => ({
      users: acc.users + 1,
      creatives: acc.creatives + Number(u.total_creatives || 0),
      adjustments: acc.adjustments + Number(u.total_adjustments || 0),
      exports: acc.exports + Number(u.total_exports || 0),
      costUsd: acc.costUsd + Number(u.total_cost_usd || 0),
      minutesSaved: acc.minutesSaved + Number(u.minutes_saved || 0),
    }),
    { users: 0, creatives: 0, adjustments: 0, exports: 0, costUsd: 0, minutesSaved: 0 }
  );

  // 3. Série diária dos últimos 30 dias
  const since = new Date();
  since.setDate(since.getDate() - 30);
  const { data: dailyRaw } = await db
    .from("usage_events")
    .select("created_at, cost_usd")
    .gte("created_at", since.toISOString())
    .order("created_at", { ascending: true });

  const dayMap = new Map<string, { count: number; cost: number }>();
  (dailyRaw || []).forEach((e: { created_at: string; cost_usd: number | null }) => {
    const day = new Date(e.created_at).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
    });
    const prev = dayMap.get(day) || { count: 0, cost: 0 };
    dayMap.set(day, {
      count: prev.count + 1,
      cost: prev.cost + Number(e.cost_usd || 0),
    });
  });
  const dailySeries: DailySeriesPoint[] = Array.from(dayMap.entries()).map(([day, v]) => ({
    day,
    event_count: v.count,
    total_cost_usd: v.cost,
  }));

  // 4. Top clientes (por contagem de gerações)
  const { data: topClientsRaw } = await db
    .from("usage_events")
    .select("client_id, cost_usd")
    .not("client_id", "is", null);

  const clientMap = new Map<string, { count: number; cost: number }>();
  (topClientsRaw || []).forEach((e: { client_id: string | null; cost_usd: number | null }) => {
    if (!e.client_id) return;
    const prev = clientMap.get(e.client_id) || { count: 0, cost: 0 };
    clientMap.set(e.client_id, { count: prev.count + 1, cost: prev.cost + Number(e.cost_usd || 0) });
  });

  // Busca os nomes dos top 5 clients
  const topClientIds = Array.from(clientMap.entries())
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 5)
    .map(([id]) => id);
  const { data: clientNames } = topClientIds.length > 0
    ? await db.from("clients").select("id, name").in("id", topClientIds)
    : { data: [] };
  const nameMap = new Map((clientNames || []).map((c: { id: string; name: string }) => [c.id, c.name]));
  const topClients = topClientIds.map((id) => ({
    client_id: id,
    client_name: nameMap.get(id) || "Cliente sem nome",
    count: clientMap.get(id)!.count,
    cost_usd: clientMap.get(id)!.cost,
  }));

  // 5. Distribuição por style family
  const { data: styleRaw } = await db
    .from("usage_events")
    .select("style_family")
    .not("style_family", "is", null);

  const styleMap = new Map<number, number>();
  (styleRaw || []).forEach((e: { style_family: number | null }) => {
    if (e.style_family != null) {
      styleMap.set(e.style_family, (styleMap.get(e.style_family) || 0) + 1);
    }
  });
  const styleDistribution = Array.from(styleMap.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([style_family, count]) => ({ style_family, count }));

  // 6. Alertas simples: usuário 2x acima da média de criativos/dia
  const avgCreativesPerUser = ranking.length > 0
    ? totals.creatives / ranking.length
    : 0;
  const alerts = ranking
    .filter((u) => u.total_creatives > avgCreativesPerUser * 2 && u.total_creatives > 10)
    .slice(0, 3)
    .map((u) => ({
      type: "high_usage" as const,
      user_id: u.user_id,
      name: u.name,
      message: `${u.total_creatives} criativos gerados (${(u.total_creatives / Math.max(avgCreativesPerUser, 1)).toFixed(1)}x a média)`,
    }));

  return {
    currentUser: {
      name: user.name,
      email: user.email,
      avatarUrl: user.avatarUrl,
    },
    totals,
    userRanking: ranking,
    dailySeries,
    topClients,
    styleDistribution,
    alerts,
  };
}

export default async function AdminPage() {
  const data = await fetchAdminData();
  if (!data) {
    redirect("/");
  }
  return <AdminDashboard data={data} />;
}
