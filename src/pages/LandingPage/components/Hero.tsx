export default function Hero() {
  return (
    <section className="py-5 px-5 bg-gradient-to-br from-orange-50 to-transparent dark:from-orange-950/20 dark:to-transparent border-b border-gray-200 dark:border-gray-800">
      <div className="logo">
        <h1 className="text-2xl md:text-3xl font-bold text-orange-600">Kardit</h1>
      </div>
      <div className="py-14 md:py-24 max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-20 items-center">
        <div className="flex flex-col gap-6">
          <h2 className="text-4xl md:text-5xl font-bold leading-tight text-gray-900 dark:text-white">
            Multi-Tenant Card Management System
          </h2>
          <p className="text-lg md:text-xl text-gray-600 dark:text-gray-400 leading-relaxed">
            Streamline your card operations with a powerful, flexible platform that connects service providers, issuing banks, and affiliates seamlessly.
          </p>
          <div className="flex flex-col md:flex-row gap-4">
            <a href="https://kardit-app.vercel.app/onboarding/start" className="px-8 py-4 bg-orange-600 text-white font-semibold rounded-lg hover:opacity-90 transition-opacity text-center" target="_blank" rel="noopener noreferrer">
              Get Started as an Affiliate
            </a>
            <a href="https://kardit-app.vercel.app/login" className="px-8 py-4 bg-transparent text-orange-600 dark:text-orange-400 font-semibold rounded-lg border-2 border-orange-600 dark:border-orange-400 hover:bg-orange-50 dark:hover:bg-orange-950/20 transition-colors text-center">
              Login
            </a>
          </div>
        </div>
        <div className="flex justify-center items-center h-80 md:h-96">
          <div className="relative w-72 h-80">
            <div className="absolute w-60 h-64 rounded-2xl bg-gradient-to-br from-orange-600 to-orange-500 shadow-xl border border-white/20 z-30"></div>
            <div className="absolute w-60 h-64 rounded-2xl bg-gradient-to-br from-orange-600 to-orange-500 shadow-lg border border-white/20 z-20 translate-x-5 translate-y-5 opacity-80"></div>
            <div className="absolute w-60 h-64 rounded-2xl bg-gradient-to-br from-orange-600 to-orange-500 shadow-md border border-white/20 z-10 translate-x-10 translate-y-10 opacity-60"></div>
          </div>
        </div>
      </div>
    </section>
  )
}
