import React from 'react';
import { AdminPage } from '../../components/admin/AdminPage';

export default function AdminRoutePage() {
  const handleBackToStore = () => {
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
  };

  return <AdminPage onNavigateToStore={handleBackToStore} />;
}
