import { type ReactNode, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { BottomNav } from './BottomNav'
import { ScrollContext } from './ScrollContext'

/*
  App-shell: тільки екрани самого застосунку. Жодного device chrome
  (немає статус-бару, батареї, рамки телефону) — це малює реальна ОС.
*/
export function AppLayout({ children, nav = true }: { children: ReactNode; nav?: boolean }) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const location = useLocation()

  return (
    <ScrollContext.Provider value={scrollRef}>
      <div className="app-frame">
        <div
          ref={scrollRef}
          className={`app-scroll ${nav ? '' : 'no-nav'}`}
          key={location.pathname}
        >
          <div className="screen-enter">{children}</div>
        </div>
        {nav && <BottomNav />}
      </div>
    </ScrollContext.Provider>
  )
}
