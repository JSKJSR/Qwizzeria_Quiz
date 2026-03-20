import { Link } from 'react-router-dom';
import SEO from '../components/SEO';

export default function NotFound() {
  return (
    <main style={{ textAlign: 'center', padding: '4rem 1rem', minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <SEO title="Page Not Found" noIndex />
      <h1 style={{ fontSize: '4rem', margin: '0 0 0.5rem', color: 'var(--accent-primary, #e85c1a)' }}>404</h1>
      <p style={{ fontSize: '1.25rem', color: '#ccc', marginBottom: '2rem' }}>
        The page you're looking for doesn't exist.
      </p>
      <Link
        to="/"
        style={{
          display: 'inline-block',
          padding: '0.75rem 1.5rem',
          background: 'var(--accent-primary, #e85c1a)',
          color: '#fff',
          borderRadius: '8px',
          textDecoration: 'none',
          fontWeight: 600,
        }}
      >
        Go Home
      </Link>
    </main>
  );
}
