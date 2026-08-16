import { RatesWidget } from '../components/RatesWidget'
import { TopBar } from '../components/TopBar'

/** Окремий екран курсів (відкривається з «Ще») — переюзає наявний RatesWidget
 *  (у нього вже є власний заголовок «Курси валют» + мітка «оновлено»). */
export function Rates() {
  return (
    <div>
      <TopBar back />
      <div style={{ marginTop: -12 }}>
        <RatesWidget />
      </div>
    </div>
  )
}
