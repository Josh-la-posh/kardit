export default function HowItWorks() {
  const steps = [
    {
      number: 1,
      title: 'Onboard as an Affiliate',
      description: 'Initialize your Kardit instance as an affiliate.'
    },
    {
      number: 2,
      title: 'Select Issuing Banks',
      description: 'Add your preferred issuing banks to the platform for card issuance.'
    },
    {
      number: 3,
      title: 'Create User Cards',
      description: 'Onboard users who will receive cards and manage their card details and transactions.'
    },
    {
      number: 4,
      title: 'Start Managing',
      description: 'Manage all card operations, users, and transactions from a single dashboard.'
    }
  ]

  return (
    <section className="py-20 md:py-32 px-5 bg-gradient-to-b from-orange-50/50 to-transparent dark:from-orange-950/10 dark:to-transparent border-t border-b border-gray-200 dark:border-gray-800" id="how-it-works">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-20">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-3">
            How Kardit Works
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Four simple steps to streamline your card management
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <div key={step.number} className="relative">
              <div className="p-6 md:p-8 h-[100%]  bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-800 rounded-xl hover:border-orange-600 dark:hover:border-orange-500 hover:shadow-xl dark:hover:shadow-orange-900/20 transition-all text-center">
                <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-orange-600 text-white flex items-center justify-center font-bold text-lg md:text-xl mx-auto mb-4">
                  {step.number}
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{step.title}</h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed text-sm md:text-base">{step.description}</p>
              </div>
              {index < steps.length - 1 && (
                <div className="hidden lg:flex absolute -right-4 top-1/2 transform -translate-y-1/2 text-2xl font-bold text-orange-600 dark:text-orange-400">
                  →
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
