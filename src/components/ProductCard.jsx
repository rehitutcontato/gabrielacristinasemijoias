import React from 'react';
import { ShoppingBag, Heart, Eye } from 'lucide-react';
import { useCart } from '../context/CartContext';

export const ProductCard = ({ product, onQuickView }) => {
  const { addToCart, isFavorited, toggleFavorite } = useCart();
  const favorited = isFavorited(product.id);

  const isGold = product.material.toLowerCase().includes('ouro');
  const isSilver = product.material.toLowerCase().includes('ródio') || product.material.toLowerCase().includes('prata');

  const handleAddClick = (e) => {
    e.stopPropagation();
    addToCart(product, 1);
  };

  const handleFavoriteClick = (e) => {
    e.stopPropagation();
    toggleFavorite(product.id);
  };

  return (
    <div className="product-card" onClick={() => onQuickView(product)}>
      {/* 4:5 Aspect Ratio Media Container */}
      <div className="card-media-wrapper">
        <img
          src={product.local_image || product.image}
          alt={product.name}
          loading="lazy"
        />

        {/* Top Badges */}
        <div className="card-badge-top-left">
          {!product.in_stock ? (
            <span className="badge-outofstock">Esgotado</span>
          ) : (
            <span className={`badge-material ${isGold ? 'gold' : isSilver ? 'silver' : ''}`}>
              {product.material}
            </span>
          )}
        </div>

        {/* Favorite Button */}
        <button
          className={`card-favorite-btn ${favorited ? 'favorited' : ''}`}
          onClick={handleFavoriteClick}
          aria-label={favorited ? 'Remover dos favoritos' : 'Favoritar'}
          title={favorited ? 'Remover dos favoritos' : 'Salvar peça'}
        >
          <Heart size={16} fill={favorited ? '#E53935' : 'none'} />
        </button>
      </div>

      {/* Card Content */}
      <div className="card-body">
        <div>
          <h3 className="card-title" title={product.name}>
            {product.name}
          </h3>

          <div className="card-price-group">
            <div className="card-price-main">
              {product.formatted_price}
            </div>
            <div className="card-price-installments">
              {product.installments}
            </div>
          </div>
        </div>

        {/* Action Button */}
        <button
          className="card-btn-add"
          onClick={handleAddClick}
          disabled={!product.in_stock}
          title={product.in_stock ? 'Adicionar à sua sacola' : 'Peça esgotada no momento'}
        >
          <ShoppingBag size={15} />
          <span>{product.in_stock ? 'Adicionar à Sacola' : 'Esgotado'}</span>
        </button>
      </div>
    </div>
  );
};
