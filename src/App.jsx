import React, { useState, useEffect } from 'react';
import { VitrineView } from './components/VitrineView';
import { AdminPage } from './components/admin/AdminPage';

export function App() {
  // --------------------------------------------------------------------------
  // ROTEAMENTO SIMPLES CLIENT-SIDE (/ ou /admin)
  // --------------------------------------------------------------------------
  const resolveCurrentPath = () => {
    if (typeof window !== 'undefined') {
      if (window.location.hash.startsWith('#/admin') || window.location.hash === '#admin') {
        return '/admin';
      }
      return window.location.pathname;
    }
    return '/';
  };

  const [currentPath, setCurrentPath] = useState(resolveCurrentPath);

  useEffect(() => {
    const handleLocationChange = () => {
      setCurrentPath(resolveCurrentPath());
    };
    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('hashchange', handleLocationChange);
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('hashchange', handleLocationChange);
    };
  }, []);

  const navigate = (path) => {
    if (typeof window !== 'undefined') {
      // Se havia hash (#/admin), removemos o hash ao navegar
      if (window.location.hash) {
        window.history.pushState(null, '', path);
      } else {
        window.history.pushState(null, '', path);
      }
      setCurrentPath(path);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Renderiza Painel Admin ou Vitrine Pública sem quebra de hooks do React
  if (currentPath.startsWith('/admin')) {
    return <AdminPage onNavigateToStore={() => navigate('/')} />;
  }

  return <VitrineView onNavigateAdmin={() => navigate('/admin')} />;
}

export default App;
