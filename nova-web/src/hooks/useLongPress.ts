import { type PointerEvent as ReactPointerEvent, useCallback, useRef } from 'react'

interface Options {
  onTap?: () => void
  onLongPress?: () => void
  delay?: number
}

/*
  Tap vs long-press на pointer events (працює і мишею, і пальцем).
  - короткий tap → onTap
  - утримання ~delay мс → onLongPress (tap уже не спрацює)
*/
export function useLongPress({ onTap, onLongPress, delay = 500 }: Options) {
  const timer = useRef<number | null>(null)
  const longFired = useRef(false)
  const startPos = useRef<{ x: number; y: number } | null>(null)

  const clearTimer = () => {
    if (timer.current !== null) {
      clearTimeout(timer.current)
      timer.current = null
    }
  }

  const onPointerDown = useCallback(
    (e: ReactPointerEvent) => {
      longFired.current = false
      startPos.current = { x: e.clientX, y: e.clientY }
      clearTimer()
      timer.current = window.setTimeout(() => {
        longFired.current = true
        onLongPress?.()
      }, delay)
    },
    [delay, onLongPress],
  )

  const onPointerUp = useCallback(() => {
    clearTimer()
    if (!longFired.current) onTap?.()
    longFired.current = false
    startPos.current = null
  }, [onTap])

  const onPointerMove = useCallback((e: ReactPointerEvent) => {
    // якщо палець/миша поповзли — це не tap і не long-press
    if (!startPos.current) return
    const dx = Math.abs(e.clientX - startPos.current.x)
    const dy = Math.abs(e.clientY - startPos.current.y)
    if (dx > 10 || dy > 10) {
      clearTimer()
      longFired.current = true // блокуємо tap після руху
    }
  }, [])

  const cancel = useCallback(() => {
    clearTimer()
    longFired.current = false
    startPos.current = null
  }, [])

  return {
    onPointerDown,
    onPointerUp,
    onPointerMove,
    onPointerLeave: cancel,
    onPointerCancel: cancel,
    onContextMenu: (e: { preventDefault: () => void }) => e.preventDefault(), // без контекстного меню на long-press
    style: { touchAction: 'none', userSelect: 'none' as const, WebkitUserSelect: 'none' as const },
  }
}
