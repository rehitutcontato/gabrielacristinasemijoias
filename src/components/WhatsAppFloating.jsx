import React, { useState } from 'react';
import { MessageCircle, X } from 'lucide-react';
import { STORE_CONFIG } from '../data/products';

export const WhatsAppFloating = () => {
  const [showTooltip, setShowTooltip] = useState(true);

  const directWhatsAppUrl = `https://wa.me/${STORE_CONFIG.whatsappNumber}?text=${encodeURIComponent(
    `Olá, Gabriela! Gostaria de tirar uma dúvida sobre as semijoias do catálogo.`
  )}`;

  return (
    <div style={{ position: 'fixed', bottom: '85px', right: '1.25rem', zIndex: 120 }}>
      {showTooltip && (
        <div
          style={{
            position: 'absolute',
            bottom: '66px',
            right: '0',
            background: '#FFFFFF',
            borderRadius: '12px',
            padding: '8px 12px',
            boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
            border: '1px solid rgba(197, 160, 89, 0.3)',
            fontSize: '0.78rem',
            whiteSpace: 'nowrap',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            animation: 'slideUp 0.3s ease'
          }}
        >
          <span style={{ color: 'var(--text-primary)', fontWeight: '500' }}>
            Dúvidas? Fale com <strong>Gabriela</strong> ✨
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowTooltip(false);
            }}
            style={{ color: '#999', cursor: 'pointer' }}
          >
            <X size={12} />
          </button>
        </div>
      )}

      <a
        href={directWhatsAppUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="whatsapp-float-btn"
        aria-label="Atendimento no WhatsApp"
        title="Falar no WhatsApp com Gabriela Cristina"
      >
        <MessageCircle size={28} />
      </a>
    </div>
  );
};
