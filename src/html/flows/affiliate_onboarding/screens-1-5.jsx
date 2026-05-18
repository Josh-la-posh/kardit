/* Screens 1-5: Onboarding Start, Org details, Doc upload, Banks, Review */

const AppBar = window.AppBar;
const Stepper = window.Stepper;
const ScreenFrame = window.ScreenFrame;
const Icon = window.Icon;
const STEPS = window.STEPS;

function ScrStart({ go }) {
  return (
    <div className="scr">
      <AppBar />
      <main style={{ flex: 1, overflow: 'auto', position: 'relative' }}>
        <img src="assets/swoosh.svg" alt="" style={{ position: 'absolute', right: -120, top: -60, width: 600, opacity: 0.16, pointerEvents: 'none' }} />
        <div style={{ maxWidth: 880, margin: '0 auto', padding: '64px 32px', position: 'relative' }}>
          <div className="scr-eyebrow">Affiliate Onboarding</div>
          <h1 className="scr-title" style={{ fontSize: 44 }}>Welcome to Kardit.</h1>
          <p className="scr-sub" style={{ fontSize: 18 }}>
            Let's get your organization onboarded as a Kardit affiliate. The process takes about 15 minutes — you can save your progress and come back at any time.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 20, marginTop: 32 }}>
            <div className="cs-card pad" style={{ borderTop: '4px solid var(--cs-green-700)' }}>
              <div className="scr-eyebrow" style={{ color: 'var(--cs-green-700)' }}>New application</div>
              <h3 style={{ fontFamily: 'var(--cs-font-display)', fontWeight: 700, fontSize: 22, color: 'var(--cs-ink-900)', margin: '6px 0 8px' }}>Start fresh</h3>
              <p style={{ fontSize: 14, color: 'var(--cs-ink-200)', margin: '0 0 18px', lineHeight: 1.6 }}>
                Begin a new onboarding application. We'll guide you through 4 short steps.
              </p>
              <ul style={{ margin: '0 0 22px', padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {['Organization & contact details', 'KYB / KYC documents', 'Issuing bank selection', 'Review & submit'].map((t,i) => (
                  <li key={t} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: 'var(--cs-ink-400)' }}>
                    <span style={{ width: 22, height: 22, borderRadius: 999, background: 'var(--cs-green-100)', color: 'var(--cs-green-900)', display: 'grid', placeItems: 'center', fontWeight: 700, fontSize: 11, border: '1px solid var(--cs-green-300)' }}>{i+1}</span>
                    {t}
                  </li>
                ))}
              </ul>
              <button className="btn btn-primary" onClick={() => go('org')}>
                Start Onboarding <Icon name="arrow" />
              </button>
            </div>

            <div className="cs-card pad">
              <div className="scr-eyebrow" style={{ color: 'var(--cs-ink-100)' }}>Drafts</div>
              <h3 style={{ fontFamily: 'var(--cs-font-display)', fontWeight: 700, fontSize: 18, color: 'var(--cs-ink-700)', margin: '6px 0 14px' }}>Continue where you left off</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ padding: 14, border: '1px solid var(--cs-line)', borderRadius: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                    <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--cs-ink-700)' }}>Acme Microfinance</div>
                    <span className="tag warn">Step 2 / 4</span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--cs-ink-100)', marginTop: 4 }}>Last edited 2 days ago</div>
                  <button className="btn btn-secondary" style={{ marginTop: 12, padding: '8px 14px', fontSize: 13 }} onClick={() => go('org')}>Continue Draft</button>
                </div>
              </div>
              <div style={{ marginTop: 22, padding: '14px 16px', background: 'var(--cs-mist)', borderRadius: 10, fontSize: 12, color: 'var(--cs-ink-200)', lineHeight: 1.55 }}>
                <strong style={{ color: 'var(--cs-ink-700)' }}>Tip:</strong> Have your CAC certificate, TIN and director IDs ready before you start.
              </div>
            </div>
          </div>

          <div style={{ marginTop: 28, fontSize: 13, color: 'var(--cs-ink-100)' }}>
            Trouble starting? <a href="#" style={{ color: 'var(--cs-green-700)', fontWeight: 600 }}>Contact support</a> or call +234-803-394-4566.
          </div>
        </div>
      </main>
    </div>
  );
}

