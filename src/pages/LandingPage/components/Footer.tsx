import { Link } from "react-router-dom"
import Logo from '@/components/Logo'

const footerLinks = [
  { label: 'Privacy Policy', href: '#' },
  { label: 'Terms of Service', href: '#' },
  { label: 'Cookie Policy', href: '#' },
  { label: 'Contact', href: '#' },
]

export default function Footer() {
  return (
    <>
      <footer className="site-footer">
        <div className="site-footer__grid">
        <div className="site-footer__brand">
          <Logo className="logo-mark--on-ink" />
            <p>
              Kardit is a subsidiary of Chams Holdco Plc — a multichannel electronic
              payments switch making payments convenient, simple and secure across
              Nigeria and beyond.
            </p>
            <div className="addr">
              8, Louis Solomon Close, Victoria Island, Lagos
              <br />
              +234-803-394-4566 · support@kardit.com
            </div>
          </div>
          <div className="site-footer__col">
            <h4>Solutions</h4>
            <ul>
              <li><Link to="/solutions#switching">Switching & Processing</Link></li>
              <li><Link to="/solutions#hosted">Hosted Services</Link></li>
              <li><Link to="/solutions#epayment">E-Payment Solutions</Link></li>
              <li><Link to="/solutions#mx">MX Suite</Link></li>
            </ul>
          </div>
          <div className="site-footer__col">
            <h4>Company</h4>
            <ul>
              <li><Link to="/about">About Us</Link></li>
              <li><Link to="/about#leadership">Management Team</Link></li>
              <li><Link to="/about#brands">Our Brands</Link></li>
              <li><Link to="/about#investors">Investor Relations</Link></li>
            </ul>
          </div>
          <div className="site-footer__col">
            <h4>Industries</h4>
            <ul>
              <li><Link to="/industries#financial">Financial Institutions</Link></li>
              <li><Link to="/industries#government">Government</Link></li>
              <li><Link to="/industries#education">Education</Link></li>
              <li><Link to="/industries#health">Healthcare</Link></li>
            </ul>
          </div>
          <div className="site-footer__col">
            <h4>Resources</h4>
            <ul>
              <li><a href="#docs">Documentation</a></li>
              <li><a href="#insights">News & Insights</a></li>
              <li><Link to="/partners">Partners</Link></li>
              <li><Link to="/contact">Contact Us</Link></li>
            </ul>
          </div>
        </div>
        <div className="site-footer__rule">
          <div className="row">
            <div className="copy">© 2026 Kardit Limited · A subsidiary of Chams Holdco Plc</div>
            <div className="site-footer__badges">
              <span className="b1">PCI-DSS</span>
              <span className="b2">ISO 27001</span>
              <span className="b3">OWASP</span>
            </div>
          </div>
        </div>
    </footer>
    </>
  )
}


