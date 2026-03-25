export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-gray-900 text-gray-300 py-16 md:py-20 px-5 border-t border-gray-800">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 md:gap-8 mb-12">
          <div>
            <h3 className="text-xl font-bold text-white mb-4">Kardit</h3>
            <p className="text-gray-400 leading-relaxed">
              Multi-tenant card management system for the modern era.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-white mb-4">Product</h4>
            <ul className="space-y-3">
              <li><a href="#features" className="text-gray-400 hover:text-white transition-colors">Features</a></li>
              <li><a href="#how-it-works" className="text-gray-400 hover:text-white transition-colors">How It Works</a></li>
              <li><a href="https://kardit-app.vercel.app/onboarding/start" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">Affiliate Program</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-white mb-4">Company</h4>
            <ul className="space-y-3">
              <li><a href="#about" className="text-gray-400 hover:text-white transition-colors">About Us</a></li>
              <li><a href="#contact" className="text-gray-400 hover:text-white transition-colors">Contact</a></li>
              <li><a href="#privacy" className="text-gray-400 hover:text-white transition-colors">Privacy Policy</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-white mb-4">Resources</h4>
            <ul className="space-y-3">
              <li><a href="#docs" className="text-gray-400 hover:text-white transition-colors">Documentation</a></li>
              <li><a href="#blog" className="text-gray-400 hover:text-white transition-colors">Blog</a></li>
              <li><a href="#status" className="text-gray-400 hover:text-white transition-colors">Status</a></li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-center pt-8 border-t border-gray-800 gap-4">
          <p className="text-gray-500 text-sm">&copy; {currentYear} Kardit. All rights reserved.</p>
          <div className="flex gap-8">
            <a href="#terms" className="text-gray-500 hover:text-gray-300 transition-colors text-sm">Terms of Service</a>
            <a href="#privacy" className="text-gray-500 hover:text-gray-300 transition-colors text-sm">Privacy Policy</a>
            <a href="#cookies" className="text-gray-500 hover:text-gray-300 transition-colors text-sm">Cookie Policy</a>
          </div>
        </div>
      </div>
    </footer>
  )
}
