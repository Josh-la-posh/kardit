/* Shared shell components for the affiliate onboarding screens */
/* Exposes: AppBar, Stepper, ScreenFrame, Field, Button, Tag, Icon */

const STEPS = [
  { id: 'org',     n: 1, label: 'Organization & Contact',  meta: 'Tell us about your business' },
  { id: 'docs',    n: 2, label: 'KYB / KYC Documents',     meta: 'Upload required documents' },
  { id: 'banks',   n: 3, label: 'Issuing Banks',           meta: 'Select your banking partners' },
  { id: 'review',  n: 4, label: 'Review & Submit',         meta: 'Confirm and send for approval' },
  { id: 'status',  n: 5, label: 'Status & Tracking',       meta: 'Track your application' },
];

function Icon({ name, size = 18, color = 'currentColor' }) {
  const s = { width: size, height: size, stroke: color, fill: 'none', strokeWidth: 1.75, strokeLinecap: 'round', strokeLinejoin: 'round' };
  const paths = {
    arrow:        <line x1="5" y1="12" x2="19" y2="12"/>,
    chevronRight: <polyline points="9 18 15 12 9 6"/>,
    chevronLeft:  <polyline points="15 18 9 12 15 6"/>,
    check:        <polyline points="20 6 9 17 4 12"/>,
    upload:       <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></>,
    file:         <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></>,
    trash:        <><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></>,
    swap:         <><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></>,
    search:       <><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></>,
    bank:         <><line x1="3" y1="22" x2="21" y2="22"/><line x1="6" y1="18" x2="6" y2="11"/><line x1="10" y1="18" x2="10" y2="11"/><line x1="14" y1="18" x2="14" y2="11"/><line x1="18" y1="18" x2="18" y2="11"/><polygon points="12 2 20 7 4 7 12 2"/></>,
    edit:         <><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></>,
    alert:        <><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></>,
    success:      <><circle cx="12" cy="12" r="10"/><polyline points="9 12 11 14 15 9"/></>,
    refresh:      <><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></>,
    message:      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>,
    clock:        <><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>,
    info:         <><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></>,
    plus:         <><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>,
    download:     <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></>,
    help:         <><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></>,
  };
  return <svg viewBox="0 0 24 24" style={s}>{paths[name]}</svg>;
}

function AppBar({ title = 'Affiliate Portal', step }) {
  return (
    <div className="scr-app-bar">
      <span className="logo-mark">Kard<span className="logo-mark__i">ı</span>t</span>
      <div style={{ width: 1, height: 28, background: 'var(--cs-line)' }}></div>
      <div className="crumbs">
        <span>{title}</span>
        {step && <><Icon name="chevronRight" size={14} color="var(--cs-ink-100)" /><strong>{step}</strong></>}
      </div>
      <div className="spacer"></div>
      <a href="#" style={{ fontSize: 13, color: 'var(--cs-ink-200)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6 }}>
        <Icon name="help" size={16} /> Help
      </a>
      <div className="user">
        <div className="avatar">AO</div>
        <div>
          <div style={{ color: 'var(--cs-ink-700)', fontWeight: 600 }}>Adaeze O.</div>
          <div style={{ fontSize: 11, color: 'var(--cs-ink-100)' }}>Acme Microfinance</div>
        </div>
      </div>
    </div>
  );
}

function Stepper({ activeStep, doneSteps = [], onJump }) {
  return (
    <aside className="scr-rail">
      <h6>Onboarding Progress</h6>
      <ol>
        {STEPS.map(s => {
          const isActive = s.id === activeStep;
          const isDone = doneSteps.includes(s.id);
          return (
            <li key={s.id}
                className={[isActive && 'is-active', isDone && 'is-done'].filter(Boolean).join(' ')}
                onClick={() => onJump && onJump(s.id)}>
              <div className="step-dot">{isDone ? '✓' : s.n}</div>
              <div style={{ flex: 1 }}>
                <div>{s.label}</div>
                <div className="step-meta">{s.meta}</div>
              </div>
            </li>
          );
        })}
      </ol>
      <div style={{ marginTop: 32, padding: 14, background: 'var(--cs-green-100)', border: '1px solid var(--cs-green-300)', borderRadius: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 700, color: 'var(--cs-green-900)' }}>
          <Icon name="info" size={14} color="var(--cs-green-900)" /> Need help?
        </div>
        <div style={{ fontSize: 12, color: 'var(--cs-ink-200)', marginTop: 6, lineHeight: 1.5 }}>
          Save your progress at any time. Our team is available 9am–6pm WAT to walk you through the process.
        </div>
        <a href="#" style={{ fontSize: 12, fontWeight: 700, color: 'var(--cs-green-700)', textDecoration: 'none', marginTop: 10, display: 'inline-block' }}>
          Talk to a Consultant →
        </a>
      </div>
    </aside>
  );
}

function ScreenFrame({ activeStep, doneSteps, title, children, onJump, hideRail = false }) {
  return (
    <div className="scr">
      <AppBar step={title} />
      <div className="scr-body" style={hideRail ? { gridTemplateColumns: '1fr' } : undefined}>
        {!hideRail && <Stepper activeStep={activeStep} doneSteps={doneSteps} onJump={onJump} />}
        <main className="scr-main">
          <div className="container">{children}</div>
        </main>
      </div>
    </div>
  );
}

window.STEPS = STEPS;
window.Icon = Icon;
window.AppBar = AppBar;
window.Stepper = Stepper;
window.ScreenFrame = ScreenFrame;
