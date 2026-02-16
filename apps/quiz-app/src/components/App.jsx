import { Routes, Route, Navigate } from 'react-router-dom';
import AuthProvider from './AuthProvider';
import Landing from '../pages/Landing';
import FreeQuizPage from '../pages/FreeQuizPage';
import PackBrowse from '../pages/PackBrowse';
import PackDetail from '../pages/PackDetail';
import PackPlay from '../pages/PackPlay';

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/play/free" element={<FreeQuizPage />} />
        <Route path="/packs" element={<PackBrowse />} />
        <Route path="/packs/:id" element={<PackDetail />} />
        <Route path="/packs/:id/play" element={<PackPlay />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}
