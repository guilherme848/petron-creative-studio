"use client";

import { useState, useRef, useCallback } from "react";
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
  ChevronLeft,
  ChevronRight,
  Upload,
  X,
  Download,
  ImagePlus,
  Users,
  Megaphone,
  Package,
  Sparkles,
  Eye,
  Check,
} from "lucide-react";

// -- Mock Data ----------------------------------------------------------------

const CLIENTES = [
  {
    id: "matcon",
    nome: "MatCon",
    cores: ["#E53935", "#FFFFFF", "#333333"],
  },
  {
    id: "lelei",
    nome: "Lelei Telhas",
    cores: ["#D32F2F", "#FFFFFF", "#212121"],
  },
  {
    id: "terraco",
    nome: "Terraço",
    cores: ["#1565C0", "#FFFFFF", "#0D47A1"],
  },
];

const TIPOS_PRECO = [
  { value: "a-partir-de", label: "A PARTIR DE" },
  { value: "por-apenas", label: "POR APENAS" },
  { value: "de-por", label: "DE/POR" },
];

const UNIDADES = ["M²", "UND", "Metro", "Caixa"];
const CONDICOES = ["À vista", "PIX", "Débito", "Dinheiro"];
const FORMATOS = [
  { value: "1080x1080", label: "Feed (1080×1080)" },
  { value: "1080x1350", label: "Feed (1080×1350)" },
  { value: "1080x1920", label: "Stories (1080×1920)" },
];

// -- Types --------------------------------------------------------------------

interface CreativeState {
  // Step 1
  clienteId: string;
  // Step 2
  promocaoNome: string;
  dataInicio: string;
  dataFim: string;
  seloUrl: string | null;
  seloFile: File | null;
  // Step 3
  produtoNome: string;
  produtoSpec: string;
  produtoFotoUrl: string | null;
  produtoFotoFile: File | null;
  tipoPreco: string;
  preco: string;
  precoAnterior: string;
  unidade: string;
  condicao: string;
  // Step 5
  formato: string;
}

const STEPS = [
  { num: 1, label: "Cliente" },
  { num: 2, label: "Promoção" },
  { num: 3, label: "Produto" },
  { num: 4, label: "Preview" },
  { num: 5, label: "Exportar" },
];

// -- Component ----------------------------------------------------------------

