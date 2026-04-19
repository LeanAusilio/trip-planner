import { differenceInDays, startOfDay } from 'date-fns'
import { useMemo, useState, useEffect } from 'react'
import { ACTIVITY_CONFIG, ActivityIcon, BedIcon, TRANSPORT_CONFIG, TransportIcon } from './Icons'
import { Flag } from './CitySearch'

export const CURRENCIES = [
  { code: 'USD', symbol: '$',    name: 'US Dollar' },
  { code: 'EUR', symbol: '€',    name: 'Euro' },
  { code: 'GBP', symbol: '£',    name: 'British Pound' },
  { code: 'JPY', symbol: '¥',    name: 'Japanese Yen' },
  { code: 'CAD', symbol: 'C$',   name: 'Canadian Dollar' },
  { code: 'AUD', symbol: 'A$',   name: 'Australian Dollar' },
  { code: 'CHF', symbol: 'Fr',   name: 'Swiss Franc' },
  { code: 'CNY', symbol: '¥',    name: 'Chinese Yuan' },
  { code: 'INR', symbol: '₹',    name: 'Indian Rupee' },
  { code: 'MXN', symbol: '$',    name: 'Mexican Peso' },
  { code: 'BRL', symbol: 'R$',   name: 'Brazilian Real' },
  { code: 'SGD', symbol: 'S$',   name: 'Singapore Dollar' },
  { code: 'HKD', symbol: 'HK$',  name: 'Hong Kong Dollar' },
  { code: 'NZD', symbol: 'NZ$',  name: 'New Zealand Dollar' },
  { code: 'SEK', symbol: 'kr',   name: 'Swedish Krona' },
  { code: 'NOK', symbol: 'kr',   name: 'Norwegian Krone' },
  { code: 'DKK', symbol: 'kr',   name: 'Danish Krone' },
  { code: 'KRW', symbol: '₩',    name: 'South Korean Won' },
  { code: 'THB', symbol: '฿',    name: 'Thai Baht' },
  { code: 'ZAR', symbol: 'R',    name: 'South African Rand' },
  { code: 'TRY', symbol: '₺',    name: 'Turkish Lira' },
  { code: 'PLN', symbol: 'zł',   name: 'Polish Zloty' },
  { code: 'AED', symbol: 'د.إ',  name: 'UAE Dirham' },
]

const NO_DECIMALS = new Set(['JPY', 'KRW', 'IDR'])

function getCurrencySymbol(code) {
  return CURRENCIES.find((c) => c.code === code)?.symbol ?? code
}

function fmt(n, symbol, noDecimals) {
  const digits = noDecimals ? 0 : 2
  return symbol + n.toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits })
}

function Bar({ value, max, color }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0
  return (
    <div className="w-full h-1.5 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${pct}%`, background: color }}
      />
    </div>
  )
}

function CurrencySelect({ value, onChange, label }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-xs text-gray-500 dark:text-gray-400">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="text-xs rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 py-0.5 pl-1.5 pr-5 appearance-none cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-400"
      >
        {CURRENCIES.map((c) => (
          <option key={c.code} value={c.code}>{c.code} — {c.name}</option>
        ))}
      </select>
    </div>
  )
}

