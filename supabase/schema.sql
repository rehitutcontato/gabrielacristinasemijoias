-- ==============================================================================
-- GC SEMIJOIAS & ACESSÓRIOS — SCRIPT SUPABASE (BANCO DE DADOS & STORAGE)
-- ==============================================================================
-- Este script configura:
-- 1. Extensão UUID
-- 2. Tabela 'produtos'
-- 3. Bucket de Storage 'produtos-gc'
-- 4. Políticas de Segurança (Row Level Security - RLS) para tabela e storage
-- 5. Índices de performance para filtros rápidos
-- 6. Seeds opcionais com dados reais do catálogo
-- ==============================================================================

-- 1. HABILITA EXTENSÃO PARA GERAÇÃO DE UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. CRIAÇÃO DA TABELA DE PRODUTOS
CREATE TABLE IF NOT EXISTS public.produtos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome TEXT NOT NULL,
    categoria TEXT NOT NULL,
    imagem_url TEXT NOT NULL,
    preco NUMERIC(10,2) NOT NULL,
    preco_promocional NUMERIC(10,2) NULL,
    ativo BOOLEAN NOT NULL DEFAULT true,
    criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Comentários das colunas para documentação do catálogo
COMMENT ON TABLE public.produtos IS 'Tabela de produtos do Catálogo Digital GC Semijoias';
COMMENT ON COLUMN public.produtos.id IS 'Identificador único do produto (UUID v4)';
COMMENT ON COLUMN public.produtos.nome IS 'Nome comercial da semijoia';
COMMENT ON COLUMN public.produtos.categoria IS 'Categoria (ex: Brincos, Colares, Pulseiras, Anéis, Conjuntos, Piercings)';
COMMENT ON COLUMN public.produtos.imagem_url IS 'URL pública da fotografia da peça (Supabase Storage ou CDN)';
COMMENT ON COLUMN public.produtos.preco IS 'Preço regular de venda (formato decimal 10,2)';
COMMENT ON COLUMN public.produtos.preco_promocional IS 'Preço promocional opcional (formato decimal 10,2)';
COMMENT ON COLUMN public.produtos.ativo IS 'Flag de disponibilidade na vitrine (true = Disponível / false = Esgotado)';
COMMENT ON COLUMN public.produtos.criado_em IS 'Data e hora do cadastro do produto';

-- 3. ÍNDICES DE ALTA PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_produtos_ativo ON public.produtos (ativo);
CREATE INDEX IF NOT EXISTS idx_produtos_categoria ON public.produtos (categoria);
CREATE INDEX IF NOT EXISTS idx_produtos_criado_em ON public.produtos (criado_em DESC);

-- 4. CONFIGURAÇÃO DE RLS (ROW LEVEL SECURITY) NA TABELA PRODUTOS
ALTER TABLE public.produtos ENABLE ROW LEVEL SECURITY;

-- Política de Leitura Pública: Qualquer visitante da vitrine pode ler produtos ativos (e no admin lê todos)
DROP POLICY IF EXISTS "Permitir leitura publica de produtos" ON public.produtos;
CREATE POLICY "Permitir leitura publica de produtos"
ON public.produtos
FOR SELECT
USING (true);

-- Política de Inserção: Permite cadastro de novos produtos via Server Actions / anon / service_role
DROP POLICY IF EXISTS "Permitir insercao de produtos" ON public.produtos;
CREATE POLICY "Permitir insercao de produtos"
ON public.produtos
FOR INSERT
WITH CHECK (true);

-- Política de Atualização: Permite atualização de preços e status ativo
DROP POLICY IF EXISTS "Permitir atualizacao de produtos" ON public.produtos;
CREATE POLICY "Permitir atualizacao de produtos"
ON public.produtos
FOR UPDATE
USING (true)
WITH CHECK (true);

-- Política de Exclusão: Permite exclusão de produtos
DROP POLICY IF EXISTS "Permitir exclusao de produtos" ON public.produtos;
CREATE POLICY "Permitir exclusao de produtos"
ON public.produtos
FOR DELETE
USING (true);


-- 5. CRIAÇÃO E CONFIGURAÇÃO DO BUCKET NO SUPABASE STORAGE
-- Cria o bucket 'produtos-gc' como público caso não exista
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'produtos-gc',
    'produtos-gc',
    true,
    5242880, -- Limite de 5MB por foto
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/jpg', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
    public = true,
    file_size_limit = 5242880,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/jpg', 'image/gif'];

-- 6. POLÍTICAS DE RLS PARA O STORAGE (storage.objects)

