import fs from 'fs';
import { PRODUCTS } from './src/data/products.js';

function escapeSql(str) {
  if (!str) return '';
  return str.replace(/'/g, "''");
}

const values = PRODUCTS.map((p) => {
  const nome = escapeSql(p.name);
  const cat = escapeSql(p.category);
  // Prefere a imagem do CDN ou a imagem local
  const img = escapeSql(p.image || p.local_image);
  const preco = Number(p.price).toFixed(2);
  const promo = p.original_price ? Number(p.original_price).toFixed(2) : 'NULL';
  const ativo = p.in_stock ? 'true' : 'false';
  return `('${nome}', '${cat}', '${img}', ${preco}, ${promo}, ${ativo})`;
});

const sqlInsert = `-- ==============================================================================
-- 7. SEEDS COMPLETOS COM TODOS OS 59 PRODUTOS REAIS DO CATÁLOGO
-- ==============================================================================
-- Dica: se quiser substituir os 10 de teste pelos 59 completos, desmarque a linha abaixo:
-- TRUNCATE TABLE public.produtos;

INSERT INTO public.produtos (nome, categoria, imagem_url, preco, preco_promocional, ativo)
VALUES
${values.join(',\n')}
ON CONFLICT DO NOTHING;
`;

fs.writeFileSync('./supabase/seeds_59.sql', sqlInsert, 'utf-8');
console.log('Sucesso! Gerado supabase/seeds_59.sql com', values.length, 'produtos.');
