import { ChevronRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { CURRENCY_NAME } from '../lib/enums'
import type { AccountResponse } from '../lib/types'
import { Amount } from './Amount'
import { FlagBadge } from './FlagBadge'

export function AccountRow({ account }: { account: AccountResponse }) {
  const navigate = useNavigate()
  const code = account.currency
  const cardCount = account.cards?.length ?? 0

  return (
    <button
      onClick={() => navigate(`/accounts/${account.id}`)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 13,
        width: '100%',
        textAlign: 'left',
        padding: '14px 4px',
      }}
    >
      <FlagBadge currency={code} size={42} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="mono num-value" style={{ color: 'var(--text-1)' }}>
          {code}
        </div>
        <div className="t-caption text-3" style={{ marginTop: 2 }}>
          {CURRENCY_NAME[code]} · {cardCount} {pluralCards(cardCount)}
        </div>
      </div>
      <Amount value={account.balance} currency={account.currency} size={17} />
      <ChevronRight size={18} strokeWidth={1.9} color="var(--text-3)" style={{ marginLeft: 4 }} />
    </button>
  )
}

function pluralCards(n: number): string {
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod10 === 1 && mod100 !== 11) return 'картка'
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return 'картки'
  return 'карток'
}
