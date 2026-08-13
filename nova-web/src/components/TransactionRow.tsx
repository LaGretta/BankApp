import { ArrowDownLeft, ArrowUpRight, CreditCard, PlusCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { TXTYPE_LABEL } from '../lib/enums'
import { formatDateShort } from '../lib/format'
import type { TransactionResponse } from '../lib/types'
import { Amount } from './Amount'

/**
 * Напрям для відображення. Якщо передано myAccountIds — визначаємо за
 * власністю рахунків (коректно і для вхідного transfer-by-card).
 * Інакше — евристика за типом.
 */
export function txDirection(tx: TransactionResponse, myAccountIds?: Set<number>): 'in' | 'out' {
  if (tx.type === 'TopUp') return 'in'
  if (myAccountIds && myAccountIds.size) {
    const toMine = tx.toAccountId != null && myAccountIds.has(tx.toAccountId)
    const fromMine = tx.fromAccountId != null && myAccountIds.has(tx.fromAccountId)
    if (toMine && !fromMine) return 'in'
    if (fromMine && !toMine) return 'out'
  }
  if (tx.type === 'Transfer') return tx.fromAccountId == null ? 'in' : 'out'
  return 'out'
}

export function TransactionRow({
  tx,
  myAccountIds,
}: {
  tx: TransactionResponse
  myAccountIds?: Set<number>
}) {
  const navigate = useNavigate()
  const dir = txDirection(tx, myAccountIds)
  const Icon = tx.type === 'TopUp' ? PlusCircle : tx.type === 'Payment' ? CreditCard : dir === 'in' ? ArrowDownLeft : ArrowUpRight
  const isFailed = tx.status === 'Failed'

  return (
    <button
      onClick={() => navigate(`/transactions/${tx.id}`)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        width: '100%',
        textAlign: 'left',
        padding: '12px 4px',
      }}
    >
      <span
        style={{
          width: 40,
          height: 40,
          borderRadius: 12,
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(160deg,#1a1a1f,#131316)',
          border: '1px solid var(--hairline)',
          color: dir === 'in' ? 'var(--positive)' : 'var(--text-2)',
        }}
      >
        <Icon size={19} strokeWidth={1.9} />
      </span>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          className="t-label"
          style={{
            color: 'var(--text-1)',
            fontWeight: 600,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {tx.description?.trim() || TXTYPE_LABEL[tx.type] || tx.type}
        </div>
        <div className="t-caption text-3" style={{ marginTop: 2 }}>
          {(TXTYPE_LABEL[tx.type] ?? tx.type)} · {formatDateShort(tx.createdAt)}
        </div>
      </div>

      <div style={{ textAlign: 'right', opacity: isFailed ? 0.5 : 1 }}>
        <Amount value={tx.amount} currency={tx.currency} direction={dir} size={15} positiveColor />
        {isFailed && (
          <div className="t-caption" style={{ color: 'var(--negative)', marginTop: 1 }}>
            Відхилено
          </div>
        )}
      </div>
    </button>
  )
}
