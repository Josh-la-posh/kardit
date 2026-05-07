import { Building2, CreditCard, Layers3 } from 'lucide-react'

const steps = [
  {
    icon: Building2,
    title: 'Onboard as an Affiliate',
    description: 'Initialize your Kardit instance and configure your tenant profile.',
  },
  {
    icon: CreditCard,
    title: 'Get Approved',
    description: 'Connect with banks and service providers to unlock secure issuance.',
  },
  {
    icon: Layers3,
    title: 'Start Managing',
    description: 'Run cards, users, and transactions from one streamlined workspace.',
  },
]

export default function HowItWorks() {
  return (
    <section
      className="relative -mt-2 overflow-hidden bg-[hsl(var(--landing-bg))] px-5 pb-20 pt-6 md:px-8 md:pb-24 md:pt-20"
      id="how-it-works"
    >

      <div className="relative mx-auto max-w-6xl">
        <div className="mb-10 flex flex-col gap-3  md:mb-12 text-center">
          <h2 className="text-3xl font-black uppercase tracking-[-0.04em] text-[hsl(var(--landing-brand))] md:text-4xl">
            How KardIT Works
          </h2>
          <p className="text-sm leading-7 text-muted-foreground md:text-base text-center">
            Three simple steps to streamline your card management.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3 md:gap-5">
          {steps.map((step, index) => {
            const Icon = step.icon

            return (
              <div key={step.title} className="relative">
                <div className="h-full rounded-md border border-[hsl(var(--landing-panel-border)/0.7)] bg-card/80 p-6 shadow-[0_18px_55px_hsl(var(--landing-fg)/0.08)] backdrop-blur md:p-7">
                  <div className="mb-5 flex items-center justify-between">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[linear-gradient(180deg,hsl(var(--landing-panel-2))_0%,hsl(var(--landing-brand))_100%)] text-white shadow-[0_16px_32px_hsl(var(--landing-brand)/0.22)]">
                      <Icon className="h-5 w-5" />
                    </div>
                  </div>

                  <h3 className="text-xl font-bold tracking-[-0.03em] text-foreground">
                    {step.title}
                  </h3>
                  <p className="mt-3 text-sm leading-7 text-muted-foreground md:text-[15px]">
                    {step.description}
                  </p>
                </div>

              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

