import Footer from './components/Footer'
import HowItWorks from './components/HowItWorks'
import Hero from './components/Hero'

const Page = () => {
  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-gray-900">
      <main className="flex-1">
        <Hero />
        <HowItWorks />
      </main>
      <Footer />
    </div>
  )
}

export default Page
