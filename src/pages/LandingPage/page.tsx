import React, { useState } from 'react'
import Footer from './components/Footer'
import CTASection from './components/CTASection'
import HowItWorks from './components/HowItWorks'
import Features from './components/Features'
import Hero from './components/Hero'
import Header from './components/Header'

const Page = () => {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-gray-900">
      <Header mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} />
      <main className="flex-1">
        <Hero />
        <Features />
        <HowItWorks />
        <CTASection />
      </main>
      <Footer />
    </div>
  )
}

export default Page
