import React from 'react';
import { MessageCircle, ShieldCheck, Heart, Lock } from 'lucide-react';
import { STORE_CONFIG } from '../data/products';

export const Footer = ({ onSelectCategory, onNavigateAdmin }) => {
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-grid">
          {/* Brand Col */}
          <div className="footer-brand">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1rem' }}>
              <img
                src="/images/logo-brand.jpg"
                alt="GC Semijoias"
                style={{ width: '44px', height: '44px', borderRadius: '8px', objectFit: 'contain' }}
              />
              <div>
                <h3 style={{ margin: 0, lineHeight: 1.1 }}>GC Semijoias</h3>
                <span style={{ fontSize: '0.72rem', letterSpacing: '0.15em', color: 'var(--gold-light)', textTransform: 'uppercase' }}>
                  & Acessórios
                </span>
              </div>
            </div>

            <p className="footer-desc">
              Semijoias finas com banho nobre em Ouro 18k e Ródio Branco. Peças hipoalergênicas, 
              acabamento artesanal e atendimento humanizado conduzido diretamente pela fundadora 
              <strong> Gabriela Cristina</strong>.
            </p>

            <a
              href={`https://wa.me/${STORE_CONFIG.whatsappNumber}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-whatsapp-outline"
              style={{ background: 'transparent', color: '#FFFFFF', borderColor: 'rgba(37, 211, 102, 0.6)' }}
            >
              <MessageCircle size={18} color="#25D366" />
              <span>WhatsApp: {STORE_CONFIG.whatsappDisplay}</span>
            </a>
          </div>

          {/* Categories Col */}
          <div className="footer-col">
            <h4>Coleções</h4>
            <ul className="footer-links">
              <li><button onClick={() => onSelectCategory('Brincos')}>Brincos & Argolas</button></li>
              <li><button onClick={() => onSelectCategory('Colares')}>Colares & Chokers</button></li>
              <li><button onClick={() => onSelectCategory('Anéis')}>Anéis & Solitários</button></li>
              <li><button onClick={() => onSelectCategory('Pulseiras')}>Pulseiras Finas</button></li>
              <li><button onClick={() => onSelectCategory('Conjuntos & Mix')}>Conjuntos & Mix</button></li>
              <li><button onClick={() => onSelectCategory('Piercings')}>Piercings Fake</button></li>
            </ul>
          </div>

          {/* Payment & Security */}
          <div className="footer-col">
            <h4>Segurança & Pagamento</h4>
            <p style={{ fontSize: '0.82rem', color: '#AFA699', lineHeight: 1.6, marginBottom: '0.75rem' }}>
              • <strong>Pix:</strong> Aprovação imediata e envio prioritário.<br />
              • <strong>Cartão de Crédito:</strong> Em até 3x sem juros.<br />
              • <strong>Garantia:</strong> 1 ano com certificado oficial.<br />
              • <strong>Envio:</strong> Todo o Brasil com código de rastreio.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--gold-light)', fontSize: '0.8rem' }}>
              <ShieldCheck size={18} />
              <span>Ambiente 100% Seguro & Protegido</span>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="footer-bottom">
          <div>
            © {new Date().getFullYear()} {STORE_CONFIG.storeName}. Todos os direitos reservados.
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span>Feito com</span>
              <Heart size={13} color="#E53935" fill="#E53935" />
              <span>para {STORE_CONFIG.founderName}</span>
            </div>
            <a
              href="/admin"
              onClick={(e) => {
                e.preventDefault();
                if (onNavigateAdmin) onNavigateAdmin();
                else window.location.href = '/admin';
              }}
              style={{
                color: 'rgba(255,255,255,0.4)',
                textDecoration: 'none',
                fontSize: '0.75rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                transition: 'color 0.2s',
              }}
              title="Acesso Administrativo"
            >
              <Lock size={12} />
              <span>Painel</span>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
