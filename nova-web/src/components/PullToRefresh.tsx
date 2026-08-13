import { type ReactNode, useEffect, useRef, useState } from 'react'
import { Nova, type PullPhase } from './Nova'
import { useScrollRef } from './ScrollContext'

const THRESHOLD = 68
const MAX = 120

type Phase = 'idle' | 'pull' | 'refreshing' | 'complete'

/*
  Pull-to-refresh з фірмовою послідовністю Nova:
  pull-stretch → release spring → refreshing → complete.
  Працює і пальцем (touch), і мишею (pointer) — щоб можна було перевірити на десктопі.
*/
export function PullToRefresh({
  onRefresh,
  children,
}: {
  onRefresh: () => Promise<void>
  children: ReactNode
}) {
  const scrollRef = useScrollRef()
  const [dist, setDist] = useState(0)
  const [phase, setPhase] = useState<Phase>('idle')
  const startY = useRef<number | null>(null)
  const active = useRef(false)

  useEffect(() => {
    const el = scrollRef?.current
    if (!el) return

    const canStart = () => el.scrollTop <= 0 && phase === 'idle'

    const onDown = (e: PointerEvent) => {
      if (!canStart()) return
      startY.current = e.clientY
      active.current = true
    }
    const onMove = (e: PointerEvent) => {
      if (!active.current || startY.current === null) return
      const dy = e.clientY - startY.current
      if (dy <= 0) {
        setDist(0)
        if (phase !== 'idle') setPhase('idle')
        return
      }
      if (el.scrollTop > 0) {
        cancel()
        return
      }
      const resisted = Math.min(MAX, dy * 0.55)
      setDist(resisted)
      setPhase('pull')
    }
    const cancel = () => {
      active.current = false
      startY.current = null
      setDist(0)
      setPhase('idle')
    }
    const onUp = async () => {
      if (!active.current) return
      active.current = false
      startY.current = null
      if (dist >= THRESHOLD && phase === 'pull') {
        setPhase('refreshing')
        setDist(56)
        try {
          await onRefresh()
        } finally {
          setPhase('complete')
          setTimeout(() => {
            setDist(0)
            setPhase('idle')
          }, 600)
        }
      } else {
        setDist(0)
        setPhase('idle')
      }
    }

    el.addEventListener('pointerdown', onDown)
    el.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    return () => {
      el.removeEventListener('pointerdown', onDown)
      el.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
  }, [scrollRef, dist, phase, onRefresh])

  const novaPhase: PullPhase =
    phase === 'refreshing' ? 'refreshing' : phase === 'complete' ? 'complete' : 'pull'
  const showNova = phase !== 'idle' || dist > 0
  const springy = phase !== 'pull' // під час активного тягнення слідуємо за пальцем без transition

  return (
    <div>
      <div
        style={{
          height: dist,
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'center',
          transition: springy ? 'height 300ms cubic-bezier(.22,1,.36,1)' : 'none',
        }}
      >
        {showNova && (
          <div style={{ paddingBottom: 6, opacity: Math.min(1, dist / 44) }}>
            <Nova
              state="pull"
              size={44}
              pullProgress={dist / THRESHOLD}
              pullPhase={novaPhase}
            />
          </div>
        )}
      </div>
      {children}
    </div>
  )
}
