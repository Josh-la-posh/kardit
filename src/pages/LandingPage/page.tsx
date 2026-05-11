import { Moon, Sun } from 'lucide-react'
import { useTheme } from '@/components/ThemeProvider'
import { Switch } from '@/components/ui/switch'
import Footer from './components/Footer'
import HowItWorks from './components/HowItWorks'
import Hero from './components/Hero'

const Page = () => {
  const { theme, setTheme } = useTheme()
  const isDarkMode =
    theme === 'dark' ||
    (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)

  return (
    <div className="flex flex-col min-h-screen bg-card dark:bg-[hsl(var(--foreground))]">
      <main className="flex-1">
        <div className="mx-auto flex w-full max-w-6xl justify-end px-5 pt-5 md:px-8 md:pt-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-[hsl(var(--landing-panel-border))] bg-[hsl(var(--landing-panel)/0.72)] px-3 py-2 shadow-[0_10px_24px_hsl(var(--landing-fg)/0.1)] backdrop-blur">
            <Sun className="h-3.5 w-3.5 text-[hsl(var(--landing-subtle))]" />
            <Switch
              checked={isDarkMode}
              onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
              aria-label="Toggle dark mode"
            />
            <Moon className="h-3.5 w-3.5 text-[hsl(var(--landing-subtle))]" />
          </div>
        </div>
        <Hero />
        <HowItWorks />
      </main>
      <Footer />
    </div>
  )
}

export default Page

