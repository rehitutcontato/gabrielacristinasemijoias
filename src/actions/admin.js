import { getSupabaseClient, getSupabaseCredentials } from '../lib/supabase';
import { PRODUCTS } from '../data/products';

const OVERRIDES_STORAGE_KEY = 'gc_catalog_overrides_v1';
const CUSTOM_PRODUCTS_KEY = 'gc_custom_products_v1';

/**
 * Funções auxiliares de persistência local para garantir que qualquer alteração
 * feita no Admin seja mantida instantaneamente na vitrine.
 */
export function getLocalOverrides() {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(OVERRIDES_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveLocalOverrides(overrides) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(OVERRIDES_STORAGE_KEY, JSON.stringify(overrides));
  } catch (e) {
    console.error('Erro ao salvar no storage local:', e);
  }
}

export function getCustomProducts() {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(CUSTOM_PRODUCTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveCustomProducts(list) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(CUSTOM_PRODUCTS_KEY, JSON.stringify(list));
  } catch (e) {
    console.error('Erro ao salvar produtos customizados:', e);
  }
}

/**
 * Função de revalidação de cache / rotas compatível com Next.js e Vite SPA
 */
export async function revalidatePath(path) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('gc-catalog-revalidate', { detail: { path, timestamp: Date.now() } })
    );
  }
}

/**
 * Normaliza e adapta o formato do produto vindo do Supabase ou do catálogo
 */
export function mapSupabaseProduct(p) {
  const price = Number(p.preco !== undefined ? p.preco : p.price) || 0;
  const rawPromo = p.preco_promocional !== undefined ? p.preco_promocional : p.promotional_price;
  const promotionalPrice = rawPromo != null && rawPromo !== '' ? Number(rawPromo) : null;
  const effectivePrice = promotionalPrice && promotionalPrice > 0 ? promotionalPrice : price;

  const formatted_price = `R$ ${effectivePrice.toFixed(2).replace('.', ',')}`;
  const installmentVal = (effectivePrice / 3).toFixed(2).replace('.', ',');
  const installments = `3x de R$ ${installmentVal} sem juros`;

  let material = p.material || 'Banho Ouro 18k';
  const nameLower = (p.nome || p.name || '').toLowerCase();
  if (nameLower.includes('ródio') || nameLower.includes('rodio')) {
    material = 'Ródio Branco';
  } else if (nameLower.includes('prata')) {
    material = 'Banho Prata 925';
  } else if (nameLower.includes('ouro')) {
    material = 'Banho Ouro 18k';
  } else if (nameLower.includes('ônix') || nameLower.includes('onix') || nameLower.includes('pedra')) {
    material = 'Banho Ouro 18k / Pedras';
  }

  const isAtivo = p.ativo !== undefined ? Boolean(p.ativo) : (p.in_stock ?? true);

  return {
    id: p.id,
    name: p.nome || p.name,
    nome: p.nome || p.name,
    category: p.categoria || p.category,
    categoria: p.categoria || p.category,
    price: effectivePrice,
    preco: price,
    original_price: promotionalPrice ? price : null,
    promotional_price: promotionalPrice,
    preco_promocional: promotionalPrice,
    formatted_price,
    installments,
    image: p.imagem_url || p.image || p.local_image,
    imagem_url: p.imagem_url || p.image || p.local_image,
    local_image: p.local_image || p.imagem_url || p.image,
    in_stock: isAtivo,
    ativo: isAtivo,
    material,
    criado_em: p.criado_em,
  };
}

/**
 * Aplica overrides salvos localmente sobre um produto
 */
function applyOverrides(product, overrides) {
  const o = overrides[product.id];
  if (!o) return mapSupabaseProduct(product);

  const basePrice = o.preco !== undefined ? Number(o.preco) : (Number(product.preco ?? product.price) || 0);
  const rawPromo = o.preco_promocional !== undefined ? o.preco_promocional : (product.preco_promocional ?? product.promotional_price);
  const promoPrice = rawPromo != null && rawPromo !== '' ? Number(rawPromo) : null;
  const effectivePrice = promoPrice && promoPrice > 0 ? promoPrice : basePrice;

  const isAtivo = o.ativo !== undefined ? Boolean(o.ativo) : (product.ativo ?? product.in_stock ?? true);

  return {
    ...mapSupabaseProduct(product),
    preco: basePrice,
    price: effectivePrice,
    original_price: promoPrice ? basePrice : null,
    promotional_price: promoPrice,
    preco_promocional: promoPrice,
    formatted_price: `R$ ${effectivePrice.toFixed(2).replace('.', ',')}`,
    installments: `3x de R$ ${(effectivePrice / 3).toFixed(2).replace('.', ',')} sem juros`,
    in_stock: isAtivo,
    ativo: isAtivo,
  };
}

