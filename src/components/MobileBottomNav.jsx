import React from 'react';
import { Home, Grid, Heart, ShoppingBag } from 'lucide-react';
import { useCart } from '../context/CartContext';

export const MobileBottomNav = ({ activeTab, onTabSelect }) => {
  const { totalItems, setIsCartOpen, favorites } = useCart();

  return (
    <nav className="mobile-bottom-nav" aria-label="Navegação inferior móvel">
      <button
        className={`nav-tab-item ${activeTab === 'home' ? 'active' : ''}`}
        onClick={() => onTabSelect('home')}
      >
        <Home size={20} />
        <span>Início</span>
      </button>

      <button
        className={`nav-tab-item ${activeTab === 'categories' ? 'active' : ''}`}
        onClick={() => onTabSelect('categories')}
      >
        <Grid size={20} />
        <span>Categorias</span>
      </button>

      <button
        className={`nav-tab-item ${activeTab === 'favorites' ? 'active' : ''}`}
        onClick={() => onTabSelect('favorites')}
      >
        <Heart size={20} fill={favorites.length > 0 ? '#E53935' : 'none'} color={favorites.length > 0 ? '#E53935' : 'currentColor'} />
        <span>Favoritos</span>
        {favorites.length > 0 && (
          <span className="nav-badge" style={{ background: '#E53935' }}>
            {favorites.length}
          </span>
        )}
      </button>

      <button
        className="nav-tab-item"
        onClick={() => setIsCartOpen(true)}
      >
        <ShoppingBag size={20} />
        <span>Sacola</span>
        {totalItems > 0 && (
          <span className="nav-badge">
            {totalItems}
          </span>
        )}
      </button>
    </nav>
  );
};
