import { useState } from 'react'

interface HeaderProps {
  mobileMenuOpen: boolean
  setMobileMenuOpen: (open: boolean) => void
}

export default function Header({ mobileMenuOpen, setMobileMenuOpen }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-sm backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-5 flex justify-between items-center h-[70px]">
        <div className="logo">
          <h1 className="text-2xl md:text-3xl font-bold text-orange-600">Kardit</h1>
        </div>
        
        <nav className={`${mobileMenuOpen ? 'flex' : 'hidden'} md:flex absolute md:relative top-[70px] md:top-0 left-0 right-0 md:left-auto md:right-auto bg-white dark:bg-gray-900 md:bg-transparent md:dark:bg-transparent border-b md:border-0 border-gray-200 dark:border-gray-800 flex-col md:flex-row gap-8 p-4 md:p-0`}>
          <ul className="flex flex-col md:flex-row gap-8 list-none m-0 p-0">
            <li><a href="#features" className="text-gray-600 dark:text-gray-300 font-semibold hover:text-orange-600 transition-colors">Features</a></li>
            <li><a href="#how-it-works" className="text-gray-600 dark:text-gray-300 font-semibold hover:text-orange-600 transition-colors">How It Works</a></li>
            <li><a href="#about" className="text-gray-600 dark:text-gray-300 font-semibold hover:text-orange-600 transition-colors">About</a></li>
          </ul>
        </nav>

        <div className="flex items-center gap-4">
          <a href="https://kardit-app.vercel.app/onboarding/start" className="hidden md:inline-block px-6 py-3 bg-orange-600 text-white font-semibold rounded-lg hover:opacity-90 transition-opacity" target="_blank" rel="noopener noreferrer">
            Become an Affiliate
          </a>
          <button 
            className="md:hidden flex flex-col gap-1.5 bg-none border-none p-2 cursor-pointer"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            <span className="w-6 h-0.5 bg-gray-900 dark:bg-white rounded transition-all"></span>
            <span className="w-6 h-0.5 bg-gray-900 dark:bg-white rounded transition-all"></span>
            <span className="w-6 h-0.5 bg-gray-900 dark:bg-white rounded transition-all"></span>
          </button>
        </div>
      </div>
    </header>
  )
}