/**
 * 1. Atualizar Preços de um Produto
 */
export async function atualizarPrecos(id, preco, precoPromocional = null) {
  if (!id) throw new Error('ID do produto não informado.');
  if (preco === undefined || isNaN(Number(preco))) throw new Error('Preço inválido.');

  const numPreco = Number(preco);
  const numPromo = precoPromocional !== undefined && precoPromocional !== null && precoPromocional !== ''
    ? Number(precoPromocional)
    : null;

  // 1. Persistência imediata no armazenamento local do navegador
  const overrides = getLocalOverrides();
  overrides[id] = {
    ...(overrides[id] || {}),
    preco: numPreco,
    preco_promocional: numPromo,
  };
  saveLocalOverrides(overrides);

  // Também atualiza se for um produto customizado recém-criado
  const customs = getCustomProducts();
  const customIdx = customs.findIndex((c) => c.id === id);
  if (customIdx !== -1) {
    customs[customIdx].preco = numPreco;
    customs[customIdx].preco_promocional = numPromo;
    saveCustomProducts(customs);
  }

  // 2. Persistência no Supabase (se configurado)
  const client = getSupabaseClient();
  if (client) {
    try {
      const { data, error } = await client
        .from('produtos')
        .update({
          preco: numPreco,
          preco_promocional: numPromo,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.warn('Aviso ao sincronizar preço no Supabase (salvo localmente):', error.message);
      }
    } catch (err) {
      console.warn('Erro ao conectar ao Supabase (salvo localmente):', err);
    }
  }

  await revalidatePath('/');
  await revalidatePath('/admin');

  return { success: true, id, preco: numPreco, precoPromocional: numPromo };
}

/**
 * 2. Alternar Status de Disponibilidade do Produto (Ativo / Esgotado)
 */
export async function alternarStatusProduto(id, ativo) {
  if (!id) throw new Error('ID do produto não informado.');

  const isAtivo = Boolean(ativo);

  // 1. Salva imediatamente no armazenamento local
  const overrides = getLocalOverrides();
  overrides[id] = {
    ...(overrides[id] || {}),
    ativo: isAtivo,
  };
  saveLocalOverrides(overrides);

  const customs = getCustomProducts();
  const customIdx = customs.findIndex((c) => c.id === id);
  if (customIdx !== -1) {
    customs[customIdx].ativo = isAtivo;
    saveCustomProducts(customs);
  }

  // 2. Salva no Supabase (se configurado)
  const client = getSupabaseClient();
  if (client) {
    try {
      const { data, error } = await client
        .from('produtos')
        .update({ ativo: isAtivo })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.warn('Aviso ao alternar status no Supabase (salvo localmente):', error.message);
      }
    } catch (err) {
      console.warn('Erro ao conectar ao Supabase (salvo localmente):', err);
    }
  }

  await revalidatePath('/');
  await revalidatePath('/admin');

  return { success: true, id, ativo: isAtivo };
}

/**
 * 3. Cadastrar Novo Produto
 */
