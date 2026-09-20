import React from 'react';
import { SlidersHorizontal, ArrowUpDown, X, Check } from 'lucide-react';

export const CategoryFilter = ({
  categories,
  selectedCategory,
  onSelectCategory,
  categoryCounts,
  subcategories,
  selectedSubcategory,
  onSelectSubcategory,
  sortBy,
  onSelectSort,
  onlyInStock,
  onToggleInStock,
  totalResults,
  searchQuery,
  onClearSearch
}) => {
  return (
    <section className="category-filter-section" id="catalogo">
      <div className="container">
        {/* Horizontal Scrollable Category Pills */}
        <div className="category-scroll-container">
          {categories.map((cat) => {
            const count = categoryCounts[cat] || 0;
            const isActive = selectedCategory === cat;
            return (
              <button
                key={cat}
                className={`category-pill ${isActive ? 'active' : ''}`}
                onClick={() => onSelectCategory(cat)}
              >
                <span>{cat}</span>
                <span className="pill-count">{count}</span>
              </button>
            );
          })}
        </div>

        {/* Subcategories (Banhos & Variações da Categoria Selecionada) */}
        {subcategories && subcategories.length > 0 && (
          <div className="subcategory-scroll-container">
            {subcategories.map((sub) => {
              const isSubActive = selectedSubcategory === sub.id;
              return (
                <button
                  key={sub.id}
                  className={`subcategory-pill ${isSubActive ? 'active' : ''}`}
                  onClick={() => onSelectSubcategory(sub.id)}
                >
                  <span>{sub.label}</span>
                  {sub.count !== undefined && (
                    <span className="sub-pill-count">{sub.count}</span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Secondary Sort & Filter Toolbar */}
        <div className="toolbar-container" style={{ marginTop: '0.75rem' }}>
          <div className="toolbar-left">
            {/* Sort by */}
            <select
              className="select-luxury"
              value={sortBy}
              onChange={(e) => onSelectSort(e.target.value)}
              aria-label="Ordenar produtos"
            >
              <option value="default">Mais Populares</option>
              <option value="price-asc">Menor Preço</option>
              <option value="price-desc">Maior Preço</option>
              <option value="name-asc">Nome (A-Z)</option>
            </select>

            {/* In-Stock Only Toggle */}
            <button
              onClick={onToggleInStock}
              className={`select-luxury ${onlyInStock ? 'active' : ''}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: onlyInStock ? 'var(--gold-ultralight)' : 'var(--bg-surface)',
                borderColor: onlyInStock ? 'var(--gold-primary)' : 'rgba(197, 160, 89, 0.25)',
                fontWeight: onlyInStock ? '600' : 'normal',
                color: onlyInStock ? 'var(--gold-dark)' : 'inherit'
              }}
            >
              <span style={{ fontSize: '0.8rem' }}>Apenas Disponíveis</span>
              {onlyInStock && <Check size={14} color="var(--gold-dark)" />}
            </button>
          </div>

          <div className="toolbar-right">
            {searchQuery && (
              <button
                onClick={onClearSearch}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '0.75rem',
                  color: 'var(--gold-dark)',
                  background: 'var(--gold-ultralight)',
                  padding: '3px 8px',
                  borderRadius: '12px',
                  border: '1px solid rgba(197, 160, 89, 0.3)'
                }}
              >
                <span>Busca: "{searchQuery}"</span>
                <X size={12} />
              </button>
            )}
            <span className="result-count-label">
              {totalResults} {totalResults === 1 ? 'peça' : 'peças'}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};
