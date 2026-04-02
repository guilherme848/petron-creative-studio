"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Upload,
  X,
  Plus,
  Save,
  ArrowLeft,
  Megaphone,
  Users,
  Sparkles,
  ShoppingBag,
  ImageIcon,
  Loader2,
  Calendar,
  Eye,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

// -- Types ------------------------------------------------------------------

interface Produto {
  id: string;
  nome: string;
  tipoPreco: string;
  preco: string;
  precoAnterior: string;
  unidade: string;
  formaPagamento: string;
}

interface PromocaoForm {
  nome: string;
  dataInicio: string;
  dataFim: string;
  subtema: string;
  cliente: string;
  seloUrl: string | null;
  seloFile: File | null;
  seloIaPrompt: string;
  produtos: Produto[];
}

interface ClientOption {
  id: string;
  name: string;
  colors: string[];
}

const TIPOS_PRECO = [
  { value: "a-partir-de", label: "A partir de" },
  { value: "por-apenas", label: "Por apenas" },
  { value: "de-por", label: "De/Por" },
];

const UNIDADES = [
  { value: "m2", label: "M\u00B2" },
  { value: "und", label: "UND" },
  { value: "metro", label: "Metro" },
  { value: "caixa", label: "Caixa" },
  { value: "litro", label: "Litro" },
  { value: "kg", label: "Kg" },
  { value: "galao", label: "Gal\u00E3o" },
];

const FORMAS_PAGAMENTO = [
  { value: "a-vista", label: "\u00C0 vista" },
  { value: "pix", label: "PIX" },
  { value: "debito", label: "D\u00E9bito" },
  { value: "dinheiro", label: "Dinheiro" },
  { value: "cartao", label: "Cart\u00E3o" },
];

function gerarId() {
  return Math.random().toString(36).substring(2, 10);
}

function criarProdutoVazio(): Produto {
  return {
    id: gerarId(),
    nome: "",
    tipoPreco: "por-apenas",
    preco: "",
    precoAnterior: "",
    unidade: "und",
    formaPagamento: "a-vista",
  };
}

// -- Page Component ---------------------------------------------------------