function ScrOrg({ go, jump, formData, setFormData, errors }) {
  const f = formData;
  const set = (k, v) => setFormData({ ...formData, [k]: v });
  return (
    <ScreenFrame activeStep="org" doneSteps={[]} title="Organization & Contact" onJump={jump}>
      <div className="scr-eyebrow">Step 1 of 4</div>
      <h2 className="scr-title">Tell us about your organization</h2>
      <p className="scr-sub">All fields are required unless marked optional. Use your registered business name and address as on file with CAC.</p>

      <div className="cs-card pad">
        <h4 style={{ fontFamily: 'var(--cs-font-display)', fontWeight: 700, fontSize: 18, color: 'var(--cs-ink-700)', margin: '0 0 18px' }}>Organization details</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className={`field ${errors.legalName ? 'has-error' : ''}`}>
            <label>Legal business name</label>
            <input value={f.legalName} onChange={e => set('legalName', e.target.value)} placeholder="e.g. Acme Microfinance Bank Ltd" />
            {errors.legalName && <span className="err"><Icon name="alert" size={13} color="var(--cs-red-700)" />{errors.legalName}</span>}
          </div>
          <div className="grid-2">
            <div className={`field ${errors.regNo ? 'has-error' : ''}`}>
              <label>RC / Registration number</label>
              <input value={f.regNo} onChange={e => set('regNo', e.target.value)} placeholder="RC 1234567" />
              {errors.regNo && <span className="err"><Icon name="alert" size={13} color="var(--cs-red-700)" />{errors.regNo}</span>}
            </div>
            <div className="field">
              <label>Tax ID (TIN) <span style={{ color: 'var(--cs-ink-100)', fontWeight: 400 }}>· optional</span></label>
              <input value={f.tin} onChange={e => set('tin', e.target.value)} placeholder="0000000-0001" />
            </div>
          </div>
          <div className="field">
            <label>Registered address</label>
            <input value={f.address} onChange={e => set('address', e.target.value)} placeholder="Street, city, state" />
          </div>
          <div className="grid-2">
            <div className="field">
              <label>Country</label>
              <select value={f.country} onChange={e => set('country', e.target.value)}>
                <option>Nigeria</option><option>Ghana</option><option>Kenya</option>
              </select>
            </div>
            <div className="field">
              <label>Industry</label>
              <select value={f.industry} onChange={e => set('industry', e.target.value)}>
                <option>Microfinance</option><option>Fintech</option><option>Retail</option><option>Government</option><option>Healthcare</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="cs-card pad" style={{ marginTop: 18 }}>
        <h4 style={{ fontFamily: 'var(--cs-font-display)', fontWeight: 700, fontSize: 18, color: 'var(--cs-ink-700)', margin: '0 0 18px' }}>Primary contact</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="grid-2">
            <div className={`field ${errors.contactName ? 'has-error' : ''}`}>
              <label>Full name</label>
              <input value={f.contactName} onChange={e => set('contactName', e.target.value)} placeholder="Adaeze Okafor" />
              {errors.contactName && <span className="err"><Icon name="alert" size={13} color="var(--cs-red-700)" />{errors.contactName}</span>}
            </div>
            <div className="field">
              <label>Role</label>
              <input value={f.contactRole} onChange={e => set('contactRole', e.target.value)} placeholder="Head of Operations" />
            </div>
          </div>
          <div className="grid-2">
            <div className={`field ${errors.email ? 'has-error' : ''}`}>
              <label>Work email</label>
              <input type="email" value={f.email} onChange={e => set('email', e.target.value)} placeholder="adaeze@acme.ng" />
              {errors.email && <span className="err"><Icon name="alert" size={13} color="var(--cs-red-700)" />{errors.email}</span>}
            </div>
            <div className="field">
              <label>Phone</label>
              <input value={f.phone} onChange={e => set('phone', e.target.value)} placeholder="+234 803 000 0000" />
            </div>
          </div>
        </div>
      </div>

      <div className="step-actions">
        <button className="btn btn-ghost" onClick={() => go('start')}>← Cancel</button>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-secondary" onClick={() => go('start')}>Save Draft</button>
          <button className="btn btn-primary" onClick={() => go('docs', { validate: 'org' })}>Next: Documents <Icon name="arrow" /></button>
        </div>
      </div>
    </ScreenFrame>
  );
}

