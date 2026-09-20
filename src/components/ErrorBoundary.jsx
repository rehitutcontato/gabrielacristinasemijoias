import React from 'react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary capturou um erro:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem',
            textAlign: 'center',
            background: '#FAF8F5',
            fontFamily: 'system-ui, -apple-system, sans-serif',
          }}
        >
          <div
            style={{
              maxWidth: '420px',
              width: '100%',
              background: '#ffffff',
              borderRadius: '16px',
              padding: '2rem',
              boxShadow: '0 10px 25px rgba(0,0,0,0.06)',
              border: '1px solid #EAE5DE',
            }}
          >
            <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>💎</div>
            <h2 style={{ fontSize: '1.3rem', color: '#1B1B1B', marginBottom: '0.8rem', fontWeight: 600 }}>
              Ops! Algo inesperado aconteceu
            </h2>
            <p style={{ fontSize: '0.875rem', color: '#666', marginBottom: '1.5rem', lineHeight: '1.5' }}>
              A interface encontrou uma falha temporária. Clique no botão abaixo para reiniciar e voltar à vitrine da loja.
            </p>
            <button
              onClick={this.handleReset}
              style={{
                width: '100%',
                background: 'linear-gradient(135deg, #B38E5D 0%, #967243 100%)',
                color: '#fff',
                border: 'none',
                borderRadius: '10px',
                padding: '0.85rem 1.5rem',
                fontSize: '0.95rem',
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(179, 142, 93, 0.25)',
              }}
            >
              Voltar à Vitrine da Loja
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
