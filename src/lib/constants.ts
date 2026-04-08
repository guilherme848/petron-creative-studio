// Categorias de produtos para lojas de material de construção
// Estrutura: Categoria → Subcategorias
export const CATEGORIAS_MATCON = {
  "Revestimentos": [
    "Porcelanato",
    "Piso Cerâmico",
    "Azulejo",
    "Piso Vinílico / SPC",
    "Piso Laminado",
    "Pastilha",
    "Pedra Natural",
    "Rodapé / Soleira",
    "Rejunte / Argamassa Colante",
  ],
  "Tintas e Acabamentos": [
    "Tinta Imobiliária",
    "Tinta Esmalte",
    "Verniz / Stain",
    "Massa Corrida / PVA",
    "Textura / Grafiato",
    "Impermeabilizante",
    "Selador / Fundo",
    "Acessórios de Pintura",
  ],
  "Louças e Metais": [
    "Vaso Sanitário",
    "Cuba / Lavatório",
    "Pia de Cozinha",
    "Torneira / Misturador",
    "Chuveiro / Ducha",
    "Acessórios de Banheiro",
    "Tanque",
  ],
  "Hidráulica": [
    "Tubo PVC / CPVC",
    "Conexões",
    "Registro / Válvula",
    "Caixa d'Água",
    "Bomba d'Água",
    "Aquecedor",
    "Fossa / Esgoto",
  ],
  "Elétrica e Iluminação": [
    "Fio / Cabo",
    "Disjuntor / Quadro",
    "Tomada / Interruptor",
    "Luminária",
    "Lâmpada LED",
    "Fita LED",
    "Painel Solar",
  ],
  "Portas e Janelas": [
    "Porta de Madeira",
    "Porta de Alumínio",
    "Porta de Correr",
    "Janela de Alumínio",
    "Janela de Vidro",
    "Fechadura / Dobradiça",
    "Batente / Guarnição",
  ],
  "Cobertura e Forro": [
    "Telha Cerâmica",
    "Telha Fibrocimento",
    "Telha Metálica / Sanduíche",
    "Telha Transparente",
    "Forro PVC",
    "Forro Gesso / Drywall",
    "Calha / Rufo",
  ],
  "Cimento e Argamassa": [
    "Cimento CP II / CP V",
    "Argamassa Pronta",
    "Concreto / Graute",
    "Cal",
    "Areia / Pedra / Brita",
  ],
  "Estrutura e Alvenaria": [
    "Tijolo / Bloco",
    "Laje Pré-Moldada",
    "Vergalhão / Ferro",
    "Tela / Arame",
    "Madeira Estrutural",
    "Drywall / Steel Frame",
  ],
  "Ferragens e Ferramentas": [
    "Parafuso / Bucha",
    "Ferramenta Manual",
    "Ferramenta Elétrica",
    "Disco / Serra / Broca",
    "EPI",
    "Escada / Andaime",
  ],
  "Jardim e Área Externa": [
    "Piso Externo / Cimentício",
    "Grama Sintética",
    "Pergolado / Deck",
    "Churrasqueira / Forno",
    "Mangueira / Irrigação",
  ],
  "Móveis e Decoração": [
    "Bancada / Tampo",
    "Gabinete de Banheiro",
    "Gabinete de Cozinha",
    "Prateleira / Suporte",
    "Espelho",
    "Papel de Parede",
  ],
} as const;

// Lista flat de todas as subcategorias
export const SUBCATEGORIAS_PRODUTO = Object.entries(CATEGORIAS_MATCON).flatMap(
  ([, subs]) => [...subs]
);

// Lista de categorias
export const CATEGORIAS = Object.keys(CATEGORIAS_MATCON) as (keyof typeof CATEGORIAS_MATCON)[];

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

// Fontes disponíveis para criativos promocionais
export const FONTES_TITULO = [
  "Montserrat",
  "Oswald",
  "Bebas Neue",
  "Anton",
  "Impact",
  "Poppins",
  "Roboto Condensed",
  "Raleway",
  "Barlow Condensed",
  "Archivo Black",
] as const;

export const FONTES_PRECO = [
  "Oswald",
  "Bebas Neue",
  "Anton",
  "Impact",
  "Montserrat",
  "Barlow Condensed",
  "Roboto Condensed",
  "Archivo Black",
  "Teko",
  "Fjalla One",
] as const;

export const FONTES_DESCRICAO = [
  "Open Sans",
  "Roboto",
  "Lato",
  "Poppins",
  "Nunito",
  "Source Sans 3",
  "Inter",
  "Montserrat",
  "PT Sans",
  "Raleway",
] as const;

// Formatos de exportação
export const FORMATOS_EXPORTACAO = [
  { value: "1080x1080", label: "Feed (1080×1080)", aspectRatio: "1:1" },
  { value: "1080x1350", label: "Feed (1080×1350)", aspectRatio: "3:4" },
  { value: "1080x1920", label: "Stories (1080×1920)", aspectRatio: "9:16" },
] as const;
