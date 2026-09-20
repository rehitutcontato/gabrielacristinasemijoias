import React, { useState, useEffect, useMemo } from 'react';
import {
  Lock,
  Eye,
  EyeOff,
  Search,
  Plus,
  X,
  Upload,
  Check,
  LogOut,
  ArrowLeft,
  Sparkles,
  RefreshCw,
  SlidersHorizontal,
  Package,
  Database,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  Trash2,
} from 'lucide-react';
import {
  obterProdutosAdmin,
  atualizarPrecos,
  alternarStatusProduto,
  cadastrarProduto,
  excluirProduto,
} from '../../actions/admin';
import {
  obterGarantias,
  emitirGarantia,
  excluirGarantia,
  gerarTextoWhatsAppGarantia
} from '../../actions/warranty';
import { WarrantyModal } from '../WarrantyModal';
import {
  ShieldCheck,
  Award,
  FileText,
  Phone,
  Calendar,
  MessageCircle,
  Clock,
  Printer
} from 'lucide-react';
import {
  getSupabaseCredentials,
  saveSupabaseCredentials,
  getSupabaseClient,
} from '../../lib/supabase';
import '../../styles/admin.css';

const CATEGORIES = [
  'Brincos',
  'Colares',
  'Pulseiras',
  'Anéis',
  'Conjuntos',
  'Piercings',
];

const AUTH_STORAGE_KEY = 'gc_admin_auth_v1';
const MASTER_PASSWORD =
  (typeof process !== 'undefined' && process.env?.ADMIN_PASSWORD) ||
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_ADMIN_PASSWORD) ||
  'gcsemijoias2025';

