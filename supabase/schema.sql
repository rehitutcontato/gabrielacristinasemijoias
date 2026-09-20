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
    material TEXT NOT NULL DEFAULT 'Banho Ouro 18k',
    imagem_url TEXT NOT NULL,
    preco NUMERIC(10,2) NOT NULL,
    preco_promocional NUMERIC(10,2) NULL,
    tamanhos JSONB NOT NULL DEFAULT '[]'::jsonb,
    cores JSONB NOT NULL DEFAULT '[]'::jsonb,
    ativo BOOLEAN NOT NULL DEFAULT true,
    criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Migração para tabelas já existentes: adiciona colunas sem perda de dados
ALTER TABLE public.produtos ADD COLUMN IF NOT EXISTS material TEXT DEFAULT 'Banho Ouro 18k';
ALTER TABLE public.produtos ADD COLUMN IF NOT EXISTS tamanhos JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.produtos ADD COLUMN IF NOT EXISTS cores JSONB DEFAULT '[]'::jsonb;

-- Comentários das colunas para documentação do catálogo
COMMENT ON TABLE public.produtos IS 'Tabela de produtos do Catálogo Digital GC Semijoias';
COMMENT ON COLUMN public.produtos.id IS 'Identificador único do produto (UUID v4)';
COMMENT ON COLUMN public.produtos.nome IS 'Nome comercial da semijoia';
COMMENT ON COLUMN public.produtos.categoria IS 'Categoria (ex: Brincos, Colares, Pulseiras, Anéis, Conjuntos, Piercings)';
COMMENT ON COLUMN public.produtos.material IS 'Tipo de banho ou material nobre (ex: Banho Ouro 18k, Ródio Branco, Prata 925)';
COMMENT ON COLUMN public.produtos.imagem_url IS 'URL pública da fotografia da peça (Supabase Storage ou CDN)';
COMMENT ON COLUMN public.produtos.preco IS 'Preço regular de venda (formato decimal 10,2)';
COMMENT ON COLUMN public.produtos.preco_promocional IS 'Preço promocional opcional (formato decimal 10,2)';
COMMENT ON COLUMN public.produtos.tamanhos IS 'Array JSON de tamanhos/aros disponíveis (ex: ["14", "16", "18", "20", "22"])';
COMMENT ON COLUMN public.produtos.cores IS 'Array JSON de variações de cor/banho disponíveis';
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
-- 7. SEEDS COMPLETOS (CARGA DOS 59 PRODUTOS REAIS DO CATÁLOGO)
-- ==============================================================================
-- Se desejar limpar a tabela antes de recarregar todos:
-- TRUNCATE TABLE public.produtos;

