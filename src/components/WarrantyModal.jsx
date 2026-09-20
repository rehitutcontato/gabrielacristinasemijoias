import React, { useState } from 'react';
import { X, ShieldCheck, Sparkles, MessageCircle, Copy, Printer, Check, Calendar, User, PackageCheck } from 'lucide-react';
import { gerarTextoWhatsAppGarantia } from '../actions/warranty';

export const WarrantyModal = ({ garantia, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!garantia) return null;

  const textoWhatsApp = gerarTextoWhatsAppGarantia(garantia);

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(textoWhatsApp);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error('Falha ao copiar:', err);
    }
  };

  const handleSendWhatsApp = () => {
    let url = `https://api.whatsapp.com/send?text=${encodeURIComponent(textoWhatsApp)}`;
    if (garantia.clienteTelefone) {
      const cleanPhone = garantia.clienteTelefone.replace(/\D/g, '');
      if (cleanPhone) {
        url = `https://wa.me/55${cleanPhone}?text=${encodeURIComponent(textoWhatsApp)}`;
      }
    }
    window.open(url, '_blank');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="drawer-backdrop" onClick={onClose} style={{ zIndex: 110, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div
        className="warranty-certificate-modal"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#FFFDF9',
          border: '2px solid var(--gold-primary)',
          borderRadius: '16px',
          maxWidth: '580px',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 20px 50px rgba(197, 160, 89, 0.25)',
          position: 'relative',
          padding: '2rem 1.75rem',
          color: 'var(--text-primary)'
        }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="icon-btn no-print"
          style={{ position: 'absolute', top: '14px', right: '14px', zIndex: 10 }}
          aria-label="Fechar certificado"
        >
          <X size={20} />
        </button>

        {/* Certificate Decorative Header */}
        <div style={{ textAlign: 'center', borderBottom: '1px solid rgba(197, 160, 89, 0.3)', paddingBottom: '1.25rem', marginBottom: '1.25rem' }}>
          <img
            src="/images/logo-brand.png"
            alt="GC Semijoias & Acessórios"
            style={{ height: '56px', margin: '0 auto 0.75rem', objectFit: 'contain' }}
          />

          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'var(--gold-ultralight)', border: '1px solid rgba(197, 160, 89, 0.35)', padding: '4px 12px', borderRadius: '20px', fontSize: '0.75rem', color: 'var(--gold-dark)', fontWeight: '600', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            <ShieldCheck size={14} />
            <span>Certificado de Garantia & Autenticidade</span>
          </div>

          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '6px' }}>
            Registro: <strong>{garantia.codigo}</strong>
          </div>
        </div>

        {/* Customer & Dates Info */}
        <div style={{ background: 'var(--gold-ultralight)', border: '1px solid rgba(197, 160, 89, 0.25)', borderRadius: '12px', padding: '1rem', marginBottom: '1.25rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.85rem' }}>
            <div>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', display: 'block' }}>Cliente:</span>
              <strong style={{ color: 'var(--text-primary)', fontSize: '0.95rem' }}>{garantia.clienteNome}</strong>
              {garantia.clienteTelefone && (
                <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  {garantia.clienteTelefone}
                </span>
              )}
            </div>

            <div>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', display: 'block' }}>Vigência da Garantia:</span>
              <strong style={{ color: 'var(--gold-dark)', fontSize: '0.95rem' }}>{garantia.periodoLabel}</strong>
              <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                Válida até: {garantia.validadeAte}
              </span>
            </div>
          </div>

          <div style={{ marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px dashed rgba(197, 160, 89, 0.25)', display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
            <span>Data da Compra: <strong>{garantia.dataCompra}</strong></span>
            {garantia.totalFormatado && <span>Total: <strong>{garantia.totalFormatado}</strong></span>}
          </div>
        </div>

        {/* Items List */}
        <div style={{ marginBottom: '1.25rem' }}>
          <h4 style={{ fontSize: '0.88rem', fontWeight: '700', marginBottom: '0.6rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <PackageCheck size={16} color="var(--gold-dark)" />
            <span>Peças Cobertas pela Garantia ({garantia.itens.length})</span>
          </h4>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '180px', overflowY: 'auto' }}>
            {garantia.itens.map((it, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  background: '#FFFFFF',
                  padding: '8px 10px',
                  borderRadius: '8px',
                  border: '1px solid rgba(197, 160, 89, 0.18)'
                }}
              >
                <img
                  src={it.image}
                  alt={it.name}
                  style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '6px' }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: '600', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {it.name}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--gold-dark)', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginTop: '2px' }}>
                    <span>{it.material}</span>
                    {(it.tamanho || it.variation?.tamanho) && (
                      <span style={{ background: 'var(--gold-light)', color: 'var(--gold-dark)', padding: '1px 6px', borderRadius: '4px', fontWeight: '600', fontSize: '0.68rem' }}>
                        💍 Aro {it.tamanho || it.variation?.tamanho}
                      </span>
                    )}
                    {(it.cor || it.variation?.cor) && (
                      <span style={{ background: '#F3F4F6', color: '#4B5563', padding: '1px 6px', borderRadius: '4px', fontWeight: '500', fontSize: '0.68rem' }}>
                        {it.cor || it.variation?.cor}
                      </span>
                    )}
                    {it.quantity > 1 ? <span>• {it.quantity} un</span> : null}
                  </div>
                </div>
                {it.price > 0 && (
                  <div style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)' }}>
                    R$ {(it.price * it.quantity).toFixed(2).replace('.', ',')}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Care Instructions */}
        <div style={{ background: '#FAF8F5', border: '1px solid rgba(0,0,0,0.06)', borderRadius: '10px', padding: '0.85rem', fontSize: '0.76rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '1.5rem' }}>
          <strong style={{ color: 'var(--text-primary)', display: 'block', marginBottom: '4px' }}>
            ✨ Recomendações de Cuidado & Conservação:
          </strong>
          Peças hipoalergênicas livres de níquel com banho nobre. A garantia cobre defeitos de fabricação e desprendimento do banho. Para preservar seu brilho, evite contato com perfumes, cremes, cosméticos, água do mar ou cloro.
        </div>

        {/* Action Buttons (Hidden when printing) */}
        <div className="no-print" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button
            onClick={handleSendWhatsApp}
            className="btn-checkout-whatsapp"
            style={{ width: '100%', justifyContent: 'center' }}
          >
            <MessageCircle size={18} />
            <span>Enviar Certificado no WhatsApp da Cliente</span>
          </button>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <button
              onClick={handleCopyText}
              className="btn-secondary-outline"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                padding: '10px',
                borderRadius: '10px',
                border: '1px solid rgba(197, 160, 89, 0.4)',
                background: '#FFFFFF',
                color: 'var(--gold-dark)',
                fontWeight: '600',
                fontSize: '0.82rem'
              }}
            >
              {copied ? <Check size={16} color="#25D366" /> : <Copy size={16} />}
              <span>{copied ? 'Certificado Copiado!' : 'Copiar Texto'}</span>
            </button>

            <button
              onClick={handlePrint}
              className="btn-secondary-outline"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                padding: '10px',
                borderRadius: '10px',
                border: '1px solid rgba(197, 160, 89, 0.4)',
                background: '#FFFFFF',
                color: 'var(--text-primary)',
                fontWeight: '600',
                fontSize: '0.82rem'
              }}
            >
              <Printer size={16} />
              <span>Imprimir / PDF</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
