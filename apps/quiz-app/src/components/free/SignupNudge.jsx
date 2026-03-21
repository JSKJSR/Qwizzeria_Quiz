import { useState, useEffect } from 'react';

export default function SignupNudge({ message, onSignUp, onDismiss }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      onDismiss?.();
    }, 10000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  if (!visible) return null;

  return (
    <div className="free-quiz__signup-nudge" role="complementary" aria-label="Sign up suggestion">
      <button
        className="free-quiz__nudge-dismiss"
        onClick={() => { setVisible(false); onDismiss?.(); }}
        aria-label="Dismiss"
      >
        {'\u2715'}
      </button>
      <p className="free-quiz__nudge-message">{message}</p>
      <button className="free-quiz__nudge-cta" onClick={onSignUp}>
        Sign Up Free
      </button>
    </div>
  );
}
