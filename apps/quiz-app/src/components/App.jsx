import { Routes, Route, Navigate } from 'react-router-dom';
import AuthProvider from './AuthProvider';
import Landing from '../pages/Landing';
import FreeQuizPage from '../pages/FreeQuizPage';
import PackBrowse from '../pages/PackBrowse';
import PackDetail from '../pages/PackDetail';
import PackPlay from '../pages/PackPlay';
import Profile from '../pages/Profile';
import History from '../pages/History';
import Leaderboard from '../pages/Leaderboard';
import ResumePlay from '../pages/ResumePlay';

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/play/free" element={<FreeQuizPage />} />
        <Route path="/play/resume/:sessionId" element={<ResumePlay />} />
        <Route path="/packs" element={<PackBrowse />} />
        <Route path="/packs/:id" element={<PackDetail />} />
        <Route path="/packs/:id/play" element={<PackPlay />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/history" element={<History />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}
