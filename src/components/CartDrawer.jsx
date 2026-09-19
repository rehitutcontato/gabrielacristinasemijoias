import React, { useState } from 'react';
import { X, ShoppingBag, Trash2, Plus, Minus, MessageCircle, ShieldCheck, Sparkles } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { STORE_CONFIG } from '../data/products';

export const CartDrawer = () => {
  const {
    cart,
    isCartOpen,
    setIsCartOpen,
    removeFromCart,
    updateQuantity,
    totalItems,
    formattedSubtotal,
    subtotal,
    getWhatsAppCheckoutUrl,
    clearCart
  } = useCart();

  const [customerName, setCustomerName] = useState('');

  if (!isCartOpen) return null;

  const checkoutUrl = getWhatsAppCheckoutUrl(customerName);

  const handleCheckout = (e) => {
    if (cart.length === 0) {
      e.preventDefault();
      return;
    }
    // Deep-link to WhatsApp
    window.open(checkoutUrl, '_blank');
  };

  return (
    <div className="drawer-backdrop" onClick={() => setIsCartOpen(false)}>
      <div className="cart-drawer" onClick={(e) => e.stopPropagation()}>
        {/* Drawer Header */}
        <div className="drawer-header">
          <div className="drawer-title">
            <ShoppingBag size={20} color="var(--gold-dark)" />
            <span>Sua Sacola ({totalItems})</span>
          </div>
          <button
            className="icon-btn"
            onClick={() => setIsCartOpen(false)}
            aria-label="Fechar sacola"
          >
            <X size={20} />
          </button>
        </div>

        {/* Items or Empty State */}
        {cart.length === 0 ? (
          <div className="drawer-items-list cart-empty-state">
            <ShoppingBag size={48} color="var(--gold-light)" />
            <h3 className="font-serif" style={{ fontSize: '1.2rem', color: 'var(--text-primary)' }}>
              Sua sacola está vazia
            </h3>
            <p style={{ fontSize: '0.85rem' }}>
              Explore nossa coleção e adicione suas semijoias favoritas para fazer seu pedido.
            </p>
            <button
              className="btn-primary-gold"
              onClick={() => setIsCartOpen(false)}
              style={{ marginTop: '0.75rem' }}
            >
              Explorar Catálogo
            </button>
          </div>
        ) : (
          <>
            <div className="drawer-items-list">
              {cart.map(({ product, quantity }) => (
                <div key={product.id} className="cart-item">
                  <img
                    src={product.local_image || product.image}
                    alt={product.name}
                    className="cart-item-img"
                  />
                  <div className="cart-item-info">
                    <div>
                      <div className="cart-item-name">{product.name}</div>
                      <div className="cart-item-material">{product.material}</div>
                    </div>

                    <div className="cart-item-bottom">
                      <div className="quantity-stepper" style={{ transform: 'scale(0.9)', transformOrigin: 'left center' }}>
                        <button
                          className="qty-btn"
                          onClick={() => updateQuantity(product.id, -1)}
                          aria-label="Diminuir quantidade"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="qty-display">{quantity}</span>
                        <button
                          className="qty-btn"
                          onClick={() => updateQuantity(product.id, 1)}
                          aria-label="Aumentar quantidade"
                        >
                          <Plus size={14} />
                        </button>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div className="cart-item-price">
                          R$ {(product.price * quantity).toFixed(2).replace('.', ',')}
                        </div>
                        <button
                          onClick={() => removeFromCart(product.id)}
                          style={{ color: 'var(--text-muted)', cursor: 'pointer' }}
                          title="Remover peça"
                          aria-label="Remover peça"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Drawer Footer */}
            <div className="drawer-footer">
              {/* Optional Name Input */}
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  Seu Nome (opcional):
                </label>
                <input
                  type="text"
                  className="cart-name-input"
                  placeholder="Ex: Maria Clara"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                />
              </div>

              {/* Summary */}
              <div className="drawer-summary-row">
                <span>Subtotal ({totalItems} {totalItems === 1 ? 'item' : 'itens'})</span>
                <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{formattedSubtotal}</span>
              </div>

              <div className="drawer-summary-row" style={{ fontSize: '0.8rem' }}>
                <span>Frete</span>
                <span style={{ color: 'var(--gold-dark)', fontWeight: '500' }}>A calcular no WhatsApp</span>
              </div>

              <div className="drawer-summary-row" style={{ fontSize: '0.8rem' }}>
                <span>Parcelamento</span>
                <span>Até 3x de R$ {(subtotal / 3).toFixed(2).replace('.', ',')} sem juros</span>
              </div>

              <div className="drawer-summary-total">
                <span>Total Estimado</span>
                <span style={{ color: 'var(--gold-dark)' }}>{formattedSubtotal}</span>
              </div>

              {/* Checkout Button */}
              <a
                href={checkoutUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-checkout-whatsapp"
                onClick={handleCheckout}
              >
                <MessageCircle size={20} />
                <span>Finalizar Pedido no WhatsApp</span>
              </a>

              <p className="drawer-disclaimer">
                Você será direcionada para conversar com <strong>Gabriela Cristina</strong> no WhatsApp 
                para confirmar os detalhes de entrega e forma de pagamento com total segurança.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
