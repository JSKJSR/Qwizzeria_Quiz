import { Routes, Route, Navigate } from 'react-router-dom';
import AuthProvider from './AuthProvider';
import AuthRedirect from './AuthRedirect';
import ProtectedRoute from './ProtectedRoute';
import AdminRoute from './AdminRoute';
import DashboardLayout from '../layouts/DashboardLayout';
import AdminLayout from '../layouts/AdminLayout';
import DashboardHome from '../pages/DashboardHome';
import FreeQuizPage from '../pages/FreeQuizPage';
import PackBrowse from '../pages/PackBrowse';
import PackDetail from '../pages/PackDetail';
import PackPlay from '../pages/PackPlay';
import Profile from '../pages/Profile';
import History from '../pages/History';
import Leaderboard from '../pages/Leaderboard';
import ResumePlay from '../pages/ResumePlay';
import HostQuizPage from '../pages/HostQuizPage';
import Guide from '../pages/Guide';
import TournamentBracketPage from '../pages/TournamentBracketPage';
import TournamentMatchPage from '../pages/TournamentMatchPage';

// Admin pages
import AdminDashboard from '../pages/admin/Dashboard';
import QuestionList from '../pages/admin/QuestionList';
import QuestionForm from '../pages/admin/QuestionForm';
import BulkImport from '../pages/admin/BulkImport';
import AdminPackList from '../pages/admin/PackList';
import PackForm from '../pages/admin/PackForm';
import PackQuestionsManager from '../pages/admin/PackQuestionsManager';
import UserList from '../pages/admin/UserList';

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Unauthenticated: landing page; authenticated: redirect based on role */}
        <Route path="/" element={<AuthRedirect />} />

        {/* Public routes: accessible without login */}
        <Route path="/play/free" element={<FreeQuizPage />} />

        {/* All protected routes */}
        <Route element={<ProtectedRoute />}>
          {/* Quiz app routes with sidebar layout */}
          <Route element={<DashboardLayout />}>
            <Route path="/dashboard" element={<DashboardHome />} />
            <Route path="/packs" element={<PackBrowse />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/play/resume/:sessionId" element={<ResumePlay />} />
            <Route path="/packs/:id" element={<PackDetail />} />
            <Route path="/packs/:id/play" element={<PackPlay />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/history" element={<History />} />
            <Route path="/host" element={<HostQuizPage />} />
            <Route path="/guide" element={<Guide />} />
          </Route>

          {/* Tournament routes (full-screen, no sidebar) */}
          <Route path="/host/tournament/:tournamentId" element={<TournamentBracketPage />} />
          <Route path="/host/tournament/:tournamentId/match/:matchId" element={<TournamentMatchPage />} />

          {/* Admin CMS routes (editor+ only) */}
          <Route path="/admin" element={<AdminRoute />}>
            <Route element={<AdminLayout />}>
              <Route index element={<AdminDashboard />} />
              <Route path="questions" element={<QuestionList />} />
              <Route path="questions/new" element={<QuestionForm />} />
              <Route path="questions/:id/edit" element={<QuestionForm />} />
              <Route path="import" element={<BulkImport />} />
              <Route path="packs" element={<AdminPackList />} />
              <Route path="packs/new" element={<PackForm />} />
              <Route path="packs/:id/edit" element={<PackForm />} />
              <Route path="packs/:id/questions" element={<PackQuestionsManager />} />
              <Route path="users" element={<UserList />} />
            </Route>
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}
