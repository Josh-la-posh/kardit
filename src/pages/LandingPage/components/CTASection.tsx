export default function CTASection() {
  return (
    <section className="py-20 md:py-32 px-5 bg-gradient-to-r from-orange-600 to-orange-500 dark:from-orange-700 dark:to-orange-600 text-white">
      <div className="max-w-3xl mx-auto text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-4 leading-tight">
          Ready to Transform Your Card Operations?
        </h2>
        <p className="text-lg md:text-xl mb-8 opacity-95 leading-relaxed">
          Join hundreds of affiliates and service providers using Kardit to streamline their card management.
        </p>
        
        <div className="flex flex-col md:flex-row gap-4 justify-center mb-12">
          <a href="https://kardit-app.vercel.app/onboarding/start" className="px-8 py-4 bg-white text-orange-600 font-semibold rounded-lg hover:opacity-90 transition-opacity" target="_blank" rel="noopener noreferrer">
            Become an Affiliate Today
          </a>
          <a href="#features" className="px-8 py-4 bg-transparent text-white font-semibold rounded-lg border-2 border-white hover:bg-white/10 transition-colors">
            Explore Features
          </a>
        </div>

        <div className="flex flex-col md:flex-row gap-8 justify-center pt-8 border-t border-white/20">
          <div className="flex items-center justify-center md:justify-start gap-3">
            <span className="text-2xl font-bold">✓</span>
            <span className="text-lg opacity-95">Quick Onboarding</span>
          </div>
          <div className="flex items-center justify-center md:justify-start gap-3">
            <span className="text-2xl font-bold">✓</span>
            <span className="text-lg opacity-95">24/7 Support</span>
          </div>
          <div className="flex items-center justify-center md:justify-start gap-3">
            <span className="text-2xl font-bold">✓</span>
            <span className="text-lg opacity-95">Seamless Integration</span>
          </div>
        </div>
      </div>
    </section>
  )
}
