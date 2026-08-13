import { ArrowDownLeft, ArrowUpRight, CreditCard, PlusCircle } from 'lucide-react'
import { useParams } from 'react-router-dom'
import { getTransaction } from '../api/transactions'
import { Amount } from '../components/Amount'
import { Button } from '../components/Button'
import { CardSkeleton } from '../components/Skeleton'
import { ErrorScreen } from '../components/StateScreen'
import { TopBar } from '../components/TopBar'
import { txDirection } from '../components/TransactionRow'
import { useAsync } from '../hooks/useAsync'
import {
  NUM_TO_CURRENCY,
  NUM_TO_TXSTATUS,
  NUM_TO_TXTYPE,
  TXSTATUS_LABEL,
  TXTYPE_LABEL,
} from '../lib/enums'
import { formatDateTime } from '../lib/format'

export function TransactionDetail() {
  const { id } = useParams()
  const txId = Number(id)
  const { data: tx, loading, error, reload } = useAsync(() => getTransaction(txId), [txId])

  return (
    <div>
      <TopBar back title="Операція" />

      {loading ? (
        <CardSkeleton />
      ) : error || !tx ? (
        <ErrorScreen
          message={error ?? 'Операцію не знайдено'}
          action={<Button variant="ghost" onClick={() => reload()}>Повторити</Button>}
        />
      ) : (
        (() => {
          const dir = txDirection(tx)
          const type = NUM_TO_TXTYPE[tx.type]
          const status = NUM_TO_TXSTATUS[tx.status]
          const Icon =
            type === 'TopUp' ? PlusCircle : type === 'Payment' ? CreditCard : dir === 'in' ? ArrowDownLeft : ArrowUpRight
          const statusColor =
            status === 'Completed' ? 'var(--positive)' : status === 'Failed' ? 'var(--negative)' : 'var(--text-2)'

          return (
            <>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                  padding: '20px 0 26px',
                }}
              >
                <span
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: 20,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'linear-gradient(160deg,#1c1c22,#131316)',
                    border: '1px solid var(--hairline)',
                    color: dir === 'in' ? 'var(--positive)' : 'var(--text-1)',
                    marginBottom: 18,
                  }}
                >
                  <Icon size={28} strokeWidth={1.8} />
                </span>
                <Amount value={tx.amount} currency={tx.currency} direction={dir} size={34} positiveColor />
                <p className="t-body text-2" style={{ marginTop: 10 }}>
                  {tx.description?.trim() || TXTYPE_LABEL[type]}
                </p>
              </div>

              <div className="surface" style={{ padding: '6px 16px' }}>
                <Row label="Тип" value={TXTYPE_LABEL[type]} />
                <div className="hairline-top" />
                <Row label="Статус" value={TXSTATUS_LABEL[status]} valueColor={statusColor} />
                <div className="hairline-top" />
                <Row label="Дата й час" value={formatDateTime(tx.createdAt)} />
                <div className="hairline-top" />
                <Row label="Валюта" value={NUM_TO_CURRENCY[tx.currency] ?? '—'} mono />
                {tx.fromAccountId != null && (
                  <>
                    <div className="hairline-top" />
                    <Row label="З рахунку" value={`№ ${String(tx.fromAccountId).padStart(8, '0')}`} mono />
                  </>
                )}
                {tx.toAccountId != null && (
                  <>
                    <div className="hairline-top" />
                    <Row label="На рахунок" value={`№ ${String(tx.toAccountId).padStart(8, '0')}`} mono />
                  </>
                )}
                <div className="hairline-top" />
                <Row label="ID операції" value={`#${tx.id}`} mono />
              </div>
            </>
          )
        })()
      )}
    </div>
  )
}

function Row({
  label,
  value,
  mono,
  valueColor,
}: {
  label: string
  value: string
  mono?: boolean
  valueColor?: string
}) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '13px 2px', gap: 12 }}>
      <span className="t-label text-2" style={{ flexShrink: 0 }}>
        {label}
      </span>
      <span
        className={mono ? 'mono num-value' : 't-label'}
        style={{ color: valueColor ?? 'var(--text-1)', fontWeight: 600, textAlign: 'right' }}
      >
        {value}
      </span>
    </div>
  )
}
