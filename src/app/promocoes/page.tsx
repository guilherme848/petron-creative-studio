"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Megaphone,
  ArrowRight,
  Calendar,
  ShoppingBag,
  MoreHorizontal,
  Pencil,
  Trash2,
  Sparkles,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import Link from "next/link";

interface PromotionItem {
  id: string;
  product_name: string;
  price: number;
  price_type: string;
}

interface Promotion {
  id: string;
  client_id: string | null;
  name: string;
  start_date: string | null;
  end_date: string | null;
  subtitle: string | null;
  seal_url: string | null;
  created_at: string;
  promotion_items: PromotionItem[];
}

export default function PromocoesPage() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function fetchPromotions() {
    try {
      const res = await fetch("/api/promotions");
      if (!res.ok) throw new Error("Erro ao buscar promoções");
      const data = await res.json();
      setPromotions(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchPromotions();
  }, []);

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Tem certeza que deseja excluir a promoção "${name}"?`)) return;
    try {
      const res = await fetch(`/api/promotions?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Erro ao excluir promoção");
      toast.success("Promoção excluída com sucesso");
      fetchPromotions();
    } catch {
      toast.error("Erro ao excluir promoção");
    }
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return null;
    return new Date(dateStr + "T12:00:00").toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Promoções</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Configure promoções e gere selos 3D com IA.
          </p>
        </div>
        <Link href="/promocoes/nova">
          <Button className="bg-gradient-to-r from-[#F97316] to-[#f43f5e] hover:from-[#ea6c10] hover:to-[#e0354f] text-white shadow-lg shadow-orange-500/20 hover:shadow-orange-500/30 border-0 btn-micro">
            <Plus className="mr-2 h-4 w-4" />
            Nova Promoção
          </Button>
        </Link>
      </div>

      {/* Loading */}
      {loading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="border-border/50 bg-card/30 rounded-2xl animate-pulse">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-xl bg-muted/50" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-32 rounded bg-muted/50" />
                    <div className="h-3 w-24 rounded bg-muted/30" />
                  </div>
                </div>
                <div className="h-3 w-40 rounded bg-muted/30" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Erro */}
      {error && !loading && (
        <Card className="border-destructive/50 bg-destructive/5 rounded-2xl">
          <CardContent className="py-10 text-center">
            <p className="text-sm text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Lista de promoções */}
      {!loading && !error && promotions.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {promotions.map((promo) => (
            <Card
              key={promo.id}
              className="border-border/50 bg-card/50 hover:bg-card/80 hover:border-border hover:shadow-lg hover:-translate-y-0.5 rounded-2xl transition-all group"
            >
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  {promo.seal_url ? (
                    <div className="h-12 w-12 rounded-xl border border-border/30 bg-muted/20 flex items-center justify-center overflow-hidden p-1">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={promo.seal_url}
                        alt="Selo"
                        className="max-h-full max-w-full object-contain"
                      />
                    </div>
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/20">
                      <Megaphone className="h-5 w-5 text-amber-500" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold truncate">
                      {promo.name}
                    </h3>
                    {promo.subtitle && (
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">
                        {promo.subtitle}
                      </p>
                    )}
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md hover:bg-muted/50"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" sideOffset={4}>
                      <DropdownMenuItem
                        onClick={() => alert("Em breve")}
                      >
                        <Pencil className="mr-2 h-4 w-4" />
                        Editar
                      </DropdownMenuItem>
                      <Link href="/criar">
                        <DropdownMenuItem>
                          <Sparkles className="mr-2 h-4 w-4" />
                          Criar Criativo
                        </DropdownMenuItem>
                      </Link>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        variant="destructive"
                        onClick={() => handleDelete(promo.id, promo.name)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="mt-4 space-y-2">
                  {(promo.start_date || promo.end_date) && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      <span>
                        {formatDate(promo.start_date)} — {formatDate(promo.end_date)}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <ShoppingBag className="h-3 w-3" />
                    <span>
                      {promo.promotion_items.length === 0
                        ? "Nenhum produto"
                        : `${promo.promotion_items.length} produto${promo.promotion_items.length > 1 ? "s" : ""}`}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Estado vazio */}
      {!loading && !error && promotions.length === 0 && (
        <Card className="border-border/50 bg-card/30 overflow-hidden rounded-2xl">
          <CardContent className="flex flex-col items-center justify-center py-20">
            <div className="relative mb-6">
              <div className="absolute inset-0 bg-amber-500/10 rounded-full blur-xl animate-glow-pulse" />
              <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl border border-amber-500/20 bg-amber-500/5 animate-float">
                <Megaphone className="h-9 w-9 text-amber-400/70" />
              </div>
            </div>
            <h3 className="text-lg font-semibold mb-1.5">Nenhuma promoção cadastrada</h3>
            <p className="text-sm text-muted-foreground mb-6 text-center max-w-sm">
              Crie sua primeira promoção para começar a gerar criativos com selos
              3D gerados por inteligência artificial.
            </p>
            <Link href="/promocoes/nova">
              <Button
                variant="outline"
                className="border-border/50 hover:border-orange-500/30 hover:bg-orange-500/5 group btn-micro"
              >
                <Plus className="mr-2 h-4 w-4" />
                Criar Promoção
                <ArrowRight className="ml-2 h-3.5 w-3.5 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
