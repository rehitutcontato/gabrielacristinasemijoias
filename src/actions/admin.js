import { getSupabaseClient, getSupabaseCredentials } from '../lib/supabase';
import { PRODUCTS } from '../data/products';

const OVERRIDES_STORAGE_KEY = 'gc_catalog_overrides_v1';
const CUSTOM_PRODUCTS_KEY = 'gc_custom_products_v1';
const DELETED_PRODUCTS_KEY = 'gc_deleted_products_v1';

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

export function getDeletedProducts() {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(DELETED_PRODUCTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveDeletedProducts(deletedIds) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(DELETED_PRODUCTS_KEY, JSON.stringify(deletedIds));
  } catch (e) {
    console.error('Erro ao salvar produtos excluídos:', e);
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

  let material = p.material;
  const nameLower = (p.nome || p.name || '').toLowerCase();
  const catLower = (p.categoria || p.category || '').toLowerCase();

  if (!material) {
    if (nameLower.includes('ródio') || nameLower.includes('rodio')) {
      material = 'Ródio Branco';
    } else if (nameLower.includes('prata')) {
      material = 'Banho Prata 925';
    } else if (nameLower.includes('ouro')) {
      material = 'Banho Ouro 18k';
    } else if (nameLower.includes('ônix') || nameLower.includes('onix') || nameLower.includes('pedra')) {
      material = 'Banho Ouro 18k / Pedras';
    } else {
      material = 'Banho Ouro 18k';
    }
  }

  // Parseia tamanhos se existirem ou fornece grade padrão para anéis
  let tamanhos = [];
  if (p.tamanhos) {
    if (Array.isArray(p.tamanhos)) {
      tamanhos = p.tamanhos;
    } else if (typeof p.tamanhos === 'string') {
      try {
        tamanhos = JSON.parse(p.tamanhos);
      } catch {
        tamanhos = p.tamanhos.split(',').map((s) => s.trim()).filter(Boolean);
      }
    }
  }
  // Se for anel e não possuir tamanhos customizados definidos ainda, sugere a grade clássica brasileira
  if ((!tamanhos || tamanhos.length === 0) && (catLower.includes('anéis') || catLower.includes('anel') || nameLower.includes('anel'))) {
    tamanhos = ['14', '16', '18', '20', '22'];
  }

  let cores = [];
  if (p.cores) {
    if (Array.isArray(p.cores)) {
      cores = p.cores;
    } else if (typeof p.cores === 'string') {
      try {
        cores = JSON.parse(p.cores);
      } catch {
        cores = p.cores.split(',').map((s) => s.trim()).filter(Boolean);
      }
    }
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
    tamanhos,
    cores,
    criado_em: p.criado_em,
  };
}

/**
 * Aplica overrides salvos localmente sobre um produto
 */
function applyOverrides(product, overrides) {
  const mapped = mapSupabaseProduct(product);
  const o = overrides[product.id];
  if (!o) return mapped;

  const basePrice = o.preco !== undefined ? Number(o.preco) : mapped.preco;
  const rawPromo = o.preco_promocional !== undefined ? o.preco_promocional : mapped.preco_promocional;
  const promoPrice = rawPromo != null && rawPromo !== '' ? Number(rawPromo) : null;
  const effectivePrice = promoPrice && promoPrice > 0 ? promoPrice : basePrice;

  const isAtivo = o.ativo !== undefined ? Boolean(o.ativo) : mapped.ativo;
  const nome = o.nome || o.name || mapped.nome;
  const categoria = o.categoria || o.category || mapped.categoria;
  const material = o.material || mapped.material;
  const tamanhos = o.tamanhos !== undefined ? (Array.isArray(o.tamanhos) ? o.tamanhos : []) : mapped.tamanhos;
  const cores = o.cores !== undefined ? (Array.isArray(o.cores) ? o.cores : []) : mapped.cores;

  return {
    ...mapped,
    nome,
    name: nome,
    categoria,
    category: categoria,
    material,
    preco: basePrice,
    price: effectivePrice,
    original_price: promoPrice ? basePrice : null,
    promotional_price: promoPrice,
    preco_promocional: promoPrice,
    formatted_price: `R$ ${effectivePrice.toFixed(2).replace('.', ',')}`,
    installments: `3x de R$ ${(effectivePrice / 3).toFixed(2).replace('.', ',')} sem juros`,
    in_stock: isAtivo,
    ativo: isAtivo,
    tamanhos,
    cores,
  };
}

/**
 * Atualiza todas as propriedades de um produto (Nome, Categoria, Material, Preços, Status, Tamanhos e Cores)
 */
export async function atualizarProdutoCompleto(id, dados) {
  if (!id) throw new Error('ID do produto não informado.');

  const numPreco = dados.preco !== undefined && dados.preco !== '' ? Number(dados.preco) : undefined;
  const numPromo = dados.preco_promocional !== undefined && dados.preco_promocional !== null && dados.preco_promocional !== ''
    ? Number(dados.preco_promocional)
    : null;

  // 1. Salvar no localStorage overrides
  const overrides = getLocalOverrides();
  overrides[id] = {
    ...(overrides[id] || {}),
    ...(dados.nome ? { nome: dados.nome.trim() } : {}),
    ...(dados.categoria ? { categoria: dados.categoria.trim() } : {}),
    ...(dados.material ? { material: dados.material.trim() } : {}),
    ...(numPreco !== undefined && !isNaN(numPreco) ? { preco: numPreco } : {}),
    preco_promocional: numPromo,
    ...(dados.ativo !== undefined ? { ativo: Boolean(dados.ativo) } : {}),
    ...(dados.tamanhos !== undefined ? { tamanhos: Array.isArray(dados.tamanhos) ? dados.tamanhos : [] } : {}),
    ...(dados.cores !== undefined ? { cores: Array.isArray(dados.cores) ? dados.cores : [] } : {}),
  };
  saveLocalOverrides(overrides);

  // Também atualiza se for produto customizado salvo localmente
  const customs = getCustomProducts();
  const customIdx = customs.findIndex((c) => c.id === id);
  if (customIdx !== -1) {
    customs[customIdx] = {
      ...customs[customIdx],
      ...overrides[id],
    };
    saveCustomProducts(customs);
  }

  // 2. Persistir no Supabase se configurado
  const client = getSupabaseClient();
  if (client) {
    try {
      const updatePayload = {};
      if (dados.nome) updatePayload.nome = dados.nome.trim();
      if (dados.categoria) updatePayload.categoria = dados.categoria.trim();
      if (dados.material) updatePayload.material = dados.material.trim();
      if (numPreco !== undefined && !isNaN(numPreco)) updatePayload.preco = numPreco;
      updatePayload.preco_promocional = numPromo;
      if (dados.ativo !== undefined) updatePayload.ativo = Boolean(dados.ativo);
      if (dados.tamanhos !== undefined) updatePayload.tamanhos = dados.tamanhos;
      if (dados.cores !== undefined) updatePayload.cores = dados.cores;

      const { error } = await client
        .from('produtos')
        .update(updatePayload)
        .eq('id', id);

      if (error) {
        console.warn('Aviso ao sincronizar produto no Supabase (salvo localmente):', error.message);
      }
    } catch (err) {
      console.warn('Erro ao conectar ao Supabase para atualizar produto:', err);
    }
  }

  await revalidatePath('/');
  await revalidatePath('/admin');

  return { success: true, id, overrides: overrides[id] };
}

/**
 * 1. Atualizar Preços de um Produto (Inline)
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

  const material = formData.get('material') || 'Banho Ouro 18k';
  const tamanhosRaw = formData.get('tamanhos');
  let tamanhos = [];
  if (tamanhosRaw) {
    try {
      tamanhos = typeof tamanhosRaw === 'string' ? JSON.parse(tamanhosRaw) : tamanhosRaw;
    } catch {
      tamanhos = String(tamanhosRaw).split(',').map((s) => s.trim()).filter(Boolean);
    }
  }
  const coresRaw = formData.get('cores');
  let cores = [];
  if (coresRaw) {
    try {
      cores = typeof coresRaw === 'string' ? JSON.parse(coresRaw) : coresRaw;
    } catch {
      cores = String(coresRaw).split(',').map((s) => s.trim()).filter(Boolean);
    }
  }

  const newProductData = {
    id: `prod-${Date.now()}`,
    nome: String(nome).trim(),
    categoria: String(categoria).trim(),
    material: String(material).trim(),
    imagem_url,
    preco,
    preco_promocional,
    tamanhos,
    cores,
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
            material: newProductData.material,
            imagem_url: newProductData.imagem_url,
            preco: newProductData.preco,
            preco_promocional: newProductData.preco_promocional,
            tamanhos: newProductData.tamanhos,
            cores: newProductData.cores,
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
 * 4. Obter Produtos para a Vitrine Pública
 * Mantém todos os itens do catálogo visíveis (peças esgotadas aparecem com badge 'Esgotado')
 * e exclui somente as peças que foram de fato apagadas.
 */
export async function obterProdutosVitrine() {
  const client = getSupabaseClient();
  const overrides = getLocalOverrides();
  const customs = getCustomProducts();
  const deletedIds = getDeletedProducts();

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
      console.warn('Erro ao consultar Supabase na vitrine, recorrendo ao catálogo local:', err);
    }
  }

  // Se não veio do Supabase, mescla customProducts criados no Admin com os itens do catálogo
  if (baseList.length === 0) {
    baseList = [...customs, ...PRODUCTS];
  }

  // Remove apenas os produtos que foram realmente excluídos pelo usuário
  const nonDeleted = baseList.filter((p) => !deletedIds.includes(p.id));

  // Aplica overrides locais (preços alterados, estoque ligado/desligado)
  const mappedList = nonDeleted.map((p) => applyOverrides(p, overrides));

  // Retorna todos os produtos do catálogo (tanto Ativos quanto Esgotados continuam no catálogo)
  return mappedList;
}

