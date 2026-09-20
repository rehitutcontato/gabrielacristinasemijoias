import React, { useState } from 'react';
import { X, ShoppingBag, MessageCircle, ShieldCheck, Sparkles, Check, Heart } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { STORE_CONFIG } from '../data/products';

export const ProductModal = ({ product, onClose }) => {
  const { addToCart, isFavorited, toggleFavorite, getDirectProductWhatsAppUrl } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(product?.lifestyle_image || product?.local_image || product?.image);
  const [selectedSize, setSelectedSize] = useState(() => {
    if (product?.tamanhos && product.tamanhos.length === 1) {
      return product.tamanhos[0];
    }
    return '';
  });
  const [selectedCor, setSelectedCor] = useState(() => {
    if (product?.cores && product.cores.length === 1) {
      return product.cores[0];
    }
    return '';
  });
  const [validationError, setValidationError] = useState('');

  if (!product) return null;

  const favorited = isFavorited(product.id);
  const hasSizes = Array.isArray(product.tamanhos) && product.tamanhos.length > 0;
  const hasCores = Array.isArray(product.cores) && product.cores.length > 0;

  const handleAdd = () => {
    if (hasSizes && !selectedSize) {
      setValidationError(
        product.category === 'Anéis'
          ? 'Por favor, selecione o aro do anel antes de adicionar à sacola.'
          : 'Por favor, selecione o tamanho desejado antes de adicionar à sacola.'
      );
      return;
    }
    setValidationError('');
    addToCart(product, quantity, { tamanho: selectedSize, cor: selectedCor });
    onClose();
  };

  const directWhatsAppUrl = getDirectProductWhatsAppUrl(product, quantity, {
    tamanho: selectedSize,
    cor: selectedCor,
  });

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
        {/* Close Button */}
        <button className="modal-close-btn" onClick={onClose} aria-label="Fechar modal">
          <X size={20} />
        </button>

        <div className="modal-grid">
          {/* Media Side */}
          <div className="modal-media-side">
            <img
              src={activeImage}
              alt={product.name}
              className="modal-img-large"
            />
            {product.lifestyle_image && (
              <div style={{ display: 'flex', gap: '8px', padding: '10px' }}>
                <button
                  onClick={() => setActiveImage(product.lifestyle_image)}
                  style={{
                    border: activeImage === product.lifestyle_image ? '2px solid var(--gold-primary)' : '1px solid #ddd',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    width: '48px',
                    height: '48px',
                    cursor: 'pointer'
                  }}
                >
                  <img src={product.lifestyle_image} alt="Foto na modelo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </button>
                <button
                  onClick={() => setActiveImage(product.local_image || product.image)}
                  style={{
                    border: activeImage === (product.local_image || product.image) ? '2px solid var(--gold-primary)' : '1px solid #ddd',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    width: '48px',
                    height: '48px',
                    cursor: 'pointer'
                  }}
                >
                  <img src={product.local_image || product.image} alt="Foto produto" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </button>
              </div>
            )}
          </div>

          {/* Info Side */}
          <div className="modal-info-side">
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="modal-category-tag">
                  {product.category} • {product.material}
                </span>
                <button
                  onClick={() => toggleFavorite(product.id)}
                  style={{ cursor: 'pointer', color: favorited ? '#E53935' : 'var(--text-muted)' }}
                  title="Favoritar peça"
                >
                  <Heart size={20} fill={favorited ? '#E53935' : 'none'} />
                </button>
              </div>

              <h2 className="modal-title font-serif">
                {product.name}
              </h2>

              {/* Price Box */}
              <div className="modal-price-box">
                <div className="modal-price-val">
                  {product.formatted_price}
                </div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  ou em até <strong>3x sem juros</strong> de R$ {(product.price / 3).toFixed(2).replace('.', ',')}
                </div>
              </div>

              {/* Seletor de Tamanhos / Aros */}
              {hasSizes && (
                <div className="modal-variation-block">
                  <div className="modal-variation-header">
                    <span className="modal-variation-title">
                      {product.category === 'Anéis' ? 'Aro do Anel:' : 'Tamanho:'}
                    </span>
                    {selectedSize ? (
                      <span className="modal-variation-selected">
                        {product.category === 'Anéis' ? `Aro ${selectedSize}` : selectedSize}
                      </span>
                    ) : (
                      <span className="modal-variation-hint">Selecione uma opção</span>
                    )}
                  </div>
                  <div className="modal-size-pills">
                    {product.tamanhos.map((tam) => (
                      <button
                        key={tam}
                        type="button"
                        className={`size-pill-btn ${selectedSize === tam ? 'selected' : ''}`}
                        onClick={() => {
                          setSelectedSize(tam);
                          setValidationError('');
                        }}
                      >
                        {tam}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Seletor de Cores / Variações */}
              {hasCores && (
                <div className="modal-variation-block">
                  <div className="modal-variation-header">
                    <span className="modal-variation-title">Variação / Banho:</span>
                    {selectedCor && (
                      <span className="modal-variation-selected">{selectedCor}</span>
                    )}
                  </div>
                  <div className="modal-size-pills">
                    {product.cores.map((cor) => (
                      <button
                        key={cor}
                        type="button"
                        className={`size-pill-btn ${selectedCor === cor ? 'selected' : ''}`}
                        onClick={() => setSelectedCor(cor)}
                      >
                        {cor}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Alerta de validação */}
              {validationError && (
                <div className="modal-size-alert">
                  <span>{validationError}</span>
                </div>
              )}

              {/* Quality & Warranty Checklist */}
              <ul className="modal-features-list">
                <li>
                  <Sparkles size={16} />
                  <span>Banho nobre em <strong>{product.material}</strong> com verniz de alta durabilidade</span>
                </li>
                <li>
                  <ShieldCheck size={16} />
                  <span><strong>100% Hipoalergênico:</strong> livre de níquel e metais pesados</span>
                </li>
                <li>
                  <Check size={16} />
                  <span>Acompanha <strong>Certificado de Garantia Oficial</strong></span>
                </li>
                <li>
                  <Check size={16} />
                  <span>Embalagem protetora e especial para presente</span>
                </li>
              </ul>
            </div>

            <div>
              {/* Quantity Stepper */}
              {product.in_stock && (
                <div className="modal-quantity-row">
                  <span style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                    Quantidade:
                  </span>
                  <div className="quantity-stepper">
                    <button
                      className="qty-btn"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      disabled={quantity <= 1}
                      aria-label="Diminuir quantidade"
                    >
                      -
                    </button>
                    <span className="qty-display">{quantity}</span>
                    <button
                      className="qty-btn"
                      onClick={() => setQuantity(quantity + 1)}
                      aria-label="Aumentar quantidade"
                    >
                      +
                    </button>
                  </div>
                </div>
              )}

              {/* CTAs */}
              <div className="modal-actions">
                {product.in_stock ? (
                  <>
                    <button className="btn-primary-gold" onClick={handleAdd} style={{ width: '100%' }}>
                      <ShoppingBag size={18} />
                      <span>Adicionar à Sacola • R$ {(product.price * quantity).toFixed(2).replace('.', ',')}</span>
                    </button>

                    <a
                      href={directWhatsAppUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-whatsapp-full"
                    >
                      <MessageCircle size={18} />
                      <span>Comprar Direto no WhatsApp</span>
                    </a>
                  </>
                ) : (
                  <div style={{ textAlign: 'center', padding: '1rem', color: '#E53935', fontWeight: '600' }}>
                    Peça esgotada no momento. Fale com Gabriela para verificar reposição!
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
