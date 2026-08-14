import { Car, Gift, Home, Plane, Shield, ShoppingBag, Smartphone, PiggyBank } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

/* iconKey (рядок, який шлемо/читаємо з бекенду) → lucide-іконка + підпис. */
export interface JarCategory {
  key: string
  icon: LucideIcon
  label: string
}

export const JAR_CATEGORIES: JarCategory[] = [
  { key: 'plane', icon: Plane, label: 'Подорож' },
  { key: 'smartphone', icon: Smartphone, label: 'Гаджет' },
  { key: 'car', icon: Car, label: 'Авто' },
  { key: 'shield', icon: Shield, label: 'Подушка' },
  { key: 'home', icon: Home, label: 'Дім' },
  { key: 'gift', icon: Gift, label: 'Подарунок' },
  { key: 'shopping', icon: ShoppingBag, label: 'Покупки' },
]

const MAP: Record<string, LucideIcon> = Object.fromEntries(
  JAR_CATEGORIES.map((c) => [c.key, c.icon]),
)

/** Іконка за ключем (фолбек — PiggyBank, якщо бекенд віддав невідомий ключ). */
export function jarIcon(iconKey: string): LucideIcon {
  return MAP[iconKey] ?? PiggyBank
}