function ScrDocs({ go, jump, docs, setDocs }) {
  const required = [
    { key: 'cac',     label: 'CAC Certificate',          desc: 'Certificate of Incorporation (PDF, max 5MB)' },
    { key: 'memart',  label: 'Memorandum & Articles',    desc: 'MEMART or constitution document' },
    { key: 'tin',     label: 'TIN Certificate',          desc: 'Tax Identification Number certificate' },
    { key: 'directors', label: 'Director ID(s)',         desc: 'Government-issued ID for each director' },
    { key: 'utility', label: 'Proof of Address',         desc: 'Utility bill, dated within 3 months' },
  ];
  const toggle = (k) => setDocs({ ...docs, [k]: docs[k] ? null : { name: `${k}_certificate.pdf`, size: '1.2 MB' } });

  return (
    <ScreenFrame activeStep="docs" doneSteps={['org']} title="KYB / KYC Documents" onJump={jump}>
      <div className="scr-eyebrow">Step 2 of 4</div>
      <h2 className="scr-title">Upload required documents</h2>
      <p className="scr-sub">All documents must be in PDF, JPG or PNG format and under 5MB. We accept clear scans or smartphone photos.</p>

      <div className="cs-card pad" style={{ borderStyle: 'dashed', borderColor: 'var(--cs-green-300)', background: 'var(--cs-green-100)', marginBottom: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: '#fff', color: 'var(--cs-green-700)', display: 'grid', placeItems: 'center' }}>
            <Icon name="upload" size={22} color="var(--cs-green-700)" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, color: 'var(--cs-ink-900)' }}>Drag and drop files here</div>
            <div style={{ fontSize: 13, color: 'var(--cs-ink-200)', marginTop: 2 }}>or click to browse — we'll auto-detect document type where possible.</div>
          </div>
          <button className="btn btn-secondary">Browse files</button>
        </div>
      </div>

      <div className="cs-card">
        <div style={{ padding: '14px 22px', borderBottom: '1px solid var(--cs-line)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--cs-ink-700)' }}>Required documents ({Object.values(docs).filter(Boolean).length}/{required.length})</div>
          <span className="tag info">{required.length - Object.values(docs).filter(Boolean).length} remaining</span>
        </div>
        {required.map((d, i) => {
          const file = docs[d.key];
          return (
            <div key={d.key} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 22px', borderBottom: i < required.length - 1 ? '1px solid var(--cs-line)' : 'none' }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: file ? 'var(--cs-green-100)' : 'var(--cs-mist)', color: file ? 'var(--cs-green-700)' : 'var(--cs-ink-100)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                <Icon name={file ? 'check' : 'file'} size={18} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--cs-ink-700)' }}>{d.label}</div>
                <div style={{ fontSize: 12, color: 'var(--cs-ink-100)', marginTop: 2 }}>
                  {file ? <><strong style={{ color: 'var(--cs-ink-400)' }}>{file.name}</strong> · {file.size} · uploaded</> : d.desc}
                </div>
              </div>
              {file ? (
                <div style={{ display: 'flex', gap: 6 }}>
                  <button className="btn btn-ghost" style={{ padding: '6px 10px', fontSize: 12 }}><Icon name="swap" size={14} /> Replace</button>
                  <button className="btn btn-ghost" style={{ padding: '6px 10px', fontSize: 12, color: 'var(--cs-red-700)' }} onClick={() => toggle(d.key)}><Icon name="trash" size={14} /></button>
                </div>
              ) : (
                <button className="btn btn-secondary" style={{ padding: '8px 14px', fontSize: 13 }} onClick={() => toggle(d.key)}>Upload</button>
              )}
            </div>
          );
        })}
      </div>

      <div className="step-actions">
        <button className="btn btn-ghost" onClick={() => go('org')}>← Back</button>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-secondary" onClick={() => go('start')}>Save Draft</button>
          <button className="btn btn-primary" onClick={() => go('banks', { validate: 'docs' })}>Next: Banks <Icon name="arrow" /></button>
        </div>
      </div>
    </ScreenFrame>
  );
}

