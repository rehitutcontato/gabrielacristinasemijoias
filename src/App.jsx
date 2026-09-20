import React, { useState, useEffect, useMemo } from 'react';
import { PRODUCTS } from './data/products';
import {
  obterProdutosVitrine,
  getLocalOverrides,
  getCustomProducts,
  mapSupabaseProduct,
} from './actions/admin';
import { useCart } from './context/CartContext';
import { Header } from './components/Header';
import { HeroBanner } from './components/HeroBanner';
import { CategoryFilter } from './components/CategoryFilter';
import { ProductGrid } from './components/ProductGrid';
import { ProductModal } from './components/ProductModal';
import { CartDrawer } from './components/CartDrawer';
import { TrustBadges } from './components/TrustBadges';
import { WhatsAppFloating } from './components/WhatsAppFloating';
import { MobileBottomNav } from './components/MobileBottomNav';
import { Toast } from './components/Toast';
import { Footer } from './components/Footer';
import { AdminPage } from './components/admin/AdminPage';

const CATEGORIES = [
  'Todos',
  'Brincos',
  'Colares',
  'Anéis',
  'Pulseiras',
  'Piercings',
  'Conjuntos & Mix'
];

export function App() {
  // --------------------------------------------------------------------------
  // ROTEAMENTO SIMPLES (CLIENT-SIDE ROUTER: / ou /admin)
  // --------------------------------------------------------------------------
  const resolveCurrentPath = () => {
    if (typeof window !== 'undefined') {
      if (window.location.hash.startsWith('#/admin') || window.location.hash === '#admin') {
        return '/admin';
      }
      return window.location.pathname;
    }
    return '/';
  };

  const [currentPath, setCurrentPath] = useState(resolveCurrentPath);

  useEffect(() => {
    const handleLocationChange = () => {
      setCurrentPath(resolveCurrentPath());
    };
    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('hashchange', handleLocationChange);
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('hashchange', handleLocationChange);
    };
  }, []);

  const navigate = (path) => {
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', path);
      setCurrentPath(path);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Se a rota for /admin, renderiza o Painel Administrativo
  if (currentPath.startsWith('/admin')) {
    return <AdminPage onNavigateToStore={() => navigate('/')} />;
  }

  // --------------------------------------------------------------------------
  // VITRINE PÚBLICA (ESTADOS E CARREGAMENTO DO BANCO SUPABASE)
  // --------------------------------------------------------------------------
  const { favorites } = useCart();

  // Inicializa sincronamente com quaisquer overrides já gravados
  const [products, setProducts] = useState(() => {
    if (typeof window !== 'undefined') {
      const overrides = getLocalOverrides();
      const customs = getCustomProducts();
      const base = [...customs, ...PRODUCTS];
      const mapped = base.map((p) => {
        const o = overrides[p.id];
        if (!o) return mapSupabaseProduct(p);
        const basePrice = o.preco !== undefined ? Number(o.preco) : (Number(p.preco ?? p.price) || 0);
        const rawPromo = o.preco_promocional !== undefined ? o.preco_promocional : (p.preco_promocional ?? p.promotional_price);
        const promoPrice = rawPromo != null && rawPromo !== '' ? Number(rawPromo) : null;
        const effectivePrice = promoPrice && promoPrice > 0 ? promoPrice : basePrice;
        const isAtivo = o.ativo !== undefined ? Boolean(o.ativo) : (p.ativo ?? p.in_stock ?? true);
        return {
          ...mapSupabaseProduct(p),
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
      });
      return mapped.filter((p) => p.ativo === true || p.in_stock === true);
    }
    return PRODUCTS;
  });

  const [isLoadingDynamic, setIsLoadingDynamic] = useState(false);

  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [selectedMaterial, setSelectedMaterial] = useState('Todos');
  const [sortBy, setSortBy] = useState('default');
  const [onlyInStock, setOnlyInStock] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [quickViewProduct, setQuickViewProduct] = useState(null);
  const [activeMobileTab, setActiveMobileTab] = useState('home');

  // Busca os produtos dinâmicos no Supabase onde ativo = true
  const fetchVitrineProducts = async () => {
    try {
      setIsLoadingDynamic(true);
      const dynamicList = await obterProdutosVitrine();
      if (dynamicList && dynamicList.length > 0) {
        setProducts(dynamicList);
      }
    } catch (err) {
      console.warn('Falha ao carregar produtos do banco, mantendo catálogo local:', err);
    } finally {
      setIsLoadingDynamic(false);
    }
  };

  useEffect(() => {
    fetchVitrineProducts();

    // Revalidação em tempo real caso ocorra alteração via Admin Actions
    const handleRevalidate = () => {
      fetchVitrineProducts();
    };
    window.addEventListener('gc-catalog-revalidate', handleRevalidate);
    return () => window.removeEventListener('gc-catalog-revalidate', handleRevalidate);
  }, []);

  // Contagem dinâmica por categoria
  const categoryCounts = useMemo(() => {
    const counts = { Todos: products.length };
    CATEGORIES.forEach((cat) => {
      if (cat !== 'Todos') {
        counts[cat] = products.filter(
          (p) => (p.category || p.categoria) === cat
        ).length;
      }
    });
    return counts;
  }, [products]);

  // Filtragem e Ordenação da Vitrine
  const filteredProducts = useMemo(() => {
    let list = [...products];

    // Aba de favoritos no mobile
    if (activeMobileTab === 'favorites') {
      list = list.filter((p) => favorites.includes(p.id));
    } else {
      // Filtro por categoria
      if (selectedCategory !== 'Todos') {
        list = list.filter(
          (p) => (p.category || p.categoria) === selectedCategory
        );
      }
    }

    // Filtro por material / banho
    if (selectedMaterial !== 'Todos') {
      list = list.filter((p) =>
        (p.material || '').toLowerCase().includes(selectedMaterial.toLowerCase())
      );
    }

    // Apenas disponíveis em estoque (ativo = true)
    if (onlyInStock) {
      list = list.filter((p) => p.in_stock || p.ativo);
    }

    // Busca rápida em tempo real
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (p) =>
          (p.name || p.nome || '').toLowerCase().includes(q) ||
          (p.category || p.categoria || '').toLowerCase().includes(q) ||
          (p.material || '').toLowerCase().includes(q)
      );
    }

    // Ordenação
    list.sort((a, b) => {
      const aStock = a.in_stock ?? a.ativo ?? true;
      const bStock = b.in_stock ?? b.ativo ?? true;

      // Itens em estoque têm prioridade
      if (aStock !== bStock) {
        return aStock ? -1 : 1;
      }

      const aPrice = a.price ?? a.preco ?? 0;
      const bPrice = b.price ?? b.preco ?? 0;

      if (sortBy === 'price-asc') {
        return aPrice - bPrice;
      }
      if (sortBy === 'price-desc') {
        return bPrice - aPrice;
      }
      if (sortBy === 'name-asc') {
        const aName = a.name || a.nome || '';
        const bName = b.name || b.nome || '';
        return aName.localeCompare(bName);
      }
      return 0;
    });

    return list;
  }, [
    products,
    selectedCategory,
    selectedMaterial,
    sortBy,
    onlyInStock,
    searchQuery,
    activeMobileTab,
    favorites,
  ]);

  const handleSelectCategory = (cat) => {
    setSelectedCategory(cat);
    setActiveMobileTab('home');
    const elem = document.getElementById('catalogo');
    if (elem) {
      elem.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleExploreClick = () => {
    const elem = document.getElementById('catalogo');
    if (elem) {
      elem.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleLogoClick = () => {
    setSelectedCategory('Todos');
    setSelectedMaterial('Todos');
    setSearchQuery('');
    setActiveMobileTab('home');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFavoritesClick = () => {
    setActiveMobileTab((prev) => (prev === 'favorites' ? 'home' : 'favorites'));
    const elem = document.getElementById('catalogo');
    if (elem) {
      elem.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleResetFilters = () => {
    setSelectedCategory('Todos');
    setSelectedMaterial('Todos');
    setSortBy('default');
    setOnlyInStock(false);
    setSearchQuery('');
    setActiveMobileTab('home');
  };

  const handleMobileTabSelect = (tab) => {
    setActiveMobileTab(tab);
    if (tab === 'home') {
      setSelectedCategory('Todos');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (tab === 'categories') {
      const elem = document.getElementById('catalogo');
      if (elem) {
        elem.scrollIntoView({ behavior: 'smooth' });
      }
    } else if (tab === 'favorites') {
      const elem = document.getElementById('catalogo');
      if (elem) {
        elem.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <div className="app-layout">
      <Header
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onLogoClick={handleLogoClick}
        onFavoritesClick={handleFavoritesClick}
        activeTab={activeMobileTab}
      />

      <main>
        {activeMobileTab !== 'favorites' && (
          <HeroBanner onExploreClick={handleExploreClick} />
        )}

        {activeMobileTab === 'favorites' && (
          <div className="container" style={{ margin: '1.5rem auto 1rem', textAlign: 'center' }}>
            <h2 className="font-serif" style={{ fontSize: '1.8rem', color: 'var(--text-primary)' }}>
              Suas Peças Favoritas ❤️
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.4rem' }}>
              {favorites.length === 0
                ? 'Você ainda não favoritou nenhuma peça. Clique no coração das fotos para salvar!'
                : `Você favoritou ${favorites.length} ${favorites.length === 1 ? 'peça' : 'peças'}.`}
            </p>
          </div>
        )}

        <CategoryFilter
          categories={CATEGORIES}
          selectedCategory={selectedCategory}
          onSelectCategory={handleSelectCategory}
          categoryCounts={categoryCounts}
          selectedMaterial={selectedMaterial}
          onSelectMaterial={setSelectedMaterial}
          sortBy={sortBy}
          onSelectSort={setSortBy}
          onlyInStock={onlyInStock}
          onToggleInStock={() => setOnlyInStock(!onlyInStock)}
          totalResults={filteredProducts.length}
          searchQuery={searchQuery}
          onClearSearch={() => setSearchQuery('')}
        />

        <ProductGrid
          products={filteredProducts}
          onQuickView={(p) => setQuickViewProduct(p)}
          onResetFilters={handleResetFilters}
        />

        <TrustBadges />
      </main>

      <Footer
        onSelectCategory={handleSelectCategory}
        onNavigateAdmin={() => navigate('/admin')}
      />

      {/* Modals & Ferramentas Flutuantes */}
      {quickViewProduct && (
        <ProductModal
          product={quickViewProduct}
          onClose={() => setQuickViewProduct(null)}
        />
      )}

      <CartDrawer />
      <Toast />
      <WhatsAppFloating />
      <MobileBottomNav
        activeTab={activeMobileTab}
        onTabSelect={handleMobileTabSelect}
      />
    </div>
  );
}

export default App;
