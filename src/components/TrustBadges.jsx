import React from 'react';
import { Crown, ShieldCheck, Gem, HeartHandshake } from 'lucide-react';

export const TrustBadges = () => {
  const items = [
    {
      icon: <Crown size={24} />,
      title: "Banho Nobre 18k",
      desc: "Multi-camadas de ouro 18k e ródio para brilho duradouro"
    },
    {
      icon: <ShieldCheck size={24} />,
      title: "100% Hipoalergênico",
      desc: "Sem níquel e com verniz protetor especial"
    },
    {
      icon: <Gem size={24} />,
      title: "1 Ano de Garantia",
      desc: "Certificado de garantia de qualidade para sua segurança"
    },
    {
      icon: <HeartHandshake size={24} />,
      title: "Atendimento Gabriela",
      desc: "Atendimento direto com a fundadora para tirar qualquer dúvida"
    }
  ];

  return (
    <section className="trust-section">
      <div className="container">
        <div className="trust-grid">
          {items.map((item, idx) => (
            <div key={idx} className="trust-card">
              <div className="trust-icon-box">
                {item.icon}
              </div>
              <h4 className="trust-title font-serif">{item.title}</h4>
              <p className="trust-desc">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
