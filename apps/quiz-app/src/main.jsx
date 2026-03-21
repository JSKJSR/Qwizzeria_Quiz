import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { initSupabase } from '@qwizzeria/supabase-client';
import { Analytics } from '@vercel/analytics/react';
import ErrorBoundary from './components/ErrorBoundary';
import { ThemeProvider } from './hooks/useTheme';
import App from './components/App';
import './styles/global.css';

// Initialize Supabase if credentials are available
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (supabaseUrl && supabaseAnonKey) {
  initSupabase(supabaseUrl, supabaseAnonKey);
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <HelmetProvider>
      <ErrorBoundary>
        <ThemeProvider>
          <BrowserRouter>
            <App />
            <Analytics />
          </BrowserRouter>
        </ThemeProvider>
      </ErrorBoundary>
    </HelmetProvider>
  </StrictMode>
);
