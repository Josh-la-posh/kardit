const footerLinks = [
  { label: 'Privacy Policy', href: '#' },
  { label: 'Terms of Service', href: '#' },
  { label: 'Cookie Policy', href: '#' },
  { label: 'Contact', href: '#' },
]

export default function Footer() {
  return (
    <footer className="bg-[#f6f8f7] px-5 pb-8 pt-0 md:px-8 md:pb-10">
      <div className="mx-auto max-w-[111rem] rounded-none bg-[linear-gradient(180deg,#cdeedb_0%,#c4e8d1_100%)] px-8 py-14 md:px-14 md:py-10">
        <div className="flex flex-col gap-10 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <a
              href="/"
              className="text-[2rem] font-extrabold tracking-[-0.04em] text-[#049547]"
            >
              Kardit
            </a>
            <p className="mt-6 text-sm leading-8 text-slate-700 md:text-md">
              © 2026 Kardit Finance. The Architectural Backbone in Fintech
              Excellence.
            </p>
          </div>

          <nav className="flex flex-wrap gap-x-6 gap-y-4 md:justify-end">
            {footerLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-base text-[#16a34a] underline underline-offset-4 transition-opacity hover:opacity-70 md:text-md"
              >
                {link.label}
              </a>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  )
}
