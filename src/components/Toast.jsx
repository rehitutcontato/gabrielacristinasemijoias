import React from 'react';
import { Sparkles, Check } from 'lucide-react';
import { useCart } from '../context/CartContext';

export const Toast = () => {
  const { toast } = useCart();

  if (!toast.show || !toast.product) return null;

  return (
    <div className="toast-container">
      <div className="toast-card">
        <img
          src={toast.product.local_image || toast.product.image}
          alt={toast.product.name}
          className="toast-thumb"
        />
        <div style={{ flexGrow: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Check size={14} color="#25D366" />
            <span className="toast-text-title">Adicionado à sacola!</span>
          </div>
          <div className="toast-text-sub" style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '240px' }}>
            {toast.product.name}
          </div>
        </div>
      </div>
    </div>
  );
};
