import { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { getSupabase } from '@qwizzeria/supabase-client';
import { fetchUserRole, hasMinRole } from '@qwizzeria/supabase-client/src/users.js';
import AdminLayout from './components/AdminLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import QuestionList from './pages/QuestionList';
import QuestionForm from './pages/QuestionForm';
import BulkImport from './pages/BulkImport';
import PackList from './pages/PackList';
import PackForm from './pages/PackForm';
import PackQuestionsManager from './pages/PackQuestionsManager';

function getSupabaseSafe() {
  try {
    return getSupabase();
  } catch {
    return null;
  }
}

export default function App() {
  const supabaseAvailable = Boolean(getSupabaseSafe());
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(supabaseAvailable);

  useEffect(() => {
    const supabase = getSupabaseSafe();
    if (!supabase) {
      return;
    }

    supabase.auth.getUser().then(async ({ data: { user: u } }) => {
      setUser(u);
      if (u) {
        try {
          const role = await fetchUserRole(u.id);
          setUserRole(role);
        } catch {
          setUserRole('user');
        }
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        const u = session?.user ?? null;
        setUser(u);
        if (u) {
          try {
            const role = await fetchUserRole(u.id);
            setUserRole(role);
          } catch {
            setUserRole('user');
          }
        } else {
          setUserRole(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', color: 'var(--text-secondary)' }}>
        Loading...
      </div>
    );
  }

  if (!getSupabaseSafe()) {
    return (
      <div className="access-denied">
        <h1>Supabase Not Configured</h1>
        <p>Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env.local file.</p>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  // Editor, admin, and superadmin can access the CMS
  const hasCmsAccess = hasMinRole(userRole || 'user', 'editor');
  const isFullAdmin = hasMinRole(userRole || 'user', 'admin');

  if (!hasCmsAccess) {
    return (
      <div className="access-denied">
        <h1>Access Denied</h1>
        <p>Your account does not have CMS privileges.</p>
        <p style={{ fontSize: 'var(--font-size-xs)', marginTop: '0.5rem' }}>
          Logged in as {user.email} (role: {userRole || 'user'})
        </p>
        <button
          className="btn btn-secondary"
          onClick={() => getSupabase().auth.signOut()}
        >
          Sign Out
        </button>
      </div>
    );
  }

  return (
    <Routes>
      <Route element={<AdminLayout user={user} userRole={userRole} />}>
        {/* Full admins see the dashboard with analytics */}
        <Route index element={isFullAdmin ? <Dashboard /> : <Navigate to="/questions" replace />} />
        <Route path="questions" element={<QuestionList />} />
        <Route path="questions/new" element={<QuestionForm />} />
        <Route path="questions/:id/edit" element={<QuestionForm />} />
        {/* Bulk import is admin+ only */}
        {isFullAdmin && <Route path="import" element={<BulkImport />} />}
        <Route path="packs" element={<PackList />} />
        <Route path="packs/new" element={<PackForm />} />
        <Route path="packs/:id/edit" element={<PackForm />} />
        <Route path="packs/:id/questions" element={<PackQuestionsManager />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

