import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function DoublesRoute() {
  const { isPremium, loading } = useAuth();

  if (loading) return null;

  if (!isPremium) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