/**
 * 5. Obter Todos os Produtos para o Painel Administrativo (Ativos e Esgotados)
 */
export async function obterProdutosAdmin() {
  const client = getSupabaseClient();
  const overrides = getLocalOverrides();
  const customs = getCustomProducts();
  const deletedIds = getDeletedProducts();

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

  // Remove produtos que foram excluídos
  const nonDeleted = baseList.filter((p) => !deletedIds.includes(p.id));

  // Aplica overrides e retorna todos para gestão
  return nonDeleted.map((p) => applyOverrides(p, overrides));
}

/**
 * 6. Excluir Produto do Catálogo (Apagar Definitivamente)
 */
export async function excluirProduto(id) {
  if (!id) throw new Error('ID do produto não informado.');

  // 1. Registra como excluído no armazenamento local
  const deleted = getDeletedProducts();
  if (!deleted.includes(id)) {
    deleted.push(id);
    saveDeletedProducts(deleted);
  }

  // Remove da lista de produtos customizados se existir
  const customs = getCustomProducts();
  const updatedCustoms = customs.filter((c) => c.id !== id);
  if (customs.length !== updatedCustoms.length) {
    saveCustomProducts(updatedCustoms);
  }

  // Remove overrides específicos deste ID
  const overrides = getLocalOverrides();
  if (overrides[id]) {
    delete overrides[id];
    saveLocalOverrides(overrides);
  }

  // 2. Remove do Supabase (se conectado)
  const client = getSupabaseClient();
  if (client) {
    try {
      const { error } = await client
        .from('produtos')
        .delete()
        .eq('id', id);

      if (error) {
        console.warn('Aviso ao excluir no Supabase (excluído localmente):', error.message);
      }
    } catch (err) {
      console.warn('Erro ao conectar com Supabase para exclusão:', err);
    }
  }

  await revalidatePath('/');
  await revalidatePath('/admin');

  return { success: true, id };
}

