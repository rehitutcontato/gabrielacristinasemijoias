import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { PRODUCTS } from '../data/products';

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
 * Normaliza e adapta o formato do produto vindo do Supabase (colunas em português)
 * para o formato compatível com os componentes existentes da vitrine e sacola.
 */
export function mapSupabaseProduct(p) {
  const price = Number(p.preco) || 0;
  const promotionalPrice = p.preco_promocional != null && p.preco_promocional !== ''
    ? Number(p.preco_promocional)
    : null;
  const effectivePrice = promotionalPrice && promotionalPrice > 0 ? promotionalPrice : price;

  const formatted_price = `R$ ${effectivePrice.toFixed(2).replace('.', ',')}`;
  const installmentVal = (effectivePrice / 3).toFixed(2).replace('.', ',');
  const installments = `3x de R$ ${installmentVal} sem juros`;

  // Inferência automática de banho com base no nome
  let material = 'Banho Ouro 18k';
  const nameLower = (p.nome || '').toLowerCase();
  if (nameLower.includes('ródio') || nameLower.includes('rodio')) {
    material = 'Ródio Branco';
  } else if (nameLower.includes('prata')) {
    material = 'Banho Prata 925';
  } else if (nameLower.includes('ouro')) {
    material = 'Banho Ouro 18k';
  } else if (nameLower.includes('ônix') || nameLower.includes('onix') || nameLower.includes('pedra')) {
    material = 'Banho Ouro 18k / Pedras';
  }

  return {
    id: p.id,
    name: p.nome,
    nome: p.nome,
    category: p.categoria,
    categoria: p.categoria,
    price: effectivePrice,
    preco: price,
    original_price: promotionalPrice ? price : null,
    promotional_price: promotionalPrice,
    preco_promocional: promotionalPrice,
    formatted_price,
    installments,
    image: p.imagem_url,
    imagem_url: p.imagem_url,
    local_image: p.imagem_url,
    in_stock: p.ativo ?? true,
    ativo: p.ativo ?? true,
    material,
    criado_em: p.criado_em,
  };
}

/**
 * 1. Atualizar Preços de um Produto
 * @param {string} id - UUID do produto
 * @param {number} preco - Preço regular
 * @param {number} [precoPromocional] - Preço promocional opcional
 */
export async function atualizarPrecos(id, preco, precoPromocional = null) {
  if (!id) throw new Error('ID do produto não informado.');
  if (preco === undefined || isNaN(Number(preco))) throw new Error('Preço inválido.');

  const numPreco = Number(preco);
  const numPromo = precoPromocional !== undefined && precoPromocional !== null && precoPromocional !== ''
    ? Number(precoPromocional)
    : null;

  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from('produtos')
      .update({
        preco: numPreco,
        preco_promocional: numPromo,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar preços no Supabase:', error);
      throw new Error(`Falha ao atualizar preço: ${error.message}`);
    }

    await revalidatePath('/');
    await revalidatePath('/admin');

    return { success: true, product: mapSupabaseProduct(data) };
  } else {
    // Fallback para ambiente local/desenvolvimento
    console.warn('[Mock] Preço atualizado localmente para o produto:', id, { preco: numPreco, precoPromocional: numPromo });
    await revalidatePath('/');
    await revalidatePath('/admin');
    return { success: true, id, preco: numPreco, precoPromocional: numPromo };
  }
}

/**
 * 2. Alternar Status de Disponibilidade do Produto (Ativo / Esgotado)
 * @param {string} id - UUID do produto
 * @param {boolean} ativo - Novo status de disponibilidade
 */
export async function alternarStatusProduto(id, ativo) {
  if (!id) throw new Error('ID do produto não informado.');

  const isAtivo = Boolean(ativo);

  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from('produtos')
      .update({ ativo: isAtivo })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao alternar status do produto no Supabase:', error);
      throw new Error(`Falha ao alterar status: ${error.message}`);
    }

    await revalidatePath('/');
    await revalidatePath('/admin');

    return { success: true, product: mapSupabaseProduct(data) };
  } else {
    // Fallback local
    console.warn('[Mock] Status alternado localmente:', id, isAtivo);
    await revalidatePath('/');
    await revalidatePath('/admin');
    return { success: true, id, ativo: isAtivo };
  }
}

