import { useEffect, useRef, useState } from 'react'

const prefersReduced =
  typeof window !== 'undefined' &&
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

/* Count-up 0 → value, 1500ms, easeOutCubic (motion-спека). */
export function useCountUp(value: number, duration = 1500): number {
  const [display, setDisplay] = useState(prefersReduced ? value : 0)
  const raf = useRef<number | undefined>(undefined)
  const startVal = useRef(0)

  useEffect(() => {
    if (prefersReduced) {
      setDisplay(value)
      return
    }
    const from = startVal.current
    let startTs: number | null = null

    const tick = (ts: number) => {
      if (startTs === null) startTs = ts
      const t = Math.min(1, (ts - startTs) / duration)
      const eased = 1 - Math.pow(1 - t, 3) // easeOutCubic
      setDisplay(from + (value - from) * eased)
      if (t < 1) {
        raf.current = requestAnimationFrame(tick)
      } else {
        startVal.current = value
      }
    }
    raf.current = requestAnimationFrame(tick)

    // страхувальний снеп: якщо rAF призупинено (вкладка не активна) — гарантовано
    // показати фінальне значення (setTimeout працює й у фоні, throttled)
    const safety = setTimeout(() => {
      setDisplay(value)
      startVal.current = value
    }, duration + 120)

    return () => {
      if (raf.current) cancelAnimationFrame(raf.current)
      clearTimeout(safety)
    }
  }, [value, duration])

  return display
}
