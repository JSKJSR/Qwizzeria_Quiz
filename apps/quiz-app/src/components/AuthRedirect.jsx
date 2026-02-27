import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import LandingPage from './LandingPage';
import LandingPageB from './LandingPageB';

const VARIANT_KEY = 'qwizzeria_landing_variant';

function getVariant() {
  let variant = localStorage.getItem(VARIANT_KEY);
  if (variant === 'A' || variant === 'B') return variant;
  variant = Math.random() < 0.5 ? 'A' : 'B';
  localStorage.setItem(VARIANT_KEY, variant);
  return variant;
}

export default function AuthRedirect() {
  const { user, isEditor, loading } = useAuth();
  const [variant] = useState(getVariant);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-primary, #000)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 40, height: 40, border: '3px solid rgba(255,255,255,0.1)', borderTopColor: 'var(--accent-primary, #e85c1a)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      </div>
    );
  }

  if (user) {
    if (isEditor) {
      return <Navigate to="/admin" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }

  return variant === 'B' ? <LandingPageB /> : <LandingPage />;
}
