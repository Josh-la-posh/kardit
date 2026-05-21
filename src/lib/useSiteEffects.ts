import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * Ports the general-purpose behaviours from the original assets/site.js:
 * sticky-header on scroll, reveal-on-scroll, animated swoosh, hero card
 * parallax, animated stat counters. Re-runs on every route change so newly
 * rendered marketing pages get the same treatment.
 */
export function useSiteEffects() {
  const { pathname } = useLocation()

  useEffect(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const cleanups: Array<() => void> = []

    // 1. Sticky header
    const header = document.querySelector('.site-header')
    if (header) {
      const onScroll = () => {
        if (window.scrollY > 8) header.classList.add('is-scrolled')
        else header.classList.remove('is-scrolled')
      }
      onScroll()
      window.addEventListener('scroll', onScroll, { passive: true })
      cleanups.push(() => window.removeEventListener('scroll', onScroll))
    }

    // 2. Reveal-on-scroll
    const revealEls = document.querySelectorAll('.reveal')
    if (revealEls.length && 'IntersectionObserver' in window) {
      const io = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible')
            io.unobserve(entry.target)
          }
        })
      }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' })
      revealEls.forEach((el) => io.observe(el))
      cleanups.push(() => io.disconnect())
    } else {
      revealEls.forEach((el) => el.classList.add('is-visible'))
    }

    // 3. Living swoosh
    function smoothPath(pts: number[][]) {
      if (pts.length < 2) return ''
      let d = `M ${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`
      for (let i = 0; i < pts.length - 1; i++) {
        const p0 = pts[Math.max(i - 1, 0)]
        const p1 = pts[i]
        const p2 = pts[i + 1]
        const p3 = pts[Math.min(i + 2, pts.length - 1)]
        const cp1x = p1[0] + (p2[0] - p0[0]) / 6
        const cp1y = p1[1] + (p2[1] - p0[1]) / 6
        const cp2x = p2[0] - (p3[0] - p1[0]) / 6
        const cp2y = p2[1] - (p3[1] - p1[1]) / 6
        d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)} ${cp2x.toFixed(1)} ${cp2y.toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`
      }
      return d
    }

    function initSwoosh(host: Element) {
      const svg = host.querySelector('svg.swoosh') as SVGSVGElement | null
      if (!svg) return
      const pathA = svg.querySelector('path[data-stroke="thick"]') as SVGPathElement | null
      const pathB = svg.querySelector('path[data-stroke="thin"]') as SVGPathElement | null
      if (!pathA || !pathB) return

      const VBW = 1200
      const SEGS = 56
      const archY = (x: number, baseStart: number, baseEnd: number, dip: number) => {
        const t = x / VBW
        return baseStart + (baseEnd - baseStart) * t - dip * (1 - Math.pow(2 * t - 1, 2))
      }

      const mouse = { x: 0, y: 0, tx: 0, ty: 0 }
      const onMouse = (e: MouseEvent | Touch) => {
        const r = (host as HTMLElement).getBoundingClientRect()
        const px = (e.clientX - r.left) / r.width
        const py = (e.clientY - r.top) / r.height
        mouse.tx = Math.max(-1, Math.min(1, (px - 0.5) * 2))
        mouse.ty = Math.max(-1, Math.min(1, (py - 0.5) * 2))
      }
      const onLeave = () => { mouse.tx = 0; mouse.ty = 0 }
      const onTouch = (e: TouchEvent) => { if (e.touches[0]) onMouse(e.touches[0]) }

      if (!reduceMotion) {
        host.addEventListener('mousemove', onMouse as EventListener)
        host.addEventListener('mouseleave', onLeave)
        window.addEventListener('touchmove', onTouch, { passive: true })
      }

      function frame(tThick: number, tThin: number) {
        const dipMix = 1 + mouse.y * 0.15
        const ampThick = 22 + mouse.y * -8
        const ampThin = 14 + mouse.y * -6
        const phaseShift = mouse.x * 0.18
        const ptsA: number[][] = []
        const ptsB: number[][] = []
        for (let i = 0; i <= SEGS; i++) {
          const t = i / SEGS
          const x = t * VBW
          const baseA = archY(x, 470, 250, 240 * dipMix)
          const yA = baseA
            + Math.sin(2 * Math.PI * (x / 320 + tThick + phaseShift)) * ampThick
            + Math.sin(2 * Math.PI * (x / 740 + tThick * 0.6)) * (ampThick * 0.35)
          ptsA.push([x, yA])
          const baseB = archY(x, 510, 305, 220 * dipMix)
          const yB = baseB
            + Math.sin(2 * Math.PI * (x / 260 + tThin + phaseShift * 1.4)) * ampThin
            + Math.sin(2 * Math.PI * (x / 600 + tThin * 0.8)) * (ampThin * 0.4)
          ptsB.push([x, yB])
        }
        pathA!.setAttribute('d', smoothPath(ptsA))
        pathB!.setAttribute('d', smoothPath(ptsB))
      }

      let last = performance.now()
      let phaseThick = 0
      let phaseThin = 0
      let rafId = 0
      let stopped = false

      function tick(now: number) {
        if (stopped) return
        const dt = Math.min(0.05, (now - last) / 1000)
        last = now
        mouse.x += (mouse.tx - mouse.x) * 0.06
        mouse.y += (mouse.ty - mouse.y) * 0.06
        phaseThick = (phaseThick + dt / 18) % 1
        phaseThin = (phaseThin + dt / 12) % 1
        frame(phaseThick, phaseThin)
        if (!reduceMotion) rafId = requestAnimationFrame(tick)
      }
      if (reduceMotion) frame(0, 0)
      else rafId = requestAnimationFrame(tick)

      cleanups.push(() => {
        stopped = true
        cancelAnimationFrame(rafId)
        host.removeEventListener('mousemove', onMouse as EventListener)
        host.removeEventListener('mouseleave', onLeave)
        window.removeEventListener('touchmove', onTouch)
      })
    }
    document.querySelectorAll('[data-swoosh]').forEach(initSwoosh)

    // 4. Hero card parallax
    const parallaxCard = document.querySelector('[data-parallax="hero-card"]') as HTMLElement | null
    if (parallaxCard && !reduceMotion) {
      let ticking = false
      const update = () => {
        const y = window.scrollY
        const max = 200
        const offset = Math.max(-12, Math.min(12, y / 24)) * (y > max ? 0 : 1)
        parallaxCard.style.transform = `translateY(${offset.toFixed(1)}px)`
        ticking = false
      }
      const onScroll = () => {
        if (!ticking) {
          ticking = true
          requestAnimationFrame(update)
        }
      }
      window.addEventListener('scroll', onScroll, { passive: true })
      cleanups.push(() => window.removeEventListener('scroll', onScroll))
    }

    // 5. Animated counters
    function formatNumber(n: number, opts: { format?: string }) {
      if (opts.format === 'compact' && n >= 1000) {
        const k = n / 1000
        return (k >= 100 ? k.toFixed(0) : k.toFixed(k >= 10 ? 0 : 1)) + 'K'
      }
      return Math.round(n).toLocaleString('en-US')
    }
    function animateCount(el: HTMLElement) {
      const target = parseFloat(el.dataset.count || '0')
      const dur = parseInt(el.dataset.duration || '1400', 10)
      const prefix = el.dataset.prefix || ''
      const suffix = el.dataset.suffix || ''
      const format = el.dataset.format || ''
      if (reduceMotion) {
        el.textContent = prefix + formatNumber(target, { format }) + suffix
        return
      }
      let start: number | null = null
      function step(ts: number) {
        if (start === null) start = ts
        const t = Math.min(1, (ts - start) / dur)
        const eased = 1 - Math.pow(1 - t, 3)
        const val = target * eased
        el.textContent = prefix + formatNumber(val, { format }) + suffix
        if (t < 1) requestAnimationFrame(step)
      }
      requestAnimationFrame(step)
    }
    const counters = document.querySelectorAll<HTMLElement>('.stat__num[data-count]')
    if (counters.length && 'IntersectionObserver' in window) {
      const cio = new IntersectionObserver((entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            animateCount(e.target as HTMLElement)
            cio.unobserve(e.target)
          }
        })
      }, { threshold: 0.4 })
      counters.forEach((c) => cio.observe(c))
      cleanups.push(() => cio.disconnect())
    }

    return () => {
      cleanups.forEach((c) => c())
    }
  }, [pathname])
}
