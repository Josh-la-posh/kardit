/* Screens 6-9: Submitted, Errors, Status tracker, Respond to clarification */

const AppBar = window.AppBar;
const Stepper = window.Stepper;
const ScreenFrame = window.ScreenFrame;
const Icon = window.Icon;
const STEPS = window.STEPS;

function ScrSubmitted({ go, caseId }) {
  return (
    <div className="scr">
      <AppBar />
      <main style={{ flex: 1, overflow: 'auto', position: 'relative', display: 'grid', placeItems: 'center' }}>
        <img src="assets/swoosh.svg" alt="" style={{ position: 'absolute', right: -120, bottom: -80, width: 600, opacity: 0.14, pointerEvents: 'none' }} />
        <div style={{ maxWidth: 560, padding: 32, textAlign: 'center', position: 'relative' }}>
          <div style={{ width: 88, height: 88, borderRadius: 999, background: 'var(--cs-green-100)', color: 'var(--cs-green-700)', display: 'grid', placeItems: 'center', margin: '0 auto 22px', border: '4px solid var(--cs-green-300)' }}>
            <Icon name="check" size={42} color="var(--cs-green-700)" />
          </div>
          <div className="scr-eyebrow">Application submitted</div>
          <h1 className="scr-title" style={{ fontSize: 36 }}>You're all set, Adaeze.</h1>
          <p className="scr-sub" style={{ fontSize: 16, margin: '12px auto 28px' }}>
            We've received your application. Our compliance team reviews most submissions within 2 working days, and we'll email you the moment there's news.
          </p>

          <div className="cs-card pad" style={{ textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--cs-ink-100)', fontWeight: 700 }}>Case ID</div>
                <div style={{ fontFamily: 'var(--cs-font-mono)', fontWeight: 700, fontSize: 22, color: 'var(--cs-ink-900)', marginTop: 4 }}>{caseId}</div>
              </div>
              <span className="tag ok" style={{ padding: '6px 14px', fontSize: 13 }}>● Submitted</span>
            </div>
            <div style={{ borderTop: '1px solid var(--cs-line)', marginTop: 16, paddingTop: 16, fontSize: 13, color: 'var(--cs-ink-200)' }}>
              Submitted on {new Date().toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric' })} · Expected response by 2 working days.
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 22 }}>
            <button className="btn btn-secondary" onClick={() => go('start')}>Back to dashboard</button>
            <button className="btn btn-primary" onClick={() => go('status')}>View Status <Icon name="arrow" /></button>
          </div>
        </div>
      </main>
    </div>
  );
}

function ScrErrors({ go }) {
  const issues = [
    { section: 'org',   field: 'TIN Number',     msg: 'TIN appears invalid — must be 10 digits.' },
    { section: 'docs',  field: 'Proof of Address', msg: 'No file uploaded. Required for KYB.' },
    { section: 'banks', field: 'Issuing Banks',  msg: 'Select at least one issuing bank.' },
  ];
  return (
    <div className="scr">
      <AppBar />
      <main style={{ flex: 1, overflow: 'auto', display: 'grid', placeItems: 'center', background: 'var(--cs-paper)' }}>
        <div style={{ maxWidth: 600, padding: 32 }}>
          <div style={{ width: 72, height: 72, borderRadius: 999, background: 'var(--cs-red-100)', color: 'var(--cs-red-700)', display: 'grid', placeItems: 'center', margin: '0 auto 18px', border: '3px solid var(--cs-red-300)' }}>
            <Icon name="alert" size={32} color="var(--cs-red-700)" />
          </div>
          <h2 className="scr-title" style={{ fontSize: 28, textAlign: 'center' }}>We can't submit yet.</h2>
          <p className="scr-sub" style={{ textAlign: 'center', margin: '8px auto 22px' }}>
            A few items need attention before your application can be sent for review.
          </p>

          <div className="cs-card">
            <div style={{ padding: '14px 22px', borderBottom: '1px solid var(--cs-line)', fontWeight: 700, color: 'var(--cs-ink-700)', fontSize: 14, display: 'flex', justifyContent: 'space-between' }}>
              <span>{issues.length} issue{issues.length === 1 ? '' : 's'} to fix</span>
              <span className="tag err">Action required</span>
            </div>
            {issues.map((it, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 14, padding: '16px 22px', borderBottom: i < issues.length - 1 ? '1px solid var(--cs-line)' : 'none' }}>
                <div style={{ width: 28, height: 28, borderRadius: 999, background: 'var(--cs-red-100)', color: 'var(--cs-red-700)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                  <Icon name="alert" size={14} color="var(--cs-red-700)" />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, color: 'var(--cs-ink-100)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>{it.section}</div>
                  <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--cs-ink-700)', marginTop: 2 }}>{it.field}</div>
                  <div style={{ fontSize: 13, color: 'var(--cs-ink-200)', marginTop: 4 }}>{it.msg}</div>
                </div>
                <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: 13 }} onClick={() => go(it.section)}>Fix Now →</button>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 22 }}>
            <button className="btn btn-ghost" onClick={() => go('review')}>← Back to review</button>
            <button className="btn btn-primary" onClick={() => go('org')}>Fix all issues <Icon name="arrow" /></button>
          </div>
        </div>
      </main>
    </div>
  );
}

