"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Users, ArrowRight, Loader2, MoreHorizontal, Pencil, Trash2, Download, Check, Building2, MapPin, Filter } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
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

interface ErpAccount {
  id: string;
  name: string;
  niche: string | null;
  cpf_cnpj: string | null;
  contact_name: string | null;
  contact_phone: string | null;
  city: string | null;
  state: string | null;
  already_imported: boolean;
}

const MATCON = "Material de Construção";

function isMatCon(segment: string | null): boolean {
  if (!segment) return false;
  const s = segment.toLowerCase();
  return s.includes("material") || s.includes("construção") || s.includes("matcon") || s.includes("home center");
}

export default function ClientesPage() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [segmentFilter, setSegmentFilter] = useState<string>("matcon");

  // Import state
  const [importOpen, setImportOpen] = useState(false);
  const [erpAccounts, setErpAccounts] = useState<ErpAccount[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loadingErp, setLoadingErp] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importNicheFilter, setImportNicheFilter] = useState<string>("matcon");

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

  async function openImportDialog() {
    setImportOpen(true);
    setLoadingErp(true);
    setSelectedIds(new Set());
    try {
      const res = await fetch("/api/import-clients");
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Erro ao buscar contas do ERP");
      }
      const data = await res.json();
      setErpAccounts(data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao conectar com o ERP");
      setImportOpen(false);
    } finally {
      setLoadingErp(false);
    }
  }

  function toggleAccount(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAllAvailable() {
    const available = filteredErpAccounts.filter((a) => !a.already_imported).map((a) => a.id);
    setSelectedIds((prev) => {
      const allSelected = available.every((id) => prev.has(id));
      if (allSelected) {
        const next = new Set(prev);
        available.forEach((id) => next.delete(id));
        return next;
      }
      return new Set([...prev, ...available]);
    });
  }

  async function handleImport() {
    if (selectedIds.size === 0) return;
    setImporting(true);
    try {
      const res = await fetch("/api/import-clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ account_ids: Array.from(selectedIds) }),
      });
      if (!res.ok) throw new Error("Erro ao importar");
      const result = await res.json();

      if (result.imported.length > 0) {
        toast.success(`${result.imported.length} cliente(s) importado(s) com sucesso`);
      }
      if (result.skipped.length > 0) {
        toast.info(`${result.skipped.length} já importado(s), pulado(s)`);
      }
      if (result.errors.length > 0) {
        toast.error(`${result.errors.length} erro(s) na importação`);
      }

      setImportOpen(false);
      fetchClients();
    } catch {
      toast.error("Erro ao importar clientes");
    } finally {
      setImporting(false);
    }
  }

  // Client list filter
  const segments = Array.from(new Set(clients.map((c) => c.segment).filter(Boolean))) as string[];
  const matconClients = clients.filter((c) => isMatCon(c.segment));
  const otherClients = clients.filter((c) => !isMatCon(c.segment));
  const filteredClients =
    segmentFilter === "all"
      ? clients
      : segmentFilter === "matcon"
      ? matconClients
      : clients.filter((c) => c.segment === segmentFilter);

  // Import dialog filter
  const importNiches = Array.from(new Set(erpAccounts.map((a) => a.niche).filter(Boolean))) as string[];
  const filteredErpAccounts =
    importNicheFilter === "all"
      ? erpAccounts
      : importNicheFilter === "matcon"
      ? erpAccounts.filter((a) => isMatCon(a.niche))
      : erpAccounts.filter((a) => a.niche === importNicheFilter);

  // Sort: MatCon first in all lists
  const sortedErpAccounts = [...filteredErpAccounts].sort((a, b) => {
    const aMatCon = isMatCon(a.niche);
    const bMatCon = isMatCon(b.niche);
    if (aMatCon && !bMatCon) return -1;
    if (!aMatCon && bMatCon) return 1;
    return a.name.localeCompare(b.name);
  });

  const availableCount = filteredErpAccounts.filter((a) => !a.already_imported).length;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Clientes</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Gerencie os clientes e suas identidades visuais.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="border-border/50 hover:border-orange-500/30 hover:bg-orange-500/5 btn-micro"
            onClick={openImportDialog}
          >
            <Download className="mr-2 h-4 w-4" />
            Importar do ERP
          </Button>
          <Link href="/clientes/novo">
            <Button className="bg-gradient-to-r from-[#F97316] to-[#f43f5e] hover:from-[#ea6c10] hover:to-[#e0354f] text-white shadow-lg shadow-orange-500/20 hover:shadow-orange-500/30 border-0 btn-micro">
              <Plus className="mr-2 h-4 w-4" />
              Novo Cliente
            </Button>
          </Link>
        </div>
      </div>

      {/* Dialog de importação do ERP */}
      <Dialog open={importOpen} onOpenChange={setImportOpen}>
        <DialogContent className="sm:max-w-lg max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Importar do ERP Petron</DialogTitle>
            <DialogDescription>
              Selecione os clientes ativos do app.agenciapetron.com.br para importar.
            </DialogDescription>
          </DialogHeader>

          {loadingErp ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-sm text-muted-foreground">Buscando contas do ERP...</span>
            </div>
          ) : (
            <>
              {/* Filtro por nicho no import */}
              {erpAccounts.length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap pb-1">
                  <button
                    type="button"
                    onClick={() => setImportNicheFilter("matcon")}
                    className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all ${
                      importNicheFilter === "matcon"
                        ? "bg-orange-500 text-white"
                        : "bg-muted/50 text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    MatCon ({erpAccounts.filter((a) => isMatCon(a.niche)).length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setImportNicheFilter("all")}
                    className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all ${
                      importNicheFilter === "all"
                        ? "bg-foreground text-background"
                        : "bg-muted/50 text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    Todos ({erpAccounts.length})
                  </button>
                  {importNiches.filter((n) => !isMatCon(n)).map((niche) => (
                    <button
                      key={niche}
                      type="button"
                      onClick={() => setImportNicheFilter(niche)}
                      className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all ${
                        importNicheFilter === niche
                          ? "bg-foreground text-background"
                          : "bg-muted/50 text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      {niche} ({erpAccounts.filter((a) => a.niche === niche).length})
                    </button>
                  ))}
                </div>
              )}

              {availableCount > 0 && (
                <div className="flex items-center justify-between text-xs text-muted-foreground pb-1">
                  <span>{selectedIds.size} selecionado(s) de {availableCount} disponível(is)</span>
                  <button
                    type="button"
                    className="text-orange-500 hover:text-orange-400 font-medium"
                    onClick={selectAllAvailable}
                  >
                    {availableCount > 0 && filteredErpAccounts.filter((a) => !a.already_imported).every((a) => selectedIds.has(a.id))
                      ? "Desmarcar filtrados"
                      : "Selecionar filtrados"}
                  </button>
                </div>
              )}
              <div className="overflow-y-auto flex-1 -mx-4 px-4 space-y-1.5 max-h-[50vh]">
                {sortedErpAccounts.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    Nenhuma conta encontrada para este filtro.
                  </p>
                ) : (
                  sortedErpAccounts.map((account) => {
                    const isSelected = selectedIds.has(account.id);
                    const isImported = account.already_imported;

                    return (
                      <button
                        key={account.id}
                        type="button"
                        disabled={isImported}
                        onClick={() => toggleAccount(account.id)}
                        className={`w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-all ${
                          isImported
                            ? "opacity-50 cursor-not-allowed border-border/30 bg-muted/20"
                            : isSelected
                            ? "border-orange-500/50 bg-orange-500/5 shadow-sm"
                            : "border-border/40 hover:border-border hover:bg-muted/30"
                        }`}
                      >
                        <div
                          className={`flex h-5 w-5 items-center justify-center rounded border shrink-0 transition-colors ${
                            isImported
                              ? "border-muted-foreground/30 bg-muted/50"
                              : isSelected
                              ? "border-orange-500 bg-orange-500 text-white"
                              : "border-border"
                          }`}
                        >
                          {(isSelected || isImported) && <Check className="h-3 w-3" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium truncate">{account.name}</span>
                            {isMatCon(account.niche) && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-orange-500/10 text-orange-500 font-medium shrink-0">
                                MatCon
                              </span>
                            )}
                            {isImported && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground shrink-0">
                                Importado
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
                            {account.niche && (
                              <span className="flex items-center gap-1">
                                <Building2 className="h-3 w-3" />
                                {account.niche}
                              </span>
                            )}
                            {(account.city || account.state) && (
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {[account.city, account.state].filter(Boolean).join("/")}
                              </span>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setImportOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleImport}
              disabled={selectedIds.size === 0 || importing}
              className="bg-gradient-to-r from-[#F97316] to-[#f43f5e] hover:from-[#ea6c10] hover:to-[#e0354f] text-white border-0"
            >
              {importing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Importando...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Importar {selectedIds.size > 0 ? `(${selectedIds.size})` : ""}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Filtro por segmento */}
      {!loading && !error && clients.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <button
            type="button"
            onClick={() => setSegmentFilter("matcon")}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              segmentFilter === "matcon"
                ? "bg-orange-500 text-white shadow-sm"
                : "bg-muted/50 text-muted-foreground hover:bg-muted"
            }`}
          >
            MatCon ({matconClients.length})
          </button>
          <button
            type="button"
            onClick={() => setSegmentFilter("all")}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              segmentFilter === "all"
                ? "bg-foreground text-background shadow-sm"
                : "bg-muted/50 text-muted-foreground hover:bg-muted"
            }`}
          >
            Todos ({clients.length})
          </button>
          {otherClients.length > 0 && (
            <button
              type="button"
              onClick={() => setSegmentFilter("outros")}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                segmentFilter === "outros"
                  ? "bg-foreground text-background shadow-sm"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted"
              }`}
            >
              Outros ({otherClients.length})
            </button>
          )}
        </div>
      )}

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
          {(segmentFilter === "outros" ? otherClients : filteredClients).map((client) => {
            const brand = client.brand_configs?.[0];
            const colors = brand?.colors || [];

            return (
              <Card
                key={client.id}
                onClick={() => router.push(`/clientes/${client.id}`)}
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
                      <div className="flex items-center gap-1.5">
                        <h3 className="text-sm font-semibold truncate">
                          {client.name}
                        </h3>
                        {isMatCon(client.segment) && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-orange-500/10 text-orange-500 font-medium shrink-0">
                            MatCon
                          </span>
                        )}
                      </div>
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
