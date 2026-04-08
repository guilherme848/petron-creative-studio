"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import {
  ImageIcon,
  Search,
  Download,
  Trash2,
  MoreHorizontal,
  Filter,
  X,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Users,
  Calendar,
  Images,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

interface Creative {
  id: string;
  client_id: string | null;
  format: string | null;
  image_url: string | null;
  created_at: string;
  clients: {
    name: string;
    segment: string | null;
  } | null;
}

function isMatCon(segment: string | null): boolean {
  if (!segment) return false;
  const s = segment.toLowerCase();
  return s.includes("material") || s.includes("construção") || s.includes("matcon") || s.includes("home center");
}

export default function BibliotecaPage() {
  const [creatives, setCreatives] = useState<Creative[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [clientFilter, setClientFilter] = useState<string>("all");
  const [lightboxCreative, setLightboxCreative] = useState<Creative | null>(null);

  async function fetchCreatives() {
    try {
      const res = await fetch("/api/creatives");
      if (!res.ok) throw new Error("Erro ao buscar criativos");
      const data = await res.json();
      setCreatives(data);
    } catch {
      toast.error("Erro ao carregar biblioteca");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchCreatives(); }, []);

  async function handleDelete(id: string) {
    if (!confirm("Excluir este criativo?")) return;
    try {
      const res = await fetch(`/api/creatives?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Erro ao excluir");
      toast.success("Criativo excluído");
      fetchCreatives();
    } catch {
      toast.error("Erro ao excluir criativo");
    }
  }

  function handleDownload(url: string, clientName: string) {
    const a = document.createElement("a");
    a.href = url;
    a.download = `criativo-${clientName}-${Date.now()}.png`;
    a.target = "_blank";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  // Clientes únicos para sidebar
  const clientEntries = Array.from(
    new Map(
      creatives
        .filter((c) => c.clients?.name)
        .map((c) => [c.client_id, { name: c.clients!.name, segment: c.clients!.segment }])
    ).entries()
  ).map(([id, info]) => ({
    id: id!,
    name: info.name,
    segment: info.segment,
    count: creatives.filter((c) => c.client_id === id).length,
  }));

  // MatCon primeiro
  const sortedClients = clientEntries.sort((a, b) => {
    const aM = isMatCon(a.segment);
    const bM = isMatCon(b.segment);
    if (aM && !bM) return -1;
    if (!aM && bM) return 1;
    return a.name.localeCompare(b.name);
  });

  // Filtros
  const filtered = creatives.filter((c) => {
    const matchSearch = !search || c.clients?.name?.toLowerCase().includes(search.toLowerCase());
    const matchClient = clientFilter === "all" || c.client_id === clientFilter;
    return matchSearch && matchClient;
  });

  // Agrupar por cliente
  const grouped = new Map<string, Creative[]>();
  for (const c of filtered) {
    const key = c.client_id || "sem-cliente";
    const list = grouped.get(key) || [];
    list.push(c);
    grouped.set(key, list);
  }

  // Ordenar grupos: MatCon primeiro
  const sortedGroups = Array.from(grouped.entries()).sort(([, a], [, b]) => {
    const aMatCon = isMatCon(a[0]?.clients?.segment || null);
    const bMatCon = isMatCon(b[0]?.clients?.segment || null);
    if (aMatCon && !bMatCon) return -1;
    if (!aMatCon && bMatCon) return 1;
    const aName = a[0]?.clients?.name || "ZZZ";
    const bName = b[0]?.clients?.name || "ZZZ";
    return aName.localeCompare(bName);
  });

  function navigateLightbox(direction: number) {
    if (!lightboxCreative) return;
    const idx = filtered.findIndex((c) => c.id === lightboxCreative.id);
    const next = idx + direction;
    if (next >= 0 && next < filtered.length) {
      setLightboxCreative(filtered[next]);
    }
  }

  const activeClient = sortedClients.find((c) => c.id === clientFilter);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Lightbox */}
      <Dialog open={!!lightboxCreative} onOpenChange={() => setLightboxCreative(null)}>
        <DialogContent className="max-w-4xl p-2 bg-black/95 border-border/20">
          {lightboxCreative?.image_url && (
            <div className="relative flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={lightboxCreative.image_url}
                alt={lightboxCreative.clients?.name || "Criativo"}
                className="max-h-[85vh] w-auto rounded-lg object-contain"
              />
              <button
                type="button"
                onClick={() => navigateLightbox(-1)}
                className="absolute left-3 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm hover:bg-white/20 transition-colors"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={() => navigateLightbox(1)}
                className="absolute right-3 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm hover:bg-white/20 transition-colors"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between bg-black/40 backdrop-blur-md rounded-xl px-4 py-3">
                <div>
                  <p className="text-white text-sm font-semibold">{lightboxCreative.clients?.name || "Sem cliente"}</p>
                  <p className="text-white/50 text-xs mt-0.5">
                    {lightboxCreative.format} &middot;{" "}
                    {new Date(lightboxCreative.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleDownload(lightboxCreative.image_url!, lightboxCreative.clients?.name || "criativo")}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/25 transition-colors"
                  >
                    <Download className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      handleDelete(lightboxCreative.id);
                      setLightboxCreative(null);
                    }}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Biblioteca de Criativos</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {creatives.length} criativo{creatives.length !== 1 ? "s" : ""} gerado{creatives.length !== 1 ? "s" : ""}
            {filtered.length !== creatives.length && ` · ${filtered.length} exibido${filtered.length !== 1 ? "s" : ""}`}
          </p>
        </div>
        <Link href="/criar">
          <Button className="bg-gradient-to-r from-[#F97316] to-[#f43f5e] hover:from-[#ea6c10] hover:to-[#e0354f] text-white shadow-lg shadow-orange-500/20 hover:shadow-orange-500/30 border-0 btn-micro">
            <Sparkles className="mr-2 h-4 w-4" />
            Criar Criativo
          </Button>
        </Link>
      </div>

      {/* Layout: Sidebar de clientes + Conteúdo */}
      <div className="flex gap-6">
        {/* Sidebar de clientes */}
        {!loading && creatives.length > 0 && (
          <div className="w-64 shrink-0 hidden lg:block">
            <Card className="sticky top-[76px] rounded-2xl border-border/50 bg-card/80 overflow-hidden">
              <div className="px-4 py-3 border-b border-border/40">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-orange-500" />
                  <span className="text-sm font-semibold">Clientes</span>
                </div>
              </div>

              <div className="p-2 max-h-[calc(100vh-160px)] overflow-y-auto custom-scrollbar">
                {/* Todos */}
                <button
                  type="button"
                  onClick={() => setClientFilter("all")}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    clientFilter === "all"
                      ? "bg-orange-500/10 text-orange-500"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Images className="h-4 w-4" />
                    <span>Todos</span>
                  </div>
                  <Badge variant="secondary" className="text-[10px] h-5 px-1.5">{creatives.length}</Badge>
                </button>

                {/* Lista de clientes */}
                <div className="space-y-0.5 mt-1">
                  {sortedClients.map((client) => (
                    <button
                      key={client.id}
                      type="button"
                      onClick={() => setClientFilter(client.id)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-[13px] font-medium transition-all ${
                        clientFilter === client.id
                          ? isMatCon(client.segment) ? "bg-orange-500/10 text-orange-500" : "bg-teal-500/10 text-teal-500"
                          : "text-foreground/80 hover:text-foreground hover:bg-muted/40"
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="truncate">{client.name}</span>
                        {isMatCon(client.segment) && (
                          <span className="text-[9px] px-1 py-0.5 rounded bg-orange-500/10 text-orange-500 font-medium shrink-0">MC</span>
                        )}
                      </div>
                      <Badge variant="secondary" className="text-[9px] h-4 px-1.5 opacity-70 shrink-0">{client.count}</Badge>
                    </button>
                  ))}
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Conteúdo principal */}
        <div className="flex-1 min-w-0 space-y-5">
          {/* Busca */}
          {!loading && creatives.length > 0 && (
            <div className="flex items-center gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por cliente..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 h-9"
                />
                {search && (
                  <button type="button" onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Filtro ativo (breadcrumb) */}
          {activeClient && (
            <div className="flex items-center gap-2 text-xs">
              <Filter className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-muted-foreground">Filtrando por: <span className="text-foreground font-medium">{activeClient.name}</span></span>
              <button type="button" onClick={() => setClientFilter("all")} className="text-orange-500 hover:text-orange-400 font-medium ml-1">Limpar</button>
            </div>
          )}

          {/* Filtros mobile (pills) */}
          {!loading && creatives.length > 0 && (
            <div className="lg:hidden flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => setClientFilter("all")}
                className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all ${clientFilter === "all" ? "bg-foreground text-background shadow-sm" : "bg-muted/50 text-muted-foreground hover:bg-muted"}`}
              >
                Todos ({creatives.length})
              </button>
              {sortedClients.map((cn) => (
                <button
                  key={cn.id}
                  type="button"
                  onClick={() => setClientFilter(cn.id)}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all ${
                    clientFilter === cn.id
                      ? isMatCon(cn.segment) ? "bg-orange-500 text-white shadow-sm" : "bg-foreground text-background shadow-sm"
                      : "bg-muted/50 text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {cn.name} ({cn.count})
                </button>
              ))}
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="grid gap-4 grid-cols-2 sm:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="aspect-square rounded-xl bg-muted/30 animate-pulse" />
              ))}
            </div>
          )}

          {/* Vazio */}
          {!loading && creatives.length === 0 && (
            <Card className="border-border/50 bg-card/30 overflow-hidden rounded-2xl">
              <CardContent className="flex flex-col items-center justify-center py-20">
                <div className="relative mb-6">
                  <div className="absolute inset-0 bg-orange-500/10 rounded-full blur-xl animate-glow-pulse" />
                  <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl border border-orange-500/20 bg-orange-500/5">
                    <ImageIcon className="h-9 w-9 text-orange-400/70" />
                  </div>
                </div>
                <h3 className="text-lg font-semibold mb-1.5">Nenhum criativo gerado</h3>
                <p className="text-sm text-muted-foreground mb-6 text-center max-w-sm">
                  Crie seu primeiro criativo promocional com inteligência artificial.
                </p>
                <Link href="/criar">
                  <Button variant="outline" className="border-border/50 hover:border-orange-500/30 hover:bg-orange-500/5 btn-micro">
                    <Sparkles className="mr-2 h-4 w-4" />
                    Criar Criativo
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}

          {/* Filtro sem resultado */}
          {!loading && creatives.length > 0 && filtered.length === 0 && (
            <div className="text-center py-12">
              <Search className="h-8 w-8 text-muted-foreground/20 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Nenhum criativo encontrado.</p>
              <button type="button" onClick={() => { setSearch(""); setClientFilter("all"); }} className="text-xs text-orange-500 hover:text-orange-400 font-medium mt-2">Limpar filtros</button>
            </div>
          )}

          {/* Criativos agrupados por cliente */}
          {!loading && sortedGroups.map(([clientId, clientCreatives]) => {
            const clientName = clientCreatives[0]?.clients?.name || "Sem cliente";
            const segment = clientCreatives[0]?.clients?.segment;

            return (
              <div key={clientId} className="space-y-3">
                <div className="flex items-center gap-3">
                  <h3 className="text-base font-semibold">{clientName}</h3>
                  {isMatCon(segment || null) && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-orange-500/10 text-orange-500 font-medium">
                      MatCon
                    </span>
                  )}
                  <div className="h-px flex-1 bg-border/40" />
                  <span className="text-xs text-muted-foreground shrink-0">
                    {clientCreatives.length} criativo{clientCreatives.length !== 1 ? "s" : ""}
                  </span>
                </div>

                <div className="grid gap-3 grid-cols-2 sm:grid-cols-3">
                  {clientCreatives.map((creative) => (
                    <div
                      key={creative.id}
                      className="group relative rounded-2xl overflow-hidden border border-border/40 bg-card/50 hover:border-border hover:shadow-lg transition-all cursor-pointer"
                      onClick={() => creative.image_url && setLightboxCreative(creative)}
                    >
                      {creative.image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={creative.image_url}
                          alt={`Criativo ${clientName}`}
                          className="w-full aspect-square object-cover"
                        />
                      ) : (
                        <div className="w-full aspect-square bg-muted/20 flex items-center justify-center">
                          <ImageIcon className="h-8 w-8 text-muted-foreground/30" />
                        </div>
                      )}

                      {/* Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                        <div className="flex items-center justify-between w-full">
                          <div>
                            {creative.format && (
                              <Badge variant="secondary" className="text-[10px] bg-white/20 text-white border-0 backdrop-blur-sm">
                                {creative.format}
                              </Badge>
                            )}
                          </div>
                          <div className="flex gap-1.5">
                            {creative.image_url && (
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); handleDownload(creative.image_url!, clientName); }}
                                className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm hover:bg-white/30 transition-colors"
                              >
                                <Download className="h-3.5 w-3.5" />
                              </button>
                            )}
                            <DropdownMenu>
                              <DropdownMenuTrigger
                                className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm hover:bg-white/30 transition-colors"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <MoreHorizontal className="h-3.5 w-3.5" />
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" sideOffset={4}>
                                <DropdownMenuItem variant="destructive" onClick={() => handleDelete(creative.id)}>
                                  <Trash2 className="mr-2 h-4 w-4" />Excluir
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </div>

                      {/* Data */}
                      <div className="p-2.5">
                        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {new Date(creative.created_at).toLocaleDateString("pt-BR", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
