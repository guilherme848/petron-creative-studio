"use client";

import { useState, useRef, useCallback, useEffect } from "react";
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
  Check,
  Loader2,
  Search,
  Type,
} from "lucide-react";
import { toast } from "sonner";
import { TIPOS_PRECO, UNIDADES, FORMAS_PAGAMENTO, FORMATOS_EXPORTACAO } from "@/lib/constants";

// -- Types for fetched data ---------------------------------------------------

interface ClienteFonts {
  title: string | null;
  price: string | null;
  description: string | null;
}

interface ClienteAPI {
  id: string;
  nome: string;
  segment: string | null;
  service: string | null;
  phone: string | null;
  address: string | null;
  logoUrl: string | null;
  cores: string[];
  fonts: ClienteFonts;
}

// Serviços que incluem tráfego pago
const SERVICOS_TRAFEGO = ["Start", "Growth", "Performance", "Escala", "Ouro", "Diamante"];

function hasTrafegoPago(service: string | null): boolean {
  if (!service) return false;
  return SERVICOS_TRAFEGO.some((s) => service.toLowerCase() === s.toLowerCase());
}

interface ProdutoAPI {
  id: string;
  name: string;
  image_url: string | null;
  image_treated_url: string | null;
  category: string | null;
}

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
  cta: string;
  // Info de contato no criativo
  showPhone: boolean;
  phoneOverride: string;
  showAddress: boolean;
  addressOverride: string;
  // Step 4+
  formato: string;
}

interface VariationResult {
  url: string;
  blob: Blob;
  variation: number;
}

interface BatchProduct {
  id: string;
  name: string;
  spec: string;
  imageUrl: string | null;
  price: string;
  previousPrice: string;
  priceType: string;
  unit: string;
  condition: string;
}

interface BatchResult {
  product: BatchProduct;
  url: string;
  blob: Blob;
}

const STEPS = [
  { num: 1, label: "Cliente" },
  { num: 2, label: "Promoção" },
  { num: 3, label: "Produto" },
  { num: 4, label: "Estilos" },
  { num: 5, label: "Lote" },
  { num: 6, label: "Exportar" },
];

// -- Component ----------------------------------------------------------------

