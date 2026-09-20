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
} from 'lucide-react';
import {
  obterProdutosAdmin,
  atualizarPrecos,
  alternarStatusProduto,
  cadastrarProduto,
} from '../../actions/admin';
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
              />
            ))}
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
function AdminProductRow({ product, onToggleStatus, onSavePrices }) {
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
      {/* Topo da linha: Foto + Nome/Categoria + Toggle Ativo/Esgotado */}
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

        {/* Toggle de Disponibilidade */}
        <button
          type="button"
          className={`admin-toggle-btn ${isAtivo ? 'active' : 'inactive'}`}
          onClick={onToggleStatus}
          title={isAtivo ? 'Clique para marcar como Esgotado' : 'Clique para marcar como Ativo'}
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