/**
 * 3. Cadastrar Novo Produto com Upload de Imagem para o Storage
 * @param {FormData} formData - Objeto FormData com foto, nome, categoria, preco e preco_promocional
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

  if (isSupabaseConfigured) {
    // Realiza upload da foto para o bucket produtos-gc se houver arquivo
    if (fotoFile && fotoFile instanceof File && fotoFile.size > 0) {
      const fileExt = fotoFile.name.split('.').pop() || 'jpg';
      const cleanName = nome.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 30);
      const fileName = `${Date.now()}-${cleanName}.${fileExt}`;
      const filePath = `catalogo/${fileName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('produtos-gc')
        .upload(filePath, fotoFile, {
          cacheControl: '3600',
          upsert: true,
          contentType: fotoFile.type || 'image/jpeg',
        });

      if (uploadError) {
        console.error('Erro no upload de foto para produtos-gc:', uploadError);
        throw new Error(`Falha no upload da foto: ${uploadError.message}`);
      }

      // Obtém a URL pública direta
      const { data: urlData } = supabase.storage
        .from('produtos-gc')
        .getPublicUrl(filePath);

      imagem_url = urlData?.publicUrl || '';
    } else {
      // Caso seja informada uma URL de imagem direta no formData
      const directUrl = formData.get('imagem_url');
      if (directUrl && typeof directUrl === 'string') {
        imagem_url = directUrl.trim();
      } else {
        throw new Error('Selecione uma foto da peça para cadastrar.');
      }
    }

    // Inserção do novo registro na tabela produtos
    const { data, error } = await supabase
      .from('produtos')
      .insert([
        {
          nome: String(nome).trim(),
          categoria: String(categoria).trim(),
          imagem_url,
          preco,
          preco_promocional,
          ativo: true,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Erro ao inserir produto no Supabase:', error);
      throw new Error(`Falha ao cadastrar produto: ${error.message}`);
    }

    await revalidatePath('/');
    await revalidatePath('/admin');

    return { success: true, product: mapSupabaseProduct(data) };
  } else {
    // Fallback local se Supabase não configurado
    let previewUrl = '/images/placeholder.jpg';
    if (fotoFile && fotoFile instanceof File) {
      previewUrl = URL.createObjectURL(fotoFile);
    }

    const mockItem = {
      id: `local-${Date.now()}`,
      nome: String(nome).trim(),
      categoria: String(categoria).trim(),
      imagem_url: previewUrl,
      preco,
      preco_promocional,
      ativo: true,
      criado_em: new Date().toISOString(),
    };

    console.warn('[Mock] Produto cadastrado localmente:', mockItem);
    await revalidatePath('/');
    await revalidatePath('/admin');

    return { success: true, product: mapSupabaseProduct(mockItem) };
  }
}

/**
 * 4. Obter Produtos para a Vitrine Pública (Apenas Ativos)
 */
export async function obterProdutosVitrine() {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('produtos')
        .select('*')
        .eq('ativo', true)
        .order('criado_em', { ascending: false });

      if (error) {
        console.error('Erro ao buscar produtos da vitrine no Supabase:', error);
        return PRODUCTS;
      }

      if (data && data.length > 0) {
        return data.map(mapSupabaseProduct);
      }
      return PRODUCTS;
    } catch (err) {
      console.error('Erro de conexão ao Supabase na vitrine:', err);
      return PRODUCTS;
    }
  }
  return PRODUCTS;
}

/**
 * 5. Obter Todos os Produtos para o Painel Administrativo (Ativos e Esgotados)
 */
export async function obterProdutosAdmin() {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('produtos')
        .select('*')
        .order('criado_em', { ascending: false });

      if (error) {
        console.error('Erro ao buscar produtos para o Admin no Supabase:', error);
        return PRODUCTS.map((p) => ({
          ...p,
          nome: p.name,
          categoria: p.category,
          imagem_url: p.local_image || p.image,
          preco: p.price,
          preco_promocional: p.original_price ? p.price : null,
          ativo: p.in_stock ?? true,
        }));
      }

      if (data && data.length > 0) {
        return data.map(mapSupabaseProduct);
      }
      return PRODUCTS.map((p) => ({
        ...p,
        nome: p.name,
        categoria: p.category,
        imagem_url: p.local_image || p.image,
        preco: p.price,
        preco_promocional: p.original_price ? p.price : null,
        ativo: p.in_stock ?? true,
      }));
    } catch (err) {
      console.error('Erro ao conectar com Supabase no Admin:', err);
      return PRODUCTS;
    }
  }

  // Se não configurado, converte o catálogo existente para o formato administrativo
  return PRODUCTS.map((p) => ({
    ...p,
    nome: p.name,
    categoria: p.category,
    imagem_url: p.local_image || p.image,
    preco: p.price,
    preco_promocional: p.original_price ? p.price : null,
    ativo: p.in_stock ?? true,
  }));
}
