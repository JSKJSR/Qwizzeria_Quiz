import { useState, useRef, useCallback } from 'react';
import { lookupUserByEmail, checkDoublesAvailability } from '@qwizzeria/supabase-client';

const DEBOUNCE_MS = 500;

/**
 * Hook for looking up a registered partner by email.
 * Returns partner state + a handleEmailChange callback.
 */
export default function usePartnerLookup() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('empty'); // empty | checking | found | not_found | unavailable | self_error | error
  const [data, setData] = useState(null); // { userId, displayName }
  const debounceRef = useRef(null);

  const validate = useCallback(async (rawEmail) => {
    const trimmed = rawEmail.trim().toLowerCase();
    if (!trimmed || !trimmed.includes('@')) {
      setStatus('empty');
      setData(null);
      return;
    }

    setStatus('checking');
    setData(null);

    try {
      const result = await lookupUserByEmail(trimmed);
      if (!result) {
        setStatus('not_found');
        return;
      }

      const available = await checkDoublesAvailability(result.userId);
      if (!available) {
        setStatus('unavailable');
        setData(result);
        return;
      }

      setStatus('found');
      setData(result);
    } catch (err) {
      setStatus(err.message?.includes('own email') ? 'self_error' : 'error');
    }
  }, []);

  const handleEmailChange = useCallback((value) => {
    setEmail(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!value.trim()) {
      setStatus('empty');
      setData(null);
      return;
    }

    debounceRef.current = setTimeout(() => validate(value), DEBOUNCE_MS);
  }, [validate]);

  const reset = useCallback(() => {
    setEmail('');
    setStatus('empty');
    setData(null);
  }, []);

  return { email, status, data, handleEmailChange, reset };
}