export default function SummaryDashboard({ destinations, hotels, activities, transports, currency = 'USD', onCurrencyChange }) {
  const hasBudget = (
    destinations.some((d) => d.budget != null) ||
    hotels.some((h) => h.budget != null) ||
    activities.some((a) => a.budget != null) ||
    transports.some((t) => t.budget != null)
  )

  const [displayCurrency, setDisplayCurrency] = useState(currency)
  const [rate, setRate] = useState(1)
  const [loadingRate, setLoadingRate] = useState(false)

  useEffect(() => { setDisplayCurrency(currency) }, [currency])

  useEffect(() => {
    if (displayCurrency === currency) { setRate(1); return }
    setLoadingRate(true)
    fetch(`https://api.frankfurter.app/latest?from=${currency}&to=${displayCurrency}`)
      .then((r) => r.json())
      .then((data) => setRate(data.rates?.[displayCurrency] ?? 1))
      .catch(() => setRate(1))
      .finally(() => setLoadingRate(false))
  }, [currency, displayCurrency])

  if (!hasBudget || destinations.length === 0) return null

  const symbol    = getCurrencySymbol(displayCurrency)
  const noDecimals = NO_DECIMALS.has(displayCurrency)
  const convert   = (n) => n * rate
  const f         = (n) => fmt(convert(n), symbol, noDecimals)

  // ── Per-destination breakdown ──────────────────────────────────────────────
  const destRows = useMemo(() => destinations.map((dest) => {
    const nights = differenceInDays(
      startOfDay(new Date(dest.departure)),
      startOfDay(new Date(dest.arrival))
    )
    const destBudget = dest.budget ?? 0
    const hotelCost  = hotels
      .filter((h) => {
        const hIn  = startOfDay(new Date(h.checkIn))
        const hOut = startOfDay(new Date(h.checkOut))
        const arr  = startOfDay(new Date(dest.arrival))
        const dep  = startOfDay(new Date(dest.departure))
        return hIn < dep && hOut > arr
      })
      .reduce((s, h) => s + (h.budget ?? 0), 0)

    const actCost = activities
      .filter((a) => a.destinationId === dest.id)
      .reduce((s, a) => s + (a.budget ?? 0), 0)

    const total  = destBudget + hotelCost + actCost
    const perDay = nights > 0 ? total / nights : total

    return { dest, nights, destBudget, hotelCost, actCost, total, perDay }
  }), [destinations, hotels, activities])

  const transportTotal = transports.reduce((s, t) => s + (t.budget ?? 0), 0)
  const grandTotal     = destRows.reduce((s, r) => s + r.total, 0) + transportTotal
  const maxDestTotal   = Math.max(...destRows.map((r) => r.total), 0)

  // ── Category totals ────────────────────────────────────────────────────────
  const categoryTotals = {
    destinations: destinations.reduce((s, d) => s + (d.budget ?? 0), 0),
    hotels:       hotels.reduce((s, h) => s + (h.budget ?? 0), 0),
    activities:   activities.reduce((s, a) => s + (a.budget ?? 0), 0),
    transports:   transportTotal,
  }
  const maxCat = Math.max(...Object.values(categoryTotals))

  const isConverting = displayCurrency !== currency

  return (
    <section className="mt-8">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <h2 className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
          Budget Summary
        </h2>
        <div className="flex flex-wrap items-center gap-3">
          <CurrencySelect
            label="Entered in"
            value={currency}
            onChange={(c) => { onCurrencyChange?.(c); setDisplayCurrency(c) }}
          />
          <CurrencySelect
            label="Show as"
            value={displayCurrency}
            onChange={setDisplayCurrency}
          />
          {loadingRate && (
            <span className="text-xs text-gray-400 dark:text-gray-500">fetching rate…</span>
          )}
          {isConverting && !loadingRate && (
            <span className="text-xs text-gray-500 dark:text-gray-400">
              1 {currency} = {rate.toFixed(4)} {displayCurrency}
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

        {/* ── Grand total card ── */}
        <div className="border border-gray-100 dark:border-gray-800 rounded-xl p-5 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Total trip budget</p>
          <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{f(grandTotal)}</p>
          {destinations.length > 0 && (() => {
            const totalNights = destRows.reduce((s, r) => s + r.nights, 0)
            return totalNights > 0 ? (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {f(grandTotal / totalNights)} / night · {totalNights} nights total
              </p>
            ) : null
          })()}

          {/* Category breakdown */}
          <div className="mt-4 space-y-2.5">
            {categoryTotals.destinations > 0 && (
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-600 dark:text-gray-400">Destinations</span>
                  <span className="text-gray-700 dark:text-gray-300 font-medium">{f(categoryTotals.destinations)}</span>
                </div>
                <Bar value={categoryTotals.destinations} max={maxCat} color="#0ea5e9" />
              </div>
            )}
            {categoryTotals.hotels > 0 && (
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-600 dark:text-gray-400 flex items-center gap-1"><BedIcon size={10} color="currentColor" /> Hotels</span>
                  <span className="text-gray-700 dark:text-gray-300 font-medium">{f(categoryTotals.hotels)}</span>
                </div>
                <Bar value={categoryTotals.hotels} max={maxCat} color="#a8a29e" />
              </div>
            )}
            {categoryTotals.activities > 0 && (
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-600 dark:text-gray-400">Activities</span>
                  <span className="text-gray-700 dark:text-gray-300 font-medium">{f(categoryTotals.activities)}</span>
                </div>
                <Bar value={categoryTotals.activities} max={maxCat} color="#f97316" />
              </div>
            )}
            {categoryTotals.transports > 0 && (
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-600 dark:text-gray-400">Transport</span>
                  <span className="text-gray-700 dark:text-gray-300 font-medium">{f(categoryTotals.transports)}</span>
                </div>
                <Bar value={categoryTotals.transports} max={maxCat} color="#3b82f6" />
              </div>
            )}
          </div>
        </div>

        {/* ── Per-destination breakdown ── */}
        <div className="border border-gray-100 dark:border-gray-800 rounded-xl overflow-hidden bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm">
          <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-800">
            <p className="text-xs text-gray-500 dark:text-gray-400">Cost per destination</p>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {destRows.map(({ dest, nights, total, perDay }) => {
              if (total === 0) return null
              const isVacation = dest.type === 'vacation'
              return (
                <div key={dest.id} className="px-5 py-3">
                  <div className="flex items-center gap-2 mb-1.5">
                    <Flag code={dest.countryCode} country={dest.country} />
                    <span className="text-sm font-medium text-gray-800 dark:text-gray-200 flex-1 truncate">{dest.city}</span>
                    <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{f(total)}</span>
                  </div>
                  <Bar value={total} max={maxDestTotal} color={isVacation ? '#0ea5e9' : '#8b5cf6'} />
                  <div className="flex items-center gap-3 mt-1.5">
                    {nights > 0 && (
                      <span className="text-xs text-gray-500 dark:text-gray-400">{f(perDay)}/night</span>
                    )}
                    <span className="text-xs text-gray-400 dark:text-gray-500">·</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">{nights} night{nights !== 1 ? 's' : ''}</span>
                    <span className="text-xs text-gray-400 dark:text-gray-500">·</span>
                    <span className="text-xs px-1.5 rounded-full" style={{
                      background: isVacation ? '#f0f9ff' : '#f5f3ff',
                      color: isVacation ? '#0369a1' : '#6d28d9',
                    }}>{dest.type}</span>
                  </div>
                </div>
              )
            })}
            {transportTotal > 0 && (
              <div className="px-5 py-3">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: '#eff6ff' }}>
                    <TransportIcon type="flight" size={11} color="#3b82f6" />
                  </span>
                  <span className="text-sm font-medium text-gray-800 dark:text-gray-200 flex-1">All transport</span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{f(transportTotal)}</span>
                </div>
                <Bar value={transportTotal} max={maxDestTotal} color="#3b82f6" />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5">{transports.length} leg{transports.length !== 1 ? 's' : ''}</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </section>
  )
}