export default function EditarPromocaoPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [dragOver, setDragOver] = useState(false);
  const [seloTab, setSeloTab] = useState<number>(0);
  const [clientes, setClientes] = useState<ClientOption[]>([]);
  const [loadingClientes, setLoadingClientes] = useState(true);
  const [gerandoSelo, setGerandoSelo] = useState(false);

  const [form, setForm] = useState<PromocaoForm>({
    nome: "",
    dataInicio: "",
    dataFim: "",
    subtema: "",
    cliente: "",
    seloUrl: null,
    seloFile: null,
    seloIaPrompt: "",
    produtos: [],
  });

  // ── Fetch Clients ─────────────────────────────────────────────────────

  useEffect(() => {
    async function fetchClients() {
      try {
        const res = await fetch("/api/clients");
        if (!res.ok) throw new Error("Erro ao buscar clientes");
        const data = await res.json();
        setClientes(
          data.map((c: { id: string; name: string; brand_configs?: { colors?: { hex: string }[] }[] }) => ({
            id: c.id,
            name: c.name,
            colors: c.brand_configs?.[0]?.colors?.map((cor: { hex: string }) => cor.hex) || [],
          }))
        );
      } catch {
        console.error("Erro ao carregar clientes");
      } finally {
        setLoadingClientes(false);
      }
    }
    fetchClients();
  }, []);

  // ── Fetch Promotion Data ──────────────────────────────────────────────

  useEffect(() => {
    async function fetchPromotion() {
      try {
        const res = await fetch("/api/promotions");
        if (!res.ok) throw new Error("Erro ao buscar promoção");
        const data = await res.json();
        const promo = data.find((p: { id: string }) => p.id === params.id);

        if (!promo) {
          toast.error("Promoção não encontrada");
          router.push("/promocoes");
          return;
        }

        setForm({
          nome: promo.name || "",
          dataInicio: promo.start_date || "",
          dataFim: promo.end_date || "",
          subtema: promo.subtitle || "",
          cliente: promo.client_id || "",
          seloUrl: promo.seal_url || null,
          seloFile: null,
          seloIaPrompt: "",
          produtos: (promo.promotion_items || []).map(
            (item: {
              id: string;
              product_name: string;
              price_type: string;
              price: number;
              previous_price: number | null;
              unit: string | null;
              payment_condition: string | null;
            }) => ({
              id: item.id || gerarId(),
              nome: item.product_name || "",
              tipoPreco: item.price_type || "por-apenas",
              preco: item.price ? String(item.price) : "",
              precoAnterior: item.previous_price ? String(item.previous_price) : "",
              unidade: item.unit || "und",
              formaPagamento: item.payment_condition || "a-vista",
            })
          ),
        });
      } catch {
        toast.error("Erro ao carregar dados da promoção");
      } finally {
        setLoading(false);
      }
    }

    fetchPromotion();
  }, [params.id, router]);

  // -- Helpers --------------------------------------------------------------

  const updateField = <K extends keyof PromocaoForm>(
    key: K,
    value: PromocaoForm[K]
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const updateProduto = (id: string, field: keyof Produto, value: string) => {
    setForm((prev) => ({
      ...prev,
      produtos: prev.produtos.map((p) =>
        p.id === id ? { ...p, [field]: value } : p
      ),
    }));
  };

  const adicionarProduto = () => {
    setForm((prev) => ({
      ...prev,
      produtos: [...prev.produtos, criarProdutoVazio()],
    }));
  };

  const removerProduto = (id: string) => {
    setForm((prev) => ({
      ...prev,
      produtos: prev.produtos.filter((p) => p.id !== id),
    }));
  };

  // -- File Upload (Selo) ---------------------------------------------------

  const handleSeloFile = useCallback((file: File) => {
    if (file.type !== "image/png") {
      toast.error("Use apenas arquivos PNG com fundo transparente.");
      return;
    }

    const url = URL.createObjectURL(file);
    setForm((prev) => ({ ...prev, seloUrl: url, seloFile: file }));
  }, []);

  const handleSeloDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleSeloFile(file);
    },
    [handleSeloFile]
  );

  const handleSeloFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleSeloFile(file);
    },
    [handleSeloFile]
  );

  const removerSelo = () => {
    if (form.seloUrl && form.seloFile) URL.revokeObjectURL(form.seloUrl);
    setForm((prev) => ({ ...prev, seloUrl: null, seloFile: null }));
  };

  const handleGerarSeloIA = async () => {
    if (!form.seloIaPrompt.trim()) return;

    setGerandoSelo(true);
    try {
      const selectedClient = clientes.find((c) => c.id === form.cliente);
      const colors = selectedClient?.colors || [];

      const res = await fetch("/api/ai/generate-seal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          promotionName: form.seloIaPrompt.trim(),
          colors,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Erro ao gerar selo" }));
        throw new Error(err.error || "Erro ao gerar selo com IA");
      }

      const blob = await res.blob();
      const file = new File([blob], "selo-ia.png", { type: "image/png" });
      const url = URL.createObjectURL(blob);
      setForm((prev) => ({ ...prev, seloUrl: url, seloFile: file }));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao gerar selo com IA");
    } finally {
      setGerandoSelo(false);
    }
  };

  // -- Save -----------------------------------------------------------------

  const handleSave = async () => {
    if (!form.nome.trim()) {
      toast.error("O nome da promoção é obrigatório.");
      return;
    }

    setSaving(true);

    try {
      const formData = new FormData();

      if (form.seloFile) {
        formData.append("seal", form.seloFile);
      }

      const promotionData = {
        id: params.id,
        name: form.nome.trim(),
        start_date: form.dataInicio || null,
        end_date: form.dataFim || null,
        subtitle: form.subtema || null,
        client_id: form.cliente || null,
        items: form.produtos
          .filter((p) => p.nome.trim())
          .map((p) => ({
            product_name: p.nome.trim(),
            price_type: p.tipoPreco,
            price: parseFloat(p.preco) || 0,
            previous_price: p.precoAnterior ? parseFloat(p.precoAnterior) : null,
            unit: p.unidade || null,
            payment_condition: p.formaPagamento || null,
          })),
      };

      formData.append("data", JSON.stringify(promotionData));

      const res = await fetch("/api/promotions", {
        method: "PUT",
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Erro ao atualizar promoção");
      }

      toast.success("Promoção atualizada com sucesso!");
      router.push("/promocoes");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Erro ao atualizar promoção. Tente novamente."
      );
    } finally {
      setSaving(false);
    }
  };

  // -- Helpers de label -----------------------------------------------------

  const getLabelTipoPreco = (value: string) =>
    TIPOS_PRECO.find((t) => t.value === value)?.label ?? value;

  const getLabelUnidade = (value: string) =>
    UNIDADES.find((u) => u.value === value)?.label ?? value;

  const getLabelFormaPagamento = (value: string) =>
    FORMAS_PAGAMENTO.find((f) => f.value === value)?.label ?? value;

  // ── Loading State ─────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    );
  }

  // -- Render ---------------------------------------------------------------

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/promocoes">
          <Button
            variant="ghost"
            size="icon"
            className="hover:bg-orange-500/10"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Editar Promoção</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Atualize os detalhes da promoção e seus produtos.
          </p>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
        {/* Left Column — Form */}
        <div className="space-y-8 stagger-children">
          {/* -- 1. Dados da Promoção ---------------------------------------- */}
          <Card className="border-border/50 bg-card/50 rounded-2xl">
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500/10">
                  <Megaphone className="h-4 w-4 text-orange-500" />
                </div>
                <div>
                  <CardTitle>Dados da Promoção</CardTitle>
                  <CardDescription>
                    Informações básicas sobre a campanha
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <Separator />
            <CardContent className="pt-6">
              {/* Templates rápidos */}
              <div className="mb-5">
                <p className="text-xs font-medium text-muted-foreground mb-2">
                  Templates rápidos
                </p>
                <div className="flex flex-wrap gap-2">
                  {["Queima de Estoque", "Liquidação de Pisos", "Mega Oferta", "Aniversário", "Feirão da Construção", "Black Friday", "Saldão"].map(
                    (template) => (
                      <button
                        key={template}
                        type="button"
                        onClick={() => updateField("nome", template)}
                        className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium transition-all cursor-pointer ${
                          form.nome === template
                            ? "border-orange-500 bg-orange-500/10 text-orange-500"
                            : "border-border/50 bg-muted/30 text-muted-foreground hover:border-orange-500/50 hover:text-orange-500 hover:bg-orange-500/5"
                        }`}
                      >
                        {template}
                      </button>
                    )
                  )}
                </div>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Label htmlFor="nome">
                    Nome da Promoção{" "}
                    <span className="text-orange-500">*</span>
                  </Label>
                  <Input
                    id="nome"
                    placeholder="Ex: Queima de Estoque, Liquidação de Pisos"
                    value={form.nome}
                    onChange={(e) => updateField("nome", e.target.value)}
                    className="mt-1.5 h-[42px] focus-visible:border-orange-500 focus-visible:ring-orange-500/30"
                  />
                </div>

                <div>
                  <Label htmlFor="dataInicio">Data de Início</Label>
                  <Input
                    id="dataInicio"
                    type="date"
                    value={form.dataInicio}
                    onChange={(e) => updateField("dataInicio", e.target.value)}
                    className="mt-1.5 h-[42px] focus-visible:border-orange-500 focus-visible:ring-orange-500/30"
                  />
                </div>

                <div>
                  <Label htmlFor="dataFim">Data de Término</Label>
                  <Input
                    id="dataFim"
                    type="date"
                    value={form.dataFim}
                    onChange={(e) => updateField("dataFim", e.target.value)}
                    className="mt-1.5 h-[42px] focus-visible:border-orange-500 focus-visible:ring-orange-500/30"
                  />
                </div>

                <div className="sm:col-span-2">
                  <Label htmlFor="subtema">Subtema / Slogan</Label>
                  <Input
                    id="subtema"
                    placeholder="Ex: Preços imperdíveis"
                    value={form.subtema}
                    onChange={(e) => updateField("subtema", e.target.value)}
                    className="mt-1.5 h-[42px] focus-visible:border-orange-500 focus-visible:ring-orange-500/30"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* -- 2. Cliente -------------------------------------------------- */}
          <Card className="border-border/50 bg-card/50 rounded-2xl">
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500/10">
                  <Users className="h-4 w-4 text-orange-500" />
                </div>
                <div>
                  <CardTitle>Cliente</CardTitle>
                  <CardDescription>
                    Selecione o cliente desta promoção
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <Separator />
            <CardContent className="pt-6">
              <Label htmlFor="cliente">Cliente</Label>
              <Select
                value={form.cliente ?? ""}
                onValueChange={(val) => updateField("cliente", val as string)}
              >
                <SelectTrigger className="mt-1.5 h-[42px] w-full focus-visible:border-orange-500 focus-visible:ring-orange-500/30">
                  <SelectValue placeholder={loadingClientes ? "Carregando..." : "Selecione o cliente"} />
                </SelectTrigger>
                <SelectContent>
                  {clientes.map((cliente) => (
                    <SelectItem key={cliente.id} value={cliente.id}>
                      {cliente.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* -- 3. Selo Promocional ----------------------------------------- */}
          <Card className="border-border/50 bg-card/50 rounded-2xl">
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500/10">
                  <Sparkles className="h-4 w-4 text-orange-500" />
                </div>
                <div>
                  <CardTitle>Selo Promocional</CardTitle>
                  <CardDescription>
                    Faça upload de um selo ou gere com inteligência artificial
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <Separator />
            <CardContent className="pt-6">
              <Tabs
                defaultValue={0}
                value={seloTab}
                onValueChange={(val) => setSeloTab(val as number)}
              >
                <TabsList className="mb-4 w-full">
                  <TabsTrigger value={0} className="flex-1">
                    <Upload className="mr-1.5 h-3.5 w-3.5" />
                    Upload de Selo
                  </TabsTrigger>
                  <TabsTrigger value={1} className="flex-1">
                    <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                    Gerar com IA
                  </TabsTrigger>
                </TabsList>

                {/* Tab Upload */}
                <TabsContent value={0}>
                  {!form.seloUrl ? (
                    <div
                      onDragOver={(e) => {
                        e.preventDefault();
                        setDragOver(true);
                      }}
                      onDragLeave={() => setDragOver(false)}
                      onDrop={handleSeloDrop}
                      onClick={() => fileInputRef.current?.click()}
                      className={`
                        relative flex cursor-pointer flex-col items-center justify-center
                        rounded-xl border-2 border-dashed p-10 transition-all
                        ${
                          dragOver
                            ? "border-orange-500 bg-orange-500/5 scale-[1.01]"
                            : "border-border/50 hover:border-orange-500/50 hover:bg-orange-500/5"
                        }
                      `}
                    >
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-500/10 mb-4">
                        <Upload className="h-6 w-6 text-orange-500" />
                      </div>
                      <p className="text-sm font-medium mb-1">
                        Arraste o selo aqui ou clique para selecionar
                      </p>
                      <p className="text-xs text-muted-foreground">
                        PNG com fundo transparente recomendado
                      </p>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".png"
                        className="hidden"
                        onChange={handleSeloFileInput}
                      />
                    </div>
                  ) : (
                    <div className="relative flex flex-col items-center gap-4">
                      <div className="relative group">
                        <div className="rounded-xl border border-border/50 bg-muted/30 p-6 flex items-center justify-center min-h-[160px]">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={form.seloUrl}
                            alt="Selo promocional"
                            className="max-h-[140px] max-w-[280px] object-contain"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={removerSelo}
                          className="absolute -top-2 -right-2 flex h-7 w-7 items-center justify-center rounded-full bg-destructive/90 text-white shadow-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      {form.seloFile && (
                        <p className="text-xs text-muted-foreground">
                          {form.seloFile.name} —{" "}
                          {(form.seloFile.size / 1024).toFixed(1)} KB
                        </p>
                      )}
                    </div>
                  )}
                </TabsContent>

                {/* Tab Gerar com IA */}
                <TabsContent value={1}>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="seloIaPrompt">Descreva o selo desejado</Label>
                      <Textarea
                        id="seloIaPrompt"
                        placeholder="Descreva o selo que deseja gerar. Ex: Selo 3D metálico com texto 'QUEIMA DE ESTOQUE' com efeito de fogo"
                        value={form.seloIaPrompt}
                        onChange={(e) =>
                          updateField("seloIaPrompt", e.target.value)
                        }
                        className="mt-1.5 min-h-[100px] focus-visible:border-orange-500 focus-visible:ring-orange-500/30"
                      />
                    </div>
                    <Button
                      onClick={handleGerarSeloIA}
                      disabled={!form.seloIaPrompt.trim() || gerandoSelo}
                      className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 text-white border-0 rounded-xl"
                    >
                      {gerandoSelo ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Gerando...
                        </>
                      ) : (
                        <>
                          <Sparkles className="mr-2 h-4 w-4" />
                          Gerar Selo
                        </>
                      )}
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* -- 4. Produtos da Promoção ------------------------------------- */}
          <Card className="border-border/50 bg-card/50 rounded-2xl">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500/10">
                    <ShoppingBag className="h-4 w-4 text-orange-500" />
                  </div>
                  <div>
                    <CardTitle>Produtos da Promoção</CardTitle>
                    <CardDescription>
                      Adicione os produtos que farão parte desta campanha
                    </CardDescription>
                  </div>
                </div>
                <Button
                  onClick={adicionarProduto}
                  variant="outline"
                  className="border-orange-500/30 text-orange-500 hover:bg-orange-500/5 hover:border-orange-500/50 rounded-xl"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Adicionar Produto
                </Button>
              </div>
            </CardHeader>
            <Separator />
            <CardContent className="pt-6">
              {form.produtos.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <ShoppingBag className="h-10 w-10 opacity-30 mb-3" />
                  <p className="text-sm font-medium">
                    Nenhum produto adicionado
                  </p>
                  <p className="text-xs mt-1">
                    Clique em &ldquo;Adicionar Produto&rdquo; para começar
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {form.produtos.map((produto, index) => (
                    <div
                      key={produto.id}
                      className="relative rounded-xl border border-border/50 bg-muted/20 p-5 transition-all hover:border-orange-500/20"
                    >
                      {/* Remove button */}
                      <button
                        type="button"
                        onClick={() => removerProduto(produto.id)}
                        className="absolute top-3 right-3 flex h-7 w-7 items-center justify-center rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                        title="Remover produto"
                      >
                        <X className="h-4 w-4" />
                      </button>

                      <div className="flex items-center gap-2 mb-4">
                        <Badge variant="secondary" className="text-xs">
                          Produto {index + 1}
                        </Badge>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        {/* Nome do produto */}
                        <div className="sm:col-span-2">
                          <Label>Nome do Produto</Label>
                          <Input
                            placeholder="Ex: Porcelanato 60x60"
                            value={produto.nome}
                            onChange={(e) =>
                              updateProduto(produto.id, "nome", e.target.value)
                            }
                            className="mt-1.5 h-[42px] focus-visible:border-orange-500 focus-visible:ring-orange-500/30"
                          />
                        </div>

                        {/* Tipo de preço */}
                        <div>
                          <Label>Tipo de Preço</Label>
                          <Select
                            value={produto.tipoPreco ?? ""}
                            onValueChange={(val) =>
                              updateProduto(
                                produto.id,
                                "tipoPreco",
                                val as string
                              )
                            }
                          >
                            <SelectTrigger className="mt-1.5 h-[42px] w-full focus-visible:border-orange-500 focus-visible:ring-orange-500/30">
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                            <SelectContent>
                              {TIPOS_PRECO.map((tipo) => (
                                <SelectItem key={tipo.value} value={tipo.value}>
                                  {tipo.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Preço */}
                        <div>
                          <Label>Preço (R$)</Label>
                          <div className="relative mt-1.5">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                              R$
                            </span>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              placeholder="0,00"
                              value={produto.preco}
                              onChange={(e) =>
                                updateProduto(
                                  produto.id,
                                  "preco",
                                  e.target.value
                                )
                              }
                              className="h-[42px] pl-10 focus-visible:border-orange-500 focus-visible:ring-orange-500/30"
                            />
                          </div>
                        </div>

                        {/* Preço anterior (visível apenas em De/Por) */}
                        {produto.tipoPreco === "de-por" && (
                          <div>
                            <Label>Preço Anterior (R$)</Label>
                            <div className="relative mt-1.5">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                                R$
                              </span>
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                placeholder="0,00"
                                value={produto.precoAnterior}
                                onChange={(e) =>
                                  updateProduto(
                                    produto.id,
                                    "precoAnterior",
                                    e.target.value
                                  )
                                }
                                className="h-[42px] pl-10 focus-visible:border-orange-500 focus-visible:ring-orange-500/30"
                              />
                            </div>
                          </div>
                        )}

                        {/* Unidade de medida */}
                        <div>
                          <Label>Unidade de Medida</Label>
                          <Select
                            value={produto.unidade ?? ""}
                            onValueChange={(val) =>
                              updateProduto(
                                produto.id,
                                "unidade",
                                val as string
                              )
                            }
                          >
                            <SelectTrigger className="mt-1.5 h-[42px] w-full focus-visible:border-orange-500 focus-visible:ring-orange-500/30">
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                            <SelectContent>
                              {UNIDADES.map((un) => (
                                <SelectItem key={un.value} value={un.value}>
                                  {un.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Forma de pagamento */}
                        <div>
                          <Label>Forma de Pagamento</Label>
                          <Select
                            value={produto.formaPagamento ?? ""}
                            onValueChange={(val) =>
                              updateProduto(
                                produto.id,
                                "formaPagamento",
                                val as string
                              )
                            }
                          >
                            <SelectTrigger className="mt-1.5 h-[42px] w-full focus-visible:border-orange-500 focus-visible:ring-orange-500/30">
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                            <SelectContent>
                              {FORMAS_PAGAMENTO.map((fp) => (
                                <SelectItem key={fp.value} value={fp.value}>
                                  {fp.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column — Live Preview */}
        <div className="lg:sticky lg:top-8 space-y-6 h-fit">
          <Card className="border-border/50 bg-card/50 rounded-2xl">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-orange-500" />
                <CardTitle className="text-base">Pré-visualização</CardTitle>
              </div>
              <CardDescription>Resumo da promoção</CardDescription>
            </CardHeader>
            <Separator />
            <CardContent className="pt-6 space-y-5">
              {/* Nome da promoção */}
              <div className="text-center">
                <p className="text-lg font-semibold">
                  {form.nome || "Nome da Promoção"}
                </p>
                {form.subtema && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {form.subtema}
                  </p>
                )}
              </div>

              {/* Cliente */}
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1.5">
                  Cliente
                </p>
                <div className="flex items-center gap-2">
                  <Users className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-sm">
                    {form.cliente
                      ? clientes.find((c) => c.id === form.cliente)?.name || "Nenhum selecionado"
                      : "Nenhum selecionado"}
                  </span>
                </div>
              </div>

              {/* Período */}
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1.5">
                  Período
                </p>
                <div className="flex items-center gap-2">
                  <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-sm">
                    {form.dataInicio && form.dataFim
                      ? `${new Date(form.dataInicio + "T12:00:00").toLocaleDateString("pt-BR")} — ${new Date(form.dataFim + "T12:00:00").toLocaleDateString("pt-BR")}`
                      : "Período não definido"}
                  </span>
                </div>
              </div>

              {/* Produtos */}
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1.5">
                  Produtos
                </p>
                <div className="flex items-center gap-2">
                  <ShoppingBag className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-sm">
                    {form.produtos.length === 0
                      ? "Nenhum produto"
                      : `${form.produtos.length} produto${form.produtos.length > 1 ? "s" : ""}`}
                  </span>
                </div>
                {form.produtos.length > 0 && (
                  <div className="mt-2 space-y-1.5">
                    {form.produtos.map((p) => (
                      <div
                        key={p.id}
                        className="flex items-center justify-between text-xs rounded-md bg-muted/30 border border-border/30 px-3 py-2"
                      >
                        <span className="truncate max-w-[160px]">
                          {p.nome || "Sem nome"}
                        </span>
                        {p.preco && (
                          <span className="font-medium text-orange-500 ml-2 whitespace-nowrap">
                            R$ {Number(p.preco).toFixed(2).replace(".", ",")}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Selo Preview */}
              {form.seloUrl && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2.5">
                    Selo Promocional
                  </p>
                  <div className="flex items-center justify-center rounded-xl bg-muted/30 border border-border/30 p-4">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={form.seloUrl}
                      alt="Selo preview"
                      className="max-h-[80px] max-w-full object-contain"
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col gap-3">
            <Button
              onClick={handleSave}
              disabled={saving || !form.nome.trim()}
              className="h-[42px] w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 text-white shadow-lg shadow-orange-500/20 hover:shadow-orange-500/30 border-0 rounded-xl font-medium"
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Salvar Alterações
                </>
              )}
            </Button>
            <Link href="/promocoes" className="w-full">
              <Button
                variant="outline"
                className="h-[42px] w-full border-border/50 hover:border-orange-500/30 hover:bg-orange-500/5 rounded-xl"
              >
                Cancelar
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
