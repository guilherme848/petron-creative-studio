"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Upload,
  X,
  Save,
  ArrowLeft,
  Package,
  Users,
  ImageIcon,
  Loader2,
  Eye,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { CATEGORIAS_PRODUTO } from "@/lib/constants";

interface ProdutoForm {
  nome: string;
  descricao: string;
  categoria: string;
  marca: string;
  cliente: string;
  imagemUrl: string | null;
  imagemFile: File | null;
}

interface ClientOption {
  id: string;
  name: string;
}

export default function EditarProdutoPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const [form, setForm] = useState<ProdutoForm>({
    nome: "",
    descricao: "",
    categoria: "",
    marca: "",
    cliente: "",
    imagemUrl: null,
    imagemFile: null,
  });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [clientes, setClientes] = useState<ClientOption[]>([]);
  const [loadingClientes, setLoadingClientes] = useState(true);

  // ── Fetch Clients ─────────────────────────────────────────────────────

  useEffect(() => {
    async function fetchClients() {
      try {
        const res = await fetch("/api/clients");
        if (!res.ok) throw new Error("Erro ao buscar clientes");
        const data = await res.json();
        setClientes(data.map((c: { id: string; name: string }) => ({ id: c.id, name: c.name })));
      } catch {
        console.error("Erro ao carregar clientes");
      } finally {
        setLoadingClientes(false);
      }
    }
    fetchClients();
  }, []);

  // ── Fetch Product Data ────────────────────────────────────────────────

  useEffect(() => {
    async function fetchProduct() {
      try {
        const res = await fetch("/api/products");
        if (!res.ok) throw new Error("Erro ao buscar produto");
        const data = await res.json();
        const product = data.find((p: { id: string }) => p.id === params.id);

        if (!product) {
          toast.error("Produto não encontrado");
          router.push("/produtos");
          return;
        }

        setForm({
          nome: product.name || "",
          descricao: product.description || "",
          categoria: product.category || "",
          marca: product.brand || "",
          cliente: product.client_id || "",
          imagemUrl: product.image_treated_url || product.image_url || null,
          imagemFile: null,
        });
      } catch {
        toast.error("Erro ao carregar dados do produto");
      } finally {
        setLoading(false);
      }
    }

    fetchProduct();
  }, [params.id, router]);

  // ── File Handling ─────────────────────────────────────────────────────

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) return;
    const url = URL.createObjectURL(file);
    setForm((prev) => ({ ...prev, imagemUrl: url, imagemFile: file }));
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const removeImage = () => {
    if (form.imagemUrl && form.imagemFile) URL.revokeObjectURL(form.imagemUrl);
    setForm((prev) => ({ ...prev, imagemUrl: null, imagemFile: null }));
  };

  // ── Save ──────────────────────────────────────────────────────────────

  const handleSave = async () => {
    if (!form.nome.trim()) {
      toast.error("O nome do produto é obrigatório.");
      return;
    }
    setSaving(true);

    try {
      const formData = new FormData();

      if (form.imagemFile) {
        formData.append("image", form.imagemFile);
      }

      const productData = {
        id: params.id,
        name: form.nome.trim(),
        description: form.descricao || null,
        category: form.categoria || null,
        brand: form.marca || null,
        client_id: form.cliente || null,
      };

      formData.append("data", JSON.stringify(productData));

      const res = await fetch("/api/products", {
        method: "PUT",
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Erro ao atualizar produto");
      }

      toast.success("Produto atualizado com sucesso!");
      router.push("/produtos");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Erro ao atualizar produto. Tente novamente."
      );
    } finally {
      setSaving(false);
    }
  };

  // ── Loading State ─────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/produtos">
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">
              Editar Produto
            </h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Atualize as informações do produto.
            </p>
          </div>
        </div>
      </div>

      {/* Grid: Form + Preview */}
      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        {/* Form Column */}
        <div className="space-y-5 stagger-children">
          {/* Dados do Produto */}
          <Card className="rounded-2xl border-border/50 bg-card/80">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-base">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500/10">
                  <Package className="h-4 w-4 text-orange-500" />
                </div>
                Dados do Produto
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nome">
                  Nome do produto <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="nome"
                  placeholder="Ex: Piso Porcelanato 60x60"
                  className="h-[42px]"
                  value={form.nome}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, nome: e.target.value }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="descricao">Descrição / Especificações</Label>
                <Textarea
                  id="descricao"
                  placeholder="Ex: Bold, retificado, acabamento acetinado"
                  rows={3}
                  value={form.descricao}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      descricao: e.target.value,
                    }))
                  }
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Categoria</Label>
                  <Select
                    value={form.categoria ?? ""}
                    onValueChange={(val) =>
                      setForm((prev) => ({ ...prev, categoria: val ?? "" }))
                    }
                  >
                    <SelectTrigger className="h-[42px]">
                      <SelectValue placeholder="Selecione a categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIAS_PRODUTO.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="marca">Marca / Fabricante</Label>
                  <Input
                    id="marca"
                    placeholder="Ex: Portobello, Eliane, Suvinil"
                    className="h-[42px]"
                    value={form.marca}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, marca: e.target.value }))
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Cliente */}
          <Card className="rounded-2xl border-border/50 bg-card/80">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-base">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10">
                  <Users className="h-4 w-4 text-blue-500" />
                </div>
                Cliente
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label>Vincular ao cliente</Label>
                <Select
                  value={form.cliente ?? ""}
                  onValueChange={(val) =>
                    setForm((prev) => ({ ...prev, cliente: val ?? "" }))
                  }
                >
                  <SelectTrigger className="h-[42px]">
                    <SelectValue placeholder={loadingClientes ? "Carregando..." : "Selecione o cliente"} />
                  </SelectTrigger>
                  <SelectContent>
                    {clientes.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Imagem */}
          <Card className="rounded-2xl border-border/50 bg-card/80">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-base">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10">
                  <ImageIcon className="h-4 w-4 text-emerald-500" />
                </div>
                Imagem do Produto
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!form.imagemUrl ? (
                <div
                  className={`relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-10 cursor-pointer transition-colors ${
                    dragOver
                      ? "border-orange-500 bg-orange-500/5"
                      : "border-border/50 hover:border-orange-500/40 hover:bg-orange-500/[0.02]"
                  }`}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOver(true);
                  }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/jpg"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFile(file);
                    }}
                  />
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-500/10 mb-3">
                    <Upload className="h-5 w-5 text-orange-500" />
                  </div>
                  <p className="text-sm font-medium text-foreground mb-1">
                    Arraste a imagem ou clique para selecionar
                  </p>
                  <p className="text-xs text-muted-foreground">
                    PNG ou JPG
                  </p>
                </div>
              ) : (
                <div className="relative group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={form.imagemUrl}
                    alt="Preview do produto"
                    className="w-full max-h-64 object-contain rounded-xl border border-border/50 bg-muted/30"
                  />
                  <button
                    onClick={removeImage}
                    className="absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-full bg-destructive text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-3 text-center">
                O fundo será removido automaticamente ao salvar.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Preview Column */}
        <div className="lg:sticky lg:top-[76px] lg:self-start space-y-4">
          <Card className="rounded-2xl border-border/50 bg-card/80 overflow-hidden">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                Pré-visualização
              </CardTitle>
            </CardHeader>
            <Separator />
            <CardContent className="pt-5">
              <div className="space-y-4">
                {/* Imagem Preview */}
                <div className="aspect-square rounded-xl border border-border/50 bg-muted/20 flex items-center justify-center overflow-hidden">
                  {form.imagemUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={form.imagemUrl}
                      alt="Produto"
                      className="w-full h-full object-contain p-4"
                    />
                  ) : (
                    <div className="text-center">
                      <ImageIcon className="h-10 w-10 text-muted-foreground/30 mx-auto mb-2" />
                      <p className="text-xs text-muted-foreground/50">
                        Sem imagem
                      </p>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm truncate">
                    {form.nome || "Nome do produto"}
                  </h4>
                  {form.descricao && (
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {form.descricao}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-1.5">
                    {form.categoria && (
                      <Badge
                        variant="secondary"
                        className="text-[10px] bg-orange-500/10 text-orange-600 border-0"
                      >
                        {form.categoria}
                      </Badge>
                    )}
                    {form.marca && (
                      <Badge
                        variant="secondary"
                        className="text-[10px]"
                      >
                        {form.marca}
                      </Badge>
                    )}
                  </div>
                  {form.cliente && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <Users className="h-3 w-3" />
                      {clientes.find((c) => c.id === form.cliente)?.name || form.cliente}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Botões */}
          <div className="flex gap-2">
            <Link href="/produtos" className="flex-1">
              <Button variant="outline" className="w-full btn-micro">
                Cancelar
              </Button>
            </Link>
            <Button
              className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white border-0 btn-micro"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {saving ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
