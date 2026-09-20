import React from 'react';
import { Sparkles, MessageCircle, ArrowDown } from 'lucide-react';
import { STORE_CONFIG } from '../data/products';

export const HeroBanner = ({ onExploreClick }) => {
  const directWhatsAppHelp = `https://wa.me/${STORE_CONFIG.whatsappNumber}?text=${encodeURIComponent(
    `Olá, Gabriela! Acessei o catálogo da GC Semijoias e gostaria de conhecer as novidades!`
  )}`;

  return (
    <section className="container">
      <div className="hero-banner">
        <div className="hero-content-wrapper">
          {/* Left Column: Text & CTAs */}
          <div>
            <div className="hero-tag">
              <Sparkles size={14} />
              <span>Elegância em Cada Detalhe</span>
            </div>

            <h1 className="hero-title font-serif">
              O Brilho & a Elegância das Melhores Semijoias
            </h1>

            <p className="hero-desc">
              <strong>Joias para realçar sua beleza.</strong> Descubra nossa curadoria de semijoias banhadas a <strong>Ouro 18k</strong>, <strong>Ródio Branco</strong> e <strong>Prata 925</strong>. Peças 100% hipoalergênicas, livres de níquel e com <strong>garantia oficial em todas as peças</strong>. Semijoias escolhidas com carinho para você!
            </p>

            <div className="hero-actions">
              <button className="btn-primary-gold" onClick={onExploreClick}>
                <span>Ver Coleção</span>
                <ArrowDown size={17} />
              </button>

              <a
                href={directWhatsAppHelp}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-whatsapp-outline"
              >
                <MessageCircle size={18} />
                <span>Falar com Gabriela</span>
              </a>
            </div>
          </div>

          {/* Right Column: Featured Image with Luxury Frame */}
          <div className="hero-image-side">
            <div className="hero-card-preview">
              <img
                src="/images/featured-earring-2.jpg"
                alt="Brinco Coração Plissado Ouro 18k - GC Semijoias"
              />
              <div
                style={{
                  position: 'absolute',
                  bottom: '12px',
                  left: '12px',
                  right: '12px',
                  background: 'rgba(255, 255, 255, 0.94)',
                  backdropFilter: 'blur(8px)',
                  padding: '8px 12px',
                  borderRadius: '10px',
                  fontSize: '0.78rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                }}
              >
                <div>
                  <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>Brinco Coração Plissado</div>
                  <div style={{ color: 'var(--gold-dark)', fontSize: '0.7rem' }}>Banho Ouro 18k Nobre</div>
                </div>
                <div style={{ fontWeight: '700', color: 'var(--text-primary)' }}>R$ 29,90</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
