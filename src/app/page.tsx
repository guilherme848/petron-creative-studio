"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Users,
  Package,
  ImagePlus,
  Images,
  MessageSquare,
  ArrowRight,
  Upload,
  Wand2,
  Clock,
  Timer,
} from "lucide-react";
import Link from "next/link";

const steps = [
  {
    number: "01",
    title: "Cadastre o cliente",
    description: "Upload da logo e configuração da identidade visual",
    icon: Upload,
    color: "text-orange-400",
    borderColor: "border-orange-500/20",
    bg: "bg-orange-500/5",
  },
  {
    number: "02",
    title: "Cadastre os produtos",
    description: "Adicione fotos e remoção automática de fundo com IA",
    icon: Package,
    color: "text-teal-400",
    borderColor: "border-teal-500/20",
    bg: "bg-teal-500/5",
  },
  {
    number: "03",
    title: "Gere os criativos",
    description:
      "Escolha entre 3 estilos e gere em lote para múltiplos produtos",
    icon: Wand2,
    color: "text-amber-400",
    borderColor: "border-amber-500/20",
    bg: "bg-amber-500/5",
  },
  {
    number: "04",
    title: "Biblioteca",
    description: "Todos os criativos organizados por cliente, prontos para download",
    icon: Images,
    color: "text-rose-400",
    borderColor: "border-rose-500/20",
    bg: "bg-rose-500/5",
  },
];

interface StatItem {
  title: string;
  value: string;
  description: string;
  icon: typeof Users;
  href: string;
  gradient: string;
  iconBg: string;
  iconColor: string;
}

interface RecentCreative {
  id: string;
  image_url: string | null;
  format: string | null;
  created_at: string;
  clients: { name: string } | null;
}

const MINUTOS_POR_CRIATIVO = 17; // média entre 15-20 min

function formatTimeSaved(totalMinutes: number): string {
  if (totalMinutes < 60) return `${totalMinutes} min`;
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  if (hours < 24) return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
  const days = Math.floor(hours / 24);
  const remainHours = hours % 24;
  return remainHours > 0 ? `${days}d ${remainHours}h` : `${days} dias`;
}