INSERT INTO public.produtos (nome, categoria, imagem_url, preco, preco_promocional, ativo)
VALUES
('Brinco Argola Detalhada Luxo | Banho Ródio Branco', 'Brincos', 'https://dcdn-us.mitiendanube.com/stores/008/220/157/products/104c735e-6c0e-412e-bd4f-78ec442396b7-4f214cecf7096bc8ad17897014703267-1024-1024.webp', 39.90, NULL, true),
('Brinco Coração Plissado | Banho Ouro', 'Brincos', 'https://dcdn-us.mitiendanube.com/stores/008/220/157/products/c8ab0b2d-17a3-4a88-a729-080653786f58-16e99ff1a6fd9a711017897013134321-1024-1024.webp', 29.90, NULL, true),
('Colar Filha Menina Vazado | Banho Ouro', 'Colares', 'https://dcdn-us.mitiendanube.com/stores/008/220/157/products/359fbd85-6a41-488a-9af7-c6d2b55c3816-da01a2c93e9676eedb17897010771872-1024-1024.webp', 49.90, NULL, true),
('Colar Choker Flores Vazadas | Banho Ouro', 'Colares', 'https://dcdn-us.mitiendanube.com/stores/008/220/157/products/e3ffb0aa-eebd-46e3-8877-cb50a71a89ca-67f47c066355a373cb17897008751288-1024-1024.webp', 69.90, NULL, true),
('Pulseira Infantil Mini Pérolas | Banho Ouro', 'Pulseiras', 'https://dcdn-us.mitiendanube.com/stores/008/220/157/products/af1e1687-b6c8-4f4a-8875-4b1708251b02-f37565f98b690dd0b017897007166386-1024-1024.webp', 49.90, NULL, true),
('Dupla de Brincos Estrelas | Banho Ródio Branco', 'Brincos', 'https://dcdn-us.mitiendanube.com/stores/008/220/157/products/cfd25d42-bada-4a8b-b951-ed5222c82d0f-e4ad7fe1a2343c39ba17897004045621-1024-1024.webp', 49.90, NULL, true),
('Brinco Estrela Raio Solares | Pedra Preto Ônix', 'Brincos', 'https://dcdn-us.mitiendanube.com/stores/008/220/157/products/chatgpt-image-17-de-set-de-2026-23_09_12-69ba8128fe5f5e283017896975003355-1024-1024.webp', 69.90, NULL, true),
('Brinco Argola Esferas | Banho Ródio Branco', 'Brincos', 'https://dcdn-us.mitiendanube.com/stores/008/220/157/products/chatgpt-image-17-de-set-de-2026-23_00_45-1a5c5a3c84a23983fb17896970061458-1024-1024.webp', 89.90, NULL, true),
('Brinco Argolinha Pérola | Banho Ródio Branco', 'Brincos', 'https://dcdn-us.mitiendanube.com/stores/008/220/157/products/chatgpt-image-17-de-set-de-2026-22_47_11-36baf67d709f0bc04e17896961117078-1024-1024.webp', 39.90, NULL, true),
('Dupla de Brinco Argola Simétrica | Banho Ouro', 'Brincos', 'https://dcdn-us.mitiendanube.com/stores/008/220/157/products/chatgpt-image-17-de-set-de-2026-22_44_02-2161171bf70dafdf3f17896958549091-1024-1024.webp', 79.90, NULL, true),
('Brinco Ursinho Cravejado em Zircônias | Banho Ouro', 'Brincos', 'https://dcdn-us.mitiendanube.com/stores/008/220/157/products/chatgpt-image-17-de-set-de-2026-22_35_55-57f4f0605705c5449217896954341640-1024-1024.webp', 49.90, NULL, true),
('Anel Bolinhas Zircônia Cristal | Tam.15', 'Anéis', 'https://dcdn-us.mitiendanube.com/stores/008/220/157/products/bd5a1fc0-c243-446b-9b52-c1d6cec17743-6256e6a69aba4a57fe17896949523478-1024-1024.webp', 49.90, NULL, true),
('Anel Gota Chuveiro Cravejado | Banhado a Ouro', 'Anéis', 'https://dcdn-us.mitiendanube.com/stores/008/220/157/products/al7958-20251208175813-1765227507-7816-201d9463cf04b7f81d17896941187758-1024-1024.webp', 89.90, NULL, true),
('Pulseira Pontos de Luz em Zircônias | Prata', 'Pulseiras', 'https://dcdn-us.mitiendanube.com/stores/008/220/157/products/chatgpt-image-17-de-set-de-2026-22_07_01-2f4acf7cb3143f6bcc17896937295969-1024-1024.webp', 59.90, NULL, true),
('Argola Unique Retangular | Banho Ouro', 'Brincos', 'https://dcdn-us.mitiendanube.com/stores/008/220/157/products/chatgpt-image-17-de-set-de-2026-22_00_34-636714ae508ae6028617896932460748-1024-1024.webp', 35.00, NULL, true),
('Colar Pontos de Luz em Zircônias Cristal | Prata', 'Colares', 'https://dcdn-us.mitiendanube.com/stores/008/220/157/products/5cdb3512-b1c0-484d-ac49-493ec376970a-a1e6c4e6a1ab76ad2217896872657480-1024-1024.webp', 79.90, NULL, true),
('Piercing Fake Liso', 'Piercings', 'https://dcdn-us.mitiendanube.com/stores/008/220/157/products/fe07fc59-3fdf-46d4-8564-8d6d9cc7c819-4ddf6895887c1465f817896861739630-1024-1024.webp', 19.90, NULL, true),
('Trio Pontos de Luz Zircônia Rosa | Banho Ouro', 'Brincos', 'https://dcdn-us.mitiendanube.com/stores/008/220/157/products/8c4751dc-10cc-4871-a62a-54055b92ed7b-57e552bc4b37c6612c17896858089428-1024-1024.webp', 49.90, NULL, true),
('Trio de Argolas Classic | Banho Prata', 'Brincos', 'https://dcdn-us.mitiendanube.com/stores/008/220/157/products/whatsapp-image-2026-09-17-at-19-22-33-432b235a682705c60517896837875857-1024-1024.webp', 59.90, NULL, true),
('Brinco Ponto de Luz M | Banho Prata', 'Brincos', 'https://dcdn-us.mitiendanube.com/stores/008/220/157/products/whatsapp-image-2026-09-17-at-19-16-00-cb0a3e98db79fd08e517896833808039-1024-1024.webp', 29.90, NULL, true),
('Brinco Ponto de Luz 7MM | Banhado a Ródio Branco', 'Brincos', 'https://dcdn-us.mitiendanube.com/stores/008/220/157/products/br15744-20260804135148-1785862309-9519-2cdd5e53220310131217896830076307-1024-1024.webp', 19.90, NULL, true),
('Brinco Ponto de Luz Zircônia Ametista | Banho Ouro', 'Brincos', 'https://dcdn-us.mitiendanube.com/stores/008/220/157/products/whatsapp-image-2026-09-17-at-18-50-49-db09c68307bff28ead17896822958252-1024-1024.webp', 9.90, NULL, true),
('Brinco Ponto de Luz Zircônia Amarela | Banho Ouro', 'Brincos', 'https://dcdn-us.mitiendanube.com/stores/008/220/157/products/whatsapp-image-2026-09-17-at-18-44-46-f678643cc292525d2917896815108144-1024-1024.webp', 15.00, NULL, true),
('Brinco Bola P | Banhado a Ródio Branco.', 'Brincos', 'https://dcdn-us.mitiendanube.com/stores/008/220/157/products/whatsapp-image-2026-09-17-at-18-38-01-b59585b0f8d99b765e17896811042905-1024-1024.webp', 19.90, NULL, true),
('Mix Dupla de Argola Bola e Piercing Fake Trançado', 'Conjuntos & Mix', 'https://dcdn-us.mitiendanube.com/stores/008/220/157/products/whatsapp-image-2026-09-17-at-18-30-55-0ce12b6ba07377049a17896806739332-1024-1024.webp', 89.90, NULL, true),
('Trio de Brinco Ponto de Luz Coração', 'Brincos', 'https://dcdn-us.mitiendanube.com/stores/008/220/157/products/whatsapp-image-2026-09-17-at-18-25-32-677f507f364d27f90717896803654614-1024-1024.webp', 89.90, NULL, true),
('TRIO DE BRINCO PONTO DE LUZ REDONDO', 'Brincos', 'https://dcdn-us.mitiendanube.com/stores/008/220/157/products/whatsapp-image-2026-09-17-at-18-15-23-ca6f14f5b6cbd04b1417896797422232-1024-1024.webp', 79.90, NULL, true),
('MIX TRIO DE ARGOLA CRAVEJADA COLORIDA LISA', 'Conjuntos & Mix', 'https://dcdn-us.mitiendanube.com/stores/008/220/157/products/mix0130_02-6930ebe3db20a4c5ca17896794399731-1024-1024.webp', 89.90, NULL, true),
('MIX DE ARGOLA TREVO COM PIERCING FAKE', 'Conjuntos & Mix', 'https://dcdn-us.mitiendanube.com/stores/008/220/157/products/mix0140-9706c6f476c31fa16a17896790873310-1024-1024.webp', 89.90, NULL, true),
('MIX TRIO DE ARGOLA CRAVEJADA COLORIDA', 'Conjuntos & Mix', 'https://dcdn-us.mitiendanube.com/stores/008/220/157/products/mix0141-cf9eac6a0133d2bbfb17896783946894-1024-1024.webp', 89.90, NULL, true),
('MIX TRIO DE ARGOLA CRAVEJADA', 'Conjuntos & Mix', 'https://dcdn-us.mitiendanube.com/stores/008/220/157/products/mix0146-a6593f65b8dfc6276a17896782344341-1024-1024.webp', 89.90, NULL, true),
('MIX TRIO DE ARGOLA CRAVEJADA', 'Conjuntos & Mix', 'https://dcdn-us.mitiendanube.com/stores/008/220/157/products/mix0145-45651fc86d7f68c86717896780895548-1024-1024.webp', 89.90, NULL, true),
('BRINCO GOTA COLORIDA', 'Brincos', 'https://dcdn-us.mitiendanube.com/stores/008/220/157/products/whatsapp-image-2026-09-17-at-17-42-43-b1ed362a27ddf0bcb917896778163927-1024-1024.webp', 29.90, NULL, true),
('CORDÃO BAIANO CLASSIC', 'Colares', 'https://dcdn-us.mitiendanube.com/stores/008/220/157/products/30cd6fa8-80df-4baf-8306-4472f930fccb-82b0531ad85fcba13917896033455567-1024-1024.webp', 99.90, NULL, true),
('BRINCO PONTO DE LUZ G', 'Brincos', 'https://dcdn-us.mitiendanube.com/stores/008/220/157/products/1d6b9a97-c29d-4def-b7ef-d6c5a878767a-0b8d998329fde1c9c617896030990710-1024-1024.webp', 39.90, NULL, true),
('BRINCO PONTO DE LUZ 2 EM 1', 'Brincos', 'https://dcdn-us.mitiendanube.com/stores/008/220/157/products/52618be7-f066-4713-a90d-7c108921025d-f2bd45c7ae3f81e26e17896028125392-1024-1024.webp', 69.90, NULL, true),
('ANEL CORAÇÃO VAZADO', 'Anéis', 'https://dcdn-us.mitiendanube.com/stores/008/220/157/products/1d8f56f6-0679-461e-b25e-e7300aab82f2-70252f7a46e3d6f35117896022565738-1024-1024.webp', 49.90, NULL, true),
('Anel Retangular Solitário Maxi | Tam.17', 'Anéis', 'https://dcdn-us.mitiendanube.com/stores/008/220/157/products/8eee1ac9-d468-4dc8-af49-feabaf66360c-89ee70b472e84902c817896017572986-1024-1024.webp', 129.90, NULL, true),
('BRINCOS CORAÇÕES TEXTURIZADOS', 'Brincos', 'https://dcdn-us.mitiendanube.com/stores/008/220/157/products/5c05f3f8-3160-402d-b7a8-4bca39daeb92-b866fa3be2890e824717894224265699-1024-1024.webp', 49.90, NULL, true),
('BRINCO ARGOLA CLICK LISO P', 'Brincos', 'https://dcdn-us.mitiendanube.com/stores/008/220/157/products/b143d923-a713-4345-9a63-2a1232ac84ea-f889a5879b0e66150517894221205247-1024-1024.webp', 29.90, NULL, true),
('BRINCO BORBOLETA EM MICROZIRCÔNIAS', 'Brincos', 'https://dcdn-us.mitiendanube.com/stores/008/220/157/products/afd213dd-4078-44d8-9230-5496d45b2216-521239a4c9309b2b2217894218770490-1024-1024.webp', 49.90, NULL, true),
('BRINCO LAÇO TEXTURIZADO', 'Brincos', 'https://dcdn-us.mitiendanube.com/stores/008/220/157/products/d1d556dd-7c01-4a63-9f46-40bd0a73b425-034ddc43e1f002759017894213973819-1024-1024.webp', 59.90, NULL, true),
('BRINCO ÁRVORE DA VIDA TEXTURIZADO', 'Brincos', 'https://dcdn-us.mitiendanube.com/stores/008/220/157/products/d97ded1c-1430-4b2e-b489-eac6362fd38d-062e792252603759ef17894211985811-1024-1024.webp', 39.90, NULL, true),
('BRINCO MEDALHA CORAÇÃO COM ZIRCÔNIAS', 'Brincos', 'https://dcdn-us.mitiendanube.com/stores/008/220/157/products/feb71184-a6a0-4401-a9f1-a9b8f4326edc-c7e7040de3d5af125b17894148467760-1024-1024.webp', 29.90, NULL, true),
('BRINCO ARGOLINHA CORAÇÃO VAZADO', 'Brincos', 'https://dcdn-us.mitiendanube.com/stores/008/220/157/products/d0c1823d-d664-4816-83e1-30fabe214f3b-bf8d422e672745039f17894145311323-1024-1024.webp', 19.90, NULL, true),
('Brinco argolinha mini coração', 'Brincos', 'https://dcdn-us.mitiendanube.com/stores/008/220/157/products/ef199d9f-fbf8-4d1e-a850-948641cf20fc-63c6996ffcc25b976e17894141230805-1024-1024.webp', 29.90, NULL, true),
('Brinco Argolinha Click INSP. Cart', 'Brincos', 'https://dcdn-us.mitiendanube.com/stores/008/220/157/products/8b00eca5-2e01-4481-8b4d-0607c135c867-d768233c3b05f1bf1217894139039360-1024-1024.webp', 39.90, NULL, true),
('Brinco Argolinha Click INSP. Cart', 'Brincos', 'https://dcdn-us.mitiendanube.com/stores/008/220/157/products/fa98ecc1-ba29-410d-b516-93f3886dc556-f913f415ee36bf401617894136909638-1024-1024.webp', 39.90, NULL, true),
('Brinco Redondo Mini Cravejado Zircônia', 'Brincos', 'https://dcdn-us.mitiendanube.com/stores/008/220/157/products/6cc9039e-9644-41a0-9ae7-f5a696c2af55-fbe15be099476b958617894134186614-1024-1024.webp', 39.90, NULL, true),
('BRINCO DELICADO ROSA', 'Brincos', 'https://dcdn-us.mitiendanube.com/stores/008/220/157/products/56d22373-4aba-4172-9dda-d67264e79da0-01e45caeaf4fb385b617894115294069-1024-1024.webp', 19.90, NULL, true),
('BRINCO CORAÇÃO DETALHADO VAZADO', 'Brincos', 'https://dcdn-us.mitiendanube.com/stores/008/220/157/products/e8440d47-9927-404e-a38f-e245e92ae096-a0db3277dbee732bd517894113440180-1024-1024.webp', 19.90, NULL, true),
('BRINCO ARGOLA LISA CORAÇÃO TUBO', 'Brincos', 'https://dcdn-us.mitiendanube.com/stores/008/220/157/products/2e6cafd7-638a-412d-927c-c84360fb6579-c4ea7812e378a02f5817894111875625-1024-1024.webp', 49.90, NULL, true),
('BRINCO MINI FLOR 3 GOTAS TRIPLAS', 'Brincos', 'https://dcdn-us.mitiendanube.com/stores/008/220/157/products/d0549cfe-881d-4f62-963d-ec86e0af3cf4-5202cd4f143b339a0017894063796283-1024-1024.webp', 19.90, NULL, true),
('Brinco Trevo Vazado', 'Brincos', 'https://dcdn-us.mitiendanube.com/stores/008/220/157/products/e84494b2-8a6b-4dce-bf46-aa01efb9ada5-63a6847fc72e88e28317894060989479-1024-1024.webp', 19.90, NULL, true),
('Brinco Argola Martelada G', 'Brincos', 'https://dcdn-us.mitiendanube.com/stores/008/220/157/products/img_1924-9ca5e37cd383e2cab117894057527310-1024-1024.webp', 69.90, NULL, true),
('Brinco Coração Derretido', 'Brincos', 'https://dcdn-us.mitiendanube.com/stores/008/220/157/products/5f830c4b-c162-4d74-a7c5-f3a44e551893-b3826cc21226a1250717890395788702-1024-1024.webp', 79.90, NULL, true),
('Brinco Borboleta meio a meio vazado zircônia cristais', 'Brincos', 'https://dcdn-us.mitiendanube.com/stores/008/220/157/products/f1ebb27a-d17d-44cf-be5a-0918668372c4-80595103a03440910517890034119557-1024-1024.webp', 39.90, NULL, true),
('Choker Penduricalho de Mini Estrelas', 'Colares', 'https://dcdn-us.mitiendanube.com/stores/008/220/157/products/a702549f-eb72-4c4b-b4d1-5e084641552a-7e948e1445476e382a17890018539476-1024-1024.webp', 99.90, NULL, true),
('Brinco Argola Elos Arredondados | Banho Ouro', 'Brincos', 'https://dcdn-us.mitiendanube.com/stores/008/220/157/products/chatgpt-image-17-de-set-de-2026-22_51_36-006cf8cf212566ebfa17896963856105-1024-1024.webp', 69.90, NULL, true)
ON CONFLICT DO NOTHING;
