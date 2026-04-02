"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Users, ArrowRight, Loader2, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import Link from "next/link";

interface BrandConfig {
  id: string;
  logo_url: string | null;
  colors: { label: string; hex: string }[];
  fonts: Record<string, string>;
}

interface Client {
  id: string;
  name: string;
  segment: string | null;
  cnpj: string | null;
  contact: string | null;
  address: string | null;
  whatsapp_link: string | null;
  created_at: string;
  brand_configs: BrandConfig[];
}

export default function ClientesPage() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function fetchClients() {
    try {
      const res = await fetch("/api/clients");
      if (!res.ok) throw new Error("Erro ao buscar clientes");
      const data = await res.json();
      setClients(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchClients();
  }, []);

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Tem certeza que deseja excluir o cliente "${name}"?`)) return;
    try {
      const res = await fetch(`/api/clients?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Erro ao excluir cliente");
      toast.success("Cliente excluído com sucesso");
      fetchClients();
    } catch {
      toast.error("Erro ao excluir cliente");
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Clientes</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Gerencie os clientes e suas identidades visuais.
          </p>
        </div>
        <Link href="/clientes/novo">
          <Button className="bg-gradient-to-r from-[#F97316] to-[#f43f5e] hover:from-[#ea6c10] hover:to-[#e0354f] text-white shadow-lg shadow-orange-500/20 hover:shadow-orange-500/30 border-0 btn-micro">
            <Plus className="mr-2 h-4 w-4" />
            Novo Cliente
          </Button>
        </Link>
      </div>

      {/* Loading */}
      {loading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="border-border/50 bg-card/30 rounded-2xl animate-pulse">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 rounded-xl bg-muted/50" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-32 rounded bg-muted/50" />
                    <div className="h-3 w-20 rounded bg-muted/30" />
                  </div>
                </div>
                <div className="flex gap-1.5 mt-4">
                  {[1, 2, 3, 4, 5].map((j) => (
                    <div key={j} className="h-6 w-6 rounded-full bg-muted/40" />
                  ))}
                </div>
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

      {/* Lista de clientes */}
      {!loading && !error && clients.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {clients.map((client) => {
            const brand = client.brand_configs?.[0];
            const colors = brand?.colors || [];

            return (
              <Card
                key={client.id}
                className="border-border/50 bg-card/50 hover:bg-card/80 hover:border-border hover:shadow-lg hover:-translate-y-0.5 rounded-2xl transition-all cursor-pointer group"
              >
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    {brand?.logo_url ? (
                      <div className="h-14 w-14 rounded-xl border border-border/30 bg-muted/20 flex items-center justify-center overflow-hidden p-1.5">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={brand.logo_url}
                          alt={`Logo de ${client.name}`}
                          className="max-h-full max-w-full object-contain"
                        />
                      </div>
                    ) : (
                      <div
                        className="flex h-14 w-14 items-center justify-center rounded-xl text-white font-bold text-sm"
                        style={{
                          backgroundColor: colors[0]?.hex || "#F97316",
                        }}
                      >
                        {client.name.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold truncate">
                        {client.name}
                      </h3>
                      {client.segment && (
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">
                          {client.segment}
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
                          onClick={() => router.push(`/clientes/${client.id}`)}
                        >
                          <Pencil className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={() => handleDelete(client.id, client.name)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {colors.length > 0 && (
                    <div className="flex gap-1.5 mt-4">
                      {colors.map((cor, i) => (
                        <div
                          key={i}
                          className="h-6 w-6 rounded-full border border-border/30 shadow-sm"
                          style={{ backgroundColor: cor.hex }}
                          title={`${cor.label}: ${cor.hex}`}
                        />
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Estado vazio */}
      {!loading && !error && clients.length === 0 && (
        <Card className="border-border/50 bg-card/30 overflow-hidden rounded-2xl">
          <CardContent className="flex flex-col items-center justify-center py-20">
            <div className="relative mb-6">
              <div className="absolute inset-0 bg-orange-500/10 rounded-full blur-xl animate-glow-pulse" />
              <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl border border-orange-500/20 bg-orange-500/5 animate-float">
                <Users className="h-9 w-9 text-orange-400/70" />
              </div>
            </div>
            <h3 className="text-lg font-semibold mb-1.5">Nenhum cliente cadastrado</h3>
            <p className="text-sm text-muted-foreground mb-6 text-center max-w-sm">
              Cadastre seu primeiro cliente com logo e identidade visual para
              começar a criar anúncios incríveis.
            </p>
            <Link href="/clientes/novo">
              <Button
                variant="outline"
                className="border-border/50 hover:border-orange-500/30 hover:bg-orange-500/5 group btn-micro"
              >
                <Plus className="mr-2 h-4 w-4" />
                Cadastrar Cliente
                <ArrowRight className="ml-2 h-3.5 w-3.5 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
