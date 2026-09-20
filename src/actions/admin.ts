// Re-exporta as actions e tipos para compatibilidade com TypeScript e Server Actions do Next.js
export * from './admin.js';

export interface ProdutoSupabase {
  id: string;
  nome: string;
  categoria: string;
  imagem_url: string;
  preco: number;
  preco_promocional?: number | null;
  ativo: boolean;
  criado_em: string;
}

export interface ProdutoAdaptado {
  id: string;
  name: string;
  nome: string;
  category: string;
  categoria: string;
  price: number;
  preco: number;
  original_price: number | null;
  promotional_price: number | null;
  preco_promocional: number | null;
  formatted_price: string;
  installments: string;
  image: string;
  imagem_url: string;
  local_image?: string;
  in_stock: boolean;
  ativo: boolean;
  material: string;
  criado_em?: string;
}
