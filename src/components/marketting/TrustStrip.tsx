export function TrustStrip() {
  return (
    <section className="trust-strip">
      <div className="container trust-strip__inner reveal">
        <div className="trust-strip__label">Connected to every major scheme</div>
        <div className="trust-strip__list">
          <div className="mark" style={{ letterSpacing: '0.1em' }}>VISA</div>
          <div className="mark">Mastercard</div>
          <div className="mark">UnionPay</div>
          <div className="mark" style={{ fontStyle: 'italic' }}>JCB</div>
          <div className="mark">RuPay</div>
          <div className="mark">Verve</div>
        </div>
      </div>
    </section>
  )
}