-- Permite leitura pública de todas as fotos armazenadas no bucket produtos-gc
DROP POLICY IF EXISTS "Permitir leitura publica de fotos produtos-gc" ON storage.objects;
CREATE POLICY "Permitir leitura publica de fotos produtos-gc"
ON storage.objects
FOR SELECT
USING (bucket_id = 'produtos-gc');

-- Permite upload de imagens no bucket produtos-gc
DROP POLICY IF EXISTS "Permitir upload de fotos produtos-gc" ON storage.objects;
CREATE POLICY "Permitir upload de fotos produtos-gc"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'produtos-gc');

-- Permite atualização/substituição de fotos no bucket produtos-gc
DROP POLICY IF EXISTS "Permitir atualizacao de fotos produtos-gc" ON storage.objects;
CREATE POLICY "Permitir atualizacao de fotos produtos-gc"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'produtos-gc');

-- Permite exclusão de fotos no bucket produtos-gc
DROP POLICY IF EXISTS "Permitir exclusao de fotos produtos-gc" ON storage.objects;
CREATE POLICY "Permitir exclusao de fotos produtos-gc"
ON storage.objects
FOR DELETE
USING (bucket_id = 'produtos-gc');


-- ==============================================================================
-- 7. SEEDS INICIAIS (CARGA DOS PRODUTOS REAIS DO CATÁLOGO)
-- ==============================================================================
INSERT INTO public.produtos (nome, categoria, imagem_url, preco, preco_promocional, ativo)
VALUES
('Brinco Argola Detalhada Luxo | Banho Ródio Branco', 'Brincos', 'https://dcdn-us.mitiendanube.com/stores/008/220/157/products/104c735e-6c0e-412e-bd4f-78ec442396b7-4f214cecf7096bc8ad17897014703267-1024-1024.webp', 39.90, NULL, true),
('Brinco Coração Plissado | Banho Ouro', 'Brincos', 'https://dcdn-us.mitiendanube.com/stores/008/220/157/products/c8ab0b2d-17a3-4a88-a729-080653786f58-16e99ff1a6fd9a711017897013134321-1024-1024.webp', 29.90, NULL, true),
('Colar Filha Menina Vazado | Banho Ouro', 'Colares', 'https://dcdn-us.mitiendanube.com/stores/008/220/157/products/359fbd85-6a41-488a-9af7-c6d2b55c3816-da01a2c93e9676eedb17897010771872-1024-1024.webp', 49.90, NULL, true),
('Colar Choker Flores Vazadas | Banho Ouro', 'Colares', 'https://dcdn-us.mitiendanube.com/stores/008/220/157/products/e3ffb0aa-eebd-46e3-8877-cb50a71a89ca-67f47c066355a373cb17897008751288-1024-1024.webp', 69.90, NULL, true),
('Pulseira Infantil Mini Pérolas | Banho Ouro', 'Pulseiras', 'https://dcdn-us.mitiendanube.com/stores/008/220/157/products/af1e1687-b6c8-4f4a-8875-4b1708251b02-f37565f98b690dd0b017897007166386-1024-1024.webp', 49.90, NULL, true),
('Dupla de Brincos Estrelas | Banho Ródio Branco', 'Brincos', 'https://dcdn-us.mitiendanube.com/stores/008/220/157/products/cfd25d42-bada-4a8b-b951-ed5222c82d0f-e4ad7fe1a2343c39ba17897004045621-1024-1024.webp', 49.90, NULL, true),
('Brinco Estrela Raio Solares | Pedra Preto Ônix', 'Brincos', 'https://dcdn-us.mitiendanube.com/stores/008/220/157/products/chatgpt-image-17-de-set-de-2026-23_09_12-69ba8128fe5f5e283017896975003355-1024-1024.webp', 69.90, NULL, true),
('Conjunto Colar e Brincos Gota Fusion Verde Esmeralda', 'Conjuntos & Mix', 'https://dcdn-us.mitiendanube.com/stores/008/220/157/products/chatgpt-image-17-de-set-de-2026-22_44_20-410a6231be4d8eb33017896959954005-1024-1024.webp', 89.90, 79.90, true),
('Anel Solitário Cravejado Zircônias | Banho Ouro', 'Anéis', 'https://dcdn-us.mitiendanube.com/stores/008/220/157/products/chatgpt-image-17-de-set-de-2026-22_42_31-b0db0ba5ae893be2a317896958869152-1024-1024.webp', 59.90, NULL, true),
('Pulseira Elos Cartier com Fecho Boia | Banho Ouro', 'Pulseiras', 'https://dcdn-us.mitiendanube.com/stores/008/220/157/products/chatgpt-image-17-de-set-de-2026-22_40_47-497d3910c01d4a89fb17896957805177-1024-1024.webp', 79.90, NULL, true)
ON CONFLICT DO NOTHING;
