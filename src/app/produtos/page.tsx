"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Package, ArrowRight, Loader2, ImageIcon, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import Link from "next/link";

interface Product {
  id: string;
  client_id: string | null;
  name: string;
  description: string | null;
  category: string | null;
  brand: string | null;
  image_url: string | null;
  image_treated_url: string | null;
  created_at: string;
}

export default function ProdutosPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  async function handleDelete(id: string, name: string) {
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

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Produtos</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Banco de produtos reutilizável, organizado por cliente.
          </p>
        </div>
        <Link href="/produtos/novo">
          <Button className="bg-gradient-to-r from-[#F97316] to-[#f43f5e] hover:from-[#ea6c10] hover:to-[#e0354f] text-white shadow-lg shadow-orange-500/20 hover:shadow-orange-500/30 border-0 btn-micro">
            <Plus className="mr-2 h-4 w-4" />
            Novo Produto
          </Button>
        </Link>
      </div>

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

      {/* Lista de produtos */}
      {!loading && !error && products.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((product) => (
            <Card
              key={product.id}
              className="border-border/50 bg-card/50 hover:bg-card/80 hover:border-border hover:shadow-lg hover:-translate-y-0.5 rounded-2xl transition-all overflow-hidden group relative"
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
                      onClick={() => router.push(`/produtos/${product.id}`)}
                    >
                      <Pencil className="mr-2 h-4 w-4" />
                      Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      variant="destructive"
                      onClick={() => handleDelete(product.id, product.name)}
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