function ScrStatus({ go, caseId, statusStage }) {
  /* statusStage in: 'submitted' | 'review' | 'clarification' | 'approved' | 'rejected' */
  const order = ['submitted', 'review', 'clarification', 'approved'];
  const idx = order.indexOf(statusStage);
  const milestones = [
    { k: 'submitted',     label: 'Submitted',         desc: 'Application received',                     when: '30 Apr 2026, 09:14' },
    { k: 'review',        label: 'In Review',          desc: 'Compliance team reviewing your documents', when: '30 Apr 2026, 14:02' },
    { k: 'clarification', label: 'Clarification',      desc: 'We need a small piece of extra info',      when: '01 May 2026, 11:20' },
    { k: 'approved',      label: 'Approved',           desc: 'Welcome aboard — credentials issued',      when: '—' },
  ];

  return (
    <ScreenFrame activeStep="status" doneSteps={['org','docs','banks','review']} title="Application Status" hideRail>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 24, marginBottom: 24, flexWrap: 'wrap' }}>
        <div>
          <div className="scr-eyebrow">Application</div>
          <h2 className="scr-title">{caseId}</h2>
          <p style={{ fontSize: 14, color: 'var(--cs-ink-200)', margin: '4px 0 0' }}>Acme Microfinance Bank Ltd · Submitted 30 Apr 2026</p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button className="btn btn-ghost" style={{ padding: '8px 12px', fontSize: 13 }}><Icon name="refresh" size={14} /> Refresh</button>
          <button className="btn btn-secondary" style={{ padding: '8px 14px', fontSize: 13 }}><Icon name="download" size={14} /> Download summary</button>
        </div>
      </div>

      {statusStage === 'clarification' && (
        <div className="cs-card pad" style={{ borderLeft: '4px solid var(--cs-red-700)', background: 'var(--cs-red-100)', marginBottom: 18 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
            <div style={{ width: 36, height: 36, borderRadius: 999, background: '#fff', color: 'var(--cs-red-700)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
              <Icon name="message" size={18} color="var(--cs-red-700)" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, color: 'var(--cs-red-900)' }}>Clarification requested</div>
              <p style={{ fontSize: 14, color: 'var(--cs-ink-400)', margin: '4px 0 12px', lineHeight: 1.55 }}>
                Compliance asks: "Could you re-upload the proof of address — the file appears partially redacted on page 2."
              </p>
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="btn btn-accent" onClick={() => go('respond')}>Respond to Clarification <Icon name="arrow" /></button>
                <button className="btn btn-ghost" style={{ color: 'var(--cs-red-700)' }}>View message</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="cs-card pad">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
          <h4 style={{ fontFamily: 'var(--cs-font-display)', fontWeight: 700, fontSize: 18, color: 'var(--cs-ink-700)', margin: 0 }}>Timeline</h4>
          <span className={`tag ${statusStage === 'clarification' ? 'warn' : statusStage === 'approved' ? 'ok' : 'info'}`} style={{ padding: '6px 12px', fontSize: 13 }}>
            ● {statusStage === 'clarification' ? 'Awaiting your response' : statusStage === 'approved' ? 'Approved' : 'In review'}
          </span>
        </div>

        <div style={{ position: 'relative', paddingLeft: 4 }}>
          {milestones.map((m, i) => {
            const done = i < idx;
            const active = i === idx;
            return (
              <div key={m.k} style={{ display: 'flex', gap: 18, paddingBottom: i < milestones.length - 1 ? 20 : 0, position: 'relative' }}>
                {i < milestones.length - 1 && (
                  <div style={{ position: 'absolute', left: 14, top: 30, bottom: 0, width: 2, background: done ? 'var(--cs-green-500)' : 'var(--cs-line)' }}></div>
                )}
                <div style={{
                  width: 30, height: 30, borderRadius: 999, flexShrink: 0,
                  background: done ? 'var(--cs-green-500)' : active ? '#fff' : 'var(--cs-mist)',
                  color: done ? '#fff' : active ? 'var(--cs-green-700)' : 'var(--cs-ink-100)',
                  border: `2px solid ${done ? 'var(--cs-green-500)' : active ? 'var(--cs-green-700)' : 'var(--cs-line-strong)'}`,
                  display: 'grid', placeItems: 'center',
                  boxShadow: active ? '0 0 0 4px rgba(43,161,93,0.20)' : 'none',
                }}>
                  {done ? <Icon name="check" size={14} color="#fff" /> : active ? <Icon name="clock" size={14} color="var(--cs-green-700)" /> : <span style={{ fontSize: 11, fontWeight: 700 }}>{i+1}</span>}
                </div>
                <div style={{ flex: 1, paddingTop: 3 }}>
                  <div style={{ fontWeight: 600, color: done || active ? 'var(--cs-ink-700)' : 'var(--cs-ink-100)', fontSize: 15 }}>{m.label}</div>
                  <div style={{ fontSize: 13, color: 'var(--cs-ink-200)', marginTop: 2 }}>{m.desc}</div>
                  <div style={{ fontSize: 12, color: 'var(--cs-ink-100)', marginTop: 4 }}>{m.when}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="cs-card pad" style={{ marginTop: 14 }}>
        <h4 style={{ fontFamily: 'var(--cs-font-display)', fontWeight: 700, fontSize: 16, color: 'var(--cs-ink-700)', margin: '0 0 14px' }}>Messages</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ width: 32, height: 32, borderRadius: 999, background: 'var(--cs-mist)', color: 'var(--cs-ink-200)', display: 'grid', placeItems: 'center', fontWeight: 700, fontSize: 12, flexShrink: 0 }}>CO</div>
            <div style={{ flex: 1, background: 'var(--cs-mist)', borderRadius: 12, padding: '10px 14px' }}>
              <div style={{ fontSize: 12, color: 'var(--cs-ink-100)', display: 'flex', justifyContent: 'space-between' }}>
                <strong style={{ color: 'var(--cs-ink-400)' }}>Compliance Officer</strong>
                <span>01 May, 11:20</span>
              </div>
              <p style={{ margin: '4px 0 0', fontSize: 14, color: 'var(--cs-ink-400)', lineHeight: 1.5 }}>
                Hello Adaeze — your proof-of-address upload is partially redacted on page 2. Please re-upload a complete copy. Thanks!
              </p>
            </div>
          </div>
        </div>
      </div>
    </ScreenFrame>
  );
}

function ScrRespond({ go }) {
  const [msg, setMsg] = React.useState('');
  const [file, setFile] = React.useState(null);
  return (
    <ScreenFrame activeStep="status" doneSteps={['org','docs','banks','review']} title="Respond to Clarification" hideRail>
      <button className="btn btn-ghost" onClick={() => go('status')} style={{ marginBottom: 14, padding: '6px 10px', fontSize: 13 }}>
        <Icon name="chevronLeft" size={14} /> Back to status
      </button>

      <div className="scr-eyebrow">Clarification</div>
      <h2 className="scr-title">Respond to compliance</h2>
      <p className="scr-sub">Reply to our message and re-upload any missing or corrected documents. Your application stays in clarification status until you submit a response.</p>

      <div className="cs-card pad" style={{ background: 'var(--cs-mist)' }}>
        <div style={{ fontSize: 12, color: 'var(--cs-ink-100)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700 }}>Original request · 01 May, 11:20</div>
        <p style={{ margin: '8px 0 0', fontSize: 14, color: 'var(--cs-ink-400)', lineHeight: 1.55 }}>
          "Could you re-upload the proof of address — the file appears partially redacted on page 2."
        </p>
      </div>

      <div className="cs-card pad" style={{ marginTop: 14 }}>
        <h4 style={{ fontFamily: 'var(--cs-font-display)', fontWeight: 700, fontSize: 16, color: 'var(--cs-ink-700)', margin: '0 0 14px' }}>Your reply</h4>
        <div className="field">
          <label>Message</label>
          <textarea value={msg} onChange={e => setMsg(e.target.value)} rows={5} placeholder="Add a short note for the compliance team..." style={{ resize: 'vertical', minHeight: 120 }}></textarea>
        </div>

        <div style={{ marginTop: 18 }}>
          <div className="field">
            <label>Re-upload document</label>
            <div style={{ border: '2px dashed var(--cs-line-strong)', borderRadius: 12, padding: 22, textAlign: 'center', background: 'var(--cs-paper)' }}>
              {file ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
                  <Icon name="file" size={20} color="var(--cs-green-700)" />
                  <span style={{ fontWeight: 600, color: 'var(--cs-ink-700)' }}>proof_of_address_v2.pdf</span>
                  <span style={{ fontSize: 12, color: 'var(--cs-ink-100)' }}>1.4 MB</span>
                  <button className="btn btn-ghost" style={{ padding: '4px 10px', fontSize: 12, color: 'var(--cs-red-700)' }} onClick={() => setFile(null)}>Remove</button>
                </div>
              ) : (
                <>
                  <Icon name="upload" size={24} color="var(--cs-ink-100)" />
                  <div style={{ fontWeight: 600, color: 'var(--cs-ink-700)', marginTop: 8 }}>Drop file here or click to browse</div>
                  <div style={{ fontSize: 12, color: 'var(--cs-ink-100)', marginTop: 4 }}>PDF, JPG, PNG · max 5MB</div>
                  <button className="btn btn-secondary" style={{ marginTop: 12, padding: '8px 14px', fontSize: 13 }} onClick={() => setFile(true)}>Browse files</button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="step-actions">
        <button className="btn btn-ghost" onClick={() => go('status')}>Cancel</button>
        <button className="btn btn-primary" disabled={!msg && !file} onClick={() => go('status', { resolveClarification: true })}>
          Submit response <Icon name="arrow" />
        </button>
      </div>
    </ScreenFrame>
  );
}

window.ScrSubmitted = ScrSubmitted;
window.ScrErrors = ScrErrors;
window.ScrStatus = ScrStatus;
window.ScrRespond = ScrRespond;
