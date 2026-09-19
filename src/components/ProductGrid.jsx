import React from 'react';
import { ProductCard } from './ProductCard';
import { Sparkles } from 'lucide-react';

export const ProductGrid = ({ products, onQuickView, onResetFilters }) => {
  if (products.length === 0) {
    return (
      <div className="container">
        <div className="cart-empty-state" style={{ minHeight: '300px' }}>
          <Sparkles size={38} color="var(--gold-primary)" />
          <h3 className="font-serif" style={{ fontSize: '1.3rem', color: 'var(--text-primary)' }}>
            Nenhuma semijoia encontrada
          </h3>
          <p style={{ maxWidth: '360px', fontSize: '0.88rem' }}>
            Não encontramos nenhuma peça com os filtros atuais ou termo de busca selecionado.
          </p>
          <button className="btn-primary-gold" onClick={onResetFilters} style={{ marginTop: '0.5rem' }}>
            Ver Todas as Peças
          </button>
        </div>
      </div>
    );
  }

  return (
    <section className="container">
      <div className="product-grid">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onQuickView={onQuickView}
          />
        ))}
      </div>
    </section>
  );
};
