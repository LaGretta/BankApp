import { type PointerEvent as ReactPointerEvent, useState } from 'react'

const prefersReduced =
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

export interface Tilt {
  x: number // rotateX (deg)
  y: number // rotateY (deg)
  px: number // 0..1 позиція вказівника по X (для sheen)
}

/*
  ±max° parallax від позиції вказівника над елементом. Демпфування — через CSS
  transition на трансформі (керує споживач). reduced-motion → без нахилу.
*/
export function useTilt(max = 7) {
  const [tilt, setTilt] = useState<Tilt>({ x: 0, y: 0, px: 0.5 })

  const onPointerMove = (e: ReactPointerEvent) => {
    if (prefersReduced) return
    const r = e.currentTarget.getBoundingClientRect()
    const px = (e.clientX - r.left) / r.width
    const py = (e.clientY - r.top) / r.height
    setTilt({
      x: (0.5 - py) * 2 * max, // вгору/вниз
      y: (px - 0.5) * 2 * max, // ліво/право
      px,
    })
  }

  const onPointerLeave = () => setTilt({ x: 0, y: 0, px: 0.5 })

  return { tilt, onPointerMove, onPointerLeave, reduced: prefersReduced }
}
