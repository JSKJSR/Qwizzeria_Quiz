import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import LandingPageB from './LandingPageB';

export default function AuthRedirect() {
  const { user, isEditor, loading } = useAuth();

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

  return <LandingPageB />;
}