export function AdminPage({ onNavigateToStore }) {
  // --------------------------------------------------------------------------
  // 1. BARREIRA DE ACESSO POR SENHA / PIN
  // --------------------------------------------------------------------------
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    try {
      const stored = localStorage.getItem(AUTH_STORAGE_KEY);
      return stored === 'true';
    } catch {
      return false;
    }
  });

  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    if (passwordInput.trim() === MASTER_PASSWORD) {
      setIsAuthenticated(true);
      setAuthError('');
      try {
        localStorage.setItem(AUTH_STORAGE_KEY, 'true');
        // Define cookie com validade de 30 dias para suporte a SSR/PWA
        document.cookie = `${AUTH_STORAGE_KEY}=true; path=/; max-age=${60 * 60 * 24 * 30}; SameSite=Lax`;
      } catch (err) {
        console.warn('Erro ao salvar credencial local:', err);
      }
    } else {
      setAuthError('Senha incorreta. Tente novamente.');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setPasswordInput('');
    try {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      document.cookie = `${AUTH_STORAGE_KEY}=; path=/; max-age=0;`;
    } catch (err) {
      console.warn('Erro ao remover auth:', err);
    }
  };

  // --------------------------------------------------------------------------
  // 2. ESTADOS DO PAINEL
  // --------------------------------------------------------------------------
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Status e modal de conexão com o Supabase
  const [supabaseCreds, setSupabaseCreds] = useState(getSupabaseCredentials);
  const [isDbModalOpen, setIsDbModalOpen] = useState(false);
  const [dbUrlInput, setDbUrlInput] = useState(supabaseCreds.url || '');
  const [dbKeyInput, setDbKeyInput] = useState(supabaseCreds.anonKey || '');
  const [dbMessage, setDbMessage] = useState('');
  const [isTestingDb, setIsTestingDb] = useState(false);

  // Estados do formulário retrátil "+ Novo Produto"
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState(CATEGORIES[0]);
  const [formPrice, setFormPrice] = useState('');
  const [formPromoPrice, setFormPromoPrice] = useState('');
  const [formImageFile, setFormImageFile] = useState(null);
  const [formImagePreview, setFormImagePreview] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Carregar produtos da base
  const fetchAdminProducts = async () => {
    try {
      setLoading(true);
      const list = await obterProdutosAdmin();
      setProducts(list || []);
    } catch (err) {
      console.error('Falha ao buscar produtos:', err);
      showToast('Erro ao sincronizar catálogo.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchAdminProducts();
    }
  }, [isAuthenticated]);

  // Toast feedback discreto
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage('');
    }, 2600);
  };

  // --------------------------------------------------------------------------
  // 2.1. ESTADOS DO MÓDULO DE GARANTIAS & VENDAS
  // --------------------------------------------------------------------------
  const [adminTab, setAdminTab] = useState('produtos'); // 'produtos' | 'garantias'
  const [warranties, setWarranties] = useState(obterGarantias);
  const [warrantySearch, setWarrantySearch] = useState('');
  const [activeCertificate, setActiveCertificate] = useState(null);
  const [isManualWarrantyModalOpen, setIsManualWarrantyModalOpen] = useState(false);

  // Formulário de nova garantia avulsa
  const [manualClientName, setManualClientName] = useState('');
  const [manualClientPhone, setManualClientPhone] = useState('');
  const [manualItemName, setManualItemName] = useState('');
  const [manualItemMaterial, setManualItemMaterial] = useState('Ouro 18k');
  const [manualItemPrice, setManualItemPrice] = useState('');
  const [manualWarrantyYears, setManualWarrantyYears] = useState(1);
  const [manualFormError, setManualFormError] = useState('');

  useEffect(() => {
    const handleSyncWarranties = () => {
      setWarranties(obterGarantias());
    };
    window.addEventListener('gc-garantias-changed', handleSyncWarranties);
    return () => window.removeEventListener('gc-garantias-changed', handleSyncWarranties);
  }, []);

  const handleCreateManualWarranty = (e) => {
    e.preventDefault();
    setManualFormError('');
    if (!manualClientName.trim()) {
      setManualFormError('Informe o nome da cliente.');
      return;
    }
    if (!manualItemName.trim()) {
      setManualFormError('Informe o nome da semijoia.');
      return;
    }

    try {
      const priceNum = manualItemPrice ? Number(manualItemPrice.replace(',', '.')) : 0;
      const formattedTotal = priceNum > 0 ? `R$ ${priceNum.toFixed(2).replace('.', ',')}` : '';

      const nova = emitirGarantia({
        clienteNome: manualClientName.trim(),
        clienteTelefone: manualClientPhone.trim(),
        itens: [
          {
            name: manualItemName.trim(),
            material: manualItemMaterial,
            price: priceNum,
            quantity: 1,
            image: '/images/logo-brand.png'
          }
        ],
        periodoAnos: manualWarrantyYears,
        totalFormatado: formattedTotal
      });

      showToast('Garantia registrada com sucesso!');
      setIsManualWarrantyModalOpen(false);
      setManualClientName('');
      setManualClientPhone('');
      setManualItemName('');
      setManualItemPrice('');
      setManualWarrantyYears(1);
      setActiveCertificate(nova);
    } catch (err) {
      setManualFormError(err.message || 'Erro ao registrar garantia.');
    }
  };

  const handleDeleteWarranty = (id) => {
    if (window.confirm('Deseja realmente remover o registro desta garantia?')) {
      excluirGarantia(id);
      showToast('Garantia removida.');
    }
  };

  const filteredWarranties = useMemo(() => {
    if (!warrantySearch.trim()) return warranties;
    const q = warrantySearch.toLowerCase().trim();
    return warranties.filter((w) => {
      const cName = (w.clienteNome || '').toLowerCase();
      const cCode = (w.codigo || '').toLowerCase();
      const itemsMatch = (w.itens || []).some((it) => (it.name || '').toLowerCase().includes(q));
      return cName.includes(q) || cCode.includes(q) || itemsMatch;
    });
  }, [warranties, warrantySearch]);

  // --------------------------------------------------------------------------
  // 3. FILTRO RÁPIDO DE PRODUTOS
  // --------------------------------------------------------------------------
  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return products;
    const q = searchQuery.toLowerCase().trim();
    return products.filter((p) => {
      const name = (p.nome || p.name || '').toLowerCase();
      const cat = (p.categoria || p.category || '').toLowerCase();
      return name.includes(q) || cat.includes(q);
    });
  }, [products, searchQuery]);

  const activeCount = useMemo(() => {
    return products.filter((p) => (p.ativo ?? p.in_stock) === true).length;
  }, [products]);

  // --------------------------------------------------------------------------
  // 4. MUTAÇÕES INLINE
  // --------------------------------------------------------------------------

  // Alternar Status Ativo / Esgotado
  const handleToggleStatus = async (product) => {
    const currentStatus = product.ativo ?? product.in_stock ?? true;
    const newStatus = !currentStatus;

    // Atualização otimista na interface
    setProducts((prev) =>
      prev.map((p) =>
        p.id === product.id ? { ...p, ativo: newStatus, in_stock: newStatus } : p
      )
    );

    try {
      await alternarStatusProduto(product.id, newStatus);
      showToast(newStatus ? 'Peça marcada como Ativa' : 'Peça marcada como Esgotada');
    } catch (err) {
      console.error('Erro ao alternar status:', err);
      // Reverte em caso de erro
      setProducts((prev) =>
        prev.map((p) =>
          p.id === product.id ? { ...p, ativo: currentStatus, in_stock: currentStatus } : p
        )
      );
      showToast('Erro ao alterar status. Tente novamente.');
    }
  };

  // Salvar Preço (onBlur)
  const handleSavePrices = async (productId, newPreco, newPromo) => {
    const numPreco = parseFloat(String(newPreco).replace(',', '.'));
    const numPromo =
      newPromo !== '' && newPromo !== null && newPromo !== undefined
        ? parseFloat(String(newPromo).replace(',', '.'))
        : null;

    if (isNaN(numPreco) || numPreco <= 0) {
      showToast('Preço de venda inválido.');
      return;
    }

    try {
      await atualizarPrecos(productId, numPreco, numPromo);
      setProducts((prev) =>
        prev.map((p) => {
          if (p.id === productId) {
            return {
              ...p,
              preco: numPreco,
              price: numPromo && numPromo > 0 ? numPromo : numPreco,
              preco_promocional: numPromo,
              promotional_price: numPromo,
            };
          }
          return p;
        })
      );
      showToast('Preço atualizado com sucesso!');
    } catch (err) {
      console.error('Erro ao atualizar preços:', err);
      showToast('Erro ao salvar preços.');
    }
  };

  // --------------------------------------------------------------------------
  // 4b. EXCLUSÃO DE PRODUTO
  // --------------------------------------------------------------------------
  const [productToDelete, setProductToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const confirmDeleteProduct = async () => {
    if (!productToDelete) return;
    const id = productToDelete.id;
    setIsDeleting(true);
    try {
      await excluirProduto(id);
      setProducts((prev) => prev.filter((p) => p.id !== id));
      showToast('Peça excluída permanentemente com sucesso.');
      setProductToDelete(null);
    } catch (err) {
      console.error('Erro ao excluir peça:', err);
      showToast('Erro ao excluir peça. Tente novamente.');
    } finally {
      setIsDeleting(false);
    }
  };

  // --------------------------------------------------------------------------
  // 5. CADASTRO DE NOVO PRODUTO
  // --------------------------------------------------------------------------
  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormImageFile(file);
      const objectUrl = URL.createObjectURL(file);
      setFormImagePreview(objectUrl);
    }
  };

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formName.trim()) {
      setFormError('Informe o nome da semijoia.');
      return;
    }
    if (!formPrice) {
      setFormError('Informe o preço de venda.');
      return;
    }
    if (!formImageFile) {
      setFormError('Selecione uma foto da peça.');
      return;
    }

    try {
      setIsSubmitting(true);
      const formData = new FormData();
      formData.append('nome', formName.trim());
      formData.append('categoria', formCategory);
      formData.append('preco', formPrice);
      if (formPromoPrice) {
        formData.append('preco_promocional', formPromoPrice);
      }
      formData.append('foto', formImageFile);

      const result = await cadastrarProduto(formData);

      if (result.success && result.product) {
        setProducts((prev) => [result.product, ...prev]);
        showToast('Produto cadastrado com sucesso!');
        // Limpa formulário e fecha modal
        setFormName('');
        setFormPrice('');
        setFormPromoPrice('');
        setFormImageFile(null);
        setFormImagePreview('');
        setIsModalOpen(false);
      }
    } catch (err) {
      console.error('Erro ao cadastrar produto:', err);
      setFormError(err.message || 'Erro ao cadastrar produto.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // --------------------------------------------------------------------------
  // 6. CONEXÃO COM O SUPABASE
  // --------------------------------------------------------------------------
  const handleSaveDbSettings = async (e) => {
    e.preventDefault();
    setDbMessage('');
    setIsTestingDb(true);

    try {
      if (!dbUrlInput.trim() || !dbKeyInput.trim()) {
        saveSupabaseCredentials('', '');
        setSupabaseCreds(getSupabaseCredentials());
        setDbMessage('Credenciais removidas. Modo Local ativado.');
        fetchAdminProducts();
        return;
      }

      saveSupabaseCredentials(dbUrlInput.trim(), dbKeyInput.trim());
      const updatedCreds = getSupabaseCredentials();
      setSupabaseCreds(updatedCreds);

      // Testa a conexão
      const client = getSupabaseClient();
      if (client) {
        const { error } = await client.from('produtos').select('id').limit(1);
        if (error) {
          setDbMessage(`Conexão salva, mas o banco retornou: ${error.message}. Verifique se o script SQL foi executado.`);
        } else {
          setDbMessage('✅ Conectado com sucesso ao Supabase na nuvem!');
          showToast('Supabase conectado com sucesso!');
          fetchAdminProducts();
          setTimeout(() => setIsDbModalOpen(false), 1200);
        }
      }
    } catch (err) {
      setDbMessage(`Erro ao testar conexão: ${err.message}`);
    } finally {
      setIsTestingDb(false);
    }
  };

  // --------------------------------------------------------------------------
  // RENDER: BARREIRA DE SENHA / PIN
  // --------------------------------------------------------------------------
  if (!isAuthenticated) {
    return (
      <div className="admin-auth-container">
        <div className="admin-auth-card">
          <div className="admin-auth-badge">
            <Lock size={13} />
            <span>Acesso Restrito</span>
          </div>

          <h1 className="admin-auth-title">GC Semijoias</h1>
          <p className="admin-auth-subtitle">
            Digite a senha mestra para gerenciar o catálogo, preços e disponibilidade das peças.
          </p>

          <form onSubmit={handleLogin} className="admin-auth-form">
            <div className="admin-input-group">
              <label className="admin-input-label">Senha de Acesso</label>
              <div className="admin-password-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="admin-input-field"
                  placeholder="Digite o PIN / Senha"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  autoFocus
                />
                <button
                  type="button"
                  className="admin-password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label="Mostrar ou esconder senha"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {authError && <div className="admin-auth-error">{authError}</div>}

            <button type="submit" className="admin-btn-primary">
              <Lock size={16} />
              <span>Entrar no Painel</span>
            </button>
          </form>

          {onNavigateToStore && (
            <div style={{ marginTop: '1.5rem' }}>
              <button
                type="button"
                onClick={onNavigateToStore}
                className="admin-btn-ghost"
                style={{ width: '100%', justifyContent: 'center' }}
              >
                <ArrowLeft size={14} />
                <span>Voltar à Vitrine da Loja</span>
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // RENDER: PAINEL ADMINISTRATIVO PRINCIPAL (MOBILE-FIRST)
  // --------------------------------------------------------------------------
  return (
    <div className="admin-layout">
      {/* Barra de Controle Superior */}
      <header className="admin-header">
        <div className="admin-header-inner">
          <div className="admin-store-brand">
            <div className="admin-store-icon">
              <Package size={20} />
            </div>
            <div>
              <h1 className="admin-store-title">GC Semijoias</h1>
              <div className="admin-store-subtitle">
                <span>Gestão</span>
                <span className="admin-active-badge">
                  <span className="admin-active-dot" />
                  {activeCount} ativos
                </span>
                <button
                  type="button"
                  onClick={() => setIsDbModalOpen(true)}
                  className={`admin-db-badge ${supabaseCreds.isConfigured ? 'connected' : 'local'}`}
                  title="Status de Conexão com o Supabase"
                >
                  <Database size={11} />
                  <span>{supabaseCreds.isConfigured ? 'Nuvem' : 'Local'}</span>
                </button>
              </div>
            </div>
          </div>

          <div className="admin-header-actions">
            {onNavigateToStore && (
              <button
                onClick={onNavigateToStore}
                className="admin-btn-ghost"
                title="Visualizar a vitrine como cliente"
              >
                <ArrowLeft size={14} />
                <span>Vitrine</span>
              </button>
            )}
            <button
              onClick={handleLogout}
              className="admin-btn-ghost"
              title="Sair do painel administrativo"
              aria-label="Logout"
            >
              <LogOut size={14} />
              <span>Sair</span>
            </button>
          </div>
        </div>
      </header>

      {/* Container Principal */}
      <main className="admin-container">
        {/* Banner informativo caso o Supabase não esteja conectado à nuvem */}
        {!supabaseCreds.isConfigured && (
          <div
            className="admin-notice-banner"
            onClick={() => setIsDbModalOpen(true)}
            role="button"
            tabIndex={0}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
              <Database size={18} color="var(--admin-gold)" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong style={{ color: '#92400E' }}>Modo Local Ativo: </strong>
                <span>
                  Suas alterações de preço e estoque estão funcionando e salvas neste dispositivo. Para sincronizar na nuvem e atualizar automaticamente para todos os clientes, <strong>clique aqui e conecte o Supabase</strong>.
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Abas de Navegação do Painel */}
        <div className="admin-nav-tabs">
          <button
            type="button"
            className={`admin-tab-btn ${adminTab === 'produtos' ? 'active' : ''}`}
            onClick={() => setAdminTab('produtos')}
          >
            <Package size={16} />
            <span>Catálogo de Produtos ({products.length})</span>
          </button>

          <button
            type="button"
            className={`admin-tab-btn ${adminTab === 'garantias' ? 'active' : ''}`}
            onClick={() => setAdminTab('garantias')}
          >
            <ShieldCheck size={16} />
            <span>Controle de Garantias & Vendas</span>
            {warranties.length > 0 && (
              <span className="admin-tab-badge">
                {warranties.length}
              </span>
            )}
          </button>
        </div>

        {/* ABA 1: CATÁLOGO DE PRODUTOS */}
        {adminTab === 'produtos' && (
          <>
            {/* Barra de Ferramentas: Busca Rápida e Botão "+ Novo Produto" */}
            <div className="admin-tools-bar">
              <div className="admin-search-wrapper">
                <Search size={18} className="admin-search-icon" />
                <input
                  type="text"
                  className="admin-search-input"
                  placeholder="Buscar peça por nome ou categoria..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button
                    className="admin-search-clear"
                    onClick={() => setSearchQuery('')}
                    aria-label="Limpar busca"
                  >
                    ×
                  </button>
                )}
              </div>

              <button
                className="admin-btn-add-product"
                onClick={() => setIsModalOpen(true)}
              >
                <Plus size={18} />
                <span>+ Novo Produto</span>
              </button>
            </div>

            {/* Lista Compacta de Produtos */}
            {loading ? (
              <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--admin-text-secondary)' }}>
                <RefreshCw size={28} className="spin-animation" style={{ margin: '0 auto 0.75rem' }} />
                <p style={{ fontSize: '0.9rem' }}>Carregando produtos...</p>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem 1rem', background: '#FFF', borderRadius: '16px', border: '1px solid #ECE7DF' }}>
                <Package size={36} color="var(--admin-gold)" style={{ margin: '0 auto 0.75rem' }} />
                <h3 style={{ fontSize: '1.1rem', marginBottom: '0.3rem' }}>Nenhum produto encontrado</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--admin-text-secondary)' }}>
                  {searchQuery ? 'Tente buscar com outros termos.' : 'Cadastre sua primeira peça no botão acima!'}
                </p>
              </div>
            ) : (
              <div className="admin-product-list">
                {filteredProducts.map((product) => (
                  <AdminProductRow
                    key={product.id}
                    product={product}
                    onToggleStatus={() => handleToggleStatus(product)}
                    onSavePrices={(preco, promo) => handleSavePrices(product.id, preco, promo)}
                    onDelete={() => setProductToDelete(product)}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {/* ABA 2: CONTROLE DE GARANTIAS & VENDAS */}
        {adminTab === 'garantias' && (
          <div className="admin-warranty-section">
            <div className="admin-tools-bar">
              <div className="admin-search-wrapper">
                <Search size={18} className="admin-search-icon" />
                <input
                  type="text"
                  className="admin-search-input"
                  placeholder="Buscar garantia por cliente, código ou peça..."
                  value={warrantySearch}
                  onChange={(e) => setWarrantySearch(e.target.value)}
                />
                {warrantySearch && (
                  <button
                    className="admin-search-clear"
                    onClick={() => setWarrantySearch('')}
                    aria-label="Limpar busca"
                  >
                    ×
                  </button>
                )}
              </div>

              <button
                className="admin-btn-add-product"
                onClick={() => setIsManualWarrantyModalOpen(true)}
              >
                <Plus size={18} />
                <span>+ Registrar Garantia</span>
              </button>
            </div>

            {filteredWarranties.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3.5rem 1rem', background: '#FFF', borderRadius: '16px', border: '1px solid #ECE7DF' }}>
                <ShieldCheck size={40} color="var(--admin-gold)" style={{ margin: '0 auto 0.75rem' }} />
                <h3 style={{ fontSize: '1.15rem', marginBottom: '0.4rem', color: 'var(--admin-text-primary)' }}>
                  Nenhuma garantia registrada ainda
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--admin-text-secondary)', maxWidth: '420px', margin: '0 auto 1.25rem' }}>
                  As garantias emitidas pelas clientes na sacola ou vendas registradas aparecerão aqui organizadas com prazo de 1 ou 2 anos.
                </p>
                <button
                  type="button"
                  onClick={() => setIsManualWarrantyModalOpen(true)}
                  className="admin-btn-primary"
                  style={{ display: 'inline-flex', padding: '9px 18px' }}
                >
                  <Plus size={16} />
                  <span>Registrar Primeira Garantia</span>
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {filteredWarranties.map((w) => (
                  <div
                    key={w.id}
                    style={{
                      background: '#FFFFFF',
                      borderRadius: '14px',
                      border: '1px solid #ECE7DF',
                      padding: '1.1rem 1.25rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.75rem',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--admin-gold)', background: 'var(--gold-ultralight)', padding: '2px 8px', borderRadius: '6px' }}>
                            {w.codigo}
                          </span>
                          <span style={{ fontSize: '0.72rem', color: '#16A34A', fontWeight: '600', background: '#DCFCE7', padding: '2px 8px', borderRadius: '12px' }}>
                            {w.status === 'ativa' ? 'Garantia Ativa' : w.status}
                          </span>
                        </div>
                        <h4 style={{ fontSize: '1.05rem', fontWeight: '700', marginTop: '6px', color: 'var(--admin-text-primary)' }}>
                          {w.clienteNome}
                        </h4>
                        {w.clienteTelefone && (
                          <div style={{ fontSize: '0.78rem', color: 'var(--admin-text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Phone size={12} />
                            <span>{w.clienteTelefone}</span>
                          </div>
                        )}
                      </div>

                      <div style={{ textAlign: 'right', fontSize: '0.8rem' }}>
                        <div style={{ color: 'var(--admin-text-secondary)' }}>
                          Compra: <strong>{w.dataCompra}</strong>
                        </div>
                        <div style={{ color: 'var(--admin-gold)', fontWeight: '600', marginTop: '2px' }}>
                          {w.periodoLabel}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--admin-text-muted)' }}>
                          Válida até: {w.validadeAte}
                        </div>
                      </div>
                    </div>

                    {/* Peças da garantia */}
                    <div style={{ background: '#FAF8F5', borderRadius: '8px', padding: '8px 12px', fontSize: '0.8rem' }}>
                      <span style={{ fontSize: '0.72rem', color: 'var(--admin-text-muted)', display: 'block', marginBottom: '4px' }}>
                        Peças cobertas:
                      </span>
                      {w.itens.map((it, idx) => (
                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '2px 0' }}>
                          <span><strong>{it.quantity}x</strong> {it.name} ({it.material})</span>
                          {it.price > 0 && <span style={{ color: 'var(--admin-text-secondary)' }}>R$ {(it.price * it.quantity).toFixed(2).replace('.', ',')}</span>}
                        </div>
                      ))}
                    </div>

                    {/* Ações da garantia */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '4px', borderTop: '1px solid #F3EFEA' }}>
                      <button
                        type="button"
                        onClick={() => handleDeleteWarranty(w.id)}
                        style={{ color: '#DC2626', background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem' }}
                      >
                        <Trash2 size={13} />
                        <span>Remover</span>
                      </button>

                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          type="button"
                          onClick={() => {
                            const txt = gerarTextoWhatsAppGarantia(w);
                            let url = `https://api.whatsapp.com/send?text=${encodeURIComponent(txt)}`;
                            if (w.clienteTelefone) {
                              const clean = w.clienteTelefone.replace(/\D/g, '');
                              if (clean) url = `https://wa.me/55${clean}?text=${encodeURIComponent(txt)}`;
                            }
                            window.open(url, '_blank');
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px',
                            background: '#25D366',
                            color: '#FFF',
                            padding: '6px 12px',
                            borderRadius: '8px',
                            fontSize: '0.78rem',
                            fontWeight: '600',
                            cursor: 'pointer',
                            border: 'none'
                          }}
                        >
                          <MessageCircle size={14} />
                          <span>WhatsApp</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setActiveCertificate(w)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px',
                            background: 'var(--admin-gold)',
                            color: '#FFF',
                            padding: '6px 12px',
                            borderRadius: '8px',
                            fontSize: '0.78rem',
                            fontWeight: '600',
                            cursor: 'pointer',
                            border: 'none'
                          }}
                        >
                          <ShieldCheck size={14} />
                          <span>Ver Certificado</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Formulário Retrátil "+ Novo Produto" (Modal / Drawer) */}
      {isModalOpen && (
        <div className="admin-modal-backdrop" onClick={() => setIsModalOpen(false)}>
          <div className="admin-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="admin-drawer-header">
              <h2 className="admin-drawer-title">Cadastrar Nova Peça</h2>
              <button
                className="admin-drawer-close"
                onClick={() => setIsModalOpen(false)}
                aria-label="Fechar"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="admin-drawer-body">
              {formError && <div className="admin-auth-error">{formError}</div>}

              {/* Upload com Pré-Visualização Instantânea */}
              <div className="admin-input-group">
                <label className="admin-input-label">Foto da Peça</label>
                <label className="admin-image-upload-box">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    style={{ display: 'none' }}
                  />
                  {formImagePreview ? (
                    <>
                      <img
                        src={formImagePreview}
                        alt="Pré-visualização"
                        className="admin-image-preview"
                      />
                      <button type="button" className="admin-image-change-btn">
                        Trocar Foto
                      </button>
                    </>
                  ) : (
                    <div className="admin-image-placeholder">
                      <Upload size={32} />
                      <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                        Clique para escolher da Galeria ou Câmera
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--admin-text-muted)' }}>
                        Formatos JPG, PNG ou WEBP (até 5MB)
                      </span>
                    </div>
                  )}
                </label>
              </div>

              {/* Nome da Peça */}
              <div className="admin-input-group">
                <label className="admin-input-label">Nome da Peça *</label>
                <input
                  type="text"
                  className="admin-input-field"
                  placeholder="Ex: Brinco Argola Cravejada Zircônia"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  required
                />
              </div>

              {/* Categoria */}
              <div className="admin-input-group">
                <label className="admin-input-label">Categoria *</label>
                <select
                  className="admin-input-field"
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Preço de Venda e Preço Promocional */}
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <div className="admin-input-group" style={{ flex: 1 }}>
                  <label className="admin-input-label">Preço de Venda (R$) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className="admin-input-field"
                    placeholder="Ex: 49.90"
                    value={formPrice}
                    onChange={(e) => setFormPrice(e.target.value)}
                    required
                  />
                </div>

                <div className="admin-input-group" style={{ flex: 1 }}>
                  <label className="admin-input-label">Promocional (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className="admin-input-field"
                    placeholder="Opcional"
                    value={formPromoPrice}
                    onChange={(e) => setFormPromoPrice(e.target.value)}
                  />
                </div>
              </div>

              {/* Botão de Envio com Loading Indicator */}
              <button
                type="submit"
                className="admin-btn-primary"
                disabled={isSubmitting}
                style={{ marginTop: '0.5rem' }}
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw size={16} className="spin-animation" />
                    <span>Cadastrando no Catálogo...</span>
                  </>
                ) : (
                  <>
                    <Plus size={18} />
                    <span>Cadastrar Peça</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal / Gaveta de Configuração do Supabase */}
      {isDbModalOpen && (
        <div className="admin-modal-backdrop" onClick={() => setIsDbModalOpen(false)}>
          <div className="admin-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="admin-drawer-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Database size={20} color="var(--admin-gold)" />
                <h2 className="admin-drawer-title">Conectar Banco Supabase</h2>
              </div>
              <button
                className="admin-drawer-close"
                onClick={() => setIsDbModalOpen(false)}
                aria-label="Fechar"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveDbSettings} className="admin-drawer-body">
              <p style={{ fontSize: '0.85rem', color: 'var(--admin-text-secondary)', margin: 0, lineHeight: 1.5 }}>
                Conecte seu projeto Supabase para que todas as alterações de preços, novos produtos e status de estoque fiquem salvos na nuvem e apareçam instantaneamente para todos os visitantes do seu site.
              </p>

              {dbMessage && (
                <div
                  style={{
                    padding: '0.75rem',
                    borderRadius: '8px',
                    fontSize: '0.82rem',
                    background: dbMessage.includes('✅') ? '#ECFDF5' : '#FEF2F2',
                    color: dbMessage.includes('✅') ? '#065F46' : '#991B1B',
                    border: `1px solid ${dbMessage.includes('✅') ? '#A7F3D0' : '#FECACA'}`,
                  }}
                >
                  {dbMessage}
                </div>
              )}

              <div className="admin-input-group">
                <label className="admin-input-label">Project URL (Supabase)</label>
                <input
                  type="url"
                  className="admin-input-field"
                  placeholder="https://seu-projeto.supabase.co"
                  value={dbUrlInput}
                  onChange={(e) => setDbUrlInput(e.target.value)}
                />
              </div>

              <div className="admin-input-group">
                <label className="admin-input-label">Anon / Public Key (Supabase)</label>
                <input
                  type="text"
                  className="admin-input-field"
                  placeholder="eyJh..."
                  value={dbKeyInput}
                  onChange={(e) => setDbKeyInput(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button
                  type="submit"
                  className="admin-btn-primary"
                  style={{ flex: 2 }}
                  disabled={isTestingDb}
                >
                  {isTestingDb ? (
                    <>
                      <RefreshCw size={16} className="spin-animation" />
                      <span>Testando...</span>
                    </>
                  ) : (
                    <>
                      <Check size={16} />
                      <span>Salvar & Conectar</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  className="admin-btn-ghost"
                  style={{ flex: 1, justifyContent: 'center' }}
                  onClick={() => {
                    setDbUrlInput('');
                    setDbKeyInput('');
                    saveSupabaseCredentials('', '');
                    setSupabaseCreds(getSupabaseCredentials());
                    setDbMessage('Credenciais limpas.');
                  }}
                >
                  Limpar
                </button>
              </div>

              <div style={{ marginTop: '0.75rem', padding: '0.85rem', background: '#FAF7F2', borderRadius: '10px', fontSize: '0.78rem', color: '#5C544B' }}>
                <strong>📌 Dica para produção (Vercel):</strong>
                <p style={{ margin: '0.3rem 0 0', lineHeight: 1.4 }}>
                  Você também pode configurar as variáveis <code>VITE_SUPABASE_URL</code> e <code>VITE_SUPABASE_ANON_KEY</code> diretamente no painel da Vercel (<em>Settings &gt; Environment Variables</em>).
                </p>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Confirmação para Exclusão Definitiva */}
      {productToDelete && (
        <div className="admin-modal-backdrop" onClick={() => !isDeleting && setProductToDelete(null)}>
          <div className="admin-confirm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-confirm-icon">
              <Trash2 size={24} color="#DC2626" />
            </div>
            <h3 className="admin-confirm-title">Excluir Peça do Catálogo?</h3>
            <p className="admin-confirm-text">
              Tem certeza que deseja apagar definitivamente a peça <strong>"{productToDelete.nome || productToDelete.name}"</strong>?
              <br />
              <span className="admin-confirm-hint">
                💡 <em>Dica:</em> Se a peça apenas acabou o estoque, use a opção <strong>Esgotado</strong> para que ela permaneça visível na vitrine sem permitir compras.
              </span>
            </p>
            <div className="admin-confirm-actions">
              <button
                type="button"
                className="admin-btn-ghost"
                onClick={() => setProductToDelete(null)}
                disabled={isDeleting}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="admin-btn-danger"
                onClick={confirmDeleteProduct}
                disabled={isDeleting}
              >
                {isDeleting ? 'Excluindo...' : 'Sim, Excluir'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal / Drawer para Registro de Garantia Avulsa */}
      {isManualWarrantyModalOpen && (
        <div className="admin-modal-backdrop" onClick={() => setIsManualWarrantyModalOpen(false)}>
          <div className="admin-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="admin-drawer-header">
              <h2 className="admin-drawer-title">Registrar Garantia & Venda</h2>
              <button
                className="admin-drawer-close"
                onClick={() => setIsManualWarrantyModalOpen(false)}
                aria-label="Fechar"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateManualWarranty} className="admin-drawer-body">
              {manualFormError && <div className="admin-auth-error">{manualFormError}</div>}

              <div className="admin-input-group">
                <label className="admin-input-label">Nome da Cliente *</label>
                <input
                  type="text"
                  className="admin-input-field"
                  placeholder="Ex: Amanda Silva"
                  value={manualClientName}
                  onChange={(e) => setManualClientName(e.target.value)}
                  required
                />
              </div>

              <div className="admin-input-group">
                <label className="admin-input-label">WhatsApp da Cliente (opcional)</label>
                <input
                  type="text"
                  className="admin-input-field"
                  placeholder="Ex: 19999998888"
                  value={manualClientPhone}
                  onChange={(e) => setManualClientPhone(e.target.value)}
                />
              </div>

              <div className="admin-input-group">
                <label className="admin-input-label">Nome da Semijoia *</label>
                <input
                  type="text"
                  className="admin-input-field"
                  placeholder="Ex: Brinco Argola Coração Luxo"
                  value={manualItemName}
                  onChange={(e) => setManualItemName(e.target.value)}
                  required
                />
              </div>

              <div className="admin-form-row">
                <div className="admin-input-group" style={{ flex: 1 }}>
                  <label className="admin-input-label">Banho / Material</label>
                  <select
                    className="admin-select-field"
                    value={manualItemMaterial}
                    onChange={(e) => setManualItemMaterial(e.target.value)}
                  >
                    <option value="Ouro 18k">Banho Ouro 18k</option>
                    <option value="Ródio Branco">Ródio Branco</option>
                    <option value="Prata 925">Prata 925</option>
                  </select>
                </div>

                <div className="admin-input-group" style={{ flex: 1 }}>
                  <label className="admin-input-label">Prazo da Garantia</label>
                  <select
                    className="admin-select-field"
                    value={manualWarrantyYears}
                    onChange={(e) => setManualWarrantyYears(Number(e.target.value))}
                  >
                    <option value={1}>1 Ano de Garantia</option>
                    <option value={2}>2 Anos de Garantia</option>
                  </select>
                </div>
              </div>

              <div className="admin-input-group">
                <label className="admin-input-label">Valor da Peça (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className="admin-input-field"
                  placeholder="Ex: 49.90"
                  value={manualItemPrice}
                  onChange={(e) => setManualItemPrice(e.target.value)}
                />
              </div>

              <div className="admin-drawer-actions">
                <button
                  type="button"
                  className="admin-btn-ghost"
                  onClick={() => setIsManualWarrantyModalOpen(false)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="admin-btn-primary"
                >
                  <ShieldCheck size={16} />
                  <span>Emitir Certificado de Garantia</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal do Certificado Oficial de Garantia */}
      {activeCertificate && (
        <WarrantyModal
          garantia={activeCertificate}
          onClose={() => setActiveCertificate(null)}
        />
      )}

      {/* Toast de Feedback Discreto */}
      {toastMessage && (
        <div className="admin-toast success">
          <Check size={16} color="#10B981" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}

// ----------------------------------------------------------------------------
// COMPONENTE: LINHA / CARTÃO DE PRODUTO COMPACTO (MOBILE-FIRST)
// ----------------------------------------------------------------------------
function AdminProductRow({ product, onToggleStatus, onSavePrices, onDelete }) {
  const isAtivo = product.ativo ?? product.in_stock ?? true;
  const initialPreco = product.preco ?? product.price ?? 0;
  const initialPromo = product.preco_promocional ?? product.promotional_price ?? '';

  const [preco, setPreco] = useState(initialPreco ? Number(initialPreco).toFixed(2) : '');
  const [promo, setPromo] = useState(initialPromo ? Number(initialPromo).toFixed(2) : '');
  const [savedFeedback, setSavedFeedback] = useState(false);

  // Sincroniza se o produto mudar externamente
  useEffect(() => {
    setPreco(initialPreco ? Number(initialPreco).toFixed(2) : '');
    setPromo(initialPromo ? Number(initialPromo).toFixed(2) : '');
  }, [initialPreco, initialPromo]);

  const triggerSave = () => {
    const p = parseFloat(String(preco).replace(',', '.'));
    const promoVal = promo !== '' ? parseFloat(String(promo).replace(',', '.')) : null;

    if (!isNaN(p) && (p !== initialPreco || promoVal !== initialPromo)) {
      onSavePrices(p, promoVal);
      setSavedFeedback(true);
      setTimeout(() => setSavedFeedback(false), 2000);
    }
  };

  const imgSrc =
    product.imagem_url ||
    product.local_image ||
    product.image ||
    '/images/placeholder.jpg';

  return (
    <div className={`admin-product-row ${!isAtivo ? 'is-inactive' : ''}`}>
      {/* Topo da linha: Foto + Nome/Categoria + Ações (Toggle + Excluir) */}
      <div className="admin-product-row-top">
        <img
          src={imgSrc}
          alt={product.nome || product.name}
          className="admin-product-thumb"
          loading="lazy"
          onError={(e) => {
            e.target.src = 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=160&auto=format&fit=crop&q=60';
          }}
        />

        <div className="admin-product-meta">
          <h3 className="admin-product-name" title={product.nome || product.name}>
            {product.nome || product.name}
          </h3>
          <span className="admin-product-category">
            {product.categoria || product.category}
          </span>
        </div>

        {/* Grupo de Ações: Toggle Ativo/Esgotado + Lixeira */}
        <div className="admin-row-actions">
          <button
            type="button"
            className={`admin-toggle-btn ${isAtivo ? 'active' : 'inactive'}`}
            onClick={onToggleStatus}
            title={isAtivo ? 'Clique para marcar como Esgotado (continua no catálogo)' : 'Clique para marcar como Ativo'}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                backgroundColor: isAtivo ? '#10B981' : '#9CA3AF',
              }}
            />
            <span>{isAtivo ? 'Ativo' : 'Esgotado'}</span>
          </button>

          <button
            type="button"
            className="admin-delete-btn"
            onClick={onDelete}
            title="Excluir produto definitivamente"
            aria-label="Excluir produto"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Rodapé da linha: Inputs numéricos inline de Preço e Promocional */}
      <div className="admin-product-prices">
        <div className={`admin-price-input-box ${savedFeedback ? 'saved' : ''}`}>
          <span className="admin-price-label">Preço:</span>
          <span style={{ fontSize: '0.78rem', color: 'var(--admin-text-secondary)', marginRight: '2px' }}>R$</span>
          <input
            type="number"
            step="0.01"
            min="0"
            className="admin-price-input"
            value={preco}
            onChange={(e) => setPreco(e.target.value)}
            onBlur={triggerSave}
            onKeyDown={(e) => e.key === 'Enter' && triggerSave()}
            placeholder="0.00"
          />
        </div>

        <div className={`admin-price-input-box ${savedFeedback ? 'saved' : ''}`}>
          <span className="admin-price-label">Promo:</span>
          <span style={{ fontSize: '0.78rem', color: 'var(--admin-text-secondary)', marginRight: '2px' }}>R$</span>
          <input
            type="number"
            step="0.01"
            min="0"
            className="admin-price-input"
            value={promo}
            onChange={(e) => setPromo(e.target.value)}
            onBlur={triggerSave}
            onKeyDown={(e) => e.key === 'Enter' && triggerSave()}
            placeholder="—"
          />
        </div>

        {savedFeedback && (
          <div className="admin-save-indicator" title="Salvo">
            <Check size={16} />
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminPage;