export async function cadastrarProduto(formData) {
  const nome = formData.get('nome');
  const categoria = formData.get('categoria');
  const precoRaw = formData.get('preco');
  const precoPromocionalRaw = formData.get('preco_promocional');
  const fotoFile = formData.get('foto') || formData.get('imagem');

  if (!nome || !categoria || precoRaw === null || precoRaw === undefined) {
    throw new Error('Preencha os campos obrigatórios: Nome, Categoria e Preço.');
  }

  const preco = parseFloat(String(precoRaw).replace(',', '.'));
  if (isNaN(preco) || preco <= 0) {
    throw new Error('Informe um valor de preço válido maior que zero.');
  }

  let preco_promocional = null;
  if (precoPromocionalRaw && String(precoPromocionalRaw).trim() !== '') {
    const parsedPromo = parseFloat(String(precoPromocionalRaw).replace(',', '.'));
    if (!isNaN(parsedPromo) && parsedPromo > 0) {
      preco_promocional = parsedPromo;
    }
  }

  let imagem_url = '';
  const client = getSupabaseClient();

  if (client && fotoFile && fotoFile instanceof File && fotoFile.size > 0) {
    try {
      const fileExt = fotoFile.name.split('.').pop() || 'jpg';
      const cleanName = nome.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 30);
      const fileName = `${Date.now()}-${cleanName}.${fileExt}`;
      const filePath = `catalogo/${fileName}`;

      const { error: uploadError } = await client.storage
        .from('produtos-gc')
        .upload(filePath, fotoFile, {
          cacheControl: '3600',
          upsert: true,
          contentType: fotoFile.type || 'image/jpeg',
        });

      if (!uploadError) {
        const { data: urlData } = client.storage
          .from('produtos-gc')
          .getPublicUrl(filePath);
        imagem_url = urlData?.publicUrl || '';
      }
    } catch (err) {
      console.warn('Falha no upload para Storage Supabase:', err);
    }
  }

  // Se não fez upload no Supabase Storage, converte para preview URL ou Data URL
  if (!imagem_url) {
    if (fotoFile && fotoFile instanceof File) {
      try {
        imagem_url = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.readAsDataURL(fotoFile);
        });
      } catch {
        imagem_url = URL.createObjectURL(fotoFile);
      }
    } else {
      imagem_url = formData.get('imagem_url') || '/images/placeholder.jpg';
    }
  }

  const newProductData = {
    id: `prod-${Date.now()}`,
    nome: String(nome).trim(),
    categoria: String(categoria).trim(),
    imagem_url,
    preco,
    preco_promocional,
    ativo: true,
    criado_em: new Date().toISOString(),
  };

  // Salva no Supabase se configurado
  if (client) {
    try {
      const { data, error } = await client
        .from('produtos')
        .insert([
          {
            nome: newProductData.nome,
            categoria: newProductData.categoria,
            imagem_url: newProductData.imagem_url,
            preco: newProductData.preco,
            preco_promocional: newProductData.preco_promocional,
            ativo: true,
          },
        ])
        .select()
        .single();

      if (!error && data) {
        newProductData.id = data.id;
      }
    } catch (err) {
      console.warn('Erro ao inserir no Supabase (salvo localmente):', err);
    }
  }

  // Salva no localStorage para persistência garantida
  const customs = getCustomProducts();
  customs.unshift(newProductData);
  saveCustomProducts(customs);

  await revalidatePath('/');
  await revalidatePath('/admin');

  return { success: true, product: mapSupabaseProduct(newProductData) };
}

/**
 * 4. Obter Produtos para a Vitrine Pública (Apenas Ativos)
 */
export async function obterProdutosVitrine() {
  const client = getSupabaseClient();
  const overrides = getLocalOverrides();
  const customs = getCustomProducts();

  let baseList = [];

  if (client) {
    try {
      const { data, error } = await client
        .from('produtos')
        .select('*')
        .eq('ativo', true)
        .order('criado_em', { ascending: false });

      if (!error && data && data.length > 0) {
        baseList = data;
      }
    } catch (err) {
      console.warn('Erro ao consultar Supabase na vitrine, recorrendo ao catálogo local:', err);
    }
  }

  // Se não veio do Supabase, mescla customProducts criados no Admin com os 59 itens do catálogo
  if (baseList.length === 0) {
    baseList = [...customs, ...PRODUCTS];
  }

  // Aplica overrides locais (preços alterados, estoque ligado/desligado)
  const mappedList = baseList.map((p) => applyOverrides(p, overrides));

  // Retorna apenas os produtos onde ativo === true
  return mappedList.filter((p) => p.ativo === true || p.in_stock === true);
}

/**
 * 5. Obter Todos os Produtos para o Painel Administrativo (Ativos e Esgotados)
 */
export async function obterProdutosAdmin() {
  const client = getSupabaseClient();
  const overrides = getLocalOverrides();
  const customs = getCustomProducts();

  let baseList = [];

  if (client) {
    try {
      const { data, error } = await client
        .from('produtos')
        .select('*')
        .order('criado_em', { ascending: false });

      if (!error && data && data.length > 0) {
        baseList = data;
      }
    } catch (err) {
      console.warn('Erro ao consultar Supabase no Admin, usando catálogo local:', err);
    }
  }

  if (baseList.length === 0) {
    baseList = [...customs, ...PRODUCTS];
  }

  // Aplica overrides e retorna todos para gestão
  return baseList.map((p) => applyOverrides(p, overrides));
}