export default function DashboardPage() {
  const [counts, setCounts] = useState({
    clients: 0,
    products: 0,
    creatives: 0,
  });
  const [recentCreatives, setRecentCreatives] = useState<RecentCreative[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [clientsRes, productsRes, creativesRes] = await Promise.all([
          fetch("/api/clients"),
          fetch("/api/products"),
          fetch("/api/creatives"),
        ]);

        const [clientsData, productsData, creativesData] = await Promise.all([
          clientsRes.ok ? clientsRes.json() : [],
          productsRes.ok ? productsRes.json() : [],
          creativesRes.ok ? creativesRes.json() : [],
        ]);

        setCounts({
          clients: Array.isArray(clientsData) ? clientsData.length : 0,
          products: Array.isArray(productsData) ? productsData.length : 0,
          creatives: Array.isArray(creativesData) ? creativesData.length : 0,
        });

        if (Array.isArray(creativesData)) {
          setRecentCreatives(creativesData.slice(0, 8));
        }
      } catch {
        console.error("Erro ao buscar dados");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const timeSavedMinutes = counts.creatives * MINUTOS_POR_CRIATIVO;

  const stats: StatItem[] = [
    {
      title: "Clientes",
      value: loading ? "..." : String(counts.clients),
      description: "cadastrados",
      icon: Users,
      href: "/clientes",
      gradient: "from-[#F97316] to-[#f43f5e]",
      iconBg: "bg-orange-500/10",
      iconColor: "text-orange-400",
    },
    {
      title: "Produtos",
      value: loading ? "..." : String(counts.products),
      description: "no banco",
      icon: Package,
      href: "/produtos",
      gradient: "from-teal-500 to-emerald-400",
      iconBg: "bg-teal-500/10",
      iconColor: "text-teal-400",
    },
    {
      title: "Criativos",
      value: loading ? "..." : String(counts.creatives),
      description: "gerados com IA",
      icon: Images,
      href: "/biblioteca",
      gradient: "from-[#F97316] to-[#f43f5e]",
      iconBg: "bg-rose-500/10",
      iconColor: "text-rose-400",
    },
    {
      title: "Tempo Economizado",
      value: loading ? "..." : formatTimeSaved(timeSavedMinutes),
      description: `vs. ${MINUTOS_POR_CRIATIVO}min/criativo manual`,
      icon: Timer,
      href: "/biblioteca",
      gradient: "from-violet-500 to-purple-400",
      iconBg: "bg-violet-500/10",
      iconColor: "text-violet-400",
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-br from-orange-500/10 via-background to-rose-500/5 p-8 md:p-10">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-orange-500/8 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-rose-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-3">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-[#F97316]">
              <MessageSquare className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="text-xs font-semibold uppercase tracking-wider text-orange-400">
              Creative Studio
            </span>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground mb-2">
            Bem-vindo ao{" "}
            <span className="text-gradient">Petron Creative</span>
          </h2>
          <p className="text-muted-foreground max-w-lg text-sm leading-relaxed">
            Gere criativos profissionais para Meta Ads em menos de 5 minutos.
            Potencializado por inteligência artificial para lojas de materiais de
            construção.
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 stagger-children">
        {stats.map((stat) => (
          <Link key={stat.title} href={stat.href}>
            <Card className="group relative overflow-hidden cursor-pointer border-border/50 bg-card/50 hover:bg-card/80 hover:border-border hover:shadow-lg hover:-translate-y-0.5 rounded-2xl p-5">
              <div
                className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-0 group-hover:opacity-[0.03]`}
              />
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="label-upper text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <div className={`rounded-lg p-2 ${stat.iconBg}`}>
                  <stat.icon className={`h-4 w-4 ${stat.iconColor}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="kpi-large tracking-tight">{stat.value}</div>
                <div className="flex items-center justify-between mt-1">
                  <p className="text-xs text-muted-foreground">
                    {stat.description}
                  </p>
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/0 group-hover:text-muted-foreground group-hover:translate-x-0.5" />
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Criativos Recentes */}
      <div>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold tracking-tight">
              Criativos recentes
            </h3>
            <div className="h-px flex-1 bg-gradient-to-r from-border to-transparent" />
          </div>
          {recentCreatives.length > 0 && (
            <Link href="/biblioteca" className="text-xs text-orange-500 hover:text-orange-400 font-medium flex items-center gap-1">
              Ver todos
              <ArrowRight className="h-3 w-3" />
            </Link>
          )}
        </div>

        {loading ? (
          <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="aspect-square rounded-xl bg-muted/30 animate-pulse" />
            ))}
          </div>
        ) : recentCreatives.length > 0 ? (
          <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
            {recentCreatives.map((creative) => (
              <Link key={creative.id} href="/biblioteca">
                <div className="group relative rounded-xl overflow-hidden border border-border/40 bg-card/50 hover:border-border hover:shadow-lg transition-all cursor-pointer">
                  {creative.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={creative.image_url}
                      alt={creative.clients?.name || "Criativo"}
                      className="w-full aspect-square object-cover"
                    />
                  ) : (
                    <div className="w-full aspect-square bg-muted/20 flex items-center justify-center">
                      <ImagePlus className="h-8 w-8 text-muted-foreground/30" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="absolute bottom-0 inset-x-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <p className="text-white text-xs font-medium truncate">
                      {creative.clients?.name || "Sem cliente"}
                    </p>
                    <p className="text-white/60 text-[10px]">
                      {new Date(creative.created_at).toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "short",
                      })}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <Card className="border-border/50 bg-card/30 overflow-hidden rounded-2xl">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="relative mb-5">
                <div className="absolute inset-0 bg-orange-500/10 rounded-full blur-xl animate-glow-pulse" />
                <div className="relative flex h-16 w-16 items-center justify-center rounded-full border border-border/50 bg-card">
                  <ImagePlus className="h-7 w-7 text-muted-foreground/40" />
                </div>
              </div>
              <h4 className="text-sm font-semibold text-foreground mb-1">
                Nenhum criativo gerado
              </h4>
              <p className="text-xs text-muted-foreground text-center max-w-sm">
                Comece criando seu primeiro criativo promocional com IA.
              </p>
              <Link href="/criar" className="mt-4">
                <button className="text-xs text-orange-500 hover:text-orange-400 font-medium flex items-center gap-1">
                  Criar agora
                  <ArrowRight className="h-3 w-3" />
                </button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>

      {/* How to start - Stepper */}
      <div>
        <div className="flex items-center gap-2 mb-5">
          <h3 className="text-lg font-semibold tracking-tight">
            Como começar
          </h3>
          <div className="h-px flex-1 bg-gradient-to-r from-border to-transparent" />
        </div>

        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4 stagger-children">
          {steps.map((step) => (
            <Card
              key={step.number}
              className="relative overflow-hidden border-border/50 bg-card/30 hover:bg-card/60 hover:border-border group rounded-2xl"
            >
              <CardContent className="pt-5 pb-5">
                <div className="flex items-start gap-4">
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${step.bg} border ${step.borderColor}`}
                  >
                    <step.icon className={`h-4.5 w-4.5 ${step.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`text-[10px] font-bold tracking-wider ${step.color} opacity-60`}
                      >
                        PASSO {step.number}
                      </span>
                    </div>
                    <h4 className="text-sm font-semibold text-foreground mb-0.5">
                      {step.title}
                    </h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