export default function CriarPage() {
  const [step, setStep] = useState(1);
  const [clientes, setClientes] = useState<ClienteAPI[]>([]);
  const [loadingClientes, setLoadingClientes] = useState(true);
  const [produtosCliente, setProdutosCliente] = useState<ProdutoAPI[]>([]);
  const [loadingProdutos, setLoadingProdutos] = useState(false);

  useEffect(() => {
    async function fetchClients() {
      try {
        const res = await fetch("/api/clients");
        if (!res.ok) throw new Error("Erro ao buscar clientes");
        const data = await res.json();
        setClientes(
          data.map((c: {
            id: string;
            name: string;
            segment?: string | null;
            service?: string | null;
            phone?: string | null;
            address?: string | null;
            brand_configs?: {
              logo_url?: string | null;
              colors?: { hex: string }[];
              fonts?: { title?: string | null; price?: string | null; description?: string | null };
            }[];
          }) => ({
            id: c.id,
            nome: c.name,
            segment: c.segment || null,
            service: c.service || null,
            phone: c.phone || null,
            address: c.address || null,
            logoUrl: c.brand_configs?.[0]?.logo_url || null,
            cores: c.brand_configs?.[0]?.colors?.map((cor: { hex: string }) => cor.hex) || ["#F97316", "#FFFFFF", "#333333"],
            fonts: {
              title: c.brand_configs?.[0]?.fonts?.title || null,
              price: c.brand_configs?.[0]?.fonts?.price || null,
              description: c.brand_configs?.[0]?.fonts?.description || null,
            },
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
    cta: "Clique e fale conosco",
    showPhone: true,
    phoneOverride: "",
    showAddress: false,
    addressOverride: "",
    formato: "1080x1080",
  });

  const seloInputRef = useRef<HTMLInputElement>(null);
  const produtoInputRef = useRef<HTMLInputElement>(null);
  const [seloDrag, setSeloDrag] = useState(false);
  const [produtoDrag, setProdutoDrag] = useState(false);
  const [gerandoSelo, setGerandoSelo] = useState(false);
  const [seloPrompt, setSeloPrompt] = useState("");
  const [gerandoCriativo, setGerandoCriativo] = useState(false);
  const [criativoUrl, setCriativoUrl] = useState<string | null>(null);
  const [criativoBlob, setCriativoBlob] = useState<Blob | null>(null);
  const [verificacao, setVerificacao] = useState<{ nota: number; erros: { esperado: string; encontrado: string; tipo: string }[] } | null>(null);
  const [clienteSearch, setClienteSearch] = useState("");
  const [clienteNichoFilter, setClienteNichoFilter] = useState<string>("matcon");
  const [usarProdutoCadastrado, setUsarProdutoCadastrado] = useState(false);

  // Step 4: 3 variações
  const [variations, setVariations] = useState<VariationResult[]>([]);
  const [gerandoVariacoes, setGerandoVariacoes] = useState(false);
  const [variacaoProgresso, setVariacaoProgresso] = useState(0);
  const [selectedVariation, setSelectedVariation] = useState<number | null>(null);

  // Step 5: Geração em lote
  const [batchProducts, setBatchProducts] = useState<BatchProduct[]>([]);
  const [batchResults, setBatchResults] = useState<BatchResult[]>([]);
  const [gerandoLote, setGerandoLote] = useState(false);
  const [loteProgresso, setLoteProgresso] = useState(0);
  const [loteTotalItens, setLoteTotalItens] = useState(0);

  const cliente = clientes.find((c) => c.id === state.clienteId);

  // Buscar produtos ao entrar no step 3 ou 5 — do cliente + sem vínculo
  useEffect(() => {
    if ((step === 3 || step === 5) && state.clienteId) {
      async function fetchProducts() {
        setLoadingProdutos(true);
        try {
          // Buscar produtos do cliente E produtos sem vínculo (client_id null)
          const [resClient, resAll] = await Promise.all([
            fetch(`/api/products?client_id=${state.clienteId}`),
            fetch(`/api/products`),
          ]);
          const clientData = resClient.ok ? await resClient.json() : [];
          const allData = resAll.ok ? await resAll.json() : [];

          // Combinar: produtos do cliente + produtos sem vínculo (sem duplicar)
          const clientIds = new Set(clientData.map((p: ProdutoAPI) => p.id));
          const unlinked = allData.filter(
            (p: ProdutoAPI) => !clientIds.has(p.id)
          );
          setProdutosCliente([...clientData, ...unlinked]);
        } catch {
          console.error("Erro ao carregar produtos");
        } finally {
          setLoadingProdutos(false);
        }
      }
      fetchProducts();
    }
  }, [step, state.clienteId]);

  const update = (partial: Partial<CreativeState>) =>
    setState((prev) => ({ ...prev, ...partial }));

  const handleGerarSeloIA = async () => {
    const promptText = seloPrompt.trim() || state.promocaoNome.trim();
    if (!promptText) return;

    setGerandoSelo(true);
    try {
      const colors = cliente?.cores || ["#F97316", "#FFFFFF"];
      const res = await fetch("/api/ai/generate-seal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ promotionName: promptText, colors }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Erro ao gerar selo");
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      update({ seloUrl: url });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao gerar selo com IA");
    } finally {
      setGerandoSelo(false);
    }
  };

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

  // Função base para gerar um criativo individual
  const generateSingleCreative = async (
    productName: string,
    productSpec: string | undefined,
    productImageFile: File | null,
    price: string,
    previousPrice: string | undefined,
    priceType: string,
    unitVal: string,
    conditionVal: string,
    styleVariation?: number,
    referenceBlob?: Blob | null,
  ): Promise<{ blob: Blob; url: string }> => {
    const bodyData = {
      clientName: cliente?.nome || "Loja",
      clientColors: cliente?.cores || ["#F97316", "#FFFFFF"],
      clientFonts: cliente?.fonts || null,
      promotionName: state.promocaoNome || "PROMOÇÃO",
      productName,
      productSpec: productSpec || undefined,
      priceType,
      price,
      previousPrice: priceType === "de-por" ? previousPrice : undefined,
      unit: unitVal,
      condition: conditionVal,
      startDate: state.dataInicio || undefined,
      endDate: state.dataFim || undefined,
      format: state.formato,
      cta: state.cta || "Clique e fale conosco",
      phone: state.showPhone ? (state.phoneOverride || cliente?.phone || undefined) : undefined,
      storeAddress: state.showAddress ? (state.addressOverride || cliente?.address || undefined) : undefined,
      clientId: state.clienteId || undefined,
      styleVariation,
    };

    const fd = new FormData();
    fd.append("data", JSON.stringify(bodyData));

    if (cliente?.logoUrl) {
      try {
        const logoRes = await fetch(cliente.logoUrl);
        if (logoRes.ok) {
          const logoBlob = await logoRes.blob();
          fd.append("logo", logoBlob, "logo.png");
        }
      } catch { /* continua sem logo */ }
    }

    if (productImageFile) {
      fd.append("productImage", productImageFile);
    }

    if (referenceBlob) {
      fd.append("referenceImage", referenceBlob, "reference.png");
    }

    const res = await fetch("/api/ai/generate-creative", {
      method: "POST",
      body: fd,
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Erro ao gerar criativo");
    }

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    return { blob, url };
  };

  // Step 4: Gerar 3 variações de estilo
  const handleGerarVariacoes = async () => {
    setGerandoVariacoes(true);
    setVariations([]);
    setSelectedVariation(null);
    setVariacaoProgresso(0);

    const results: VariationResult[] = [];

    for (let v = 1; v <= 3; v++) {
      try {
        setVariacaoProgresso(v);
        const { blob, url } = await generateSingleCreative(
          state.produtoNome,
          state.produtoSpec,
          state.produtoFotoFile,
          state.preco,
          state.precoAnterior,
          state.tipoPreco,
          state.unidade,
          state.condicao,
          v,
        );
        results.push({ url, blob, variation: v });
        setVariations([...results]);
      } catch (err) {
        toast.error(`Erro na variação ${v}: ${err instanceof Error ? err.message : "erro"}`);
      }
    }

    if (results.length > 0) {
      toast.success(`${results.length} variação(ões) gerada(s)!`);
    }
    setGerandoVariacoes(false);
  };

  // Step 5: Gerar em lote
  const handleGerarLote = async () => {
    if (batchProducts.length === 0 || selectedVariation === null) return;

    const refVariation = variations.find((v) => v.variation === selectedVariation);
    if (!refVariation) return;

    setGerandoLote(true);
    setBatchResults([]);
    setLoteProgresso(0);
    setLoteTotalItens(batchProducts.length);

    const results: BatchResult[] = [];

    for (let i = 0; i < batchProducts.length; i++) {
      const product = batchProducts[i];
      setLoteProgresso(i + 1);

      try {
        // Buscar imagem do produto se disponível
        let productFile: File | null = null;
        if (product.imageUrl) {
          try {
            const imgRes = await fetch(product.imageUrl);
            if (imgRes.ok) {
              const imgBlob = await imgRes.blob();
              productFile = new File([imgBlob], "product.png", { type: "image/png" });
            }
          } catch { /* continua sem imagem */ }
        }

        const { blob, url } = await generateSingleCreative(
          product.name,
          product.spec,
          productFile,
          product.price,
          product.priceType === "de-por" ? product.previousPrice : undefined,
          product.priceType,
          product.unit,
          product.condition,
          undefined,
          refVariation.blob,
        );

        results.push({ product, url, blob });
        setBatchResults([...results]);
      } catch (err) {
        toast.error(`Erro em "${product.name}": ${err instanceof Error ? err.message : "erro"}`);
      }
    }

    if (results.length > 0) {
      toast.success(`${results.length} criativo(s) gerado(s) em lote!`);
    }
    setGerandoLote(false);
  };

  // Helper: toggle produto no lote
  const toggleBatchProduct = (product: ProdutoAPI) => {
    setBatchProducts((prev) => {
      const exists = prev.find((p) => p.id === product.id);
      if (exists) return prev.filter((p) => p.id !== product.id);
      return [...prev, {
        id: product.id,
        name: product.name,
        spec: product.category || "",
        imageUrl: product.image_treated_url || product.image_url,
        price: state.preco,
        previousPrice: "",
        priceType: state.tipoPreco,
        unit: state.unidade,
        condition: state.condicao,
      }];
    });
  };

  // Helper: editar campo de um produto do lote
  const updateBatchProduct = (id: string, field: keyof BatchProduct, value: string) => {
    setBatchProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [field]: value } : p))
    );
  };

  // Download individual
  const handleGerarCriativo = handleGerarVariacoes;

  const handleDownload = (blob: Blob, name: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${name}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadAll = () => {
    // Download reference
    const refVar = variations.find((v) => v.variation === selectedVariation);
    if (refVar) {
      handleDownload(refVar.blob, `criativo-${state.produtoNome}-referencia`);
    }
    // Download batch
    batchResults.forEach((r) => {
      setTimeout(() => {
        handleDownload(r.blob, `criativo-${r.product.name}`);
      }, 300);
    });
    toast.success("Downloads iniciados!");
  };

  const canAdvance = () => {
    if (step === 1 && !state.clienteId) return false;
    if (step === 3 && !state.produtoNome.trim()) return false;
    if (step === 4 && selectedVariation === null) return false;
    if (step === 5 && batchResults.length === 0 && !gerandoLote) return false;
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

      {/* Content */}
      <div className="max-w-2xl">
        {/* Left: Steps */}
        <div className="space-y-5">
          {/* Step 1: Cliente */}
          {step === 1 && (() => {
            const isMatCon = (s: string | null) => {
              if (!s) return false;
              const low = s.toLowerCase();
              return low.includes("material") || low.includes("construção") || low.includes("matcon") || low.includes("home center");
            };

            // Base: só clientes com tráfego pago (filtro principal)
            const trafegoClients = clientes.filter((c) => hasTrafegoPago(c.service));
            const conteudoClients = clientes.filter((c) => !hasTrafegoPago(c.service));

            // Filtrar por nicho dentro dos de tráfego
            const nichoFiltered = clienteNichoFilter === "all"
              ? (clienteNichoFilter === "all" ? clientes : trafegoClients)
              : clienteNichoFilter === "matcon"
              ? trafegoClients.filter((c) => isMatCon(c.segment))
              : clienteNichoFilter === "todos-trafego"
              ? trafegoClients
              : clienteNichoFilter === "sem-trafego"
              ? conteudoClients
              : trafegoClients.filter((c) => c.segment === clienteNichoFilter);

            const filtered = nichoFiltered.filter((c) =>
              c.nome.toLowerCase().includes(clienteSearch.toLowerCase())
            );

            const matconTrafegoCount = trafegoClients.filter((c) => isMatCon(c.segment)).length;

            const selectedClient = clientes.find((c) => c.id === state.clienteId);

            return (
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

                {/* Cliente selecionado — card destacado */}
                {selectedClient && (
                  <div className="rounded-xl border-2 border-orange-500 bg-gradient-to-br from-orange-500/5 to-transparent p-4 space-y-3">
                    <div className="flex items-center gap-4">
                      {selectedClient.logoUrl ? (
                        <div className="h-16 w-16 rounded-xl border border-orange-500/20 bg-white flex items-center justify-center overflow-hidden p-1.5 shadow-sm">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={selectedClient.logoUrl} alt={selectedClient.nome} className="max-h-full max-w-full object-contain" />
                        </div>
                      ) : (
                        <div
                          className="flex h-16 w-16 items-center justify-center rounded-xl text-white font-bold text-lg shadow-sm"
                          style={{ backgroundColor: selectedClient.cores[0] }}
                        >
                          {selectedClient.nome.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-base font-bold truncate">{selectedClient.nome}</h4>
                          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-orange-500 text-white shrink-0">
                            <Check className="h-3 w-3" />
                          </div>
                        </div>
                        <div className="flex items-center gap-3 mt-2">
                          <div className="flex gap-1">
                            {selectedClient.cores.map((cor, i) => (
                              <div
                                key={i}
                                className="h-5 w-5 rounded-full border-2 border-white shadow-sm"
                                style={{ backgroundColor: cor }}
                                title={cor}
                              />
                            ))}
                          </div>
                          {selectedClient.fonts.title && (
                            <span className="text-[10px] text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded">
                              {selectedClient.fonts.title}
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => update({ clienteId: "" })}
                        className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-muted/50 transition-colors shrink-0"
                        title="Trocar cliente"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Busca + lista (esconde quando já selecionou, mostra ao clicar X) */}
                {!selectedClient && (
                  <>
                    {loadingClientes ? (
                      <div className="space-y-2">
                        {[1, 2, 3, 4].map((i) => (
                          <div key={i} className="flex items-center gap-3 rounded-lg border border-border/30 p-3 animate-pulse">
                            <div className="h-10 w-10 rounded-lg bg-muted/50" />
                            <div className="flex-1 space-y-1.5">
                              <div className="h-3.5 w-28 rounded bg-muted/50" />
                              <div className="flex gap-1">
                                <div className="h-3 w-3 rounded-full bg-muted/40" />
                                <div className="h-3 w-3 rounded-full bg-muted/40" />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : clientes.length === 0 ? (
                      <div className="text-center py-10">
                        <Users className="h-10 w-10 text-muted-foreground/20 mx-auto mb-3" />
                        <p className="text-sm text-muted-foreground">
                          Nenhum cliente cadastrado.
                        </p>
                      </div>
                    ) : (
                      <>
                        {/* Campo de busca */}
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="Buscar por nome..."
                            value={clienteSearch}
                            onChange={(e) => setClienteSearch(e.target.value)}
                            className="pl-9 h-10"
                            autoFocus
                          />
                          {clienteSearch && (
                            <button
                              type="button"
                              onClick={() => setClienteSearch("")}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>

                        {/* Filtro por serviço/nicho */}
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <button
                            type="button"
                            onClick={() => setClienteNichoFilter("matcon")}
                            className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all ${
                              clienteNichoFilter === "matcon"
                                ? "bg-orange-500 text-white shadow-sm"
                                : "bg-muted/50 text-muted-foreground hover:bg-muted"
                            }`}
                          >
                            MatCon + Tráfego ({matconTrafegoCount})
                          </button>
                          <button
                            type="button"
                            onClick={() => setClienteNichoFilter("todos-trafego")}
                            className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all ${
                              clienteNichoFilter === "todos-trafego"
                                ? "bg-foreground text-background shadow-sm"
                                : "bg-muted/50 text-muted-foreground hover:bg-muted"
                            }`}
                          >
                            Com tráfego ({trafegoClients.length})
                          </button>
                          {conteudoClients.length > 0 && (
                            <button
                              type="button"
                              onClick={() => setClienteNichoFilter("sem-trafego")}
                              className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all ${
                                clienteNichoFilter === "sem-trafego"
                                  ? "bg-foreground text-background shadow-sm"
                                  : "bg-muted/50 text-muted-foreground hover:bg-muted"
                              }`}
                            >
                              Só conteúdo ({conteudoClients.length})
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => setClienteNichoFilter("all")}
                            className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all ${
                              clienteNichoFilter === "all"
                                ? "bg-foreground text-background shadow-sm"
                                : "bg-muted/50 text-muted-foreground hover:bg-muted"
                            }`}
                          >
                            Todos ({clientes.length})
                          </button>
                        </div>

                        {/* Contagem */}
                        <p className="text-[11px] text-muted-foreground">
                          {filtered.length === clientes.length
                            ? `${clientes.length} clientes`
                            : `${filtered.length} de ${clientes.length}`}
                        </p>

                        {/* Lista de clientes */}
                        {filtered.length === 0 ? (
                          <div className="text-center py-8">
                            <Search className="h-8 w-8 text-muted-foreground/20 mx-auto mb-2" />
                            <p className="text-sm text-muted-foreground">
                              Nenhum cliente encontrado.
                            </p>
                          </div>
                        ) : (
                          <div className="relative">
                            <div className="space-y-1 max-h-[340px] overflow-y-auto pr-1 custom-scrollbar">
                              {filtered.map((c) => (
                                <button
                                  key={c.id}
                                  onClick={() => {
                                    update({ clienteId: c.id });
                                    setClienteSearch("");
                                  }}
                                  className="w-full flex items-center gap-3 rounded-lg border border-border/40 p-2.5 text-left transition-all hover:border-orange-500/40 hover:bg-orange-500/[0.03] group"
                                >
                                  {c.logoUrl ? (
                                    <div className="h-9 w-9 rounded-lg border border-border/30 bg-white flex items-center justify-center overflow-hidden p-0.5 shrink-0">
                                      {/* eslint-disable-next-line @next/next/no-img-element */}
                                      <img src={c.logoUrl} alt={c.nome} className="max-h-full max-w-full object-contain" />
                                    </div>
                                  ) : (
                                    <div
                                      className="flex h-9 w-9 items-center justify-center rounded-lg text-white font-bold text-[10px] shrink-0"
                                      style={{ backgroundColor: c.cores[0] }}
                                    >
                                      {c.nome.slice(0, 2).toUpperCase()}
                                    </div>
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <h4 className="text-[13px] font-semibold truncate group-hover:text-orange-500 transition-colors">{c.nome}</h4>
                                    <div className="flex items-center gap-2 mt-0.5">
                                      <div className="flex gap-0.5">
                                        {c.cores.slice(0, 4).map((cor, i) => (
                                          <div
                                            key={i}
                                            className="h-2.5 w-2.5 rounded-full border border-border/40"
                                            style={{ backgroundColor: cor }}
                                          />
                                        ))}
                                      </div>
                                      {c.service && (
                                        <span className={`text-[10px] truncate ${hasTrafegoPago(c.service) ? "text-orange-500/70" : "text-muted-foreground"}`}>
                                          {c.service}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/20 group-hover:text-orange-500/50 transition-colors shrink-0" />
                                </button>
                              ))}
                            </div>
                            {/* Fade bottom para indicar mais itens */}
                            {filtered.length > 6 && (
                              <div className="absolute bottom-0 inset-x-0 h-8 bg-gradient-to-t from-card/80 to-transparent pointer-events-none rounded-b-xl" />
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
            );
          })()}

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
                      <div className="space-y-3">
                        <Input
                          placeholder={state.promocaoNome || "Descreva o selo — Ex: Queima de Estoque com efeito de fogo"}
                          className="h-[42px]"
                          value={seloPrompt}
                          onChange={(e) => setSeloPrompt(e.target.value)}
                        />
                        <Button
                          onClick={handleGerarSeloIA}
                          disabled={gerandoSelo || (!seloPrompt.trim() && !state.promocaoNome.trim())}
                          className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white border-0 btn-micro"
                        >
                          {gerandoSelo ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                              Gerando selo...
                            </>
                          ) : (
                            <>
                              <Sparkles className="h-4 w-4 mr-2" />
                              Gerar Selo com IA
                            </>
                          )}
                        </Button>
                        {state.seloUrl && (
                          <div className="relative group">
                            <img
                              src={state.seloUrl}
                              alt="Selo gerado"
                              className="max-h-32 mx-auto object-contain"
                            />
                          </div>
                        )}
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
                {/* Toggle: produto cadastrado ou novo */}
                <div className="flex items-center gap-2 p-1 rounded-lg bg-muted/50">
                  <button
                    type="button"
                    onClick={() => setUsarProdutoCadastrado(false)}
                    className={`flex-1 px-3 py-2 rounded-md text-xs font-medium transition-all ${
                      !usarProdutoCadastrado
                        ? "bg-background shadow-sm text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Criar do zero
                  </button>
                  <button
                    type="button"
                    onClick={() => setUsarProdutoCadastrado(true)}
                    className={`flex-1 px-3 py-2 rounded-md text-xs font-medium transition-all ${
                      usarProdutoCadastrado
                        ? "bg-background shadow-sm text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Usar cadastrado ({produtosCliente.length})
                  </button>
                </div>

                {usarProdutoCadastrado ? (
                  <>
                    {loadingProdutos ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                        <span className="ml-2 text-sm text-muted-foreground">Buscando produtos...</span>
                      </div>
                    ) : produtosCliente.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-6">
                        Nenhum produto cadastrado para este cliente.
                      </p>
                    ) : (
                      <div className="grid gap-2 max-h-[250px] overflow-y-auto">
                        {produtosCliente.map((p) => {
                          const isSelected = state.produtoNome === p.name;
                          return (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => {
                                const imageUrl = p.image_treated_url || p.image_url;
                                update({
                                  produtoNome: p.name,
                                  produtoSpec: p.category || "",
                                  produtoFotoUrl: imageUrl,
                                  produtoFotoFile: null,
                                });
                                // Fetch the image as a File to send to AI
                                if (imageUrl) {
                                  fetch(imageUrl)
                                    .then((r) => r.blob())
                                    .then((blob) => {
                                      const file = new File([blob], "product.png", { type: "image/png" });
                                      update({ produtoFotoFile: file });
                                    })
                                    .catch(() => {});
                                }
                              }}
                              className={`flex items-center gap-3 p-3 rounded-lg border text-left transition-all ${
                                isSelected
                                  ? "border-orange-500 bg-orange-500/5 shadow-sm"
                                  : "border-border/50 hover:border-orange-500/30"
                              }`}
                            >
                              {(p.image_treated_url || p.image_url) ? (
                                <div className="h-12 w-12 rounded-lg border border-border/30 bg-muted/20 flex items-center justify-center overflow-hidden p-1 shrink-0">
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img src={p.image_treated_url || p.image_url || ""} alt={p.name} className="max-h-full max-w-full object-contain" />
                                </div>
                              ) : (
                                <div className="h-12 w-12 rounded-lg bg-muted/30 flex items-center justify-center shrink-0">
                                  <Package className="h-5 w-5 text-muted-foreground/50" />
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{p.name}</p>
                                {p.category && <p className="text-xs text-muted-foreground">{p.category}</p>}
                              </div>
                              {isSelected && (
                                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-orange-500 text-white shrink-0">
                                  <Check className="h-3 w-3" />
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </>
                ) : (
                  <>
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
                  </>
                )}

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
                        {FORMAS_PAGAMENTO.map((c) => (
                          <SelectItem key={c} value={c}>
                            {c}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Separator />

                {/* CTA */}
                <div className="space-y-2">
                  <Label>Texto do botão (CTA)</Label>
                  <Select
                    value={state.cta}
                    onValueChange={(val) => update({ cta: val ?? "" })}
                  >
                    <SelectTrigger className="h-[42px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Clique e fale conosco">Clique e fale conosco</SelectItem>
                      <SelectItem value="Clique e faça seu orçamento">Clique e faça seu orçamento</SelectItem>
                      <SelectItem value="Fale conosco pelo WhatsApp">Fale conosco pelo WhatsApp</SelectItem>
                      <SelectItem value="Peça já seu orçamento">Peça já seu orçamento</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                {/* Telefone no criativo */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Telefone no criativo</Label>
                    <button
                      type="button"
                      onClick={() => update({ showPhone: !state.showPhone })}
                      className={`relative w-9 h-5 rounded-full transition-colors ${state.showPhone ? "bg-orange-500" : "bg-muted"}`}
                    >
                      <div className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${state.showPhone ? "translate-x-4" : "translate-x-0.5"}`} />
                    </button>
                  </div>
                  {state.showPhone && (
                    <div className="space-y-1.5">
                      {cliente?.phone && (
                        <button
                          type="button"
                          onClick={() => update({ phoneOverride: cliente.phone || "" })}
                          className={`w-full text-left px-3 py-2 rounded-lg border text-xs transition-all ${
                            state.phoneOverride === cliente.phone
                              ? "border-orange-500/50 bg-orange-500/5"
                              : "border-border/40 hover:border-orange-500/30"
                          }`}
                        >
                          <span className="text-muted-foreground">Cadastrado:</span>{" "}
                          <span className="font-medium">{cliente.phone}</span>
                        </button>
                      )}
                      <Input
                        placeholder="Ou digite outro número..."
                        value={state.phoneOverride}
                        onChange={(e) => update({ phoneOverride: e.target.value })}
                        className="h-9 text-xs"
                      />
                      <p className="text-[10px] text-muted-foreground">Aparece próximo ao botão de WhatsApp</p>
                    </div>
                  )}
                </div>

                {/* Endereço no criativo */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Endereço no criativo</Label>
                    <button
                      type="button"
                      onClick={() => update({ showAddress: !state.showAddress })}
                      className={`relative w-9 h-5 rounded-full transition-colors ${state.showAddress ? "bg-orange-500" : "bg-muted"}`}
                    >
                      <div className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${state.showAddress ? "translate-x-4" : "translate-x-0.5"}`} />
                    </button>
                  </div>
                  {state.showAddress && (
                    <div className="space-y-1.5">
                      {cliente?.address && (
                        <button
                          type="button"
                          onClick={() => update({ addressOverride: cliente.address || "" })}
                          className={`w-full text-left px-3 py-2 rounded-lg border text-xs transition-all ${
                            state.addressOverride === cliente.address
                              ? "border-orange-500/50 bg-orange-500/5"
                              : "border-border/40 hover:border-orange-500/30"
                          }`}
                        >
                          <span className="text-muted-foreground">Cadastrado:</span>{" "}
                          <span className="font-medium">{cliente.address}</span>
                        </button>
                      )}
                      <Input
                        placeholder="Ou digite outro endereço..."
                        value={state.addressOverride}
                        onChange={(e) => update({ addressOverride: e.target.value })}
                        className="h-9 text-xs"
                      />
                      <p className="text-[10px] text-muted-foreground">Aparece no rodapé do criativo</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 4: Gerar 3 variações e escolher */}
          {step === 4 && (
            <Card className="rounded-2xl border-border/50 bg-card/80 animate-fade-in">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-base">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500/10">
                    <Sparkles className="h-4 w-4 text-orange-500" />
                  </div>
                  Escolher Estilo
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Formato</Label>
                  <Select
                    value={state.formato}
                    onValueChange={(val) => update({ formato: val ?? "" })}
                  >
                    <SelectTrigger className="h-[42px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FORMATOS_EXPORTACAO.map((f) => (
                        <SelectItem key={f.value} value={f.value}>
                          {f.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  className="w-full h-12 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white border-0 btn-micro"
                  onClick={handleGerarVariacoes}
                  disabled={gerandoVariacoes}
                >
                  {gerandoVariacoes ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Gerando variação {variacaoProgresso}/3...
                    </>
                  ) : variations.length > 0 ? (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Gerar novamente (3 estilos)
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Gerar 3 estilos diferentes
                    </>
                  )}
                </Button>

                {/* Progresso */}
                {gerandoVariacoes && (
                  <div className="w-full bg-muted/30 rounded-full h-2">
                    <div
                      className="bg-orange-500 h-2 rounded-full transition-all"
                      style={{ width: `${(variacaoProgresso / 3) * 100}%` }}
                    />
                  </div>
                )}

                {/* Grid de 3 variações */}
                {variations.length > 0 && (
                  <>
                    <p className="text-sm text-muted-foreground">
                      Escolha o estilo que será usado como referência para gerar os demais criativos:
                    </p>
                    <div className="grid gap-3 grid-cols-3">
                      {variations.map((v) => (
                        <button
                          key={v.variation}
                          type="button"
                          onClick={() => setSelectedVariation(v.variation)}
                          className={`relative rounded-xl overflow-hidden border-2 transition-all ${
                            selectedVariation === v.variation
                              ? "border-orange-500 shadow-lg shadow-orange-500/20 scale-[1.02]"
                              : "border-border/50 hover:border-orange-500/40"
                          }`}
                        >
                          <img
                            src={v.url}
                            alt={`Estilo ${v.variation}`}
                            className="w-full aspect-square object-cover"
                          />
                          {selectedVariation === v.variation && (
                            <div className="absolute top-2 right-2 flex h-6 w-6 items-center justify-center rounded-full bg-orange-500 text-white shadow-lg">
                              <Check className="h-3.5 w-3.5" />
                            </div>
                          )}
                          <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                            <span className="text-white text-xs font-medium">Estilo {v.variation}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                    {selectedVariation && (
                      <p className="text-xs text-center text-orange-500 font-medium">
                        Estilo {selectedVariation} selecionado como referência
                      </p>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* Step 5: Geração em Lote */}
          {step === 5 && (
            <Card className="rounded-2xl border-border/50 bg-card/80 animate-fade-in">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-base">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500/10">
                    <Package className="h-4 w-4 text-orange-500" />
                  </div>
                  Geração em Lote
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Selecione os produtos para gerar criativos seguindo o estilo escolhido. Cada produto será gerado com o mesmo layout de referência.
                </p>

                {/* Seleção de produtos */}
                {loadingProdutos ? (
                  <div className="flex items-center justify-center py-6">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : produtosCliente.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">
                    Nenhum produto cadastrado para este cliente.
                  </p>
                ) : (
                  <>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{batchProducts.length} produto(s) selecionado(s)</span>
                      <div className="flex gap-2">
                        {[5, 10, 20].map((n) => (
                          <button
                            key={n}
                            type="button"
                            onClick={() => {
                              const prods = produtosCliente.slice(0, n).map((p) => ({
                                id: p.id,
                                name: p.name,
                                spec: p.category || "",
                                imageUrl: p.image_treated_url || p.image_url,
                                price: state.preco,
                                previousPrice: "",
                                priceType: state.tipoPreco,
                                unit: state.unidade,
                                condition: state.condicao,
                              }));
                              setBatchProducts(prods);
                            }}
                            className="text-orange-500 hover:text-orange-400 font-medium"
                          >
                            Top {n}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Lista para selecionar produtos */}
                    <div className="grid gap-1.5 max-h-[200px] overflow-y-auto">
                      {produtosCliente.map((p) => {
                        const isSelected = batchProducts.some((bp) => bp.id === p.id);
                        return (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => toggleBatchProduct(p)}
                            className={`flex items-center gap-2.5 p-2 rounded-lg border text-left transition-all text-xs ${
                              isSelected
                                ? "border-orange-500/50 bg-orange-500/5"
                                : "border-border/40 hover:border-border"
                            }`}
                          >
                            <div
                              className={`flex h-4 w-4 items-center justify-center rounded border shrink-0 transition-colors ${
                                isSelected ? "border-orange-500 bg-orange-500 text-white" : "border-border"
                              }`}
                            >
                              {isSelected && <Check className="h-2.5 w-2.5" />}
                            </div>
                            {(p.image_treated_url || p.image_url) ? (
                              <div className="h-8 w-8 rounded border border-border/30 bg-muted/20 flex items-center justify-center overflow-hidden p-0.5 shrink-0">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={p.image_treated_url || p.image_url || ""} alt={p.name} className="max-h-full max-w-full object-contain" />
                              </div>
                            ) : (
                              <div className="h-8 w-8 rounded bg-muted/30 flex items-center justify-center shrink-0">
                                <Package className="h-3.5 w-3.5 text-muted-foreground/50" />
                              </div>
                            )}
                            <span className="font-medium truncate">{p.name}</span>
                            {p.category && <span className="text-muted-foreground ml-auto shrink-0">{p.category}</span>}
                          </button>
                        );
                      })}
                    </div>

                    {/* Tabela editável dos produtos selecionados */}
                    {batchProducts.length > 0 && (
                      <div className="space-y-2">
                        <Separator />
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                          Editar detalhes ({batchProducts.length} produto{batchProducts.length > 1 ? "s" : ""})
                        </p>
                        <div className="space-y-3 max-h-[350px] overflow-y-auto">
                          {batchProducts.map((bp, idx) => (
                            <div key={bp.id} className="rounded-xl border border-border/50 p-3 space-y-2.5">
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold text-orange-500 bg-orange-500/10 px-1.5 py-0.5 rounded">{idx + 1}</span>
                                <span className="text-sm font-semibold truncate flex-1">{bp.name}</span>
                                <button
                                  type="button"
                                  onClick={() => setBatchProducts((prev) => prev.filter((p) => p.id !== bp.id))}
                                  className="text-muted-foreground hover:text-destructive p-0.5"
                                >
                                  <X className="h-3.5 w-3.5" />
                                </button>
                              </div>
                              <div className="grid gap-2 grid-cols-2">
                                <div>
                                  <label className="text-[10px] text-muted-foreground font-medium">Tipo preço</label>
                                  <Select
                                    value={bp.priceType}
                                    onValueChange={(val) => updateBatchProduct(bp.id, "priceType", val ?? "")}
                                  >
                                    <SelectTrigger className="h-8 text-xs mt-0.5">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {TIPOS_PRECO.map((t) => (
                                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div>
                                  <label className="text-[10px] text-muted-foreground font-medium">Preço</label>
                                  <Input
                                    value={bp.price}
                                    onChange={(e) => updateBatchProduct(bp.id, "price", e.target.value)}
                                    placeholder="29,90"
                                    className="h-8 text-xs font-bold mt-0.5"
                                  />
                                </div>
                              </div>
                              {bp.priceType === "de-por" && (
                                <div>
                                  <label className="text-[10px] text-muted-foreground font-medium">Preço anterior (De)</label>
                                  <Input
                                    value={bp.previousPrice}
                                    onChange={(e) => updateBatchProduct(bp.id, "previousPrice", e.target.value)}
                                    placeholder="49,90"
                                    className="h-8 text-xs mt-0.5"
                                  />
                                </div>
                              )}
                              <div className="grid gap-2 grid-cols-2">
                                <div>
                                  <label className="text-[10px] text-muted-foreground font-medium">Unidade</label>
                                  <Select
                                    value={bp.unit}
                                    onValueChange={(val) => updateBatchProduct(bp.id, "unit", val ?? "")}
                                  >
                                    <SelectTrigger className="h-8 text-xs mt-0.5">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {UNIDADES.map((u) => (
                                        <SelectItem key={u} value={u}>{u}</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div>
                                  <label className="text-[10px] text-muted-foreground font-medium">Condição</label>
                                  <Select
                                    value={bp.condition}
                                    onValueChange={(val) => updateBatchProduct(bp.id, "condition", val ?? "")}
                                  >
                                    <SelectTrigger className="h-8 text-xs mt-0.5">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {FORMAS_PAGAMENTO.map((f) => (
                                        <SelectItem key={f} value={f}>{f}</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* Botão gerar lote */}
                <Button
                  className="w-full h-12 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white border-0 btn-micro"
                  onClick={handleGerarLote}
                  disabled={gerandoLote || batchProducts.length === 0}
                >
                  {gerandoLote ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Gerando {loteProgresso}/{loteTotalItens}...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Gerar {batchProducts.length} criativo(s) em lote
                    </>
                  )}
                </Button>

                {/* Progresso do lote */}
                {gerandoLote && (
                  <div className="w-full bg-muted/30 rounded-full h-2">
                    <div
                      className="bg-orange-500 h-2 rounded-full transition-all"
                      style={{ width: `${(loteProgresso / loteTotalItens) * 100}%` }}
                    />
                  </div>
                )}

                {/* Resultados do lote */}
                {batchResults.length > 0 && (
                  <div className="grid gap-3 grid-cols-2 sm:grid-cols-3">
                    {batchResults.map((r) => (
                      <div key={r.product.id} className="rounded-xl overflow-hidden border border-border/50">
                        <img src={r.url} alt={r.product.name} className="w-full aspect-square object-cover" />
                        <div className="p-2 text-center">
                          <p className="text-xs font-medium truncate">{r.product.name}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Step 6: Exportar */}
          {step === 6 && (
            <Card className="rounded-2xl border-border/50 bg-card/80 animate-fade-in">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-base">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500/10">
                    <Download className="h-4 w-4 text-orange-500" />
                  </div>
                  Exportar Criativos
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {(variations.length > 0 || batchResults.length > 0) ? (
                  <>
                    <p className="text-sm text-muted-foreground">
                      {1 + batchResults.length} criativo(s) pronto(s) para download.
                    </p>

                    <Button
                      className="w-full h-12 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white border-0 btn-micro"
                      onClick={handleDownloadAll}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Baixar todos ({1 + batchResults.length} arquivos)
                    </Button>

                    {/* Grid de todos os criativos */}
                    <div className="grid gap-3 grid-cols-2 sm:grid-cols-3">
                      {/* Referência */}
                      {selectedVariation && variations.find((v) => v.variation === selectedVariation) && (
                        <div className="rounded-xl overflow-hidden border-2 border-orange-500/30">
                          <img
                            src={variations.find((v) => v.variation === selectedVariation)!.url}
                            alt="Referência"
                            className="w-full aspect-square object-cover"
                          />
                          <div className="p-2 text-center">
                            <p className="text-xs font-medium truncate">{state.produtoNome}</p>
                            <Badge variant="secondary" className="text-[9px] bg-orange-500/10 text-orange-500 border-0 mt-1">
                              Referência
                            </Badge>
                          </div>
                        </div>
                      )}
                      {/* Lote */}
                      {batchResults.map((r) => (
                        <div key={r.product.id} className="rounded-xl overflow-hidden border border-border/50">
                          <img src={r.url} alt={r.product.name} className="w-full aspect-square object-cover" />
                          <div className="p-2 text-center">
                            <p className="text-xs font-medium truncate">{r.product.name}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <Sparkles className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Volte aos passos anteriores para gerar os criativos.
                    </p>
                  </div>
                )}
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
            {step < 6 ? (
              <Button
                className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white border-0 btn-micro"
                onClick={() => setStep((s) => Math.min(6, s + 1))}
                disabled={!canAdvance()}
              >
                {step === 5 ? "Exportar" : "Próximo"}
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            ) : (
              <div />
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
