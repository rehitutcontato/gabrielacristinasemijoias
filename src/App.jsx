import React, { useState, useMemo } from 'react';
import { PRODUCTS } from './data/products';
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
  const { favorites } = useCart();

  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [selectedMaterial, setSelectedMaterial] = useState('Todos');
  const [sortBy, setSortBy] = useState('default');
  const [onlyInStock, setOnlyInStock] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [quickViewProduct, setQuickViewProduct] = useState(null);
  const [activeMobileTab, setActiveMobileTab] = useState('home');

  // Compute category counts
  const categoryCounts = useMemo(() => {
    const counts = { Todos: PRODUCTS.length };
    CATEGORIES.forEach((cat) => {
      if (cat !== 'Todos') {
        counts[cat] = PRODUCTS.filter((p) => p.category === cat).length;
      }
    });
    return counts;
  }, []);

  // Filter & Sort Products
  const filteredProducts = useMemo(() => {
    let list = [...PRODUCTS];

    // If on favorites tab
    if (activeMobileTab === 'favorites') {
      list = list.filter((p) => favorites.includes(p.id));
    } else {
      // Category filter
      if (selectedCategory !== 'Todos') {
        list = list.filter((p) => p.category === selectedCategory);
      }
    }

    // Material filter
    if (selectedMaterial !== 'Todos') {
      list = list.filter((p) => p.material.toLowerCase().includes(selectedMaterial.toLowerCase()));
    }

    // In-stock only
    if (onlyInStock) {
      list = list.filter((p) => p.in_stock);
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          p.material.toLowerCase().includes(q)
      );
    }

    // Sorting
    list.sort((a, b) => {
      // In-stock items prioritized
      if (a.in_stock !== b.in_stock) {
        return a.in_stock ? -1 : 1;
      }

      if (sortBy === 'price-asc') {
        return a.price - b.price;
      }
      if (sortBy === 'price-desc') {
        return b.price - a.price;
      }
      if (sortBy === 'name-asc') {
        return a.name.localeCompare(b.name);
      }
      return 0; // default order
    });

    return list;
  }, [selectedCategory, selectedMaterial, sortBy, onlyInStock, searchQuery, activeMobileTab, favorites]);

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

      <Footer onSelectCategory={handleSelectCategory} />

      {/* Modals & Floating Tools */}
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