function ScrBanks({ go, jump, banks, setBanks }) {
  const all = [
    { id: 'gtb', name: 'Guaranty Trust Bank', code: '058' },
    { id: 'access', name: 'Access Bank', code: '044' },
    { id: 'zenith', name: 'Zenith Bank', code: '057' },
    { id: 'firstbank', name: 'First Bank of Nigeria', code: '011' },
    { id: 'uba', name: 'United Bank for Africa', code: '033' },
    { id: 'fidelity', name: 'Fidelity Bank', code: '070' },
    { id: 'stanbic', name: 'Stanbic IBTC Bank', code: '221' },
    { id: 'wema', name: 'Wema Bank', code: '035' },
    { id: 'sterling', name: 'Sterling Bank', code: '232' },
    { id: 'union', name: 'Union Bank', code: '032' },
  ];
  const [q, setQ] = React.useState('');
  const filtered = all.filter(b => b.name.toLowerCase().includes(q.toLowerCase()));
  const toggle = id => setBanks(banks.includes(id) ? banks.filter(x => x !== id) : [...banks, id]);

  return (
    <ScreenFrame activeStep="banks" doneSteps={['org', 'docs']} title="Issuing Banks" onJump={jump}>
      <div className="scr-eyebrow">Step 3 of 4</div>
      <h2 className="scr-title">Select your issuing banks</h2>
      <p className="scr-sub">Choose the banks Kardit will route transactions through on your behalf. You can add more later from your dashboard.</p>

      <div className="cs-card">
        <div style={{ padding: '14px 22px', borderBottom: '1px solid var(--cs-line)', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--cs-ink-100)' }}>
              <Icon name="search" size={16} />
            </span>
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search banks..." style={{ width: '100%', padding: '10px 12px 10px 38px', borderRadius: 8, border: '1px solid var(--cs-line-strong)', fontSize: 14, outline: 'none' }} />
          </div>
          <span className="tag ok">{banks.length} selected</span>
        </div>
        <div style={{ maxHeight: 360, overflow: 'auto' }}>
          {filtered.map((b, i) => {
            const sel = banks.includes(b.id);
            return (
              <label key={b.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 22px', borderBottom: i < filtered.length - 1 ? '1px solid var(--cs-line)' : 'none', cursor: 'pointer', background: sel ? 'var(--cs-green-100)' : '#fff' }}>
                <input type="checkbox" checked={sel} onChange={() => toggle(b.id)} style={{ width: 18, height: 18, accentColor: 'var(--cs-green-700)' }} />
                <div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--cs-mist)', color: 'var(--cs-ink-200)', display: 'grid', placeItems: 'center' }}>
                  <Icon name="bank" size={18} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--cs-ink-700)' }}>{b.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--cs-ink-100)' }}>CBN code · {b.code}</div>
                </div>
                {sel && <Icon name="check" size={18} color="var(--cs-green-700)" />}
              </label>
            );
          })}
        </div>
      </div>

      <div className="step-actions">
        <button className="btn btn-ghost" onClick={() => go('docs')}>← Back</button>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-secondary" onClick={() => go('start')}>Save Draft</button>
          <button className="btn btn-primary" onClick={() => go('review', { validate: 'banks' })}>Review & Submit <Icon name="arrow" /></button>
        </div>
      </div>
    </ScreenFrame>
  );
}