export default function CriarPage() {
  const [step, setStep] = useState(1);
  const [state, setState] = useState<CreativeState>({
    clienteId: "",
    promocaoNome: "",
    dataInicio: "",
    dataFim: "",
    seloUrl: null,
    seloFile: null,
    produtoNome: "",
    produtoSpec: "",
    produtoFotoUrl: null,
    produtoFotoFile: null,
    tipoPreco: "a-partir-de",
    preco: "",
    precoAnterior: "",
    unidade: "M²",
    condicao: "À vista",
    formato: "1080x1080",
  });

  const seloInputRef = useRef<HTMLInputElement>(null);
  const produtoInputRef = useRef<HTMLInputElement>(null);
  const [seloDrag, setSeloDrag] = useState(false);
  const [produtoDrag, setProdutoDrag] = useState(false);

  const cliente = CLIENTES.find((c) => c.id === state.clienteId);

  const update = (partial: Partial<CreativeState>) =>
    setState((prev) => ({ ...prev, ...partial }));

  const handleFileUpload = useCallback(
    (field: "seloUrl" | "produtoFotoUrl", fileField: "seloFile" | "produtoFotoFile") =>
      (file: File) => {
        if (!file.type.startsWith("image/")) return;
        const url = URL.createObjectURL(file);
        update({ [field]: url, [fileField]: file });
      },
    []
  );

  const handleDrop = useCallback(
    (field: "seloUrl" | "produtoFotoUrl", fileField: "seloFile" | "produtoFotoFile", setDrag: (v: boolean) => void) =>
      (e: React.DragEvent) => {
        e.preventDefault();
        setDrag(false);
        const file = e.dataTransfer.files[0];
        if (file) handleFileUpload(field, fileField)(file);
      },
    [handleFileUpload]
  );

  const canAdvance = () => {
    if (step === 1 && !state.clienteId) return false;
    if (step === 3 && !state.produtoNome.trim()) return false;
    return true;
  };

  const formatPreco = (valor: string) => {
    if (!valor) return { inteiro: "0", centavos: "00" };
    const parts = valor.replace(",", ".").split(".");
    return {
      inteiro: parts[0] || "0",
      centavos: parts[1]?.slice(0, 2).padEnd(2, "0") || "00",
    };
  };

  const preco = formatPreco(state.preco);
  const tipoLabel = TIPOS_PRECO.find((t) => t.value === state.tipoPreco)?.label || "A PARTIR DE";

  // -- Render -----------------------------------------------------------------

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Criar Criativo</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Monte seu criativo promocional passo a passo.
        </p>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center gap-1">
        {STEPS.map((s, i) => (
          <div key={s.num} className="flex items-center gap-1 flex-1">
            <button
              onClick={() => {
                if (s.num < step) setStep(s.num);
              }}
              className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                s.num === step
                  ? "bg-orange-500 text-white shadow-lg shadow-orange-500/25"
                  : s.num < step
                  ? "bg-orange-500/10 text-orange-500 cursor-pointer hover:bg-orange-500/20"
                  : "bg-muted/50 text-muted-foreground"
              }`}
            >
              {s.num < step ? (
                <Check className="h-3 w-3" />
              ) : (
                <span>{s.num}</span>
              )}
              <span className="hidden sm:inline">{s.label}</span>
            </button>
            {i < STEPS.length - 1 && (
              <div
                className={`h-px flex-1 ${
                  s.num < step ? "bg-orange-500/30" : "bg-border/50"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Content: Form + Preview */}
      <div className="grid gap-6 lg:grid-cols-[1fr_420px]">
        {/* Left: Steps */}
        <div className="space-y-5">
          {/* Step 1: Cliente */}
          {step === 1 && (
            <Card className="rounded-2xl border-border/50 bg-card/80 animate-fade-in">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-base">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500/10">
                    <Users className="h-4 w-4 text-orange-500" />
                  </div>
                  Selecione o Cliente
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Escolha o cliente para aplicar a identidade visual no criativo.
                </p>
                <div className="grid gap-3">
                  {CLIENTES.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => update({ clienteId: c.id })}
                      className={`flex items-center gap-4 rounded-xl border p-4 text-left transition-all ${
                        state.clienteId === c.id
                          ? "border-orange-500 bg-orange-500/5 shadow-sm"
                          : "border-border/50 hover:border-orange-500/30 hover:bg-card/60"
                      }`}
                    >
                      <div
                        className="flex h-12 w-12 items-center justify-center rounded-xl text-white font-bold text-sm"
                        style={{ backgroundColor: c.cores[0] }}
                      >
                        {c.nome.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-semibold">{c.nome}</h4>
                        <div className="flex gap-1 mt-1.5">
                          {c.cores.map((cor, i) => (
                            <div
                              key={i}
                              className="h-4 w-4 rounded-full border border-border/50"
                              style={{ backgroundColor: cor }}
                            />
                          ))}
                        </div>
                      </div>
                      {state.clienteId === c.id && (
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-orange-500 text-white">
                          <Check className="h-3.5 w-3.5" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Promoção */}
          {step === 2 && (
            <Card className="rounded-2xl border-border/50 bg-card/80 animate-fade-in">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-base">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500/10">
                    <Megaphone className="h-4 w-4 text-orange-500" />
                  </div>
                  Configurar Promoção
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Nome da promoção</Label>
                  <Input
                    placeholder="Ex: Queima de Estoque, Liquidação de Pisos"
                    className="h-[42px]"
                    value={state.promocaoNome}
                    onChange={(e) => update({ promocaoNome: e.target.value })}
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Data início</Label>
                    <Input
                      type="date"
                      className="h-[42px]"
                      value={state.dataInicio}
                      onChange={(e) => update({ dataInicio: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Data fim</Label>
                    <Input
                      type="date"
                      className="h-[42px]"
                      value={state.dataFim}
                      onChange={(e) => update({ dataFim: e.target.value })}
                    />
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label>Selo promocional</Label>
                  <Tabs defaultValue="upload">
                    <TabsList className="w-full">
                      <TabsTrigger value="upload" className="flex-1">
                        Upload de selo
                      </TabsTrigger>
                      <TabsTrigger value="ia" className="flex-1">
                        Gerar com IA
                      </TabsTrigger>
                    </TabsList>
                    <TabsContent value="upload" className="mt-3">
                      {!state.seloUrl ? (
                        <div
                          className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 cursor-pointer transition-colors ${
                            seloDrag
                              ? "border-orange-500 bg-orange-500/5"
                              : "border-border/50 hover:border-orange-500/40"
                          }`}
                          onDragOver={(e) => { e.preventDefault(); setSeloDrag(true); }}
                          onDragLeave={() => setSeloDrag(false)}
                          onDrop={handleDrop("seloUrl", "seloFile", setSeloDrag)}
                          onClick={() => seloInputRef.current?.click()}
                        >
                          <input
                            ref={seloInputRef}
                            type="file"
                            accept="image/png"
                            className="hidden"
                            onChange={(e) => {
                              const f = e.target.files?.[0];
                              if (f) handleFileUpload("seloUrl", "seloFile")(f);
                            }}
                          />
                          <Upload className="h-5 w-5 text-orange-500 mb-2" />
                          <p className="text-xs text-muted-foreground">
                            PNG com fundo transparente
                          </p>
                        </div>
                      ) : (
                        <div className="relative group">
                          <img
                            src={state.seloUrl}
                            alt="Selo"
                            className="max-h-32 mx-auto object-contain"
                          />
                          <button
                            onClick={() => update({ seloUrl: null, seloFile: null })}
                            className="absolute top-1 right-1 flex h-6 w-6 items-center justify-center rounded-full bg-destructive text-white opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      )}
                    </TabsContent>
                    <TabsContent value="ia" className="mt-3">
                      <div className="rounded-xl border border-border/50 p-4 text-center">
                        <Sparkles className="h-6 w-6 text-orange-500 mx-auto mb-2" />
                        <p className="text-sm font-medium mb-1">
                          Geração com IA
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Em breve — integração com Google Gemini
                        </p>
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 3: Produto e Oferta */}
          {step === 3 && (
            <Card className="rounded-2xl border-border/50 bg-card/80 animate-fade-in">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-base">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500/10">
                    <Package className="h-4 w-4 text-orange-500" />
                  </div>
                  Produto e Oferta
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>
                      Nome do produto <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      placeholder="Ex: Piso 60x60 Bold"
                      className="h-[42px]"
                      value={state.produtoNome}
                      onChange={(e) => update({ produtoNome: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Especificação</Label>
                    <Input
                      placeholder="Ex: Acetinado retificado"
                      className="h-[42px]"
                      value={state.produtoSpec}
                      onChange={(e) => update({ produtoSpec: e.target.value })}
                    />
                  </div>
                </div>

                {/* Foto do produto */}
                <div className="space-y-2">
                  <Label>Foto do produto</Label>
                  {!state.produtoFotoUrl ? (
                    <div
                      className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 cursor-pointer transition-colors ${
                        produtoDrag
                          ? "border-orange-500 bg-orange-500/5"
                          : "border-border/50 hover:border-orange-500/40"
                      }`}
                      onDragOver={(e) => { e.preventDefault(); setProdutoDrag(true); }}
                      onDragLeave={() => setProdutoDrag(false)}
                      onDrop={handleDrop("produtoFotoUrl", "produtoFotoFile", setProdutoDrag)}
                      onClick={() => produtoInputRef.current?.click()}
                    >
                      <input
                        ref={produtoInputRef}
                        type="file"
                        accept="image/png,image/jpeg"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) handleFileUpload("produtoFotoUrl", "produtoFotoFile")(f);
                        }}
                      />
                      <ImagePlus className="h-5 w-5 text-orange-500 mb-2" />
                      <p className="text-xs text-muted-foreground">
                        Arraste ou clique — PNG ou JPG
                      </p>
                    </div>
                  ) : (
                    <div className="relative group">
                      <img
                        src={state.produtoFotoUrl}
                        alt="Produto"
                        className="max-h-40 mx-auto object-contain rounded-xl border border-border/50"
                      />
                      <button
                        onClick={() => update({ produtoFotoUrl: null, produtoFotoFile: null })}
                        className="absolute top-1 right-1 flex h-6 w-6 items-center justify-center rounded-full bg-destructive text-white opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                </div>

                <Separator />

                {/* Preço */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Tipo de preço</Label>
                    <Select
                      value={state.tipoPreco}
                      onValueChange={(val) => update({ tipoPreco: val ?? "" })}
                    >
                      <SelectTrigger className="h-[42px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TIPOS_PRECO.map((t) => (
                          <SelectItem key={t.value} value={t.value}>
                            {t.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Preço</Label>
                    <Input
                      placeholder="Ex: 15,99"
                      className="h-[42px] text-lg font-bold"
                      value={state.preco}
                      onChange={(e) => update({ preco: e.target.value })}
                    />
                  </div>
                </div>

                {state.tipoPreco === "de-por" && (
                  <div className="space-y-2">
                    <Label>Preço anterior (De)</Label>
                    <Input
                      placeholder="Ex: 29,99"
                      className="h-[42px]"
                      value={state.precoAnterior}
                      onChange={(e) => update({ precoAnterior: e.target.value })}
                    />
                  </div>
                )}

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Unidade</Label>
                    <Select
                      value={state.unidade}
                      onValueChange={(val) => update({ unidade: val ?? "" })}
                    >
                      <SelectTrigger className="h-[42px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {UNIDADES.map((u) => (
                          <SelectItem key={u} value={u}>
                            {u}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Condição</Label>
                    <Select
                      value={state.condicao}
                      onValueChange={(val) => update({ condicao: val ?? "" })}
                    >
                      <SelectTrigger className="h-[42px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CONDICOES.map((c) => (
                          <SelectItem key={c} value={c}>
                            {c}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 4: Preview */}
          {step === 4 && (
            <Card className="rounded-2xl border-border/50 bg-card/80 animate-fade-in">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-base">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500/10">
                    <Eye className="h-4 w-4 text-orange-500" />
                  </div>
                  Preview do Criativo
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Confira o criativo gerado ao lado. Volte aos passos anteriores
                  para ajustar qualquer detalhe.
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-border/50 p-3 space-y-1">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Cliente
                    </p>
                    <p className="text-sm font-semibold">{cliente?.nome || "—"}</p>
                  </div>
                  <div className="rounded-xl border border-border/50 p-3 space-y-1">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Promoção
                    </p>
                    <p className="text-sm font-semibold">
                      {state.promocaoNome || "—"}
                    </p>
                  </div>
                  <div className="rounded-xl border border-border/50 p-3 space-y-1">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Produto
                    </p>
                    <p className="text-sm font-semibold">
                      {state.produtoNome || "—"}
                    </p>
                  </div>
                  <div className="rounded-xl border border-border/50 p-3 space-y-1">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Preço
                    </p>
                    <p className="text-sm font-semibold">
                      R$ {state.preco || "0,00"} {state.unidade}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 5: Exportar */}
          {step === 5 && (
            <Card className="rounded-2xl border-border/50 bg-card/80 animate-fade-in">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-base">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500/10">
                    <Download className="h-4 w-4 text-orange-500" />
                  </div>
                  Exportar Criativo
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Formato de exportação</Label>
                  <Select
                    value={state.formato}
                    onValueChange={(val) => update({ formato: val ?? "" })}
                  >
                    <SelectTrigger className="h-[42px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FORMATOS.map((f) => (
                        <SelectItem key={f.value} value={f.value}>
                          {f.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <Button
                    className="h-12 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white border-0 btn-micro"
                    onClick={() => alert("Exportação em PNG disponível em breve!")}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Baixar PNG
                  </Button>
                  <Button
                    variant="outline"
                    className="h-12 btn-micro"
                    onClick={() => alert("Exportação em JPG disponível em breve!")}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Baixar JPG
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Navigation */}
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={() => setStep((s) => Math.max(1, s - 1))}
              disabled={step === 1}
              className="btn-micro"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Voltar
            </Button>
            {step < 5 ? (
              <Button
                className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white border-0 btn-micro"
                onClick={() => setStep((s) => Math.min(5, s + 1))}
                disabled={!canAdvance()}
              >
                Próximo
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            ) : (
              <div />
            )}
          </div>
        </div>

        {/* Right: Live Preview */}
        <div className="lg:sticky lg:top-[76px] lg:self-start">
          <Card className="rounded-2xl border-border/50 bg-card/80 overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                Preview ao vivo
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Creative Preview */}
              <div
                className="relative w-full overflow-hidden rounded-xl border border-border/50"
                style={{ aspectRatio: "1 / 1" }}
              >
                {/* Background */}
                <div
                  className="absolute inset-0"
                  style={{
                    background: cliente
                      ? `linear-gradient(135deg, ${cliente.cores[0]} 0%, ${cliente.cores[0]} 45%, ${cliente.cores[1]} 45%, ${cliente.cores[1]} 100%)`
                      : "linear-gradient(135deg, #F97316 0%, #F97316 45%, #FFFFFF 45%, #FFFFFF 100%)",
                  }}
                />

                {/* Content */}
                <div className="relative z-10 flex flex-col h-full p-[8%]">
                  {/* Topo: Selo / Nome da promoção */}
                  <div className="text-center mb-[4%]">
                    {state.seloUrl ? (
                      <img
                        src={state.seloUrl}
                        alt="Selo"
                        className="max-h-[25%] mx-auto object-contain drop-shadow-lg"
                      />
                    ) : state.promocaoNome ? (
                      <div className="inline-block">
                        <p
                          className="text-white font-black uppercase tracking-tight drop-shadow-lg"
                          style={{ fontSize: "clamp(10px, 4vw, 22px)" }}
                        >
                          {state.promocaoNome}
                        </p>
                      </div>
                    ) : (
                      <p
                        className="text-white/60 font-bold uppercase"
                        style={{ fontSize: "clamp(8px, 3vw, 16px)" }}
                      >
                        Nome da promoção
                      </p>
                    )}
                  </div>

                  {/* Logo do cliente */}
                  <div className="text-center mb-[4%]">
                    {cliente ? (
                      <div
                        className="inline-flex h-[8%] min-h-[24px] items-center justify-center rounded px-2 text-white font-bold"
                        style={{
                          backgroundColor: cliente.cores[2] || "#333",
                          fontSize: "clamp(6px, 2vw, 11px)",
                        }}
                      >
                        {cliente.nome}
                      </div>
                    ) : (
                      <div className="inline-block rounded bg-white/20 px-2 py-0.5">
                        <span
                          className="text-white/50 font-medium"
                          style={{ fontSize: "clamp(6px, 2vw, 10px)" }}
                        >
                          Logo do cliente
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Corpo: Produto + Preço + Foto */}
                  <div className="flex-1 flex items-center gap-[4%]">
                    {/* Esquerda: Info do produto */}
                    <div className="flex-1 space-y-[3%]">
                      <div>
                        <p
                          className="font-black uppercase text-[#1a1a1a] leading-tight"
                          style={{ fontSize: "clamp(9px, 3.5vw, 18px)" }}
                        >
                          {state.produtoNome || "PRODUTO"}
                        </p>
                        {state.produtoSpec && (
                          <p
                            className="text-[#333] font-medium"
                            style={{ fontSize: "clamp(6px, 2vw, 11px)" }}
                          >
                            {state.produtoSpec}
                          </p>
                        )}
                      </div>

                      {/* Tag de preço */}
                      <div
                        className="inline-block rounded px-1.5 py-0.5"
                        style={{
                          backgroundColor: cliente?.cores[0] || "#F97316",
                          fontSize: "clamp(5px, 1.8vw, 9px)",
                        }}
                      >
                        <span className="text-white font-bold uppercase tracking-wide">
                          {tipoLabel}
                        </span>
                      </div>

                      {/* Preço anterior (De/Por) */}
                      {state.tipoPreco === "de-por" && state.precoAnterior && (
                        <p
                          className="text-[#666] line-through"
                          style={{ fontSize: "clamp(6px, 2vw, 11px)" }}
                        >
                          De R${state.precoAnterior}
                        </p>
                      )}

                      {/* Preço */}
                      <div className="flex items-start gap-0.5">
                        <span
                          className="font-black text-[#1a1a1a] leading-none"
                          style={{ fontSize: "clamp(20px, 8vw, 42px)" }}
                        >
                          {preco.inteiro}
                        </span>
                        <span
                          className="font-bold text-[#1a1a1a]"
                          style={{
                            fontSize: "clamp(8px, 3vw, 18px)",
                            marginTop: "2%",
                          }}
                        >
                          ,{preco.centavos}
                        </span>
                      </div>

                      <p
                        className="font-semibold text-[#444]"
                        style={{ fontSize: "clamp(5px, 1.8vw, 10px)" }}
                      >
                        {state.unidade} {state.condicao.toUpperCase()}
                      </p>
                    </div>

                    {/* Direita: Foto do produto */}
                    <div className="w-[42%] aspect-square flex items-center justify-center">
                      {state.produtoFotoUrl ? (
                        <img
                          src={state.produtoFotoUrl}
                          alt="Produto"
                          className="w-full h-full object-contain drop-shadow-xl"
                        />
                      ) : (
                        <div className="w-full h-full rounded-lg bg-white/40 border border-white/30 flex items-center justify-center">
                          <ImagePlus
                            className="text-white/40"
                            style={{
                              width: "clamp(16px, 5vw, 32px)",
                              height: "clamp(16px, 5vw, 32px)",
                            }}
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Rodapé: Validade */}
                  <div className="mt-auto pt-[3%]">
                    <div
                      className="flex items-center justify-center gap-1 rounded py-1 px-2"
                      style={{
                        backgroundColor: cliente?.cores[0] || "#F97316",
                        fontSize: "clamp(5px, 1.6vw, 9px)",
                      }}
                    >
                      <span className="text-white font-semibold">
                        {state.dataInicio && state.dataFim
                          ? `Ofertas válidas de ${new Date(state.dataInicio + "T12:00:00").toLocaleDateString("pt-BR", { day: "numeric", month: "long" })} a ${new Date(state.dataFim + "T12:00:00").toLocaleDateString("pt-BR", { day: "numeric", month: "long" })}`
                          : "Ofertas válidas de __ a __"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Disclaimer lateral */}
                <div
                  className="absolute right-1 top-1/2 -translate-y-1/2 -rotate-90 whitespace-nowrap text-[#999]"
                  style={{ fontSize: "clamp(3px, 1vw, 6px)" }}
                >
                  IMAGEM MERAMENTE ILUSTRATIVA
                </div>
              </div>

              {/* Info do formato */}
              <div className="flex items-center justify-between mt-3">
                <Badge
                  variant="secondary"
                  className="text-[10px] bg-orange-500/10 text-orange-600 border-0"
                >
                  {state.formato}
                </Badge>
                <span className="text-[10px] text-muted-foreground">
                  Preview em tempo real
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
