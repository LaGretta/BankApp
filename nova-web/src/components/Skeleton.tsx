import type { CSSProperties } from 'react'

export function Skeleton({
  width,
  height = 14,
  radius = 8,
  style,
}: {
  width?: number | string
  height?: number | string
  radius?: number
  style?: CSSProperties
}) {
  return (
    <span
      className="skeleton"
      style={{ display: 'block', width: width ?? '100%', height, borderRadius: radius, ...style }}
    />
  )
}

/* Скелет рядка списку (аватар + два рядки тексту + сума). */
export function RowSkeleton() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 2px' }}>
      <Skeleton width={38} height={38} radius={19} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <Skeleton width="55%" height={13} />
        <Skeleton width="35%" height={11} />
      </div>
      <Skeleton width={64} height={16} />
    </div>
  )
}

export function CardSkeleton() {
  return <Skeleton height={210} radius={24} style={{ marginBottom: 16 }} />
}
