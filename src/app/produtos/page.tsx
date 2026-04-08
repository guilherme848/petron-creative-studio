"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Plus,
  Package,
  ArrowRight,
  ImageIcon,
  MoreHorizontal,
  Pencil,
  Trash2,
  Search,
  X,
  LayoutGrid,
  List,
  ChevronRight,
  FolderOpen,
  Layers,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import Link from "next/link";
import { CATEGORIAS_MATCON, CATEGORIAS } from "@/lib/constants";

interface Product {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  subcategory: string | null;
  brand: string | null;
  image_url: string | null;
  image_treated_url: string | null;
  created_at: string;
}

const PAGE_SIZE = 24;

export default function ProdutosPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState<string>("all");
  const [subFilter, setSubFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set());

  async function fetchProducts() {
    try {
      const res = await fetch("/api/products");
      if (!res.ok) throw new Error("Erro ao buscar produtos");
      const data = await res.json();
      setProducts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchProducts(); }, []);

  async function handleDelete(e: React.MouseEvent, id: string, name: string) {
    e.stopPropagation();
    if (!confirm(`Tem certeza que deseja excluir o produto "${name}"?`)) return;
    try {
      const res = await fetch(`/api/products?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Erro ao excluir produto");
      toast.success("Produto excluído com sucesso");
      fetchProducts();
    } catch {
      toast.error("Erro ao excluir produto");
    }
  }

  // Contagem por categoria e subcategoria
  const countByCategory = useMemo(() => {
    const map = new Map<string, number>();
    for (const p of products) {
      if (p.category) map.set(p.category, (map.get(p.category) || 0) + 1);
    }
    return map;
  }, [products]);

  const countBySubcategory = useMemo(() => {
    const map = new Map<string, number>();
    for (const p of products) {
      if (p.subcategory) {
        const key = `${p.category}::${p.subcategory}`;
        map.set(key, (map.get(key) || 0) + 1);
      }
    }
    return map;
  }, [products]);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const matchSearch =
        !search ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.brand?.toLowerCase().includes(search.toLowerCase());
      const matchCat = catFilter === "all" || p.category === catFilter;
      const matchSub = subFilter === "all" || p.subcategory === subFilter;
      return matchSearch && matchCat && matchSub;
    });
  }, [products, search, catFilter, subFilter]);

  const visible = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;

  useEffect(() => { setVisibleCount(PAGE_SIZE); }, [search, catFilter, subFilter]);
  useEffect(() => { setSubFilter("all"); }, [catFilter]);

  function toggleCat(cat: string) {
    setExpandedCats((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  }

  function selectCategory(cat: string) {
    if (catFilter === cat) {
      setCatFilter("all");
    } else {
      setCatFilter(cat);
      setExpandedCats((prev) => new Set(prev).add(cat));
    }
  }

  function selectSubcategory(sub: string) {
    if (subFilter === sub) {
      setSubFilter("all");
    } else {
      setSubFilter(sub);
    }
  }

  // Breadcrumb do filtro ativo
  const breadcrumb = catFilter !== "all"
    ? subFilter !== "all"
      ? `${catFilter} › ${subFilter}`
      : catFilter
    : null;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Produtos</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {products.length} produto{products.length !== 1 ? "s" : ""} cadastrado{products.length !== 1 ? "s" : ""}
            {filtered.length !== products.length && ` · ${filtered.length} exibido${filtered.length !== 1 ? "s" : ""}`}
          </p>
        </div>
        <Link href="/produtos/novo">
          <Button className="bg-gradient-to-r from-[#F97316] to-[#f43f5e] hover:from-[#ea6c10] hover:to-[#e0354f] text-white shadow-lg shadow-orange-500/20 hover:shadow-orange-500/30 border-0 btn-micro">
            <Plus className="mr-2 h-4 w-4" />
            Novo Produto
          </Button>
        </Link>
      </div>

      {/* Layout: Sidebar de categorias + Conteúdo */}
      <div className="flex gap-6">
        {/* Sidebar de categorias — sempre visível */}
        <div className="w-64 shrink-0 hidden lg:block">
          <Card className="sticky top-[76px] rounded-2xl border-border/50 bg-card/80 overflow-hidden">
            <div className="px-4 py-3 border-b border-border/40">
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-orange-500" />
                <span className="text-sm font-semibold">Categorias</span>
              </div>
            </div>

            <div className="p-2 max-h-[calc(100vh-160px)] overflow-y-auto custom-scrollbar">
              {/* Todos */}
              <button
                type="button"
                onClick={() => { setCatFilter("all"); setSubFilter("all"); }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  catFilter === "all"
                    ? "bg-orange-500/10 text-orange-500"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
              >
                <span>Todos os produtos</span>
                <Badge variant="secondary" className="text-[10px] h-5 px-1.5">{products.length}</Badge>
              </button>

              {/* Árvore de categorias */}
              <div className="space-y-0.5 mt-1">
                {CATEGORIAS.map((cat) => {
                  const count = countByCategory.get(cat) || 0;
                  const isActive = catFilter === cat;
                  const isExpanded = expandedCats.has(cat);
                  const subcats = CATEGORIAS_MATCON[cat];

                  return (
                    <div key={cat}>
                      <div className="flex items-center">
                        <button
                          type="button"
                          onClick={() => toggleCat(cat)}
                          className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <ChevronRight className={`h-3.5 w-3.5 transition-transform ${isExpanded ? "rotate-90" : ""}`} />
                        </button>
                        <button
                          type="button"
                          onClick={() => selectCategory(cat)}
                          className={`flex-1 flex items-center justify-between px-2.5 py-2 rounded-lg text-[13px] font-medium transition-all ${
                            isActive
                              ? "bg-teal-500/10 text-teal-500"
                              : "text-foreground/80 hover:text-foreground hover:bg-muted/40"
                          }`}
                        >
                          <span className="truncate">{cat}</span>
                          {count > 0 && <Badge variant="secondary" className="text-[9px] h-4 px-1.5 opacity-70">{count}</Badge>}
                        </button>
                      </div>

                      {/* Subcategorias */}
                      {isExpanded && (
                        <div className="ml-6 mt-0.5 mb-1 space-y-0.5 border-l-2 border-border/30 pl-3">
                          {subcats.map((sub) => {
                            const subCount = countBySubcategory.get(`${cat}::${sub}`) || 0;
                            const isSubActive = catFilter === cat && subFilter === sub;

                            return (
                              <button
                                key={sub}
                                type="button"
                                onClick={() => {
                                  setCatFilter(cat);
                                  selectSubcategory(sub);
                                }}
                                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-[12px] transition-all ${
                                  isSubActive
                                    ? "bg-orange-500/10 text-orange-500 font-medium"
                                    : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                                }`}
                              >
                                <span className="truncate">{sub}</span>
                                {subCount > 0 && <span className="text-[10px] tabular-nums opacity-50">{subCount}</span>}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </Card>
        </div>

        {/* Conteúdo principal */}
        <div className="flex-1 min-w-0 space-y-4">
          {/* Busca + View Toggle */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou marca..."
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
            <div className="flex items-center border border-border/50 rounded-lg p-0.5">
              <button type="button" onClick={() => setViewMode("grid")} className={`p-1.5 rounded-md transition-colors ${viewMode === "grid" ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button type="button" onClick={() => setViewMode("list")} className={`p-1.5 rounded-md transition-colors ${viewMode === "list" ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Breadcrumb do filtro ativo */}
          {breadcrumb && (
            <div className="flex items-center gap-2 text-xs">
              <FolderOpen className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-muted-foreground">{breadcrumb}</span>
              <button
                type="button"
                onClick={() => { setCatFilter("all"); setSubFilter("all"); }}
                className="text-orange-500 hover:text-orange-400 font-medium ml-1"
              >
                Limpar
              </button>
            </div>
          )}

          {/* Filtros mobile (pills) — só aparece em telas pequenas */}
          <div className="lg:hidden flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() => { setCatFilter("all"); setSubFilter("all"); }}
              className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all ${catFilter === "all" ? "bg-foreground text-background shadow-sm" : "bg-muted/50 text-muted-foreground hover:bg-muted"}`}
            >
              Todos ({products.length})
            </button>
            {CATEGORIAS.filter((c) => countByCategory.has(c)).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => selectCategory(cat)}
                className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all ${catFilter === cat ? "bg-teal-500 text-white shadow-sm" : "bg-muted/50 text-muted-foreground hover:bg-muted"}`}
              >
                {cat} ({countByCategory.get(cat)})
              </button>
            ))}
          </div>

          {/* Loading */}
          {loading && (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="border-border/50 bg-card/30 rounded-2xl animate-pulse overflow-hidden">
                  <div className="aspect-square bg-muted/30" />
                  <CardContent className="p-4 space-y-2"><div className="h-4 w-28 rounded bg-muted/50" /><div className="h-3 w-16 rounded bg-muted/30" /></CardContent>
                </Card>
              ))}
            </div>
          )}

          {error && !loading && (
            <Card className="border-destructive/50 bg-destructive/5 rounded-2xl"><CardContent className="py-10 text-center"><p className="text-sm text-destructive">{error}</p></CardContent></Card>
          )}

          {!loading && !error && products.length > 0 && filtered.length === 0 && (
            <div className="text-center py-12">
              <Search className="h-8 w-8 text-muted-foreground/20 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Nenhum produto encontrado.</p>
              <button type="button" onClick={() => { setSearch(""); setCatFilter("all"); setSubFilter("all"); }} className="text-xs text-orange-500 hover:text-orange-400 font-medium mt-2">Limpar filtros</button>
            </div>
          )}

          {/* Grid View */}
          {!loading && !error && visible.length > 0 && viewMode === "grid" && (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {visible.map((product) => (
                <Card key={product.id} onClick={() => router.push(`/produtos/${product.id}`)} className="border-border/50 bg-card/50 hover:bg-card/80 hover:border-border hover:shadow-lg hover:-translate-y-0.5 rounded-2xl transition-all overflow-hidden group relative cursor-pointer">
                  <div className="absolute top-2 right-2 z-10">
                    <DropdownMenu>
                      <DropdownMenuTrigger className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-md bg-background/80 backdrop-blur-sm hover:bg-muted/80 shadow-sm" onClick={(e) => e.stopPropagation()}>
                        <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" sideOffset={4}>
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); router.push(`/produtos/${product.id}`); }}><Pencil className="mr-2 h-4 w-4" />Editar</DropdownMenuItem>
                        <DropdownMenuItem variant="destructive" onClick={(e) => handleDelete(e, product.id, product.name)}><Trash2 className="mr-2 h-4 w-4" />Excluir</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <div className="aspect-square bg-muted/20 flex items-center justify-center overflow-hidden">
                    {product.image_url || product.image_treated_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={product.image_treated_url || product.image_url || ""} alt={product.name} className="w-full h-full object-contain p-4" />
                    ) : (
                      <ImageIcon className="h-10 w-10 text-muted-foreground/20" />
                    )}
                  </div>
                  <CardContent className="p-4">
                    <h3 className="text-sm font-semibold truncate">{product.name}</h3>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {product.category && <Badge variant="secondary" className="text-[10px] bg-teal-500/10 text-teal-600 dark:text-teal-400 border-0">{product.category}</Badge>}
                      {product.subcategory && <Badge variant="secondary" className="text-[10px] bg-orange-500/10 text-orange-600 dark:text-orange-400 border-0">{product.subcategory}</Badge>}
                      {product.brand && <Badge variant="secondary" className="text-[10px]">{product.brand}</Badge>}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* List View */}
          {!loading && !error && visible.length > 0 && viewMode === "list" && (
            <div className="space-y-1.5">
              {visible.map((product) => (
                <div key={product.id} onClick={() => router.push(`/produtos/${product.id}`)} className="group flex items-center gap-4 p-3 rounded-xl border border-border/40 bg-card/50 hover:bg-card/80 hover:border-border hover:shadow-sm transition-all cursor-pointer">
                  <div className="h-14 w-14 rounded-lg bg-muted/20 flex items-center justify-center overflow-hidden shrink-0">
                    {product.image_url || product.image_treated_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={product.image_treated_url || product.image_url || ""} alt={product.name} className="w-full h-full object-contain p-1.5" />
                    ) : (
                      <ImageIcon className="h-5 w-5 text-muted-foreground/20" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold truncate">{product.name}</h3>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {product.category && <Badge variant="secondary" className="text-[9px] bg-teal-500/10 text-teal-600 dark:text-teal-400 border-0">{product.category}</Badge>}
                      {product.subcategory && <Badge variant="secondary" className="text-[9px] bg-orange-500/10 text-orange-600 dark:text-orange-400 border-0">{product.subcategory}</Badge>}
                      {product.brand && <Badge variant="secondary" className="text-[9px]">{product.brand}</Badge>}
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-md hover:bg-muted/50" onClick={(e) => e.stopPropagation()}>
                      <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" sideOffset={4}>
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); router.push(`/produtos/${product.id}`); }}><Pencil className="mr-2 h-4 w-4" />Editar</DropdownMenuItem>
                      <DropdownMenuItem variant="destructive" onClick={(e) => handleDelete(e, product.id, product.name)}><Trash2 className="mr-2 h-4 w-4" />Excluir</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
            </div>
          )}

          {hasMore && (
            <div className="flex justify-center pt-2">
              <Button variant="outline" onClick={() => setVisibleCount((prev) => prev + PAGE_SIZE)} className="border-border/50 hover:border-orange-500/30 hover:bg-orange-500/5 btn-micro">
                Carregar mais ({filtered.length - visibleCount} restante{filtered.length - visibleCount !== 1 ? "s" : ""})
              </Button>
            </div>
          )}

          {!loading && !error && products.length === 0 && (
            <Card className="border-border/50 bg-card/30 overflow-hidden rounded-2xl">
              <CardContent className="flex flex-col items-center justify-center py-20">
                <div className="relative mb-6">
                  <div className="absolute inset-0 bg-teal-500/10 rounded-full blur-xl animate-glow-pulse" />
                  <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl border border-teal-500/20 bg-teal-500/5 animate-float">
                    <Package className="h-9 w-9 text-teal-400/70" />
                  </div>
                </div>
                <h3 className="text-lg font-semibold mb-1.5">Nenhum produto cadastrado</h3>
                <p className="text-sm text-muted-foreground mb-6 text-center max-w-sm">Cadastre produtos com fotos e o sistema remove o fundo automaticamente usando inteligência artificial.</p>
                <Link href="/produtos/novo">
                  <Button variant="outline" className="border-border/50 hover:border-orange-500/30 hover:bg-orange-500/5 group btn-micro">
                    <Plus className="mr-2 h-4 w-4" />Cadastrar Produto
                    <ArrowRight className="ml-2 h-3.5 w-3.5 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
