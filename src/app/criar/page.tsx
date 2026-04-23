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
  Pencil,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { TIPOS_PRECO, UNIDADES, FORMAS_PAGAMENTO, FORMATOS_EXPORTACAO, CATEGORIAS_MATCON, CATEGORIAS } from "@/lib/constants";
import { STYLE_WAVES, STYLE_SHORT_NAMES } from "@/lib/style-families";

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
  subcategory: string | null;
  brand: string | null;
  unit: string | null;
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
  orientacoes: string;
}

interface VariationResult {
  url: string;
  blob: Blob;
  variation: number;
  creativeId: string | null;
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
  creativeId: string | null;
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
    orientacoes: "",
  });

  const seloInputRef = useRef<HTMLInputElement>(null);
  const produtoInputRef = useRef<HTMLInputElement>(null);
  const [seloDrag, setSeloDrag] = useState(false);
  const [produtoDrag, setProdutoDrag] = useState(false);
  const [gerandoCriativo, setGerandoCriativo] = useState(false);
  const [criativoUrl, setCriativoUrl] = useState<string | null>(null);
  const [criativoBlob, setCriativoBlob] = useState<Blob | null>(null);
  const [verificacao, setVerificacao] = useState<{ nota: number; erros: { esperado: string; encontrado: string; tipo: string }[] } | null>(null);
  const [clienteSearch, setClienteSearch] = useState("");
  const [clienteNichoFilter, setClienteNichoFilter] = useState<string>("matcon");
  const [usarProdutoCadastrado, setUsarProdutoCadastrado] = useState(false);
  const [salvarProdutoNoBanco, setSalvarProdutoNoBanco] = useState(false);
  const [salvandoProduto, setSalvandoProduto] = useState(false);
  const [showSalvarModal, setShowSalvarModal] = useState(false);
  const [salvarCategoria, setSalvarCategoria] = useState("");
  const [salvarSubcategoria, setSalvarSubcategoria] = useState("");
  const [salvarUnidade, setSalvarUnidade] = useState("");
  const [produtoSearch, setProdutoSearch] = useState("");
  const [ctaCustom, setCtaCustom] = useState(false);

  // Step 4: 3 variações por wave (até 9 acumuladas)
  const [variations, setVariations] = useState<VariationResult[]>([]);
  const [gerandoVariacoes, setGerandoVariacoes] = useState(false);
  const [variacaoProgresso, setVariacaoProgresso] = useState(0);
  const [selectedVariation, setSelectedVariation] = useState<number | null>(null);
  // Quantas waves foram geradas até agora (0 = nenhuma, 1 = wave 1 feita, 2 = waves 1+2, 3 = todas)
  const [currentWave, setCurrentWave] = useState(0);

  // Step 5: Geração em lote
  const [batchProducts, setBatchProducts] = useState<BatchProduct[]>([]);
  const [batchResults, setBatchResults] = useState<BatchResult[]>([]);
  const [gerandoLote, setGerandoLote] = useState(false);
  const [loteProgresso, setLoteProgresso] = useState(0);
  const [loteTotalItens, setLoteTotalItens] = useState(0);

  // Cadastro ad-hoc de produto no step 5 (com opção de persistir no banco)
  const [showAdHocForm, setShowAdHocForm] = useState(false);
  const [adHocName, setAdHocName] = useState("");
  const [adHocSpec, setAdHocSpec] = useState("");
  const [adHocPrice, setAdHocPrice] = useState("");
  const [adHocPreviousPrice, setAdHocPreviousPrice] = useState("");
  const [adHocPriceType, setAdHocPriceType] = useState("a-partir-de");
  const [adHocUnit, setAdHocUnit] = useState("UN");
  const [adHocCondition, setAdHocCondition] = useState("À vista");
  const [adHocImageFile, setAdHocImageFile] = useState<File | null>(null);
  const [adHocImageUrl, setAdHocImageUrl] = useState<string | null>(null);
  const [adHocCategory, setAdHocCategory] = useState("");
  const [adHocSubcategory, setAdHocSubcategory] = useState("");
  const [adHocSaveToDb, setAdHocSaveToDb] = useState(false);
  const [adHocSaving, setAdHocSaving] = useState(false);
  const [adHocConfirmStep, setAdHocConfirmStep] = useState(false); // mostra review antes de adicionar

  // Verificação de texto e ajustes
  const [verifications, setVerifications] = useState<Map<string, { nota: number; erros: { esperado: string; encontrado: string; tipo: string }[] }>>(new Map());
  const [adjustingId, setAdjustingId] = useState<string | null>(null);
  const [adjustPrompt, setAdjustPrompt] = useState("");
  const [adjustingLoading, setAdjustingLoading] = useState(false);
  const [exportedIds, setExportedIds] = useState<Set<string>>(new Set());

  const cliente = clientes.find((c) => c.id === state.clienteId);

  // Buscar todos os produtos ao entrar no step 3 ou 5
  useEffect(() => {
    if (step === 3 || step === 5) {
      async function fetchProducts() {
        setLoadingProdutos(true);
        try {
          const res = await fetch("/api/products");
          const data = res.ok ? await res.json() : [];
          setProdutosCliente(data);
        } catch {
          console.error("Erro ao carregar produtos");
        } finally {
          setLoadingProdutos(false);
        }
      }
      fetchProducts();
    }
  }, [step]);

  const update = (partial: Partial<CreativeState>) =>
    setState((prev) => ({ ...prev, ...partial }));

  function formatPhone(value: string): string {
    const digits = value.replace(/\D/g, "").slice(0, 11);
    if (digits.length <= 2) return digits.length ? `(${digits}` : "";
    if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }

  // Filtrar produtos cadastrados pela busca
  const filteredProducts = produtosCliente.filter((p) => {
    if (!produtoSearch) return true;
    const q = produtoSearch.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.brand?.toLowerCase().includes(q) ||
      p.category?.toLowerCase().includes(q) ||
      p.subcategory?.toLowerCase().includes(q)
    );
  });

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
    styleFamily?: number,   // ID do style family (1-9) — opcional pro lote que usa referenceBlob
    referenceBlob?: Blob | null,
    batchMode?: boolean,    // quando true, usa prompt cirúrgico de content swap
  ): Promise<{ blob: Blob; url: string; creativeId: string | null }> => {
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
      styleFamily,
      adjustmentPrompt: state.orientacoes?.trim() || undefined,
      batchMode: batchMode || undefined,
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

    const creativeId = res.headers.get("X-Creative-Id") || null;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    return { blob, url, creativeId };
  };

  // Verificar texto de um criativo via Gemini Vision
  const verifyCreativeText = async (blob: Blob, key: string, expectedTexts: string[]) => {
    try {
      const verifyForm = new FormData();
      verifyForm.append("image", blob, "criativo.png");
      verifyForm.append("expectedTexts", JSON.stringify(expectedTexts));
      const verifyRes = await fetch("/api/ai/verify-text", { method: "POST", body: verifyForm });
      if (verifyRes.ok) {
        const result = await verifyRes.json();
        setVerifications((prev) => new Map(prev).set(key, result));
      }
    } catch { /* verificação falhou, não bloqueia */ }
  };

  // Ajustar criativo individual com prompt do usuário
  // O texto cru do usuário passa primeiro por /api/ai/refine-adjustment
  // (gpt-4o-mini) pra virar um prompt estruturado antes de regerar a imagem.
  const handleAdjustCreative = async (
    originalBlob: Blob,
    productName: string,
    key: string,
    isVariation: boolean,
    variationIndex?: number,
  ) => {
    if (!adjustPrompt.trim()) return;
    setAdjustingLoading(true);

    try {
      // ─── Refinar o prompt de ajuste via gpt-4o-mini ──────────────
      let refinedPrompt = adjustPrompt.trim();
      try {
        const refineRes = await fetch("/api/ai/refine-adjustment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            rawPrompt: adjustPrompt.trim(),
            productName,
            promotionName: state.promocaoNome,
          }),
        });
        if (refineRes.ok) {
          const { refinedPrompt: refined, wasRefined } = await refineRes.json();
          if (refined) {
            refinedPrompt = refined;
            if (wasRefined) {
              toast.info("Prompt refinado pelo arquiteto de prompts", { duration: 2000 });
            }
          }
        }
      } catch {
        // Se o refine falhar, usa o texto cru (fallback silencioso)
      }

      const fd = new FormData();
      fd.append("referenceImage", originalBlob, "original.png");

      const bodyData = {
        clientName: cliente?.nome || "Loja",
        clientColors: cliente?.cores || ["#F97316", "#FFFFFF"],
        clientFonts: cliente?.fonts || null,
        promotionName: state.promocaoNome || "PROMOÇÃO",
        productName,
        format: state.formato,
        cta: state.cta || "Clique e fale conosco",
        phone: state.showPhone ? (state.phoneOverride || cliente?.phone || undefined) : undefined,
        storeAddress: state.showAddress ? (state.addressOverride || cliente?.address || undefined) : undefined,
        clientId: state.clienteId || undefined,
        adjustmentPrompt: refinedPrompt,
      };

      fd.append("data", JSON.stringify(bodyData));

      if (cliente?.logoUrl) {
        try {
          const logoRes = await fetch(cliente.logoUrl);
          if (logoRes.ok) {
            const logoBlob = await logoRes.blob();
            fd.append("logo", logoBlob, "logo.png");
          }
        } catch {}
      }

      const res = await fetch("/api/ai/generate-creative", { method: "POST", body: fd });
      if (!res.ok) throw new Error("Erro ao ajustar");

      const creativeId = res.headers.get("X-Creative-Id") || null;
      const newBlob = await res.blob();
      const newUrl = URL.createObjectURL(newBlob);

      // Atualizar o criativo na lista correta
      if (isVariation && variationIndex !== undefined) {
        setVariations((prev) =>
          prev.map((v) => v.variation === variationIndex ? { ...v, url: newUrl, blob: newBlob, creativeId } : v)
        );
      } else {
        setBatchResults((prev) =>
          prev.map((r) => r.product.id === key ? { ...r, url: newUrl, blob: newBlob, creativeId } : r)
        );
      }

      // Verificar texto do novo criativo
      const expectedTexts = [productName, state.preco].filter(Boolean);
      await verifyCreativeText(newBlob, key, expectedTexts);

      toast.success("Criativo ajustado!");
      setAdjustingId(null);
      setAdjustPrompt("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao ajustar");
    } finally {
      setAdjustingLoading(false);
    }
  };

  // Step 4: Gerar a PRÓXIMA wave de 3 estilos (sempre acumula, nunca reseta)
  const handleGerarVariacoes = async () => {
    const waveIndex = currentWave; // wave a ser gerada agora
    if (waveIndex >= STYLE_WAVES.length) return; // todas as 9 já geradas

    setGerandoVariacoes(true);
    setVariacaoProgresso(0);

    const wave = STYLE_WAVES[waveIndex];
    const accumulated: VariationResult[] = [...variations]; // sempre parte do atual

    for (let i = 0; i < wave.length; i++) {
      const styleFamily = wave[i];
      try {
        setVariacaoProgresso(i + 1);
        const { blob, url, creativeId } = await generateSingleCreative(
          state.produtoNome,
          state.produtoSpec,
          state.produtoFotoFile,
          state.preco,
          state.precoAnterior,
          state.tipoPreco,
          state.unidade,
          state.condicao,
          styleFamily,
        );
        accumulated.push({ url, blob, variation: styleFamily, creativeId });
        setVariations([...accumulated]);
        // Verificar texto automaticamente
        const expectedTexts = [state.produtoNome, state.preco, state.promocaoNome].filter(Boolean);
        verifyCreativeText(blob, `var-${styleFamily}`, expectedTexts);
      } catch (err) {
        toast.error(`Erro em "${STYLE_SHORT_NAMES[styleFamily]}": ${err instanceof Error ? err.message : "erro"}`);
      }
    }

    setCurrentWave(waveIndex + 1);
    const totalNow = accumulated.length;
    if (totalNow > 0) {
      const waveLabel = waveIndex === 0 ? "primeiros" : waveIndex === 1 ? "próximos" : "últimos";
      toast.success(`${wave.length} estilos ${waveLabel} gerados! (${totalNow}/9 no total)`);
    }
    setGerandoVariacoes(false);
  };

  // Limpar tudo e voltar ao início (botão explícito, sem surpresas)
  const handleLimparVariacoes = () => {
    setVariations([]);
    setSelectedVariation(null);
    setCurrentWave(0);
    toast.info("Estilos gerados foram limpos");
  };

  // Validação do form ad-hoc (foto agora é obrigatória)
  const isAdHocFormValid = () =>
    !!adHocName.trim() &&
    !!adHocPrice.trim() &&
    !!adHocImageFile &&
    !!adHocCategory &&
    !!adHocSubcategory;

  // Avança do form para a tela de confirmação (review antes de adicionar)
  const handleAdHocReview = () => {
    if (!adHocName.trim()) {
      toast.error("Nome do produto é obrigatório");
      return;
    }
    if (!adHocPrice.trim()) {
      toast.error("Preço é obrigatório");
      return;
    }
    if (!adHocImageFile) {
      toast.error("Foto do produto é obrigatória");
      return;
    }
    if (!adHocCategory) {
      toast.error("Categoria é obrigatória");
      return;
    }
    if (!adHocSubcategory) {
      toast.error("Subcategoria é obrigatória");
      return;
    }
    if (adHocPriceType === "de-por" && !adHocPreviousPrice.trim()) {
      toast.error("Preço anterior é obrigatório no tipo De/Por");
      return;
    }
    setAdHocConfirmStep(true);
  };

  // Confirma e adiciona ao batch (e opcionalmente salva no banco)
  const handleConfirmAdHocProduct = async () => {
    setAdHocSaving(true);

    let persistedImageUrl: string | null = adHocImageUrl;
    let persistedId: string | null = null;

    // Se marcou "salvar no banco", persiste via /api/products antes de adicionar
    if (adHocSaveToDb && adHocImageFile) {
      try {
        const fd = new FormData();
        fd.append("image", adHocImageFile);
        fd.append("data", JSON.stringify({
          name: adHocName.trim(),
          description: adHocSpec.trim() || null,
          category: adHocCategory,
          subcategory: adHocSubcategory,
          brand: null,
          unit: adHocUnit,
          client_id: state.clienteId || null,
        }));

        const res = await fetch("/api/products", { method: "POST", body: fd });
        if (res.ok) {
          const data = await res.json();
          persistedId = data.id || null;
          persistedImageUrl = data.image_treated_url || data.image_url || adHocImageUrl;
          toast.success(`"${adHocName.trim()}" salvo no banco e adicionado ao lote`);
          // Recarrega a lista de produtos cadastrados
          try {
            const prodRes = await fetch("/api/products");
            if (prodRes.ok) setProdutosCliente(await prodRes.json());
          } catch { /* ignora */ }
        } else {
          toast.warning("Não foi possível salvar no banco, mas adicionado ao lote");
        }
      } catch {
        toast.warning("Erro ao salvar no banco, mas adicionado ao lote");
      }
    }

    const newProduct: BatchProduct = {
      id: persistedId || `adhoc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: adHocName.trim(),
      spec: adHocSpec.trim(),
      imageUrl: persistedImageUrl,
      price: adHocPrice.trim(),
      previousPrice: adHocPreviousPrice.trim(),
      priceType: adHocPriceType,
      unit: adHocUnit,
      condition: adHocCondition,
    };
    setBatchProducts((prev) => [...prev, newProduct]);

    // Reset completo do form
    setAdHocName("");
    setAdHocSpec("");
    setAdHocPrice("");
    setAdHocPreviousPrice("");
    setAdHocPriceType("a-partir-de");
    setAdHocUnit("UN");
    setAdHocCondition("À vista");
    setAdHocImageFile(null);
    setAdHocImageUrl(null);
    setAdHocCategory("");
    setAdHocSubcategory("");
    setAdHocSaveToDb(false);
    setAdHocConfirmStep(false);
    setShowAdHocForm(false);
    setAdHocSaving(false);

    if (!adHocSaveToDb) {
      toast.success(`"${newProduct.name}" adicionado ao lote`);
    }
  };

  // Volta do confirm pro form de edição
  const handleAdHocBack = () => setAdHocConfirmStep(false);

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

        const { blob, url, creativeId } = await generateSingleCreative(
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
          true, // batchMode — força content swap cirúrgico com preservação total da referência
        );

        results.push({ product, url, blob, creativeId });
        setBatchResults([...results]);
        // Verificar texto automaticamente
        const expectedTexts = [product.name, product.price].filter(Boolean);
        verifyCreativeText(blob, product.id, expectedTexts);
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
        spec: product.subcategory || "",
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

  const handleDownloadAll = async () => {
    // Coletar IDs para aprovar
    const idsToApprove: string[] = [];
    const refVar = variations.find((v) => v.variation === selectedVariation);

    if (refVar?.creativeId) idsToApprove.push(refVar.creativeId);
    batchResults.forEach((r) => {
      if (r.creativeId) idsToApprove.push(r.creativeId);
    });

    // Aprovar criativos (marcar como exported)
    if (idsToApprove.length > 0) {
      try {
        await fetch("/api/creatives", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ids: idsToApprove }),
        });
      } catch { /* continua com download mesmo se falhar */ }
    }

    // Download reference
    if (refVar) {
      handleDownload(refVar.blob, `criativo-${state.produtoNome}-referencia`);
    }
    // Download batch
    batchResults.forEach((r, i) => {
      setTimeout(() => {
        handleDownload(r.blob, `criativo-${r.product.name}`);
      }, 300 * (i + 1));
    });
    setExportedIds(new Set(idsToApprove));
    toast.success(`${idsToApprove.length} criativo(s) aprovado(s) e exportado(s)!`);
  };

  const canAdvance = () => {
    if (step === 1 && !state.clienteId) return false;
    if (step === 3 && !state.produtoNome.trim()) return false;
    if (step === 4 && selectedVariation === null) return false;
    // Step 5 (lote) é OPCIONAL — usuário pode avançar só com a variação escolhida
    // no step 4, sem precisar gerar nenhum criativo em lote.
    if (step === 5 && gerandoLote) return false;
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

  // Função para salvar produto via modal
  async function handleSalvarProduto() {
    if (!state.produtoNome.trim()) return;

    // Check duplicidade
    const nomeNorm = state.produtoNome.trim().toLowerCase();
    const duplicado = produtosCliente.find((p) => p.name.toLowerCase() === nomeNorm);
    if (duplicado) {
      toast.info(`Produto "${duplicado.name}" já existe no banco.`);
      setShowSalvarModal(false);
      return;
    }

    setSalvandoProduto(true);
    try {
      const fd = new FormData();
      if (state.produtoFotoFile) {
        fd.append("image", state.produtoFotoFile);
      }
      fd.append("data", JSON.stringify({
        name: state.produtoNome.trim(),
        description: state.produtoSpec || null,
        category: salvarCategoria || null,
        subcategory: salvarSubcategoria || null,
        brand: null,
        unit: salvarUnidade || null,
      }));
      const res = await fetch("/api/products", { method: "POST", body: fd });
      if (res.ok) {
        toast.success("Produto salvo no banco!");
        setShowSalvarModal(false);
        // Atualizar lista de produtos
        const prodRes = await fetch("/api/products");
        if (prodRes.ok) setProdutosCliente(await prodRes.json());
      } else {
        toast.error("Erro ao salvar produto no banco");
      }
    } catch {
      toast.error("Erro ao salvar produto");
    } finally {
      setSalvandoProduto(false);
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Modal de salvar produto no banco */}
      <Dialog open={showSalvarModal} onOpenChange={setShowSalvarModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Salvar produto no banco</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Nome (readonly) */}
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Produto</Label>
              <p className="text-sm font-semibold">{state.produtoNome}</p>
            </div>

            {/* Verificação de duplicidade */}
            {state.produtoNome.trim() && (() => {
              const dup = produtosCliente.find((p) => p.name.toLowerCase() === state.produtoNome.trim().toLowerCase());
              if (dup) return (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
                  <p className="text-xs text-amber-600 dark:text-amber-400">Produto &quot;{dup.name}&quot; já existe no banco.</p>
                </div>
              );
              return (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                  <p className="text-xs text-emerald-600 dark:text-emerald-400">Nome disponível, sem duplicidade.</p>
                </div>
              );
            })()}

            {/* Categoria */}
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs">Categoria</Label>
                <Select value={salvarCategoria} onValueChange={(val) => { setSalvarCategoria(val ?? ""); setSalvarSubcategoria(""); }}>
                  <SelectTrigger className="h-[38px]"><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIAS.map((cat) => (<SelectItem key={cat} value={cat}>{cat}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Subcategoria</Label>
                <Select value={salvarSubcategoria} onValueChange={(val) => setSalvarSubcategoria(val ?? "")} disabled={!salvarCategoria}>
                  <SelectTrigger className="h-[38px]"><SelectValue placeholder={salvarCategoria ? "Selecione" : "—"} /></SelectTrigger>
                  <SelectContent>
                    {salvarCategoria && CATEGORIAS_MATCON[salvarCategoria as keyof typeof CATEGORIAS_MATCON]?.map((sub) => (
                      <SelectItem key={sub} value={sub}>{sub}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Unidade */}
            <div className="space-y-1.5">
              <Label className="text-xs">Unidade de medida</Label>
              <Select value={salvarUnidade} onValueChange={(val) => setSalvarUnidade(val ?? "")}>
                <SelectTrigger className="h-[38px]"><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {UNIDADES.map((u) => (<SelectItem key={u} value={u}>{u}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSalvarModal(false)}>Cancelar</Button>
            <Button
              onClick={handleSalvarProduto}
              disabled={salvandoProduto || !state.produtoNome.trim() || !!produtosCliente.find((p) => p.name.toLowerCase() === state.produtoNome.trim().toLowerCase())}
              className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white border-0"
            >
              {salvandoProduto ? <><Loader2 className="h-4 w-4 animate-spin mr-1.5" />Salvando...</> : "Salvar Produto"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
                  <Label>Selo promocional (opcional)</Label>
                  <p className="text-[11px] text-muted-foreground">
                    Faça upload de um selo próprio ou deixe em branco — a IA gera automaticamente junto com a arte.
                  </p>
                  {!state.seloUrl ? (
                    <div
                      className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 cursor-pointer transition-colors ${
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
                        Nenhum produto cadastrado.
                      </p>
                    ) : (
                      <>
                        {/* Busca */}
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="Buscar por nome, marca, categoria..."
                            value={produtoSearch}
                            onChange={(e) => setProdutoSearch(e.target.value)}
                            className="pl-9 h-9"
                          />
                          {produtoSearch && (
                            <button type="button" onClick={() => setProdutoSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                              <X className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                        {filteredProducts.length === 0 ? (
                          <p className="text-sm text-muted-foreground text-center py-4">Nenhum produto encontrado.</p>
                        ) : (
                          <div className="grid gap-2 max-h-[300px] overflow-y-auto custom-scrollbar">
                            {filteredProducts.map((p) => {
                              const isSelected = state.produtoNome === p.name;
                              return (
                                <button
                                  key={p.id}
                                  type="button"
                                  onClick={() => {
                                    const imageUrl = p.image_treated_url || p.image_url;
                                    update({
                                      produtoNome: p.name,
                                      produtoSpec: p.subcategory || "",
                                      produtoFotoUrl: imageUrl,
                                      produtoFotoFile: null,
                                      unidade: p.unit || state.unidade,
                                    });
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
                                    <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                                      {p.category && <span className="text-[10px] px-1.5 py-0.5 rounded bg-teal-500/10 text-teal-500">{p.category}</span>}
                                      {p.subcategory && <span className="text-[10px] px-1.5 py-0.5 rounded bg-orange-500/10 text-orange-500">{p.subcategory}</span>}
                                      {p.brand && <span className="text-[10px] text-muted-foreground">{p.brand}</span>}
                                      {p.unit && <span className="text-[10px] text-muted-foreground">· {p.unit}</span>}
                                    </div>
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

                {/* Salvar produto no banco */}
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full border-border/50 hover:border-orange-500/30 hover:bg-orange-500/5 text-xs"
                  onClick={() => {
                    setSalvarCategoria("");
                    setSalvarSubcategoria("");
                    setSalvarUnidade(state.unidade || "");
                    setShowSalvarModal(true);
                  }}
                  disabled={!state.produtoNome.trim()}
                >
                  <Package className="h-3.5 w-3.5 mr-1.5" />
                  Salvar no banco de produtos
                </Button>
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
                  {ctaCustom ? (
                    <div className="flex gap-2">
                      <Input
                        placeholder="Digite seu CTA personalizado..."
                        className="h-[42px] flex-1"
                        value={state.cta}
                        onChange={(e) => update({ cta: e.target.value })}
                      />
                      <Button variant="outline" size="sm" className="h-[42px] text-xs" onClick={() => setCtaCustom(false)}>
                        Sugestões
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="grid gap-1.5 grid-cols-2">
                        {[
                          "Clique e fale conosco",
                          "Clique e faça seu orçamento",
                          "Fale conosco pelo WhatsApp",
                          "Peça já seu orçamento",
                          "Compre agora",
                          "Aproveite essa oferta",
                        ].map((cta) => (
                          <button
                            key={cta}
                            type="button"
                            onClick={() => update({ cta })}
                            className={`px-3 py-2 rounded-lg border text-[11px] font-medium text-left transition-all ${
                              state.cta === cta
                                ? "border-orange-500/50 bg-orange-500/5 text-orange-500"
                                : "border-border/40 text-muted-foreground hover:border-orange-500/30 hover:text-foreground"
                            }`}
                          >
                            {cta}
                          </button>
                        ))}
                      </div>
                      <button
                        type="button"
                        onClick={() => { setCtaCustom(true); update({ cta: "" }); }}
                        className="text-[11px] text-orange-500 hover:text-orange-400 font-medium"
                      >
                        + Personalizar CTA
                      </button>
                    </div>
                  )}
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
                          onClick={() => update({ phoneOverride: formatPhone(cliente.phone || "") })}
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
                        placeholder="(XX) XXXXX-XXXX"
                        value={state.phoneOverride}
                        onChange={(e) => update({ phoneOverride: formatPhone(e.target.value) })}
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

                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-orange-500" />
                    Orientações para a IA <span className="text-muted-foreground font-normal">(opcional)</span>
                  </Label>
                  <Textarea
                    value={state.orientacoes}
                    onChange={(e) => update({ orientacoes: e.target.value })}
                    placeholder="Ex: destaque o 70% OFF, produto à esquerda, tom mais agressivo, adicione fita amarela de obra, use vermelho vibrante..."
                    className="min-h-[80px] resize-none text-sm"
                    maxLength={500}
                  />
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Dica: use pra garantir que cada criativo saia único. As instruções entram junto com o prompt mestre e sobrescrevem layout/composição (mas preservam produto, preço e CTA).
                  </p>
                  {state.orientacoes && (
                    <p className="text-[11px] text-right text-muted-foreground">
                      {state.orientacoes.length}/500
                    </p>
                  )}
                </div>

                {/* Botão único: sempre gera a PRÓXIMA wave (acumula, nunca reseta) */}
                {currentWave < STYLE_WAVES.length && (
                  <Button
                    className="w-full h-12 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white border-0 btn-micro"
                    onClick={handleGerarVariacoes}
                    disabled={gerandoVariacoes}
                  >
                    {gerandoVariacoes ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Gerando {variacaoProgresso}/3...
                      </>
                    ) : currentWave === 0 ? (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        Gerar 3 estilos diferentes
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        Gerar mais 3 estilos ({variations.length}/9)
                      </>
                    )}
                  </Button>
                )}

                {/* Banner: tokens já consumidos + ação de limpar discreta */}
                {variations.length > 0 && !gerandoVariacoes && (
                  <div className="flex items-start gap-2 rounded-lg border border-orange-500/20 bg-orange-500/5 p-2.5">
                    <AlertTriangle className="h-3.5 w-3.5 text-orange-500 mt-0.5 shrink-0" />
                    <div className="flex-1 space-y-1.5">
                      <p className="text-[11px] text-muted-foreground leading-relaxed">
                        <span className="font-medium text-foreground">{variations.length} de 9 estilos</span> já gerados.
                        {currentWave >= STYLE_WAVES.length
                          ? " Todos os 9 estilos já estão na tela — escolha um pra seguir."
                          : " Cada geração consome tokens do gpt-image-2 — gere apenas se precisar mais opções."}
                      </p>
                      <button
                        type="button"
                        onClick={handleLimparVariacoes}
                        className="text-[11px] text-muted-foreground hover:text-destructive underline underline-offset-2"
                      >
                        Limpar todos e recomeçar
                      </button>
                    </div>
                  </div>
                )}

                {/* Progresso */}
                {gerandoVariacoes && (
                  <div className="w-full bg-muted/30 rounded-full h-2">
                    <div
                      className="bg-orange-500 h-2 rounded-full transition-all"
                      style={{ width: `${(variacaoProgresso / 3) * 100}%` }}
                    />
                  </div>
                )}

                {/* Grid de variações (cresce de 3 → 6 → 9) */}
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
                            alt={STYLE_SHORT_NAMES[v.variation] || `Estilo ${v.variation}`}
                            className="w-full aspect-square object-cover"
                          />
                          {selectedVariation === v.variation && (
                            <div className="absolute top-2 right-2 flex h-6 w-6 items-center justify-center rounded-full bg-orange-500 text-white shadow-lg">
                              <Check className="h-3.5 w-3.5" />
                            </div>
                          )}
                          <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                            <span className="text-white text-[11px] font-medium truncate block">
                              {STYLE_SHORT_NAMES[v.variation] || `Estilo ${v.variation}`}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                    {selectedVariation && (
                      <p className="text-xs text-center text-orange-500 font-medium">
                        {STYLE_SHORT_NAMES[selectedVariation] || `Estilo ${selectedVariation}`} selecionado como referência
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
                  O lote é opcional. Selecione produtos cadastrados OU cadastre um produto avulso na hora. Cada produto gerado usará o estilo escolhido como base exata, trocando apenas produto/preço/nome.
                </p>

                {/* Botão cadastrar produto avulso */}
                <div className="flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAdHocForm((v) => !v)}
                    className="flex items-center gap-1.5 text-xs text-orange-500 hover:text-orange-400 font-medium"
                  >
                    <ImagePlus className="h-3.5 w-3.5" />
                    {showAdHocForm ? "Cancelar cadastro avulso" : "+ Cadastrar produto avulso"}
                  </button>
                  <span className="text-xs text-muted-foreground">
                    (não salva no banco)
                  </span>
                </div>

                {/* Form ad-hoc inline — com foto obrigatória + confirmação */}
                {showAdHocForm && !adHocConfirmStep && (
                  <div className="rounded-xl border border-orange-500/40 bg-orange-500/5 p-3 space-y-2.5">
                    <p className="text-[11px] font-semibold text-orange-500 uppercase tracking-wider">
                      Cadastrar produto avulso
                    </p>

                    <div>
                      <label className="text-[10px] text-muted-foreground font-medium">Nome do produto *</label>
                      <Input
                        value={adHocName}
                        onChange={(e) => setAdHocName(e.target.value)}
                        placeholder="Ex: Cimento CPII 50kg"
                        className="h-8 text-xs mt-0.5"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-muted-foreground font-medium">Descrição/spec</label>
                      <Input
                        value={adHocSpec}
                        onChange={(e) => setAdHocSpec(e.target.value)}
                        placeholder="Ex: Saco 50kg | Alta resistência"
                        className="h-8 text-xs mt-0.5"
                      />
                    </div>

                    <div className="grid gap-2 grid-cols-2">
                      <div>
                        <label className="text-[10px] text-muted-foreground font-medium">Categoria *</label>
                        <Select value={adHocCategory} onValueChange={(v) => { setAdHocCategory(v ?? ""); setAdHocSubcategory(""); }}>
                          <SelectTrigger className="h-8 text-xs mt-0.5">
                            <SelectValue placeholder="Selecionar" />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.keys(CATEGORIAS_MATCON).map((cat) => (
                              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-[10px] text-muted-foreground font-medium">Subcategoria *</label>
                        <Select
                          value={adHocSubcategory}
                          onValueChange={(v) => setAdHocSubcategory(v ?? "")}
                          disabled={!adHocCategory}
                        >
                          <SelectTrigger className="h-8 text-xs mt-0.5">
                            <SelectValue placeholder={adHocCategory ? "Selecionar" : "Cat. primeiro"} />
                          </SelectTrigger>
                          <SelectContent>
                            {adHocCategory && CATEGORIAS_MATCON[adHocCategory as keyof typeof CATEGORIAS_MATCON]?.map((sub: string) => (
                              <SelectItem key={sub} value={sub}>{sub}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid gap-2 grid-cols-2">
                      <div>
                        <label className="text-[10px] text-muted-foreground font-medium">Tipo preço</label>
                        <Select value={adHocPriceType} onValueChange={(v) => setAdHocPriceType(v ?? "")}>
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
                        <label className="text-[10px] text-muted-foreground font-medium">Preço *</label>
                        <Input
                          value={adHocPrice}
                          onChange={(e) => setAdHocPrice(e.target.value)}
                          placeholder="29,90"
                          className="h-8 text-xs font-bold mt-0.5"
                        />
                      </div>
                    </div>

                    {adHocPriceType === "de-por" && (
                      <div>
                        <label className="text-[10px] text-muted-foreground font-medium">Preço anterior (De) *</label>
                        <Input
                          value={adHocPreviousPrice}
                          onChange={(e) => setAdHocPreviousPrice(e.target.value)}
                          placeholder="49,90"
                          className="h-8 text-xs mt-0.5"
                        />
                      </div>
                    )}

                    <div className="grid gap-2 grid-cols-2">
                      <div>
                        <label className="text-[10px] text-muted-foreground font-medium">Unidade</label>
                        <Select value={adHocUnit} onValueChange={(v) => setAdHocUnit(v ?? "")}>
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
                        <Select value={adHocCondition} onValueChange={(v) => setAdHocCondition(v ?? "")}>
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

                    {/* Foto obrigatória */}
                    <div>
                      <label className="text-[10px] text-muted-foreground font-medium flex items-center gap-1">
                        Foto do produto <span className="text-red-500">*</span>
                        {!adHocImageFile && <span className="text-[9px] text-red-500">(obrigatória)</span>}
                      </label>
                      <div className={`mt-1 flex items-center gap-2 rounded border ${adHocImageFile ? "border-green-500/30 bg-green-500/5" : "border-red-500/30 bg-red-500/5"} p-2`}>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            setAdHocImageFile(file);
                            setAdHocImageUrl(URL.createObjectURL(file));
                          }}
                          className="text-[10px] file:mr-2 file:rounded file:border-0 file:bg-orange-500/10 file:px-2 file:py-1 file:text-[10px] file:text-orange-500 file:font-medium hover:file:bg-orange-500/20 file:cursor-pointer cursor-pointer flex-1"
                        />
                        {adHocImageUrl && (
                          <div className="h-10 w-10 rounded border border-border/30 bg-muted/20 flex items-center justify-center overflow-hidden shrink-0">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={adHocImageUrl} alt="preview" className="max-h-full max-w-full object-contain" />
                          </div>
                        )}
                      </div>
                    </div>

                    <Button
                      type="button"
                      onClick={handleAdHocReview}
                      className="w-full h-9 text-xs bg-orange-500 hover:bg-orange-600 text-white border-0"
                      disabled={!isAdHocFormValid()}
                    >
                      <ChevronRight className="h-3.5 w-3.5 mr-1.5" />
                      Revisar antes de adicionar
                    </Button>
                  </div>
                )}

                {/* Tela de confirmação (review) */}
                {showAdHocForm && adHocConfirmStep && (
                  <div className="rounded-xl border border-green-500/40 bg-green-500/5 p-3 space-y-2.5">
                    <p className="text-[11px] font-semibold text-green-500 uppercase tracking-wider flex items-center gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Confirme os dados
                    </p>

                    <div className="flex gap-3">
                      {adHocImageUrl && (
                        <div className="h-20 w-20 rounded-lg border border-border/40 bg-muted/20 flex items-center justify-center overflow-hidden shrink-0 p-1">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={adHocImageUrl} alt={adHocName} className="max-h-full max-w-full object-contain" />
                        </div>
                      )}
                      <div className="flex-1 space-y-0.5 text-xs">
                        <p className="font-bold truncate">{adHocName}</p>
                        {adHocSpec && <p className="text-muted-foreground text-[10px]">{adHocSpec}</p>}
                        <p className="text-[10px]">
                          <span className="text-muted-foreground">Categoria:</span>{" "}
                          <span className="font-medium">{adHocCategory}</span> / <span className="font-medium">{adHocSubcategory}</span>
                        </p>
                        <p className="text-[10px]">
                          <span className="text-muted-foreground">
                            {adHocPriceType === "de-por" ? "De/Por:" : adHocPriceType === "por-apenas" ? "Por apenas:" : "A partir de:"}
                          </span>{" "}
                          {adHocPriceType === "de-por" && (
                            <span className="text-muted-foreground line-through mr-1">R$ {adHocPreviousPrice}</span>
                          )}
                          <span className="font-bold text-orange-500">R$ {adHocPrice}</span>
                          <span className="text-muted-foreground"> / {adHocUnit} {adHocCondition}</span>
                        </p>
                      </div>
                    </div>

                    {/* Toggle salvar no banco */}
                    <label className="flex items-start gap-2 rounded-lg border border-border/40 p-2 cursor-pointer hover:border-orange-500/40 transition-colors">
                      <input
                        type="checkbox"
                        checked={adHocSaveToDb}
                        onChange={(e) => setAdHocSaveToDb(e.target.checked)}
                        className="mt-0.5 h-3.5 w-3.5 accent-orange-500 cursor-pointer"
                      />
                      <div className="flex-1 space-y-0.5">
                        <p className="text-xs font-medium">Salvar no banco de dados</p>
                        <p className="text-[10px] text-muted-foreground leading-relaxed">
                          Salva este produto permanentemente com foto, categoria e subcategoria. Você poderá reutilizá-lo em próximos lotes sem cadastrar de novo.
                        </p>
                      </div>
                    </label>

                    <div className="flex gap-2">
                      <Button
                        type="button"
                        onClick={handleAdHocBack}
                        variant="outline"
                        className="flex-1 h-9 text-xs"
                        disabled={adHocSaving}
                      >
                        <ChevronLeft className="h-3.5 w-3.5 mr-1" />
                        Editar
                      </Button>
                      <Button
                        type="button"
                        onClick={handleConfirmAdHocProduct}
                        className="flex-1 h-9 text-xs bg-green-500 hover:bg-green-600 text-white border-0"
                        disabled={adHocSaving}
                      >
                        {adHocSaving ? (
                          <>
                            <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                            Salvando...
                          </>
                        ) : (
                          <>
                            <Check className="h-3.5 w-3.5 mr-1" />
                            Confirmar {adHocSaveToDb && "e salvar"}
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                )}

                {/* Seleção de produtos cadastrados */}
                {loadingProdutos ? (
                  <div className="flex items-center justify-center py-6">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : produtosCliente.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Nenhum produto cadastrado para este cliente. Você pode cadastrar um avulso acima ou avançar sem gerar lote.
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
                                spec: p.subcategory || "",
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
                            {p.subcategory && <span className="text-muted-foreground ml-auto shrink-0">{p.subcategory}</span>}
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

                {/* Resultados do lote com verificação e ajuste */}
                {batchResults.length > 0 && (
                  <div className="grid gap-3 grid-cols-2 sm:grid-cols-3">
                    {batchResults.map((r) => {
                      const verification = verifications.get(r.product.id);
                      const isAdjusting = adjustingId === r.product.id;
                      return (
                        <div key={r.product.id} className="rounded-xl overflow-hidden border border-border/50 bg-card/50">
                          <img src={r.url} alt={r.product.name} className="w-full aspect-square object-cover" />
                          <div className="p-2 space-y-1.5">
                            <p className="text-xs font-medium truncate">{r.product.name}</p>
                            {/* Verificação */}
                            {verification && (
                              <div className="flex items-center gap-1">
                                {verification.nota >= 8 ? (
                                  <CheckCircle2 className="h-3 w-3 text-green-500 shrink-0" />
                                ) : (
                                  <AlertTriangle className="h-3 w-3 text-orange-500 shrink-0" />
                                )}
                                <span className={`text-[10px] font-medium ${verification.nota >= 8 ? "text-green-500" : "text-orange-500"}`}>
                                  Texto: {verification.nota}/10
                                </span>
                              </div>
                            )}
                            {/* Botão ajustar */}
                            <button
                              type="button"
                              onClick={() => { setAdjustingId(isAdjusting ? null : r.product.id); setAdjustPrompt(""); }}
                              className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-orange-500 transition-colors"
                            >
                              <Pencil className="h-3 w-3" />
                              {isAdjusting ? "Cancelar" : "Ajustar"}
                            </button>
                            {isAdjusting && (
                              <div className="space-y-1.5">
                                <Textarea
                                  value={adjustPrompt}
                                  onChange={(e) => setAdjustPrompt(e.target.value)}
                                  placeholder="Descreva o ajuste... Ex: aumentar o preço, corrigir nome do produto, mudar cor de fundo"
                                  className="text-xs min-h-[60px] resize-none"
                                />
                                <Button
                                  size="sm"
                                  className="w-full h-7 text-xs bg-orange-500 hover:bg-orange-600 text-white border-0"
                                  onClick={() => handleAdjustCreative(r.blob, r.product.name, r.product.id, false)}
                                  disabled={adjustingLoading || !adjustPrompt.trim()}
                                >
                                  {adjustingLoading ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Sparkles className="h-3 w-3 mr-1" />}
                                  Regenerar com ajuste
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
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
                      {selectedVariation && (() => {
                        const refVar = variations.find((v) => v.variation === selectedVariation);
                        if (!refVar) return null;
                        const isExported = refVar.creativeId ? exportedIds.has(refVar.creativeId) : false;
                        const verification = verifications.get(`var-${selectedVariation}`);
                        const isAdjusting = adjustingId === `ref-${selectedVariation}`;
                        return (
                          <div className="rounded-xl overflow-hidden border-2 border-orange-500/30 bg-card/50">
                            <div className="relative">
                              <img src={refVar.url} alt="Referência" className="w-full aspect-square object-cover" />
                              {isExported && (
                                <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-500 text-white text-[9px] font-bold shadow-lg">
                                  <ShieldCheck className="h-3 w-3" />
                                  Aprovado
                                </div>
                              )}
                            </div>
                            <div className="p-2 space-y-1.5">
                              <p className="text-xs font-medium truncate">{state.produtoNome}</p>
                              <Badge variant="secondary" className="text-[9px] bg-orange-500/10 text-orange-500 border-0">
                                Referência
                              </Badge>
                              {verification && (
                                <div className="flex items-center gap-1">
                                  {verification.nota >= 8 ? (
                                    <CheckCircle2 className="h-3 w-3 text-green-500" />
                                  ) : (
                                    <AlertTriangle className="h-3 w-3 text-orange-500" />
                                  )}
                                  <span className={`text-[10px] font-medium ${verification.nota >= 8 ? "text-green-500" : "text-orange-500"}`}>
                                    Texto: {verification.nota}/10
                                  </span>
                                </div>
                              )}
                              <button
                                type="button"
                                onClick={() => { setAdjustingId(isAdjusting ? null : `ref-${selectedVariation}`); setAdjustPrompt(""); }}
                                className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-orange-500 transition-colors"
                              >
                                <Pencil className="h-3 w-3" />
                                {isAdjusting ? "Cancelar" : "Ajustar"}
                              </button>
                              {isAdjusting && (
                                <div className="space-y-1.5">
                                  <Textarea
                                    value={adjustPrompt}
                                    onChange={(e) => setAdjustPrompt(e.target.value)}
                                    placeholder="Descreva o ajuste..."
                                    className="text-xs min-h-[60px] resize-none"
                                  />
                                  <Button
                                    size="sm"
                                    className="w-full h-7 text-xs bg-orange-500 hover:bg-orange-600 text-white border-0"
                                    onClick={() => handleAdjustCreative(refVar.blob, state.produtoNome, `ref-${selectedVariation}`, true, selectedVariation)}
                                    disabled={adjustingLoading || !adjustPrompt.trim()}
                                  >
                                    {adjustingLoading ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Sparkles className="h-3 w-3 mr-1" />}
                                    Regenerar
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })()}
                      {/* Lote */}
                      {batchResults.map((r) => {
                        const isExported = r.creativeId ? exportedIds.has(r.creativeId) : false;
                        const verification = verifications.get(r.product.id);
                        const isAdjusting = adjustingId === `exp-${r.product.id}`;
                        return (
                          <div key={r.product.id} className="rounded-xl overflow-hidden border border-border/50 bg-card/50">
                            <div className="relative">
                              <img src={r.url} alt={r.product.name} className="w-full aspect-square object-cover" />
                              {isExported && (
                                <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-500 text-white text-[9px] font-bold shadow-lg">
                                  <ShieldCheck className="h-3 w-3" />
                                  Aprovado
                                </div>
                              )}
                            </div>
                            <div className="p-2 space-y-1.5">
                              <p className="text-xs font-medium truncate">{r.product.name}</p>
                              {verification && (
                                <div className="flex items-center gap-1">
                                  {verification.nota >= 8 ? (
                                    <CheckCircle2 className="h-3 w-3 text-green-500" />
                                  ) : (
                                    <AlertTriangle className="h-3 w-3 text-orange-500" />
                                  )}
                                  <span className={`text-[10px] font-medium ${verification.nota >= 8 ? "text-green-500" : "text-orange-500"}`}>
                                    Texto: {verification.nota}/10
                                  </span>
                                </div>
                              )}
                              <button
                                type="button"
                                onClick={() => { setAdjustingId(isAdjusting ? null : `exp-${r.product.id}`); setAdjustPrompt(""); }}
                                className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-orange-500 transition-colors"
                              >
                                <Pencil className="h-3 w-3" />
                                {isAdjusting ? "Cancelar" : "Ajustar"}
                              </button>
                              {isAdjusting && (
                                <div className="space-y-1.5">
                                  <Textarea
                                    value={adjustPrompt}
                                    onChange={(e) => setAdjustPrompt(e.target.value)}
                                    placeholder="Descreva o ajuste..."
                                    className="text-xs min-h-[60px] resize-none"
                                  />
                                  <Button
                                    size="sm"
                                    className="w-full h-7 text-xs bg-orange-500 hover:bg-orange-600 text-white border-0"
                                    onClick={() => handleAdjustCreative(r.blob, r.product.name, r.product.id, false)}
                                    disabled={adjustingLoading || !adjustPrompt.trim()}
                                  >
                                    {adjustingLoading ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Sparkles className="h-3 w-3 mr-1" />}
                                    Regenerar
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
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
                {step === 5
                  ? (batchResults.length > 0 ? "Exportar" : "Pular lote e exportar")
                  : "Próximo"}
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
