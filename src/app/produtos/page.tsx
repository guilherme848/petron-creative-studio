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
  Loader2,
  ImageIcon,
  MoreHorizontal,
  Pencil,
  Trash2,
  Search,
  X,
  Filter,
  LayoutGrid,
  List,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import Link from "next/link";
import { DEPARTAMENTOS } from "@/lib/constants";

interface Product {
  id: string;
  name: string;
  description: string | null;
  department: string | null;
  category: string | null;
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

  // Filters
  const [search, setSearch] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

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

  useEffect(() => {
    fetchProducts();
  }, []);

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

  // Derived data
  const departments = useMemo(() => {
    const deps = new Set(products.map((p) => p.department).filter(Boolean) as string[]);
    return DEPARTAMENTOS.filter((d) => deps.has(d));
  }, [products]);

  const categoriesForDept = useMemo(() => {
    if (departmentFilter === "all") {
      return Array.from(new Set(products.map((p) => p.category).filter(Boolean) as string[])).sort();
    }
    return Array.from(
      new Set(
        products
          .filter((p) => p.department === departmentFilter)
          .map((p) => p.category)
          .filter(Boolean) as string[]
      )
    ).sort();
  }, [products, departmentFilter]);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const matchSearch =
        !search ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.brand?.toLowerCase().includes(search.toLowerCase());
      const matchDept = departmentFilter === "all" || p.department === departmentFilter;
      const matchCat = categoryFilter === "all" || p.category === categoryFilter;
      return matchSearch && matchDept && matchCat;
    });
  }, [products, search, departmentFilter, categoryFilter]);

  const visible = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;

  // Reset visible count when filters change
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [search, departmentFilter, categoryFilter]);

  // Reset category when department changes
  useEffect(() => {
    setCategoryFilter("all");
  }, [departmentFilter]);

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

      {/* Busca + View Toggle */}
      {!loading && !error && products.length > 0 && (
        <div className="space-y-3">
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
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            <div className="flex items-center border border-border/50 rounded-lg p-0.5">
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                className={`p-1.5 rounded-md transition-colors ${
                  viewMode === "grid" ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("list")}
                className={`p-1.5 rounded-md transition-colors ${
                  viewMode === "list" ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Filtros por departamento */}
          {departments.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap">
              <Filter className="h-3.5 w-3.5 text-muted-foreground" />
              <button
                type="button"
                onClick={() => setDepartmentFilter("all")}
                className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all ${
                  departmentFilter === "all"
                    ? "bg-foreground text-background shadow-sm"
                    : "bg-muted/50 text-muted-foreground hover:bg-muted"
                }`}
              >
                Todos ({products.length})
              </button>
              {departments.map((dep) => {
                const count = products.filter((p) => p.department === dep).length;
                return (
                  <button
                    key={dep}
                    type="button"
                    onClick={() => setDepartmentFilter(dep)}
                    className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all ${
                      departmentFilter === dep
                        ? "bg-teal-500 text-white shadow-sm"
                        : "bg-muted/50 text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    {dep} ({count})
                  </button>
                );
              })}
            </div>
          )}

          {/* Sub-filtro por categoria */}
          {departmentFilter !== "all" && categoriesForDept.length > 1 && (
            <div className="flex items-center gap-1.5 flex-wrap pl-5">
              <button
                type="button"
                onClick={() => setCategoryFilter("all")}
                className={`px-2 py-0.5 rounded-full text-[10px] font-medium transition-all ${
                  categoryFilter === "all"
                    ? "bg-orange-500 text-white shadow-sm"
                    : "bg-muted/40 text-muted-foreground hover:bg-muted"
                }`}
              >
                Todas
              </button>
              {categoriesForDept.map((cat) => {
                const count = products.filter(
                  (p) => p.department === departmentFilter && p.category === cat
                ).length;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategoryFilter(cat)}
                    className={`px-2 py-0.5 rounded-full text-[10px] font-medium transition-all ${
                      categoryFilter === cat
                        ? "bg-orange-500 text-white shadow-sm"
                        : "bg-muted/40 text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    {cat} ({count})
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="border-border/50 bg-card/30 rounded-2xl animate-pulse overflow-hidden">
              <div className="aspect-square bg-muted/30" />
              <CardContent className="p-4 space-y-2">
                <div className="h-4 w-28 rounded bg-muted/50" />
                <div className="h-3 w-16 rounded bg-muted/30" />
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

      {/* Filtro sem resultado */}
      {!loading && !error && products.length > 0 && filtered.length === 0 && (
        <div className="text-center py-12">
          <Search className="h-8 w-8 text-muted-foreground/20 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Nenhum produto encontrado.</p>
          <button
            type="button"
            onClick={() => {
              setSearch("");
              setDepartmentFilter("all");
              setCategoryFilter("all");
            }}
            className="text-xs text-orange-500 hover:text-orange-400 font-medium mt-2"
          >
            Limpar filtros
          </button>
        </div>
      )}

      {/* Grid View */}
      {!loading && !error && visible.length > 0 && viewMode === "grid" && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {visible.map((product) => (
            <Card
              key={product.id}
              onClick={() => router.push(`/produtos/${product.id}`)}
              className="border-border/50 bg-card/50 hover:bg-card/80 hover:border-border hover:shadow-lg hover:-translate-y-0.5 rounded-2xl transition-all overflow-hidden group relative cursor-pointer"
            >
              <div className="absolute top-2 right-2 z-10">
                <DropdownMenu>
                  <DropdownMenuTrigger
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-md bg-background/80 backdrop-blur-sm hover:bg-muted/80 shadow-sm"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" sideOffset={4}>
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/produtos/${product.id}`);
                      }}
                    >
                      <Pencil className="mr-2 h-4 w-4" />
                      Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      variant="destructive"
                      onClick={(e) => handleDelete(e, product.id, product.name)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Excluir
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div className="aspect-square bg-muted/20 flex items-center justify-center overflow-hidden">
                {product.image_url || product.image_treated_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={product.image_treated_url || product.image_url || ""}
                    alt={product.name}
                    className="w-full h-full object-contain p-4"
                  />
                ) : (
                  <ImageIcon className="h-10 w-10 text-muted-foreground/20" />
                )}
              </div>
              <CardContent className="p-4">
                <h3 className="text-sm font-semibold truncate">
                  {product.name}
                </h3>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {product.department && (
                    <Badge
                      variant="secondary"
                      className="text-[10px] bg-teal-500/10 text-teal-600 border-0"
                    >
                      {product.department}
                    </Badge>
                  )}
                  {product.category && (
                    <Badge
                      variant="secondary"
                      className="text-[10px] bg-orange-500/10 text-orange-600 border-0"
                    >
                      {product.category}
                    </Badge>
                  )}
                  {product.brand && (
                    <Badge variant="secondary" className="text-[10px]">
                      {product.brand}
                    </Badge>
                  )}
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
            <div
              key={product.id}
              onClick={() => router.push(`/produtos/${product.id}`)}
              className="group flex items-center gap-4 p-3 rounded-xl border border-border/40 bg-card/50 hover:bg-card/80 hover:border-border hover:shadow-sm transition-all cursor-pointer"
            >
              <div className="h-14 w-14 rounded-lg bg-muted/20 flex items-center justify-center overflow-hidden shrink-0">
                {product.image_url || product.image_treated_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={product.image_treated_url || product.image_url || ""}
                    alt={product.name}
                    className="w-full h-full object-contain p-1.5"
                  />
                ) : (
                  <ImageIcon className="h-5 w-5 text-muted-foreground/20" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold truncate">{product.name}</h3>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {product.department && (
                    <Badge variant="secondary" className="text-[9px] bg-teal-500/10 text-teal-600 border-0">
                      {product.department}
                    </Badge>
                  )}
                  {product.category && (
                    <Badge variant="secondary" className="text-[9px] bg-orange-500/10 text-orange-600 border-0">
                      {product.category}
                    </Badge>
                  )}
                  {product.brand && (
                    <Badge variant="secondary" className="text-[9px]">
                      {product.brand}
                    </Badge>
                  )}
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-md hover:bg-muted/50"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" sideOffset={4}>
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/produtos/${product.id}`);
                    }}
                  >
                    <Pencil className="mr-2 h-4 w-4" />
                    Editar
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    variant="destructive"
                    onClick={(e) => handleDelete(e, product.id, product.name)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Excluir
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))}
        </div>
      )}

      {/* Load More */}
      {hasMore && (
        <div className="flex justify-center pt-2">
          <Button
            variant="outline"
            onClick={() => setVisibleCount((prev) => prev + PAGE_SIZE)}
            className="border-border/50 hover:border-orange-500/30 hover:bg-orange-500/5 btn-micro"
          >
            Carregar mais ({filtered.length - visibleCount} restante{filtered.length - visibleCount !== 1 ? "s" : ""})
          </Button>
        </div>
      )}

      {/* Estado vazio */}
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
            <p className="text-sm text-muted-foreground mb-6 text-center max-w-sm">
              Cadastre produtos com fotos e o sistema remove o fundo
              automaticamente usando inteligência artificial.
            </p>
            <Link href="/produtos/novo">
              <Button
                variant="outline"
                className="border-border/50 hover:border-orange-500/30 hover:bg-orange-500/5 group btn-micro"
              >
                <Plus className="mr-2 h-4 w-4" />
                Cadastrar Produto
                <ArrowRight className="ml-2 h-3.5 w-3.5 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
