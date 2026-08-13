// Генерація іконок Nova (liquid-metal краплина) з NOVA_HANDOFF §9.
// Майстер 1024×1024 + PWA-розміри + maskable + apple-touch. Запуск: node scripts/gen-icons.mjs
import sharp from 'sharp'
import { mkdir, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT = join(__dirname, '..', 'public', 'icons')

function svg({ maskable = false } = {}) {
  const S = 1024
  const radius = maskable ? 0 : Math.round(S * 0.225)
  // maskable — краплина менша (safe zone), rounded — більша
  const dScale = maskable ? 0.44 : 0.54
  const dw = Math.round(S * dScale)
  const dx = (S - dw) / 2
  const dy = (S - dw) / 2

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}" viewBox="0 0 ${S} ${S}">
  <defs>
    <linearGradient id="tile" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#1A1B20"/>
      <stop offset="1" stop-color="#08080B"/>
    </linearGradient>
    <radialGradient id="drop" cx="0.34" cy="0.22" r="0.85">
      <stop offset="0" stop-color="#FFFFFF"/>
      <stop offset="0.38" stop-color="#D2ECE7"/>
      <stop offset="0.74" stop-color="#93C4D2"/>
      <stop offset="1" stop-color="#5E828F"/>
    </radialGradient>
    <radialGradient id="innerShade" cx="0.5" cy="1" r="0.9">
      <stop offset="0" stop-color="#28464F" stop-opacity="0.55"/>
      <stop offset="0.6" stop-color="#28464F" stop-opacity="0"/>
    </radialGradient>
    <filter id="glow" x="-40%" y="-40%" width="180%" height="180%">
      <feGaussianBlur stdDeviation="42"/>
    </filter>
    <filter id="soft" x="-40%" y="-40%" width="180%" height="180%">
      <feGaussianBlur stdDeviation="10"/>
    </filter>
  </defs>

  <rect x="0" y="0" width="${S}" height="${S}" rx="${radius}" ry="${radius}" fill="url(#tile)"/>
  ${maskable ? '' : `<rect x="1" y="1" width="${S - 2}" height="${S - 2}" rx="${radius}" ry="${radius}" fill="none" stroke="rgba(255,255,255,0.09)" stroke-width="2"/>`}

  <g transform="rotate(-8 ${S / 2} ${S / 2})">
    <!-- turquoise glow -->
    <ellipse cx="${S / 2}" cy="${S / 2 + dw * 0.14}" rx="${dw * 0.42}" ry="${dw * 0.34}" fill="#7FE6D6" opacity="0.42" filter="url(#glow)"/>
    <!-- droplet body (asymmetric rounded = liquid) -->
    <path d="M ${dx + dw * 0.5} ${dy}
             C ${dx + dw * 0.86} ${dy}, ${dx + dw} ${dy + dw * 0.16}, ${dx + dw} ${dy + dw * 0.52}
             C ${dx + dw} ${dy + dw * 0.84}, ${dx + dw * 0.82} ${dy + dw}, ${dx + dw * 0.48} ${dy + dw}
             C ${dx + dw * 0.16} ${dy + dw}, ${dx} ${dy + dw * 0.82}, ${dx} ${dy + dw * 0.48}
             C ${dx} ${dy + dw * 0.16}, ${dx + dw * 0.16} ${dy}, ${dx + dw * 0.5} ${dy} Z"
          fill="url(#drop)"/>
    <path d="M ${dx + dw * 0.5} ${dy}
             C ${dx + dw * 0.86} ${dy}, ${dx + dw} ${dy + dw * 0.16}, ${dx + dw} ${dy + dw * 0.52}
             C ${dx + dw} ${dy + dw * 0.84}, ${dx + dw * 0.82} ${dy + dw}, ${dx + dw * 0.48} ${dy + dw}
             C ${dx + dw * 0.16} ${dy + dw}, ${dx} ${dy + dw * 0.82}, ${dx} ${dy + dw * 0.48}
             C ${dx} ${dy + dw * 0.16}, ${dx + dw * 0.16} ${dy}, ${dx + dw * 0.5} ${dy} Z"
          fill="url(#innerShade)"/>
    <!-- top highlight -->
    <ellipse cx="${dx + dw * 0.36}" cy="${dy + dw * 0.26}" rx="${dw * 0.2}" ry="${dw * 0.12}" fill="#FFFFFF" opacity="0.9" filter="url(#soft)"/>
  </g>
</svg>`
}

async function run() {
  await mkdir(OUT, { recursive: true })
  const rounded = Buffer.from(svg({ maskable: false }))
  const maskable = Buffer.from(svg({ maskable: true }))

  await writeFile(join(OUT, 'icon.svg'), svg({ maskable: false }))

  const jobs = [
    [rounded, 'icon-1024.png', 1024],
    [rounded, 'icon-512.png', 512],
    [rounded, 'icon-192.png', 192],
    [rounded, 'apple-touch-icon.png', 180],
    [maskable, 'maskable-512.png', 512],
  ]
  for (const [buf, name, size] of jobs) {
    await sharp(buf).resize(size, size).png().toFile(join(OUT, name))
    console.log('✓', name)
  }
}

run().catch((e) => {
  console.error(e)
  process.exit(1)
})
