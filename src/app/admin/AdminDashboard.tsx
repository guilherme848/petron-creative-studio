"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Download,
  Users,
  Sparkles,
  Pencil,
  CheckCircle2,
  DollarSign,
  Clock,
  AlertTriangle,
  TrendingUp,
} from "lucide-react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { STYLE_SHORT_NAMES } from "@/lib/style-families";
import type { AdminData, UserTotals } from "./page";

interface Props {
  data: AdminData;
  brlPerUsd: number;
}

const formatBrl = (usd: number, rate: number) =>
  `R$ ${(usd * rate).toFixed(2).replace(".", ",")}`;
const formatHours = (minutes: number) => {
  if (minutes < 60) return `${minutes}min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
};

export function AdminDashboard({ data, brlPerUsd }: Props) {
  const [selectedUser, setSelectedUser] = useState<UserTotals | null>(null);

  const exportCsv = () => {
    const rows = [
      ["Usuário", "Email", "Role", "Criativos", "Ajustes", "Exports", "Custo USD", "Custo BRL", "Tempo economizado"],
      ...data.userRanking.map((u) => [
        u.name,
        u.email,
        u.creative_role,
        u.total_creatives,
        u.total_adjustments,
        u.total_exports,
        (u.total_cost_usd || 0).toFixed(4),
        formatBrl(u.total_cost_usd || 0, brlPerUsd),
        formatHours(u.minutes_saved || 0),
      ]),
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `petron-creative-admin-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const styleChartData = useMemo(
    () =>
      data.styleDistribution.map((s) => ({
        name: STYLE_SHORT_NAMES[s.style_family || 0] || `#${s.style_family}`,
        Gerações: s.count,
      })),
    [data.styleDistribution]
  );

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-1" />
                Voltar
              </Button>
            </Link>
            <Separator orientation="vertical" className="h-6" />
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Admin Dashboard</h1>
              <p className="text-xs text-muted-foreground">
                {data.currentUser.name} · {data.currentUser.email}
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={exportCsv}>
            <Download className="h-4 w-4 mr-1.5" />
            Exportar CSV
          </Button>
        </div>

        {/* Alertas */}
        {data.alerts.length > 0 && (
          <Card className="rounded-2xl border-orange-500/40 bg-orange-500/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4 text-orange-500" />
                Alertas ({data.alerts.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1.5 pt-0">
              {data.alerts.map((a) => (
                <div key={a.user_id} className="text-xs flex items-center gap-2">
                  <TrendingUp className="h-3 w-3 text-orange-500" />
                  <span className="font-medium">{a.name}:</span>
                  <span className="text-muted-foreground">{a.message}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* KPIs principais */}
        <div className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
          <KpiCard icon={<Users className="h-4 w-4" />} label="Usuários" value={data.totals.users} />
          <KpiCard icon={<Sparkles className="h-4 w-4" />} label="Criativos" value={data.totals.creatives} />
          <KpiCard icon={<Pencil className="h-4 w-4" />} label="Ajustes" value={data.totals.adjustments} />
          <KpiCard icon={<CheckCircle2 className="h-4 w-4" />} label="Exports" value={data.totals.exports} />
          <KpiCard
            icon={<DollarSign className="h-4 w-4" />}
            label="Custo total"
            value={formatBrl(data.totals.costUsd, brlPerUsd)}
            sub={`$${data.totals.costUsd.toFixed(2)}`}
          />
          <KpiCard
            icon={<Clock className="h-4 w-4" />}
            label="Tempo economizado"
            value={formatHours(data.totals.minutesSaved)}
            sub={`${data.totals.creatives} × 17 min`}
          />
        </div>

        {/* Gráficos */}
        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="rounded-2xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Gerações por dia (últimos 30d)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.dailySeries}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                    <XAxis dataKey="day" tick={{ fontSize: 10 }} stroke="#888" />
                    <YAxis tick={{ fontSize: 10 }} stroke="#888" />
                    <Tooltip
                      contentStyle={{
                        background: "rgba(0,0,0,0.9)",
                        border: "1px solid rgba(249,115,22,0.4)",
                        borderRadius: "8px",
                        fontSize: "11px",
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="event_count"
                      stroke="#F97316"
                      strokeWidth={2}
                      dot={false}
                      name="Gerações"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Distribuição por estilo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={styleChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="#888" />
                    <YAxis tick={{ fontSize: 10 }} stroke="#888" />
                    <Tooltip
                      contentStyle={{
                        background: "rgba(0,0,0,0.9)",
                        border: "1px solid rgba(249,115,22,0.4)",
                        borderRadius: "8px",
                        fontSize: "11px",
                      }}
                    />
                    <Bar dataKey="Gerações" fill="#F97316" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Ranking de usuários + Drill-down */}
        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="rounded-2xl lg:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Ranking de uso</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1.5">
                {data.userRanking.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-6 text-center">
                    Nenhum evento registrado ainda.
                  </p>
                ) : (
                  data.userRanking.map((u, idx) => (
                    <button
                      key={u.user_id}
                      type="button"
                      onClick={() => setSelectedUser(u === selectedUser ? null : u)}
                      className={`w-full flex items-center gap-3 p-2.5 rounded-xl border text-left transition-all ${
                        selectedUser?.user_id === u.user_id
                          ? "border-orange-500/50 bg-orange-500/5"
                          : "border-border/40 hover:border-border"
                      }`}
                    >
                      <span className="text-[10px] font-bold text-orange-500 bg-orange-500/10 px-2 py-0.5 rounded">
                        {idx + 1}
                      </span>
                      {u.avatar_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={u.avatar_url}
                          alt={u.name}
                          className="h-8 w-8 rounded-full object-cover border border-border/40"
                        />
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-orange-500/10 flex items-center justify-center text-xs font-bold text-orange-500">
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold truncate">{u.name}</p>
                        <p className="text-[10px] text-muted-foreground truncate">
                          {u.email}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-[9px] shrink-0">
                        {u.creative_role}
                      </Badge>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-bold text-orange-500">{u.total_creatives}</p>
                        <p className="text-[9px] text-muted-foreground">criativos</p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Drill-down do usuário selecionado */}
          <Card className="rounded-2xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">
                {selectedUser ? "Detalhes do usuário" : "Top clientes"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedUser ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    {selectedUser.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={selectedUser.avatar_url}
                        alt={selectedUser.name}
                        className="h-12 w-12 rounded-full object-cover border border-border/40"
                      />
                    ) : (
                      <div className="h-12 w-12 rounded-full bg-orange-500/10 flex items-center justify-center text-sm font-bold text-orange-500">
                        {selectedUser.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold truncate">{selectedUser.name}</p>
                      <p className="text-[10px] text-muted-foreground truncate">
                        {selectedUser.email}
                      </p>
                    </div>
                  </div>
                  <Separator />
                  <div className="space-y-1.5 text-xs">
                    <Row label="Criativos" value={selectedUser.total_creatives} />
                    <Row label="Ajustes" value={selectedUser.total_adjustments} />
                    <Row label="Exports" value={selectedUser.total_exports} />
                    <Row label="Custo total" value={formatBrl(selectedUser.total_cost_usd || 0, brlPerUsd)} />
                    <Row
                      label="Tempo economizado"
                      value={formatHours(selectedUser.minutes_saved || 0)}
                    />
                    {selectedUser.last_activity_at && (
                      <Row
                        label="Última atividade"
                        value={new Date(selectedUser.last_activity_at).toLocaleString("pt-BR")}
                      />
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {data.topClients.length === 0 ? (
                    <p className="text-xs text-muted-foreground py-6 text-center">
                      Sem dados ainda.
                    </p>
                  ) : (
                    data.topClients.map((c, idx) => (
                      <div key={c.client_id || idx} className="flex items-center gap-2 text-xs">
                        <span className="text-[10px] font-bold text-orange-500 bg-orange-500/10 px-1.5 py-0.5 rounded w-5 text-center">
                          {idx + 1}
                        </span>
                        <span className="flex-1 truncate">{c.client_name}</span>
                        <span className="text-orange-500 font-bold">{c.count}</span>
                      </div>
                    ))
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function KpiCard({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  sub?: string;
}) {
  return (
    <Card className="rounded-2xl border-border/50">
      <CardContent className="p-4 space-y-1">
        <div className="flex items-center gap-1.5 text-muted-foreground">
          {icon}
          <span className="text-[10px] uppercase tracking-wider font-medium">{label}</span>
        </div>
        <p className="text-xl font-bold">{value}</p>
        {sub && <p className="text-[10px] text-muted-foreground">{sub}</p>}
      </CardContent>
    </Card>
  );
}

function Row({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-bold">{value}</span>
    </div>
  );
}
