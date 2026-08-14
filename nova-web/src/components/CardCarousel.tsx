import {
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from 'react'

const SLIDE = 330
const GAP = 18
const STEP = SLIDE + GAP
const PAD = 18 // горизонтальний padding .app-scroll — карусель робимо full-bleed

const clamp = (i: number, n: number) => Math.max(0, Math.min(n - 1, i))

/*
  Горизонтальна каруселя карток. Активна = центрована; сусідні визирають по краях.
  Свайп пальцем — нативний scroll-snap; мишею — drag-to-scroll зі снепом.
  initialIndex — на яку картку стати одразу (напр. після переказу з певної картки).
*/
export function CardCarousel({
  children,
  initialIndex = 0,
  onActiveChange,
}: {
  children: ReactNode[]
  initialIndex?: number
  onActiveChange?: (i: number) => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(initialIndex)
  const n = children.length

  const dragging = useRef(false)
  const moved = useRef(false)
  const captured = useRef(false)
  const startX = useRef(0)
  const startScroll = useRef(0)

  const setActiveSafe = (i: number) => {
    setActive((prev) => {
      if (i !== prev) onActiveChange?.(i)
      return i
    })
  }

  // початкова позиція (без анімації)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const i = clamp(initialIndex, n)
    el.scrollLeft = i * STEP
    setActiveSafe(i)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const onScroll = () => {
    const el = ref.current
    if (!el) return
    // синхронно (працює й у фонових вкладках, де rAF призупинено);
    // setActiveSafe не ре-рендерить, якщо індекс не змінився
    const i = clamp(Math.round(el.scrollLeft / STEP), n)
    setActiveSafe(i)
  }

  const goTo = (i: number) => {
    ref.current?.scrollTo({ left: clamp(i, n) * STEP, behavior: 'smooth' })
  }

  // drag мишею (тач — нативний скрол)
  const onPointerDown = (e: ReactPointerEvent) => {
    // скидаємо для БУДЬ-ЯКОГО типу вказівника, щоб тач-тап не з'їдався
    // застряглим станом від попереднього drag мишею
    moved.current = false
    captured.current = false
    if (e.pointerType !== 'mouse') return
    const el = ref.current
    if (!el) return
    dragging.current = true
    startX.current = e.clientX
    startScroll.current = el.scrollLeft
    // ВАЖЛИВО: НЕ захоплюємо вказівник тут — інакше подальший click піде в
    // каруселю, а не в грань картки, і переворот не спрацює. Захоплюємо лише
    // коли реально почався drag (див. onPointerMove).
  }
  const onPointerMove = (e: ReactPointerEvent) => {
    if (!dragging.current) return
    const el = ref.current
    if (!el) return
    const dx = e.clientX - startX.current
    if (!moved.current && Math.abs(dx) > 5) {
      moved.current = true
      // захоплюємо лише коли це справді drag (щоб продовжувати поза елементом)
      try {
        el.setPointerCapture(e.pointerId)
        captured.current = true
      } catch {
        /* ignore */
      }
    }
    if (moved.current) el.scrollLeft = startScroll.current - dx
  }
  const endDrag = (e: ReactPointerEvent) => {
    if (!dragging.current) return
    dragging.current = false
    const el = ref.current
    if (el && captured.current) {
      try {
        el.releasePointerCapture(e.pointerId)
      } catch {
        /* ignore */
      }
    }
    captured.current = false
    if (el && moved.current) {
      const i = clamp(Math.round(el.scrollLeft / STEP), n)
      el.scrollTo({ left: i * STEP, behavior: 'smooth' })
    }
  }
  // після справжнього drag — гасимо клік (щоб картка не перевернулась)
  const onClickCapture = (e: ReactMouseEvent) => {
    if (moved.current) {
      e.stopPropagation()
      moved.current = false
    }
  }

  return (
    <div style={{ marginLeft: -PAD, marginRight: -PAD }}>
      <div
        ref={ref}
        onScroll={onScroll}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onClickCapture={onClickCapture}
        className="carousel-scroll"
        style={{
          display: 'flex',
          gap: GAP,
          overflowX: 'auto',
          scrollSnapType: dragging.current ? 'none' : 'x mandatory',
          padding: `6px calc(50% - ${SLIDE / 2}px) 10px`,
          touchAction: 'pan-x',
          scrollbarWidth: 'none',
        }}
      >
        {children.map((child, i) => (
          <div key={i} style={{ scrollSnapAlign: 'center', flexShrink: 0 }}>
            {child}
          </div>
        ))}
      </div>

      {n > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 7, marginTop: 12 }}>
          {children.map((_, i) => (
            <button
              key={i}
              aria-label={`Картка ${i + 1}`}
              onClick={() => goTo(i)}
              style={{
                width: i === active ? 22 : 7,
                height: 7,
                borderRadius: 999,
                background: i === active ? 'var(--text-1)' : 'var(--s3)',
                transition: 'all 240ms cubic-bezier(.22,1,.36,1)',
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}
