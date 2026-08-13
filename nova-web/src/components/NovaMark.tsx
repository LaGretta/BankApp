/* Liquid-metal краплина (той самий мотив, що й app icon). */
export function NovaMark({ size = 64, tile = false }: { size?: number; tile?: boolean }) {
  const drop = (
    <span
      style={{
        width: tile ? '54%' : size,
        height: tile ? '54%' : size,
        borderRadius: '20px 22px 18px 24px',
        transform: 'rotate(-8deg)',
        display: 'block',
        background:
          'radial-gradient(68% 55% at 34% 22%, #FFFFFF, #D2ECE7 38%, #93C4D2 74%, #5E828F 100%)',
        boxShadow:
          'inset 0 -6px 13px rgba(40,70,80,.5), inset 0 3px 6px rgba(255,255,255,.9), 0 6px 18px rgba(127,230,214,.4)',
      }}
    />
  )

  if (!tile) return drop

  return (
    <span
      style={{
        width: size,
        height: size,
        borderRadius: '22.5%',
        background: 'linear-gradient(155deg, #1A1B20, #08080B)',
        border: '1px solid rgba(255,255,255,.09)',
        boxShadow: '0 16px 34px rgba(0,0,0,.6), inset 0 1px 0 rgba(255,255,255,.1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {drop}
    </span>
  )
}
