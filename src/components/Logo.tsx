import { cn } from '@/lib/utils'

type LogoProps = {
  className?: string
}

export default function Logo({ className }: LogoProps) {
  return (
    <span className={cn('logo-mark', className)}>
      Kard<span className="logo-mark__i">i</span>t
    </span>
  )
}
