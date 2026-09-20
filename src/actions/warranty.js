// Gestor de Garantias e Vendas - GC Semijoias & Acessórios
import { STORE_CONFIG } from '../data/products';

const WARRANTY_STORAGE_KEY = 'gc_semijoias_garantias_v1';

/**
 * Retorna todas as garantias salvas localmente
 */
export function obterGarantias() {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(WARRANTY_STORAGE_KEY);
    if (!raw) return [];
    const list = JSON.parse(raw);
    return Array.isArray(list) ? list : [];
  } catch (err) {
    console.error('Erro ao ler garantias do localStorage:', err);
    return [];
  }
}

/**
 * Calcula a data de validade com base nos meses
 */
export function calcularValidadeGarantia(dataInicio, meses = 12) {
  const d = new Date(dataInicio);
  d.setMonth(d.getMonth() + Number(meses));
  return d.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

/**
 * Cria e salva um novo registro de garantia a partir dos dados da venda/sacola
 */
export function emitirGarantia({
  clienteNome,
  clienteTelefone = '',
  itens,
  periodoAnos = 1,
  totalFormatado = '',
  observacoes = ''
}) {
  if (!clienteNome || !itens || itens.length === 0) {
    throw new Error('Nome da cliente e ao menos um item são obrigatórios.');
  }

  const agora = new Date();
  const meses = Number(periodoAnos) === 2 ? 24 : 12;
  const validadeAte = calcularValidadeGarantia(agora, meses);

  const novoRegistro = {
    id: `gar-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    codigo: `GC-${agora.getFullYear()}-${String(Date.now()).slice(-5)}`,
    clienteNome: clienteNome.trim(),
    clienteTelefone: clienteTelefone.trim(),
    dataCompra: agora.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }),
    dataCompraIso: agora.toISOString(),
    periodoAnos: Number(periodoAnos),
    periodoLabel: Number(periodoAnos) === 2 ? '2 Anos de Garantia' : '1 Ano de Garantia',
    validadeAte,
    totalFormatado,
    observacoes,
    itens: itens.map((item) => ({
      id: item.product?.id || item.id,
      name: item.product?.name || item.name,
      material: item.product?.material || item.material || 'Banho Nobre',
      price: item.product?.price ?? item.price ?? 0,
      quantity: item.quantity || 1,
      image: item.product?.local_image || item.product?.image || item.image || '/images/logo-brand.png',
      variation: item.variation || null,
      tamanho: item.variation?.tamanho || item.tamanho || null,
      cor: item.variation?.cor || item.cor || null,
    })),
    status: 'ativa'
  };

  const listaAtual = obterGarantias();
  const novaLista = [novoRegistro, ...listaAtual];

  try {
    localStorage.setItem(WARRANTY_STORAGE_KEY, JSON.stringify(novaLista));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('gc-garantias-changed', { detail: novoRegistro }));
    }
  } catch (err) {
    console.error('Erro ao salvar garantia:', err);
  }

  return novoRegistro;
}

/**
 * Remove um registro de garantia
 */
export function excluirGarantia(id) {
  const listaAtual = obterGarantias();
  const novaLista = listaAtual.filter((g) => g.id !== id);
  try {
    localStorage.setItem(WARRANTY_STORAGE_KEY, JSON.stringify(novaLista));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('gc-garantias-changed', { detail: { id, deleted: true } }));
    }
    return true;
  } catch (err) {
    console.error('Erro ao excluir garantia:', err);
    return false;
  }
}

/**
 * Gera mensagem formatada pronta para enviar no WhatsApp da cliente
 */
export function gerarTextoWhatsAppGarantia(garantia) {
  let msg = `✨ *CERTIFICADO OFICIAL DE GARANTIA & AUTENTICIDADE* ✨\n`;
  msg += `*${STORE_CONFIG.storeName}*\n`;
  msg += `Fundadora: ${STORE_CONFIG.founderName}\n\n`;

  msg += `👤 *Cliente:* ${garantia.clienteNome}\n`;
  msg += `📜 *Certificado:* \`${garantia.codigo}\`\n`;
  msg += `📅 *Data da Compra:* ${garantia.dataCompra}\n`;
  msg += `🛡️ *Garantia:* ${garantia.periodoLabel}\n`;
  msg += `⏳ *Válida até:* ${garantia.validadeAte}\n\n`;

  msg += `💎 *Peças Adquiridas:*\n`;
  garantia.itens.forEach((it) => {
    let details = [];
    const tam = it.tamanho || it.variation?.tamanho;
    const cor = it.cor || it.variation?.cor;
    if (tam) details.push(`Aro/Tamanho: ${tam}`);
    if (cor) details.push(`Cor: ${cor}`);
    const detailsStr = details.length > 0 ? ` [${details.join(' • ')}]` : '';

    msg += `• *${it.quantity}x* ${it.name}${detailsStr}\n`;
    msg += `   Acabamento: ${it.material}\n`;
  });

  if (garantia.totalFormatado) {
    msg += `\n💰 *Valor Total:* ${garantia.totalFormatado}\n`;
  }

  msg += `\n📋 *Termos de Garantia & Cuidados:*
Todas as semijoias da GC Semijoias são 100% hipoalergênicas, livres de níquel e possuem banho nobre de alta durabilidade.
Esta garantia cobre eventuais defeitos de fabricação ou desprendimento do banho.

*Para preservar o brilho impecável da sua peça:*
1. Evite contato com perfumes, cremes e produtos químicos;
2. Retire antes de entrar no mar ou na piscina;
3. Guarde em local seco e individualmente para evitar atrito.

Guarde esta mensagem com carinho como seu comprovante oficial! 💖✨`;

  return msg;
}
