import React, { useState } from 'react';
import { ShoppingBag, Search, X, Heart, Sparkles } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { STORE_CONFIG } from '../data/products';

export const Header = ({ searchQuery, setSearchQuery, onLogoClick, onFavoritesClick, activeTab }) => {
  const { totalItems, setIsCartOpen, favorites } = useCart();
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  return (
    <header className="site-header">
      {/* Top Banner Announcement */}
      <div className="top-bar">
        <Sparkles size={13} className="highlight" />
        <span>
          Banhos Nobres em Ouro 18k e Ródio • <span className="highlight">1 Ano de Garantia</span> • Compre Direto no WhatsApp
        </span>
      </div>

      {/* Main Header Container */}
      <div className="container header-container">
        {/* Left: Search Trigger */}
        <div className="header-left">
          <button
            className={`icon-btn ${isSearchOpen ? 'active' : ''}`}
            onClick={() => setIsSearchOpen(!isSearchOpen)}
            aria-label="Buscar produtos"
            title="Buscar no catálogo"
          >
            {isSearchOpen ? <X size={20} /> : <Search size={20} />}
          </button>
        </div>

        {/* Center: Brand Logo */}
        <div className="header-logo-container" onClick={onLogoClick} role="button" tabIndex={0}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <img
              src="/images/logo-brand.jpg"
              alt="GC Semijoias & Acessórios"
              className="header-logo-img"
            />
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
              <span className="header-logo-text">GC Semijoias</span>
              <span className="header-logo-sub">& Acessórios</span>
            </div>
          </div>
        </div>

        {/* Right: Favorites & Bag */}
        <div className="header-right">
          <button
            className={`icon-btn ${activeTab === 'favorites' ? 'active' : ''}`}
            onClick={onFavoritesClick}
            aria-label="Favoritos"
            title="Peças favoritadas"
          >
            <Heart size={20} fill={favorites.length > 0 ? '#E53935' : 'none'} color={favorites.length > 0 ? '#E53935' : 'currentColor'} />
            {favorites.length > 0 && (
              <span className="bag-badge" style={{ background: '#E53935' }}>
                {favorites.length}
              </span>
            )}
          </button>

          <button
            className="icon-btn bag-btn"
            onClick={() => setIsCartOpen(true)}
            aria-label="Sacola de Compras"
            title="Ver sacola"
          >
            <ShoppingBag size={20} color="var(--gold-dark)" />
            {totalItems > 0 && (
              <span className="bag-badge">
                {totalItems}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Expandable Search Input */}
      {isSearchOpen && (
        <div className="search-bar-container">
          <div className="search-input-wrapper">
            <Search size={18} className="search-icon-left" />
            <input
              type="text"
              className="search-input"
              placeholder="Buscar por brinco, colar, anel, argola, zircônia..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
            />
            {searchQuery && (
              <button
                className="search-clear-btn"
                onClick={() => setSearchQuery('')}
                aria-label="Limpar busca"
              >
                <X size={18} />
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