function ScrReview({ go, jump, formData, docs, banks, setConfirmed, confirmed }) {
  const docsCount = Object.values(docs).filter(Boolean).length;
  return (
    <ScreenFrame activeStep="review" doneSteps={['org', 'docs', 'banks']} title="Review & Submit" onJump={jump}>
      <div className="scr-eyebrow">Step 4 of 4</div>
      <h2 className="scr-title">Review your application</h2>
      <p className="scr-sub">Take a moment to confirm everything is right. Once submitted, our team will review within 2 working days.</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <ReviewSection title="Organization & contact" onEdit={() => go('org')}>
          <ReviewRow k="Legal name"  v={formData.legalName || '—'} />
          <ReviewRow k="RC number"   v={formData.regNo || '—'} />
          <ReviewRow k="TIN"         v={formData.tin || '—'} />
          <ReviewRow k="Address"     v={formData.address || '—'} />
          <ReviewRow k="Industry"    v={formData.industry} />
          <ReviewRow k="Contact"     v={`${formData.contactName} · ${formData.contactRole}`} />
          <ReviewRow k="Email"       v={formData.email} />
          <ReviewRow k="Phone"       v={formData.phone} />
        </ReviewSection>

        <ReviewSection title={`Documents (${docsCount}/5)`} onEdit={() => go('docs')}>
          {Object.entries(docs).map(([k, v]) => (
            <ReviewRow key={k} k={k.toUpperCase()} v={v ? <><Icon name="check" size={13} color="var(--cs-green-700)" /> {v.name}</> : <span style={{ color: 'var(--cs-red-700)' }}>Missing</span>} />
          ))}
        </ReviewSection>

        <ReviewSection title={`Issuing banks (${banks.length})`} onEdit={() => go('banks')}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {banks.length ? banks.map(b => <span key={b} className="tag ok" style={{ textTransform: 'uppercase' }}>{b}</span>) : <span style={{ color: 'var(--cs-red-700)', fontSize: 13 }}>No banks selected</span>}
          </div>
        </ReviewSection>
      </div>

      <div className="cs-card pad" style={{ marginTop: 18 }}>
        <label style={{ display: 'flex', gap: 12, alignItems: 'flex-start', cursor: 'pointer' }}>
          <input type="checkbox" checked={confirmed.terms} onChange={e => setConfirmed({ ...confirmed, terms: e.target.checked })} style={{ marginTop: 3, width: 18, height: 18, accentColor: 'var(--cs-green-700)' }} />
          <span style={{ fontSize: 14, color: 'var(--cs-ink-400)', lineHeight: 1.55 }}>
            I confirm that all information provided is accurate, and I have authority to submit this application on behalf of my organization. I accept the <a href="#" style={{ color: 'var(--cs-green-700)', fontWeight: 600 }}>Kardit Affiliate Terms</a> and <a href="#" style={{ color: 'var(--cs-green-700)', fontWeight: 600 }}>Privacy Policy</a>.
          </span>
        </label>
        <label style={{ display: 'flex', gap: 12, alignItems: 'flex-start', cursor: 'pointer', marginTop: 12 }}>
          <input type="checkbox" checked={confirmed.contact} onChange={e => setConfirmed({ ...confirmed, contact: e.target.checked })} style={{ marginTop: 3, width: 18, height: 18, accentColor: 'var(--cs-green-700)' }} />
          <span style={{ fontSize: 14, color: 'var(--cs-ink-400)', lineHeight: 1.55 }}>
            Kardit may contact me about my application via email or phone.
          </span>
        </label>
      </div>

      <div className="step-actions">
        <button className="btn btn-ghost" onClick={() => go('banks')}>← Back</button>
        <button className="btn btn-accent" disabled={!confirmed.terms} onClick={() => go('submitted', { validate: 'submit' })}>
          Submit application <Icon name="arrow" />
        </button>
      </div>
    </ScreenFrame>
  );
}

function ReviewSection({ title, children, onEdit }) {
  return (
    <div className="cs-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 22px', borderBottom: '1px solid var(--cs-line)' }}>
        <div style={{ fontFamily: 'var(--cs-font-display)', fontWeight: 700, fontSize: 16, color: 'var(--cs-ink-700)' }}>{title}</div>
        <button className="btn btn-ghost" style={{ padding: '6px 10px', fontSize: 13, color: 'var(--cs-green-700)' }} onClick={onEdit}><Icon name="edit" size={14} /> Edit</button>
      </div>
      <div style={{ padding: '8px 22px 16px' }}>{children}</div>
    </div>
  );
}
function ReviewRow({ k, v }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', gap: 14, padding: '8px 0', borderBottom: '1px solid var(--cs-line)', fontSize: 14 }}>
      <div style={{ color: 'var(--cs-ink-100)', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>{k}</div>
      <div style={{ color: 'var(--cs-ink-700)', display: 'flex', alignItems: 'center', gap: 6 }}>{v}</div>
    </div>
  );
}

window.ScrStart = ScrStart;
window.ScrOrg = ScrOrg;
window.ScrDocs = ScrDocs;
window.ScrBanks = ScrBanks;
window.ScrReview = ScrReview;
