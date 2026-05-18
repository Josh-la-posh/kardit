import MarketingHeader from '@/components/MarketingHeader'
import Footer from './components/Footer'
import HowItWorks from './components/HowItWorks'

const Page = () => {
    // const featureCards = [
    //   {
    //     icon: Lock,
    //     title: 'Bank-level security',
    //     description: '256-bit AES encryption',
    //   },
    //   {
    //     icon: TrendingUp,
    //     title: 'Real-time Insights',
    //     description: 'AI-driven forecasting',
    //   },
    // ]

    const rawAppBaseUrl = ((import.meta as any).env?.VITE_APP_BASE_URL as string | undefined)?.trim() || ''
    const appBaseUrl = rawAppBaseUrl
      ? (/^https?:\/\//i.test(rawAppBaseUrl) ? rawAppBaseUrl : `http://${rawAppBaseUrl}`).replace(/\/$/, '')
      : ''
    const authUrl = appBaseUrl ? `${appBaseUrl}/login` : '/login'
    const onboardingUrl = appBaseUrl ? `${appBaseUrl}/onboarding/start` : '/onboarding/start'

  return (
    <div className="">
      <div className="bg-[var(--cs-bg)] text-[var(--cs-fg)]" data-screen-label="Kardit - Home">
        <MarketingHeader
          authUrl={authUrl}
          enrollmentUrl={onboardingUrl}
        />
        <main>
          <section className="relative overflow-hidden py-20" data-swoosh>
            <div className="absolute inset-0 -z-10" aria-hidden="true">
              <svg className="h-full w-full" viewBox="0 0 1200 600" preserveAspectRatio="xMidYMid slice">
                <defs>
                  <linearGradient id="thickGrad" x1="0" x2="1" y1="0" y2="0">
                    <stop offset="0" stopColor="hsl(var(--kardit-home-hero-red-1) / 0)" />
                    <stop offset="0.18" stopColor="hsl(var(--kardit-home-hero-red-1) / 0.45)" />
                    <stop offset="0.55" stopColor="hsl(var(--kardit-home-hero-red-2) / 0.62)" />
                    <stop offset="1" stopColor="hsl(var(--kardit-home-hero-red-3) / 0)" />
                  </linearGradient>
                  <linearGradient id="thinGrad" x1="0" x2="1" y1="0" y2="0">
                    <stop offset="0" stopColor="hsl(var(--kardit-home-hero-red-3) / 0)" />
                    <stop offset="0.4" stopColor="hsl(var(--kardit-home-hero-red-3) / 0.4)" />
                    <stop offset="0.85" stopColor="hsl(var(--kardit-home-hero-red-3) / 0)" />
                  </linearGradient>
                </defs>
                <path data-stroke="thick" d="" stroke="url(#thickGrad)" strokeWidth="32" strokeLinecap="round" fill="none" />
                <path data-stroke="thin" d="" stroke="url(#thinGrad)" strokeWidth="14" strokeLinecap="round" fill="none" />
              </svg>
            </div>
            <div className="mx-auto grid w-[min(1440px,calc(100%-48px))] grid-cols-1 items-center gap-8 lg:grid-cols-[1.2fr_0.8fr]">
              <div>
                <span className="inline-flex items-center gap-2 rounded-full bg-[var(--cs-green-100)] px-3.5 py-[7px] text-sm font-bold text-[var(--cs-green-900)]">
                  <span className="h-2 w-2 rounded-full bg-[var(--cs-green-500)]"></span> Now licensed for
                  UnionPay cross-border
                </span>
                <h1 className="mt-3.5">
                  <span className="block text-[clamp(2rem,5vw,4rem)] font-extrabold leading-[1.03] tracking-[-0.02em] text-[var(--cs-ink-900)]">
                    Convenient.
                  </span>
                  <span className="block text-[clamp(2rem,5vw,4rem)] font-extrabold leading-[1.03] tracking-[-0.02em] text-[var(--cs-ink-900)]">
                    Simple.
                  </span>
                  <span className="block text-[clamp(2rem,5vw,4rem)] font-extrabold leading-[1.03] tracking-[-0.02em] text-primary">
                    <em className="not-italic">Secure.</em>
                  </span>
                </h1>
                <p className="mt-5 max-w-[66ch] leading-[1.75] text-[var(--cs-fg-muted)]">
                  A multichannel electronic payments switch built for issuers, acquirers, fintechs and the
                  merchants they serve. Connect every channel - ATM, POS, web, mobile, USSD - to one platform.
                </p>
                <div className="mt-[22px] flex flex-wrap gap-3">
                  <a
                    className="rounded-xl border border-transparent bg-[var(--cs-green-700)] px-5 py-4 text-sm font-bold text-[var(--cs-white)] no-underline transition-all hover:bg-[var(--cs-green-900)]"
                    href="contact.html"
                  >
                    Talk to a Consultant
                  </a>
                  <a
                    className="rounded-xl border border-[var(--cs-border-strong)] bg-[var(--cs-bg-elevated)] px-5 py-4 text-sm font-bold text-[var(--cs-ink-700)] no-underline"
                    href="solutions.html"
                  >
                    Explore Solutions -
                  </a>
                </div>
                <div className="mt-[18px] text-sm text-[var(--cs-fg-subtle)]">
                  Trusted by 200,000+ businesses - PCI-DSS - ISO 27001
                </div>
              </div>

              <div
                className="rounded-[24px] border border-[var(--cs-border)] bg-[var(--cs-bg-elevated)] p-[18px] shadow-[var(--cs-shadow-lg)]"
                data-parallax="hero-card"
                aria-label="Live transaction volume snapshot"
              >
                <div className="flex items-start justify-between gap-2.5">
                  <div>
                    <div className="text-sm text-[var(--cs-fg-subtle)]">Today - Volume</div>
                    <div className="mt-1 text-[28px] font-extrabold leading-[1.15] text-[var(--cs-ink-900)]">
                      N4,820,140
                    </div>
                  </div>
                  <span className="font-bold text-[var(--cs-success)]">+ 12.4%</span>
                </div>
                <div className="mt-4 grid h-[92px] grid-cols-12 items-end gap-1.5" aria-hidden="true">
                  <span className="block rounded-full bg-[color-mix(in_srgb,var(--cs-green-700)_70%,white)]" style={{ height: '30%', animationDelay: '0ms' }}></span>
                  <span className="block rounded-full bg-[color-mix(in_srgb,var(--cs-green-700)_70%,white)]" style={{ height: '55%', animationDelay: '40ms' }}></span>
                  <span className="block rounded-full bg-[color-mix(in_srgb,var(--cs-green-700)_70%,white)]" style={{ height: '42%', animationDelay: '80ms' }}></span>
                  <span className="block rounded-full bg-[color-mix(in_srgb,var(--cs-green-700)_70%,white)]" style={{ height: '75%', animationDelay: '120ms' }}></span>
                  <span className="block rounded-full bg-[color-mix(in_srgb,var(--cs-green-700)_70%,white)]" style={{ height: '60%', animationDelay: '160ms' }}></span>
                  <span className="block rounded-full bg-[color-mix(in_srgb,var(--cs-green-700)_70%,white)]" style={{ height: '88%', animationDelay: '200ms' }}></span>
                  <span className="block rounded-full bg-[color-mix(in_srgb,var(--cs-green-700)_70%,white)]" style={{ height: '72%', animationDelay: '240ms' }}></span>
                  <span className="block rounded-full bg-[color-mix(in_srgb,var(--cs-green-700)_70%,white)]" style={{ height: '95%', animationDelay: '280ms' }}></span>
                  <span className="block rounded-full bg-[color-mix(in_srgb,var(--cs-green-700)_70%,white)]" style={{ height: '68%', animationDelay: '320ms' }}></span>
                  <span className="block rounded-full bg-[var(--cs-red-700)]" style={{ height: '80%', animationDelay: '360ms' }}></span>
                  <span className="block rounded-full bg-[var(--cs-red-700)]" style={{ height: '92%', animationDelay: '400ms' }}></span>
                  <span className="block rounded-full bg-[var(--cs-red-700)]" style={{ height: '100%', animationDelay: '440ms' }}></span>
                </div>
                <div className="mt-[14px] grid grid-cols-3 gap-2.5">
                  <div>
                    <div className="text-xs text-[var(--cs-fg-subtle)]">Settled</div>
                    <div className="font-bold text-[var(--cs-ink-900)]">94.2%</div>
                  </div>
                  <div>
                    <div className="text-xs text-[var(--cs-fg-subtle)]">Pending</div>
                    <div className="font-bold text-[var(--cs-ink-900)]">4.1%</div>
                  </div>
                  <div>
                    <div className="text-xs text-[var(--cs-fg-subtle)]">Declined</div>
                    <div className="font-bold text-[var(--cs-ink-900)]">1.7%</div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="border-y border-[var(--cs-border)] bg-[var(--cs-bg-elevated)] py-8">
            <div className="mx-auto w-[min(1440px,calc(100%-48px))] flex justify-between items-center gap-5">
              <div className="text-sm text-[var(--cs-fg-muted)] uppercase">Connected to every major scheme</div>
              <div className="flex flex-wrap gap-10 font-bold text-[var(--cs-ink-400)] text-lg md:text-xl">
                <div className="mark" style={{ letterSpacing: '0.1em' }}>
                  VISA
                </div>
                <div className="mark">Mastercard</div>
                <div className="mark">UnionPay</div>
                <div className="mark" style={{ fontStyle: 'italic' }}>
                  JCB
                </div>
                <div className="mark">RuPay</div>
                <div className="mark">Verve</div>
              </div>
            </div>
          </section>

          <section className="bg-[var(--cs-paper)] py-20">
            <div className="mx-auto w-[min(1440px,calc(100%-48px))]">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--cs-green-700)]">
                    Products &amp; Solutions
                  </div>
                  <h2 className="mt-1.5 text-[clamp(1.6rem,3vw,2.4rem)] font-extrabold leading-[1.15]">
                    One switch. Every channel.
                  </h2>
                </div>
                <p className="self-end text-[var(--cs-fg-muted)] max-w-[450px]">
                  From a single API to vertical-specific suites, the Kardit platform meets you where your
                  business is.
                </p>
              </div>

              <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                <article className="rounded-2xl border border-[var(--cs-border)] bg-[var(--cs-bg-elevated)] p-6 shadow-[var(--cs-shadow-sm)]">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--cs-bg-tint)] text-[var(--cs-ink-700)]">
                    <svg
                      width="28"
                      height="28"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.75"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect x="2" y="5" width="20" height="14" rx="2" />
                      <line x1="2" y1="10" x2="22" y2="10" />
                    </svg>
                  </div>
                  <div className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--cs-fg-subtle)]">
                    Payment Gateway
                  </div>
                  <div className="mt-2 text-[28px] font-bold text-[var(--cs-ink-700)]">ChamsPay</div>
                  <p className="mt-2 text-[var(--cs-fg-muted)]">
                    Accept card, bank transfer, USSD and QR online - settled to your account next day.
                  </p>
                  <a className="mt-4 inline-block font-semibold text-[var(--cs-green-700)] no-underline" href="solutions.html#chamspay">
                    Learn more
                  </a>
                </article>

                <article className="rounded-2xl border border-[var(--cs-border)] bg-[var(--cs-bg-elevated)] p-6 shadow-[var(--cs-shadow-sm)]">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--cs-bg-tint)] text-[var(--cs-ink-700)]">
                    <svg
                      width="28"
                      height="28"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.75"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="m2 7 1-4h18l1 4" />
                      <path d="M5 12v7a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-7" />
                    </svg>
                  </div>
                  <div className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--cs-fg-subtle)]">
                    E-Commerce &amp; Bills
                  </div>
                  <div className="mt-2 text-[28px] font-bold text-[var(--cs-ink-700)]">Naira.com</div>
                  <p className="mt-2 text-[var(--cs-fg-muted)]">
                    PCI-DSS-secured platform for everyday bill payments, transfers and airtime - for
                    consumers and merchants.
                  </p>
                  <a className="mt-4 inline-block font-semibold text-[var(--cs-green-700)] no-underline" href="solutions.html#naira">
                    Learn more
                  </a>
                </article>

                <article className="rounded-2xl border border-[var(--cs-border)] bg-[var(--cs-bg-elevated)] p-6 shadow-[var(--cs-shadow-sm)]">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--cs-bg-tint)] text-[var(--cs-ink-700)]">
                    <svg
                      width="28"
                      height="28"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.75"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect x="3" y="3" width="7" height="7" rx="1" />
                      <rect x="14" y="3" width="7" height="7" rx="1" />
                      <rect x="3" y="14" width="7" height="7" rx="1" />
                      <rect x="14" y="14" width="7" height="7" rx="1" />
                    </svg>
                  </div>
                  <div className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--cs-fg-subtle)]">
                    Vertical Suites
                  </div>
                  <div className="mt-2 text-[28px] font-bold text-[var(--cs-ink-700)]">MX Suite</div>
                  <p className="mt-2 text-[var(--cs-fg-muted)]">
                    Pre-built switching for Campus, Health, E-Gov, Move and Enterprise - with custom
                    configurations.
                  </p>
                  <a className="mt-4 inline-block font-semibold text-[var(--cs-green-700)] no-underline" href="solutions.html#mx">
                    Learn more
                  </a>
                </article>
              </div>
            </div>
          </section>

        <section
          className="relative overflow-hidden py-14 text-[var(--cs-white)]"
          style={{ background: 'linear-gradient(120deg, var(--cs-green-900), #173c27)' }}
          data-swoosh
        >
            <div className="absolute inset-0 -z-10" aria-hidden="true">
              <svg className="h-full w-full" viewBox="0 0 1200 600" preserveAspectRatio="xMidYMid slice">
                <path
                  data-stroke="thick"
                  d=""
                  stroke="hsl(var(--kardit-home-stats-stroke-1) / 0.18)"
                  strokeWidth="32"
                  strokeLinecap="round"
                  fill="none"
                />
                <path
                  data-stroke="thin"
                  d=""
                  stroke="hsl(var(--kardit-home-stats-stroke-2) / 0.16)"
                  strokeWidth="14"
                  strokeLinecap="round"
                  fill="none"
                />
              </svg>
            </div>
            <div className="mx-auto w-[min(1440px,calc(100%-48px))]">
              <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                <div>
                  <div className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--cs-green-300)]">
                    By the numbers
                  </div>
                  <h2 className="mt-1.5 text-[clamp(1.6rem,3vw,2.4rem)] font-extrabold leading-[1.15]">
                    A platform with proof.
                  </h2>
                </div>
              </div>
            </div>
          </section>

          {/* <section className=''>
            <div className="mt-8 md:mt-12">
              <div className="grid gap-4 md:grid-cols-2">
                {featureCards.map((feature) => {
                  const Icon = feature.icon

                  return (
                    <div
                      key={feature.title}
                      className="flex items-center gap-5 rounded-[1.35rem] border border-[hsl(var(--landing-panel-border)/0.85)] bg-[linear-gradient(135deg,hsl(var(--landing-soft))_0%,hsl(var(--landing-soft-2))_100%)] px-6 py-5 shadow-[0_12px_34px_hsl(var(--landing-fg)/0.08)] md:px-7 md:py-6"
                    >
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[hsl(var(--landing-panel))] text-[hsl(var(--landing-brand))] shadow-sm">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold tracking-[-0.03em] text-[hsl(var(--landing-fg))] md:text-[1.35rem]">
                          {feature.title}
                        </h3>
                        <p className="text-sm text-[hsl(var(--landing-subtle))] md:text-base">
                          {feature.description}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="relative mx-auto mt-8 max-w-[47rem] rounded-[1.7rem] border border-[hsl(var(--landing-panel-border)/0.8)] bg-[hsl(var(--landing-panel)/0.75)] px-4 pb-6 pt-6 shadow-[0_30px_90px_hsl(var(--landing-fg)/0.12)] backdrop-blur md:mt-10 md:px-7 md:pb-8 md:pt-8">
                <div className="absolute left-1/2 top-1/2 h-44 w-44 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[hsl(var(--landing-brand-2)/0.25)] blur-3xl" />

                <div className="relative mx-auto mt-24 h-[15.5rem] max-w-[40.5rem] overflow-hidden rounded-[1.7rem] bg-[linear-gradient(145deg,hsl(var(--landing-panel-2))_0%,hsl(var(--landing-panel))_100%)] shadow-[0_28px_70px_hsl(var(--landing-fg)/0.32)] md:h-[22rem]">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_30%,hsl(var(--landing-brand-2)/0.12),transparent_18%),radial-gradient(circle_at_72%_22%,hsl(var(--landing-highlight)/0.16),transparent_22%)]" />
                  <div className="absolute inset-0 opacity-70 bg-[repeating-linear-gradient(118deg,transparent_0_12px,hsl(var(--landing-highlight)/0.10)_12px_14px,transparent_14px_26px)]" />
                  <div className="absolute inset-x-[-3%] top-[36%] h-12 -rotate-6 bg-[linear-gradient(90deg,transparent_0%,hsl(var(--landing-highlight)/0.10)_12%,hsl(var(--landing-brand-3)/0.35)_38%,hsl(var(--landing-brand-3)/0.12)_66%,transparent_100%)] blur-[1px] md:top-[38%] md:h-16" />
                  <div className="absolute inset-x-[-4%] top-[45%] h-14 rotate-[8deg] bg-[linear-gradient(90deg,transparent_0%,hsl(var(--landing-highlight)/0.10)_18%,hsl(var(--landing-highlight)/0.28)_42%,hsl(var(--landing-brand-2)/0.14)_70%,transparent_100%)] blur-[1px] md:h-20" />

                  <div className="absolute bottom-7 left-[6%] right-[6%] flex items-end gap-3 md:bottom-10 md:gap-5">
                    <div className="h-8 w-[18%] bg-[hsl(var(--landing-brand-2)/0.18)] md:h-12" />
                    <div className="h-10 w-[18%] bg-[hsl(var(--landing-brand-2)/0.18)] md:h-16" />
                    <div className="h-12 w-[24%] bg-[hsl(var(--landing-brand-2)/0.24)] md:h-20" />
                    <div className="h-20 w-[17%] bg-[hsl(var(--landing-brand-2)/0.2)] md:h-28" />
                    <div className="h-10 w-[18%] bg-[hsl(var(--landing-brand-2)/0.18)] md:h-16" />
                  </div>

                  <div className="absolute right-10 top-10 h-10 w-10 rounded-xl border border-[hsl(var(--landing-highlight)/0.35)] md:h-14 md:w-14">
                    <div className="absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[hsl(var(--destructive))]" />
                  </div>
                </div>

                <div className="absolute left-2 top-8 w-[18rem] rotate-[-6deg] rounded-[1.4rem] bg-[linear-gradient(160deg,hsl(var(--landing-subtle))_0%,hsl(var(--landing-panel-2))_56%,hsl(var(--landing-panel))_100%)] p-5 text-white shadow-[0_35px_80px_hsl(var(--landing-fg)/0.30)] md:left-0 md:top-12 md:w-[24rem] md:p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[hsl(var(--landing-brand-2)/0.18)] text-[hsl(var(--landing-brand-2))]">
                      <BadgeCheck className="h-5 w-5" />
                    </div>
                    <span className="text-lg font-bold text-[hsl(var(--landing-highlight))] md:text-[1.6rem]">
                      +14.2%
                    </span>
                  </div>

                  <div className="mt-7 space-y-3">
                    <div className="h-3.5 w-[82%] rounded-full bg-[hsl(var(--landing-panel)/0.45)]" />
                    <div className="h-3.5 w-[56%] rounded-full bg-[hsl(var(--landing-panel)/0.4)]" />
                  </div>

                  <div className="mt-7 flex items-end gap-2 md:gap-3">
                    <div className="h-7 w-[21%] rounded-sm bg-[hsl(var(--landing-brand-2)/0.45)] md:h-10" />
                    <div className="h-9 w-[22%] rounded-sm bg-[hsl(var(--landing-brand-2)/0.52)] md:h-12" />
                    <div className="h-14 w-[23%] rounded-sm bg-[hsl(var(--landing-highlight)/0.88)] md:h-16" />
                    <div className="h-10 w-[20%] rounded-sm bg-[hsl(var(--landing-brand-2)/0.58)] md:h-12" />
                  </div>
                </div>

                <div className="absolute bottom-2 right-3 w-[16.5rem] rotate-[4deg] rounded-[1.1rem] bg-[hsl(var(--landing-panel-2))] p-4 text-white shadow-[0_24px_60px_hsl(var(--landing-fg)/0.35)] md:bottom-0 md:right-0 md:w-[20rem] md:p-5">
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-full bg-[radial-gradient(circle_at_38%_28%,hsl(var(--landing-soft))_0%,hsl(var(--landing-subtle))_36%,hsl(var(--landing-panel-2))_100%)] ring-2 ring-[hsl(var(--landing-fg)/0.1)]" />
                    <div className="flex-1">
                      <p className="text-lg font-semibold tracking-[-0.02em]">
                        Identity Verified
                      </p>
                      <p className="text-sm text-[hsl(var(--landing-subtle))]">M. Sterling - 2m ago</p>
                    </div>
                  </div>

                  <div className="mt-5 flex items-end justify-between">
                    <span className="text-[1.55rem] font-bold text-[hsl(var(--landing-highlight))]">
                      $12,450.00
                    </span>
                    <div className="flex h-6 w-6 items-center justify-center rounded-full border border-[hsl(var(--landing-highlight))] text-[hsl(var(--landing-highlight))]">
                      <span className="text-xs">v</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section> */}
          <HowItWorks />
        </main>

        <Footer />
      </div>
    </div>
  )
}

export default Page
