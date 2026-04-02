// Categorias de produtos para lojas de material de construção
export const CATEGORIAS_PRODUTO = [
  "Pisos",
  "Azulejos",
  "Porcelanato",
  "Tintas",
  "Portas",
  "Forro PVC",
  "Telhas",
  "Hidráulica",
  "Elétrica",
  "Ferramentas",
  "Outros",
] as const;

// Tipos de preço promocional
export const TIPOS_PRECO = [
  { value: "a-partir-de", label: "A PARTIR DE" },
  { value: "por-apenas", label: "POR APENAS" },
  { value: "de-por", label: "DE/POR" },
] as const;

// Unidades de medida
export const UNIDADES = ["M²", "UND", "Metro", "Caixa", "Litro", "Kg", "Galão"] as const;

// Formas de pagamento
export const FORMAS_PAGAMENTO = [
  "À vista",
  "PIX",
  "Débito",
  "Dinheiro",
  "Cartão",
] as const;

// Formatos de exportação
export const FORMATOS_EXPORTACAO = [
  { value: "1080x1080", label: "Feed (1080×1080)", aspectRatio: "1:1" },
  { value: "1080x1350", label: "Feed (1080×1350)", aspectRatio: "3:4" },
  { value: "1080x1920", label: "Stories (1080×1920)", aspectRatio: "9:16" },
] as const;
