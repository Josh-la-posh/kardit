import {
  BadgeCheck,
  BadgeDollarSign,
  CircleDot,
  Compass,
  Fingerprint,
  Lock,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react'

const appBaseUrl =
  ((import.meta as any).env?.VITE_APP_BASE_URL as string | undefined)?.replace(
    /\/$/,
    ''
  ) || ''
const authUrl = appBaseUrl ? `${appBaseUrl}/login` : '/login'
const onboardingUrl = appBaseUrl ? `${appBaseUrl}/onboarding/start` : '/onboarding/start'
const featureCards = [
  {
    icon: Lock,
    title: 'Bank-level security',
    description: '256-bit AES encryption',
  },
  {
    icon: TrendingUp,
    title: 'Real-time Insights',
    description: 'AI-driven forecasting',
  },
]

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-[hsl(var(--landing-bg))] px-5 pb-10 pt-5 text-[hsl(var(--landing-fg))] md:px-8 md:pb-14 md:pt-6">
      <div className="absolute inset-x-0 top-0 h-[28rem] bg-[radial-gradient(circle_at_top_left,_hsl(var(--landing-brand)/0.16),_transparent_42%),radial-gradient(circle_at_top_right,_hsl(var(--landing-fg)/0.1),_transparent_28%)]" />

      <div className="relative mx-auto max-w-6xl">
        <header className="flex items-center justify-between gap-4 py-2">
          <a
            href="/"
            className="text-xl font-extrabold uppercase tracking-tight text-[hsl(var(--landing-brand))] md:text-2xl"
          >
            Kardit
          </a>

          <div className=" items-center gap-5 md:flex">
            <a
              href={authUrl}
              className="rounded-2xl bg-[linear-gradient(135deg,hsl(var(--landing-panel-2))_0%,hsl(var(--landing-brand))_55%,hsl(var(--landing-brand-2))_100%)] px-7 py-3.5 text-sm font-semibold text-white shadow-[0_16px_40px_hsl(var(--landing-brand)/0.3)] transition-transform duration-300 hover:-translate-y-0.5 md:px-9 md:text-base"
              target="_blank"
              rel="noopener noreferrer"
            >
              Sign In
            </a>
          </div>
        </header>

        <div className="grid items-center gap-10 pb-4 pt-10 lg:grid-cols-[1.03fr_0.97fr] lg:gap-8 lg:pt-14">
          <div className="max-w-2xl">
            <div className="mb-6 inline-flex items-center gap-3 rounded-full bg-[hsl(var(--landing-panel)/0.85)] px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.24em] text-[hsl(var(--landing-subtle))] shadow-[0_10px_30px_hsl(var(--landing-fg)/0.08)] backdrop-blur md:text-sm">
              <ShieldCheck className="h-3.5 w-3.5 text-[hsl(var(--landing-brand))]" />
              Chamsswitch
            </div>

            <h1 className="max-w-3xl text-[2.7rem] font-black leading-[0.96] tracking-[-0.045em] text-[hsl(var(--landing-fg))] sm:text-5xl md:text-[4.1rem]">
              <span className="bg-[linear-gradient(90deg,hsl(var(--landing-panel-2))_0%,hsl(var(--landing-brand))_42%,hsl(var(--landing-brand-2))_100%)] bg-clip-text text-transparent">
                Multi-Tenant Card
              </span>
              <br />
              <span className="bg-[linear-gradient(90deg,hsl(var(--landing-brand-2))_0%,hsl(var(--landing-brand-3))_48%,hsl(var(--landing-brand))_100%)] bg-clip-text text-transparent">
                Management
              </span>
              <br />
              <span className="bg-[linear-gradient(90deg,hsl(var(--landing-brand-3))_0%,hsl(var(--landing-brand-2))_40%,hsl(var(--landing-brand))_100%)] bg-clip-text text-transparent">
                System
              </span>
            </h1>

            <p className="mt-7 max-w-lg text-base leading-8 text-[hsl(var(--landing-subtle))] md:text-lg md:leading-8">
              Streamline your card operations with a powerful, flexible platform
              that connects service providers, issuing banks, and affiliates
              seamlessly.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row ">
              <a
                href={onboardingUrl}
                className="inline-flex min-w-[12.5rem] items-center justify-center rounded-2xl bg-[linear-gradient(135deg,hsl(var(--landing-panel-2))_0%,hsl(var(--landing-brand))_45%,hsl(var(--landing-brand-2))_100%)] px-7 py-4 text-base font-semibold text-white shadow-[0_20px_50px_hsl(var(--landing-brand)/0.3)] transition-transform duration-300 hover:-translate-y-0.5"
                target="_blank"
                rel="noopener noreferrer"
              >
                Get Started
              </a>
              <a
                href={authUrl}
                className="inline-flex min-w-[12.5rem] items-center justify-center rounded-2xl border border-[hsl(var(--landing-panel-border))] bg-[linear-gradient(135deg,hsl(var(--landing-soft))_0%,hsl(var(--landing-soft-2))_100%)] px-7 py-4 text-base font-semibold text-[hsl(var(--landing-fg))] shadow-[0_16px_38px_hsl(var(--landing-fg)/0.08)] transition-transform duration-300 hover:-translate-y-0.5"
                target="_blank"
                rel="noopener noreferrer"
              >
                Learn More
              </a>
            </div>
          </div>

          <div className="relative">
            <div className="absolute left-6 top-10 h-24 w-24 rounded-full bg-[hsl(var(--landing-brand-2)/0.35)] blur-3xl" />
            <div className="absolute right-8 top-24 h-28 w-28 rounded-full bg-[hsl(var(--landing-subtle)/0.25)] blur-3xl" />

            <div className="relative mx-auto max-w-[32rem] rounded-[2rem] border border-[hsl(var(--landing-panel-border)/0.8)] bg-[hsl(var(--landing-panel)/0.86)] p-4 shadow-[0_28px_70px_hsl(var(--landing-fg)/0.14)] backdrop-blur xl:p-5">
              <div className="mb-5 flex items-start justify-between gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[linear-gradient(180deg,hsl(var(--landing-panel-2))_0%,hsl(var(--landing-brand))_100%)] shadow-[0_16px_40px_hsl(var(--landing-brand)/0.22)]">
                  <Compass className="h-6 w-6 text-white" />
                </div>

                <div className="pt-1 text-right">
                  <p className="text-xs uppercase tracking-[0.28em] text-[hsl(var(--landing-subtle))]">
                    Portfolio Velocity
                  </p>
                  <div className="mt-2 inline-flex items-center gap-2 text-3xl font-black tracking-[-0.04em] text-[hsl(var(--landing-fg))] md:text-[2rem]">
                    <TrendingUp className="h-6 w-6 text-[hsl(var(--landing-brand))]" />
                    +12.84%
                  </div>
                </div>
              </div>

              <div className="relative overflow-hidden rounded-[1.7rem] bg-[linear-gradient(145deg,hsl(var(--landing-panel-2))_0%,hsl(var(--landing-panel-2)/0.85)_48%,hsl(var(--landing-panel))_100%)] p-5 text-white shadow-inner">
                <div className="absolute -left-10 bottom-0 h-36 w-36 rounded-full border-[16px] border-[hsl(var(--landing-brand-2)/0.15)]" />
                <div className="absolute right-[-3.5rem] top-8 h-40 w-40 rounded-full border-[18px] border-[hsl(var(--landing-highlight)/0.12)]" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_25%,hsl(var(--landing-highlight)/0.18),transparent_18%),radial-gradient(circle_at_78%_22%,hsl(var(--landing-brand-2)/0.24),transparent_20%),radial-gradient(circle_at_68%_72%,hsl(var(--landing-fg)/0.16),transparent_22%)]" />

                <div className="relative grid gap-4 md:grid-cols-[1.1fr_0.9fr]">
                  <div className="space-y-4">
                    <div className="max-w-[9rem] rounded-3xl border border-[hsl(var(--landing-fg)/0.15)] bg-card/10 p-3.5 backdrop-blur">
                      <div className="mb-3 inline-flex rounded-2xl bg-[hsl(var(--landing-brand-2)/0.2)] p-2.5 text-[hsl(var(--landing-highlight))]">
                        <Fingerprint className="h-6 w-6" />
                      </div>
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[hsl(var(--landing-soft-2))]">
                        Secure
                      </p>
                      <p className="text-xs text-[hsl(var(--landing-soft-2))]">Authentication</p>
                    </div>

                    <div className="flex items-center gap-3 pl-1 text-xs text-[hsl(var(--landing-highlight)/0.9)] md:text-sm">
                      <CircleDot className="h-3.5 w-3.5" />
                      Encrypted issuer routing
                    </div>

                    <div className="flex items-end gap-3 pt-3">
                      <div className="h-12 w-9 rounded-xl bg-[hsl(var(--landing-brand-2)/0.2)] shadow-[0_0_25px_hsl(var(--landing-brand-2)/0.18)]" />
                      <div className="h-16 w-12 rounded-xl bg-[hsl(var(--landing-brand-2)/0.35)] shadow-[0_0_25px_hsl(var(--landing-brand-2)/0.2)]" />
                      <div className="h-24 w-14 rounded-2xl bg-card/65 shadow-[0_0_30px_hsl(var(--landing-fg)/0.2)]" />
                      <div className="h-14 w-10 rounded-xl bg-[hsl(var(--landing-brand-2)/0.25)] shadow-[0_0_25px_hsl(var(--landing-brand-2)/0.18)]" />
                    </div>
                  </div>

                  <div className="space-y-4 pt-1">
                    <div className="flex justify-end">
                      <div className="rounded-3xl border border-[hsl(var(--landing-fg)/0.15)] bg-card/10 px-4 py-3 text-right backdrop-blur">
                        <BadgeDollarSign className="ml-auto h-5 w-5 text-[hsl(var(--landing-highlight))]" />
                        <p className="mt-2 text-xs font-semibold uppercase tracking-[0.18em] text-[hsl(var(--landing-soft-2))]">
                          Digital Payments
                        </p>
                      </div>
                    </div>

                    <div className="rounded-[1.5rem] border border-[hsl(var(--landing-fg)/0.15)] bg-card/10 p-4 backdrop-blur">
                      <div className="mb-3 flex items-center justify-between">
                        <span className="text-xs uppercase tracking-[0.2em] text-[hsl(var(--landing-soft-2))]">
                          Smart Analytics
                        </span>
                        <span className="rounded-full bg-[hsl(var(--landing-brand-2)/0.2)] px-2.5 py-1 text-xs font-semibold text-[hsl(var(--landing-highlight))]">
                          Live
                        </span>
                      </div>
                      <div className="flex items-end gap-2">
                        <div className="h-8 flex-1 rounded-full bg-card/10" />
                        <div className="h-12 flex-1 rounded-full bg-card/15" />
                        <div className="h-20 flex-1 rounded-full bg-[hsl(var(--landing-brand-2)/0.5)]" />
                        <div className="h-11 flex-1 rounded-full bg-card/15" />
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <div className="flex items-center gap-3 rounded-3xl border border-[hsl(var(--landing-fg)/0.15)] bg-card/10 px-4 py-3 backdrop-blur">
                        <div className="rounded-2xl bg-[hsl(var(--landing-brand-2)/0.2)] p-2.5">
                          <ShieldCheck className="h-4.5 w-4.5 text-[hsl(var(--landing-highlight))]" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-white">
                            Money Management
                          </p>
                          <p className="text-xs text-[hsl(var(--landing-soft-2))]">
                            Policy-driven controls
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 h-2 overflow-hidden rounded-full bg-[hsl(var(--landing-soft-2))]">
                <div className="h-full w-[66%] rounded-full bg-[linear-gradient(90deg,hsl(var(--landing-brand-3))_0%,hsl(var(--landing-brand))_100%)]" />
              </div>

              <div className="mt-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  {['JS', 'MB', '+4'].map((item, index) => (
                    <span
                      key={item}
                      className={`inline-flex h-9 w-9 items-center justify-center rounded-2xl text-xs font-bold md:h-10 md:w-10 md:text-sm ${
                        index === 2
                          ? 'bg-[hsl(var(--landing-brand))] text-white'
                          : 'bg-[hsl(var(--landing-soft-2))] text-[hsl(var(--landing-fg))]'
                      }`}
                    >
                      {item}
                    </span>
                  ))}
                </div>
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-[hsl(var(--landing-subtle))] md:text-sm">
                  Live Secure Nodes
                </p>
              </div>
            </div>
          </div>
        </div>

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
      </div>
    </section>
  )
}



