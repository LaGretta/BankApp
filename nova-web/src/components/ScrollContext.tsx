import { type RefObject, createContext, useContext } from 'react'

export const ScrollContext = createContext<RefObject<HTMLDivElement | null> | null>(null)

export function useScrollRef() {
  return useContext(ScrollContext)
}
