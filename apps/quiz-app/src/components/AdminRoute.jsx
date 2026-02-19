import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function AdminRoute() {
  const { isEditor, loading } = useAuth();

  if (loading) return null;

  if (!isEditor) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
