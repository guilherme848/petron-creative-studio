"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getPalette } from "colorthief";
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
import {
  Upload,
  X,
  Plus,
  Save,
  ArrowLeft,
  Building2,
  Palette,
  Type,
  ImageIcon,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

// ── Types ──────────────────────────────────────────────────────────────────

interface ColorSlot {
  label: string;
  hex: string;
}

interface ClienteForm {
  nome: string;
  segmento: string;
  documento: string;
  contato: string;
  endereco: string;
  linkWhatsapp: string;
  logoUrl: string | null;
  logoFile: File | null;
  cores: ColorSlot[];
  fonteTitulo: string;
  fontePreco: string;
  fonteDescricao: string;
}

const DEFAULT_COLORS: ColorSlot[] = [
  { label: "Cor Primária", hex: "#F97316" },
  { label: "Cor Secundária", hex: "#1E293B" },
  { label: "Cor de Destaque", hex: "#FACC15" },
  { label: "Cor de Texto", hex: "#FFFFFF" },
  { label: "Cor de Texto Secundário", hex: "#94A3B8" },
];

// ── Page Component ─────────────────────────────────────────────────────────

export default function NovoClientePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const [extractingColors, setExtractingColors] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const [form, setForm] = useState<ClienteForm>({
    nome: "",
    segmento: "",
    documento: "",
    contato: "",
    endereco: "",
    linkWhatsapp: "",
    logoUrl: null,
    logoFile: null,
    cores: [...DEFAULT_COLORS],
    fonteTitulo: "",
    fontePreco: "",
    fonteDescricao: "",
  });

  // ── Helpers ──────────────────────────────────────────────────────────────

  const updateField = <K extends keyof ClienteForm>(
    key: K,
    value: ClienteForm[K]
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const updateColor = (index: number, hex: string) => {
    setForm((prev) => {
      const cores = [...prev.cores];
      cores[index] = { ...cores[index], hex };
      return { ...prev, cores };
    });
  };

  const addColor = () => {
    setForm((prev) => ({
      ...prev,
      cores: [...prev.cores, { label: "Nova Cor", hex: "#6366F1" }],
    }));
  };

  const removeColor = (index: number) => {
    setForm((prev) => ({
      ...prev,
      cores: prev.cores.filter((_, i) => i !== index),
    }));
  };

  const updateColorLabel = (index: number, label: string) => {
    setForm((prev) => {
      const cores = [...prev.cores];
      cores[index] = { ...cores[index], label };
      return { ...prev, cores };
    });
  };

  // ── Color Extraction ────────────────────────────────────────────────────

  const extractColors = useCallback(async (imageUrl: string) => {
    setExtractingColors(true);
    try {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = imageUrl;

      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("Falha ao carregar imagem"));
      });

      const palette = await getPalette(img, { colorCount: 5 });

      if (palette && palette.length > 0) {
        const labels = [
          "Cor Primária",
          "Cor Secundária",
          "Cor de Destaque",
          "Cor de Texto",
          "Cor de Texto Secundário",
        ];
        const newColors: ColorSlot[] = palette.map((color, i) => ({
          label: labels[i] || `Cor ${i + 1}`,
          hex: color.hex(),
        }));
        setForm((prev) => ({ ...prev, cores: newColors }));
      }
    } catch (err) {
      console.error("Erro ao extrair cores:", err);
    } finally {
      setExtractingColors(false);
    }
  }, []);

  // ── File Upload ──────────────────────────────────────────────────────────

  const handleFile = useCallback(
    (file: File) => {
      const validTypes = ["image/png", "image/jpeg", "image/svg+xml"];
      if (!validTypes.includes(file.type)) {
        toast.error("Formato não suportado. Use PNG, JPG ou SVG.");
        return;
      }

      const url = URL.createObjectURL(file);
      setForm((prev) => ({ ...prev, logoUrl: url, logoFile: file }));
      extractColors(url);
    },
    [extractColors]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const removeLogo = () => {
    if (form.logoUrl) URL.revokeObjectURL(form.logoUrl);
    setForm((prev) => ({
      ...prev,
      logoUrl: null,
      logoFile: null,
      cores: [...DEFAULT_COLORS],
    }));
  };

  // ── Save ─────────────────────────────────────────────────────────────────

  const handleSave = async () => {
    if (!form.nome.trim()) {
      toast.error("O nome da empresa é obrigatório.");
      return;
    }

    setSaving(true);

    try {
      const formData = new FormData();

      if (form.logoFile) {
        formData.append("logo", form.logoFile);
      }

      const clientData = {
        name: form.nome.trim(),
        segment: form.segmento || null,
        cnpj: form.documento || null,
        contact: form.contato || null,
        address: form.endereco || null,
        whatsapp_link: form.linkWhatsapp || null,
        colors: form.cores.map((c) => ({ label: c.label, hex: c.hex })),
        fonts: {
          title: form.fonteTitulo || null,
          price: form.fontePreco || null,
          description: form.fonteDescricao || null,
        },
      };

      formData.append("data", JSON.stringify(clientData));

      const res = await fetch("/api/clients", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Erro ao salvar cliente");
      }

      router.push("/clientes");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Erro ao salvar cliente. Tente novamente."
      );
    } finally {
      setSaving(false);
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/clientes">
          <Button
            variant="ghost"
            size="icon"
            className="hover:bg-orange-500/10"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Novo Cliente</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Cadastre um cliente com sua identidade visual completa.
          </p>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
        {/* Left Column — Form */}
        <div className="space-y-8 stagger-children">
          {/* ── Dados do Cliente ─────────────────────────────────────── */}
          <Card className="border-border/50 bg-card/50 rounded-2xl">
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500/10">
                  <Building2 className="h-4 w-4 text-orange-500" />
                </div>
                <div>
                  <CardTitle>Dados do Cliente</CardTitle>
                  <CardDescription>
                    Informações básicas da empresa
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <Separator />
            <CardContent className="pt-6">
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Label htmlFor="nome">
                    Nome da Empresa{" "}
                    <span className="text-orange-500">*</span>
                  </Label>
                  <Input
                    id="nome"
                    placeholder="Ex: Padaria do João"
                    value={form.nome}
                    onChange={(e) => updateField("nome", e.target.value)}
                    className="mt-1.5 h-[42px] focus-visible:border-orange-500 focus-visible:ring-orange-500/30"
                  />
                </div>

                <div>
                  <Label htmlFor="segmento">Segmento de Atuação</Label>
                  <Input
                    id="segmento"
                    placeholder="Ex: Alimentação"
                    value={form.segmento}
                    onChange={(e) => updateField("segmento", e.target.value)}
                    className="mt-1.5 h-[42px] focus-visible:border-orange-500 focus-visible:ring-orange-500/30"
                  />
                </div>

                <div>
                  <Label htmlFor="documento">CNPJ / CPF</Label>
                  <Input
                    id="documento"
                    placeholder="00.000.000/0000-00"
                    value={form.documento}
                    onChange={(e) => updateField("documento", e.target.value)}
                    className="mt-1.5 h-[42px] focus-visible:border-orange-500 focus-visible:ring-orange-500/30"
                  />
                </div>

                <div>
                  <Label htmlFor="contato">Contato (Telefone / WhatsApp)</Label>
                  <Input
                    id="contato"
                    placeholder="(00) 00000-0000"
                    value={form.contato}
                    onChange={(e) => updateField("contato", e.target.value)}
                    className="mt-1.5 h-[42px] focus-visible:border-orange-500 focus-visible:ring-orange-500/30"
                  />
                </div>

                <div>
                  <Label htmlFor="whatsapp">Link WhatsApp</Label>
                  <Input
                    id="whatsapp"
                    placeholder="https://wa.me/5500000000000"
                    value={form.linkWhatsapp}
                    onChange={(e) => updateField("linkWhatsapp", e.target.value)}
                    className="mt-1.5 h-[42px] focus-visible:border-orange-500 focus-visible:ring-orange-500/30"
                  />
                </div>

                <div className="sm:col-span-2">
                  <Label htmlFor="endereco">Endereço</Label>
                  <Input
                    id="endereco"
                    placeholder="Rua, número, bairro, cidade - UF"
                    value={form.endereco}
                    onChange={(e) => updateField("endereco", e.target.value)}
                    className="mt-1.5 h-[42px] focus-visible:border-orange-500 focus-visible:ring-orange-500/30"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ── Logo ────────────────────────────────────────────────── */}
          <Card className="border-border/50 bg-card/50 rounded-2xl">
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500/10">
                  <ImageIcon className="h-4 w-4 text-orange-500" />
                </div>
                <div>
                  <CardTitle>Logo</CardTitle>
                  <CardDescription>
                    Faça upload da logo do cliente (PNG, JPG ou SVG)
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <Separator />
            <CardContent className="pt-6">
              {!form.logoUrl ? (
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOver(true);
                  }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
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
                    Arraste a logo aqui ou clique para selecionar
                  </p>
                  <p className="text-xs text-muted-foreground">
                    PNG, JPG ou SVG — máximo 5MB
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".png,.jpg,.jpeg,.svg"
                    className="hidden"
                    onChange={handleFileInput}
                  />
                </div>
              ) : (
                <div className="relative flex flex-col items-center gap-4">
                  <div className="relative group">
                    <div className="rounded-xl border border-border/50 bg-muted/30 p-6 flex items-center justify-center min-h-[160px]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={form.logoUrl}
                        alt="Logo do cliente"
                        className="max-h-[140px] max-w-[280px] object-contain"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={removeLogo}
                      className="absolute -top-2 -right-2 flex h-7 w-7 items-center justify-center rounded-full bg-destructive/90 text-white shadow-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {form.logoFile?.name} —{" "}
                    {form.logoFile
                      ? (form.logoFile.size / 1024).toFixed(1) + " KB"
                      : ""}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* ── Paleta de Cores ──────────────────────────────────────── */}
          <Card className="border-border/50 bg-card/50 rounded-2xl">
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500/10">
                  <Palette className="h-4 w-4 text-orange-500" />
                </div>
                <div>
                  <CardTitle>Paleta de Cores</CardTitle>
                  <CardDescription>
                    {form.logoUrl
                      ? "Cores extraídas automaticamente da logo. Edite conforme necessário."
                      : "Faça upload da logo para extrair cores automaticamente, ou configure manualmente."}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <Separator />
            <CardContent className="pt-6">
              {extractingColors && (
                <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin text-orange-500" />
                  Extraindo cores da logo...
                </div>
              )}

              {!extractingColors && (
                <div className="space-y-4">
                  {form.cores.map((cor, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 group/color"
                    >
                      {/* Color Swatch + Picker */}
                      <div className="relative">
                        <label
                          className="block h-10 w-10 rounded-full border-2 border-border/50 cursor-pointer shadow-sm hover:shadow-md transition-shadow overflow-hidden"
                          style={{ backgroundColor: cor.hex }}
                        >
                          <input
                            type="color"
                            value={cor.hex}
                            onChange={(e) => updateColor(index, e.target.value)}
                            className="absolute inset-0 opacity-0 cursor-pointer"
                          />
                        </label>
                      </div>

                      {/* Label */}
                      <Input
                        value={cor.label}
                        onChange={(e) =>
                          updateColorLabel(index, e.target.value)
                        }
                        className="h-[38px] max-w-[200px] text-sm focus-visible:border-orange-500 focus-visible:ring-orange-500/30"
                      />

                      {/* Hex Input */}
                      <Input
                        value={cor.hex}
                        onChange={(e) => {
                          let val = e.target.value;
                          if (!val.startsWith("#")) val = "#" + val;
                          updateColor(index, val);
                        }}
                        className="h-[38px] w-[110px] font-mono text-sm focus-visible:border-orange-500 focus-visible:ring-orange-500/30"
                        maxLength={7}
                      />

                      {/* Remove */}
                      <button
                        type="button"
                        onClick={() => removeColor(index)}
                        className="flex h-7 w-7 items-center justify-center rounded-md opacity-0 group-hover/color:opacity-100 transition-opacity hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={addColor}
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-orange-500 transition-colors mt-2"
                  >
                    <Plus className="h-4 w-4" />
                    Adicionar cor
                  </button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* ── Tipografia ───────────────────────────────────────────── */}
          <Card className="border-border/50 bg-card/50 rounded-2xl">
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500/10">
                  <Type className="h-4 w-4 text-orange-500" />
                </div>
                <div>
                  <CardTitle>Tipografia</CardTitle>
                  <CardDescription>
                    Defina as fontes usadas nos criativos do cliente
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <Separator />
            <CardContent className="pt-6">
              <div className="grid gap-5 sm:grid-cols-3">
                <div>
                  <Label htmlFor="fonteTitulo">Fonte de Título</Label>
                  <Input
                    id="fonteTitulo"
                    placeholder="Ex: Montserrat"
                    value={form.fonteTitulo}
                    onChange={(e) => updateField("fonteTitulo", e.target.value)}
                    className="mt-1.5 h-[42px] focus-visible:border-orange-500 focus-visible:ring-orange-500/30"
                  />
                </div>
                <div>
                  <Label htmlFor="fontePreco">Fonte de Preço</Label>
                  <Input
                    id="fontePreco"
                    placeholder="Ex: Oswald"
                    value={form.fontePreco}
                    onChange={(e) => updateField("fontePreco", e.target.value)}
                    className="mt-1.5 h-[42px] focus-visible:border-orange-500 focus-visible:ring-orange-500/30"
                  />
                </div>
                <div>
                  <Label htmlFor="fonteDescricao">Fonte de Descrição</Label>
                  <Input
                    id="fonteDescricao"
                    placeholder="Ex: Open Sans"
                    value={form.fonteDescricao}
                    onChange={(e) =>
                      updateField("fonteDescricao", e.target.value)
                    }
                    className="mt-1.5 h-[42px] focus-visible:border-orange-500 focus-visible:ring-orange-500/30"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column — Live Preview */}
        <div className="lg:sticky lg:top-8 space-y-6 h-fit">
          <Card className="border-border/50 bg-card/50 rounded-2xl">
            <CardHeader>
              <CardTitle className="text-base">Pré-visualização</CardTitle>
              <CardDescription>
                Identidade visual do cliente
              </CardDescription>
            </CardHeader>
            <Separator />
            <CardContent className="pt-6 space-y-6">
              {/* Logo Preview */}
              <div className="flex items-center justify-center rounded-xl bg-muted/30 border border-border/30 p-6 min-h-[100px]">
                {form.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={form.logoUrl}
                    alt="Logo preview"
                    className="max-h-[80px] max-w-full object-contain"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <ImageIcon className="h-8 w-8 opacity-30" />
                    <span className="text-xs">Nenhuma logo</span>
                  </div>
                )}
              </div>

              {/* Company Name */}
              <div className="text-center">
                <p className="text-lg font-semibold">
                  {form.nome || "Nome da Empresa"}
                </p>
                {form.segmento && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {form.segmento}
                  </p>
                )}
              </div>

              {/* Color Palette Preview */}
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2.5">
                  Paleta de Cores
                </p>
                <div className="flex flex-wrap gap-2">
                  {form.cores.map((cor, i) => (
                    <div key={i} className="flex flex-col items-center gap-1">
                      <div
                        className="h-10 w-10 rounded-full border border-border/30 shadow-sm"
                        style={{ backgroundColor: cor.hex }}
                        title={`${cor.label}: ${cor.hex}`}
                      />
                      <span className="text-[10px] text-muted-foreground max-w-[48px] truncate">
                        {cor.hex}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Typography Preview */}
              {(form.fonteTitulo || form.fontePreco || form.fonteDescricao) && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2.5">
                    Tipografia
                  </p>
                  <div className="space-y-1.5 text-xs">
                    {form.fonteTitulo && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Título</span>
                        <span className="font-medium">{form.fonteTitulo}</span>
                      </div>
                    )}
                    {form.fontePreco && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Preço</span>
                        <span className="font-medium">{form.fontePreco}</span>
                      </div>
                    )}
                    {form.fonteDescricao && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Descrição
                        </span>
                        <span className="font-medium">
                          {form.fonteDescricao}
                        </span>
                      </div>
                    )}
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
                  Salvar Cliente
                </>
              )}
            </Button>
            <Link href="/clientes" className="w-full">
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
