import { Link } from 'react-router-dom'
import { Swoosh } from '@/components/marketting/Swoosh'
import HowItWorks from './components/HowItWorks'

export default function Page() {
  return (
    <main>
      <section className="hero hero--compact" data-swoosh>
        <Swoosh variant="default" />
        <div className="container hero__inner hero__inner--solo">
          <div>
            <span className="pill"><span className="dot" /> Business Payments to China · For Importers & Corporates</span>
            <h1 className="hero__title">
              <span className="hero__title-line">Pay Your Chinese</span>
              <span className="hero__title-line">Suppliers</span>
              <span className="hero__title-line"><em>Without the Friction.</em></span>
            </h1>
            <p className="hero__lede">
              A guided five-step journey from first form to going live. Complete each step to
              unlock the next — most teams finish in under fifteen minutes.
            </p>
            <div className="hero__cta">
              <a className="btn btn--primary" href="#journey">Begin the Journey ↓</a>
              <Link className="btn btn--ghost" to="/contact">Talk to a Partner Manager →</Link>
            </div>
            <div className="hero__trust">
              5 screens · Save & resume any time · Compliance-reviewed in 2 working days
            </div>
          </div>
        </div>
      </section>

      <section className="section section--paper" id="journey">
        <div className="container">
          <div className="journey-head reveal">
            <div>
              <div className="eyebrow">The Affiliate Journey</div>
              <h2 className="section-head__title">Five steps. One at a time.</h2>
              <p className="section-head__lede" style={{ maxWidth: 640 }}>
                Each screen represents an actual moment in the onboarding flow — the same one your
                team will use. Complete the primary action on a screen and the next one loads
                automatically.
              </p>
            </div>
          </div>

          <div className="journey-stage" style={{ display: 'grid', placeItems: 'center', minHeight: 320, padding: 32 }}>
            <div style={{ textAlign: 'center', maxWidth: 520 }}>
              <div className="eyebrow eyebrow--muted">Onboarding wizard</div>
              <h3 className="section-head__title" style={{ marginTop: 8 }}>Ready when you are.</h3>
              <p className="card__desc" style={{ marginTop: 12 }}>
                Four short steps — organization details, KYB documents, issuing banks, and a final
                review. About 15 minutes; you can save and come back.
              </p>
              <div style={{ marginTop: 20, display: 'flex', gap: 10, justifyContent: 'center' }}>
                <Link className="btn btn--accent" to="/onboarding/start">Start Onboarding</Link>
                <Link className="btn btn--ghost" to="/contact">Book a Walkthrough</Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section section--ink" data-swoosh>
        <Swoosh variant="ink" />
        <div className="container">
          <div className="section-head reveal">
            <div>
              <div className="eyebrow eyebrow--inverse">Why partner with Kardit</div>
              <h2 className="section-head__title">Built to make your business move faster.</h2>
            </div>
          </div>
          <div className="partner-perks">
            <Perk num="01" title="One platform, every channel"
                  body="Route ATM, POS, web, mobile and USSD through a single switch. Your customers get one experience; your operations team gets one console." delay={1} />
            <Perk num="02" title="Two-day compliance review"
                  body="Submit a complete application and a real human gets back to you within two working days — not two weeks." delay={2} />
            <Perk num="03" title="Local rails, global schemes"
                  body="CBN-compliant out of the box, with VISA, Mastercard, UnionPay, JCB, RuPay and Verve already wired in." delay={3} />
            <Perk num="04" title="A real partner manager"
                  body="Every affiliate gets a named contact through onboarding and beyond — not a ticketing portal." delay={4} />
          </div>
        </div>
      </section>

      <section className="section section--paper">
        <div className="container reveal">
          <div className="cta-band">
            <div>
              <h2 className="cta-band__title">Questions before you apply?</h2>
              <p className="cta-band__lede">
                A partner manager can walk you through the requirements, expected timeline, and
                what your first month live looks like — typically in under twenty minutes.
              </p>
            </div>
            <div className="cta-band__actions">
              <Link className="btn btn--accent" to="/contact">Book a Walkthrough</Link>
              <Link className="btn btn--outline-green" to="/solutions">Explore Solutions</Link>
            </div>
          </div>
        </div>
      </section>

      <HowItWorks />
    </main>
  )
}

function Perk({ num, title, body, delay }: { num: string; title: string; body: string; delay: number }) {
  return (
    <div className="reveal" data-delay={delay}>
      <div className="perk-num">{num}</div>
      <div className="perk-title">{title}</div>
      <p className="perk-body">{body}</p>
    </div>
  )
}
