import React, { useState } from 'react'
import HowItWorks from './components/HowItWorks'
import Hero from './components/Hero'

const Page = () => {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-gray-900">
      <main className="flex-1">
        <Hero />
        <HowItWorks />
      </main>
    </div>
  )
}

export default Page
