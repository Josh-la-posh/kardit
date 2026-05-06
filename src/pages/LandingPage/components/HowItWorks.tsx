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
      className="relative -mt-2 overflow-hidden bg-[#f6f8f7] px-5 pb-20 pt-6 md:px-8 md:pb-24 md:pt-20"
      id="how-it-works"
    >

      <div className="relative mx-auto max-w-6xl">
        <div className="mb-10 flex flex-col gap-3  md:mb-12 text-center">
          <h2 className="text-3xl font-black uppercase tracking-[-0.04em] text-emerald-800 md:text-4xl">
            How KardIT Works
          </h2>
          <p className="text-sm leading-7 text-slate-600 md:text-base text-center">
            Three simple steps to streamline your card management.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3 md:gap-5">
          {steps.map((step, index) => {
            const Icon = step.icon

            return (
              <div key={step.title} className="relative">
                <div className="h-full rounded-md border border-white/70 bg-white/80 p-6 shadow-[0_18px_55px_rgba(15,23,42,0.06)] backdrop-blur md:p-7">
                  <div className="mb-5 flex items-center justify-between">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[linear-gradient(180deg,#132238_0%,#0db14b_100%)] text-white shadow-[0_16px_32px_rgba(7,148,73,0.18)]">
                      <Icon className="h-5 w-5" />
                    </div>
                  </div>

                  <h3 className="text-xl font-bold tracking-[-0.03em] text-slate-900">
                    {step.title}
                  </h3>
                  <p className="mt-3 text-sm leading-7 text-slate-600 md:text-[15px]">
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