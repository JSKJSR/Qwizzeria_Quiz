import { useState } from 'react';

export function GuideSection({ title, icon, defaultOpen = false, children }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={`guide__section ${open ? 'guide__section--open' : ''}`}>
      <button className="guide__section-toggle" onClick={() => setOpen(o => !o)}>
        <span className="guide__section-chevron">{open ? '\u25BC' : '\u25B6'}</span>
        <span className="guide__section-icon">{icon}</span>
        <span className="guide__section-title">{title}</span>
      </button>
      {open && <div className="guide__section-content">{children}</div>}
    </div>
  );
}

export function GuideStep({ number, title, description, visual }) {
  return (
    <div className="guide__step">
      <div className="guide__step-text">
        <div className="guide__step-header">
          <span className="guide__step-number">{number}</span>
          <span className="guide__step-title">{title}</span>
        </div>
        <p className="guide__step-desc">{description}</p>
      </div>
      <div className="guide__step-visual">{visual}</div>
    </div>
  );
}

export function GuideTip({ children }) {
  return <div className="guide__tip">{children}</div>;
}
