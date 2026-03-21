import { Routes, Route } from 'react-router-dom';
import AuthProvider from './AuthProvider';
import AuthRedirect from './AuthRedirect';
import ProtectedRoute from './ProtectedRoute';
import AdminRoute from './AdminRoute';
import { TierRoute } from './SubscriptionGate';
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
import DoublesPage from '../pages/DoublesPage';
import Guide from '../pages/Guide';
import Pricing from '../pages/Pricing';
import TournamentBracketPage from '../pages/TournamentBracketPage';
import TournamentMatchPage from '../pages/TournamentMatchPage';
import BuzzerPage from '../pages/BuzzerPage';
import ResetPassword from '../pages/ResetPassword';
import NotFound from '../pages/NotFound';

// Admin pages
import AdminDashboard from '../pages/admin/Dashboard';
import QuestionList from '../pages/admin/QuestionList';
import QuestionForm from '../pages/admin/QuestionForm';
import BulkImport from '../pages/admin/BulkImport';
import AdminPackList from '../pages/admin/PackList';
import PackForm from '../pages/admin/PackForm';
import PackQuestionsManager from '../pages/admin/PackQuestionsManager';
import UserList from '../pages/admin/UserList';
import RolesAndTiersGuide from '../pages/admin/RolesAndTiersGuide';
import AdminOpsManual from '../pages/admin/AdminOpsManual';
import DoublesSessions from '../pages/admin/DoublesSessions';

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Unauthenticated: landing page; authenticated: redirect based on role */}
        <Route path="/" element={<AuthRedirect />} />

        {/* Public routes: accessible without login */}
        <Route path="/play/free" element={<FreeQuizPage />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* All protected routes */}
        <Route element={<ProtectedRoute />}>
          {/* Quiz app routes with sidebar layout */}
          <Route element={<DashboardLayout />}>
            {/* Always-free routes (no tier gate) */}
            <Route path="/dashboard" element={<DashboardHome />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/guide" element={<Guide />} />
            <Route path="/pricing" element={<Pricing />} />

            {/* Basic tier routes */}
            <Route element={<TierRoute requiredTier="basic" />}>
              <Route path="/packs" element={<PackBrowse />} />
              <Route path="/packs/:id" element={<PackDetail />} />
              <Route path="/packs/:id/play" element={<PackPlay />} />
              <Route path="/leaderboard" element={<Leaderboard />} />
              <Route path="/history" element={<History />} />
              <Route path="/play/resume/:sessionId" element={<ResumePlay />} />
            </Route>

            {/* Pro tier routes */}
            <Route element={<TierRoute requiredTier="pro" />}>
              <Route path="/host" element={<HostQuizPage />} />
            </Route>

            {/* Doubles: pro tier */}
            <Route element={<TierRoute requiredTier="pro" />}>
              <Route path="/doubles" element={<DoublesPage />} />
            </Route>
          </Route>

          {/* Tournament routes (full-screen, no sidebar) — pro tier */}
          <Route element={<TierRoute requiredTier="pro" />}>
            <Route path="/host/tournament/:tournamentId" element={<TournamentBracketPage />} />
            <Route path="/host/tournament/:tournamentId/match/:matchId" element={<TournamentMatchPage />} />
          </Route>

          {/* Buzzer page (full-screen, no sidebar, any logged-in user) */}
          <Route path="/buzz/:roomCode" element={<BuzzerPage />} />

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
              <Route path="doubles" element={<DoublesSessions />} />
              <Route path="users" element={<UserList />} />
              <Route path="guide" element={<RolesAndTiersGuide />} />
              <Route path="ops" element={<AdminOpsManual />} />
            </Route>
          </Route>
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </AuthProvider>
  );
}
