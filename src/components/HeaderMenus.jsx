import { useState, useEffect, useRef } from 'react'
import { ActivityIcon, BedIcon, TransportIcon } from './Icons'

function DropdownMenu({ label, items, align = 'right', accent = false }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    function handleKey(e) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('keydown', handleKey)
    }
  }, [open])

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className={`w-8 h-8 flex items-center justify-center rounded-lg border transition-colors text-sm font-medium ${
          accent
            ? 'bg-sky-500 border-sky-500 text-white hover:bg-sky-600 hover:border-sky-600 dark:bg-sky-600 dark:border-sky-600 dark:hover:bg-sky-500'
            : 'border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
        }`}
        aria-expanded={open}
      >
        {label}
      </button>
      {open && (
        <div
          className={`absolute top-full mt-1.5 w-52 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg z-50 py-1 ${align === 'right' ? 'right-0' : 'left-0'}`}
        >
          {items.map((item, idx) =>
            item.divider ? (
              <div key={`div-${idx}`} className="my-1 border-t border-gray-100 dark:border-gray-800" />
            ) : (
              <button
                key={item.label}
                onClick={() => { item.onClick(); setOpen(false) }}
                disabled={item.disabled}
                className="w-full text-left px-3 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center gap-2.5 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {item.icon && <span className="w-4 flex items-center justify-center">{item.icon}</span>}
                {item.label}
                {item.badge}
              </button>
            )
          )}
        </div>
      )}
    </div>
  )
}

export default function HeaderMenus({
  hasData,
  onAddDestination,
  onAddTransport,
  onAddHotel,
  onAddActivity,
  onExport,
  onSummaryPDF,
  onCopyShareLink,
  onWhatsApp,
  onInstagram,
  onShare,
  onTravelStats,
  isCollaborating,
  syncStatus,
}) {
  const syncColor = { syncing: '#f59e0b', synced: '#22c55e', error: '#ef4444' }[syncStatus] ?? '#9ca3af'

  const addItems = [
    {
      label: 'Destination',
      icon: <span className="text-sky-500 text-base leading-none">+</span>,
      onClick: onAddDestination,
    },
    {
      label: 'Transport',
      icon: <TransportIcon type="flight" size={13} color="#9ca3af" />,
      onClick: onAddTransport,
    },
    {
      label: 'Hotel',
      icon: <BedIcon size={13} color="#9ca3af" />,
      onClick: onAddHotel,
    },
    {
      label: 'Activity',
      icon: <ActivityIcon type="attraction" size={13} color="#9ca3af" />,
      onClick: onAddActivity,
    },
  ]

  const shareItems = [
    {
      label: 'Export (ICS / Google)',
      icon: <span className="text-gray-400 text-sm leading-none">↑</span>,
      onClick: onExport,
      disabled: !hasData,
    },
    {
      label: 'Full summary PDF',
      icon: <span className="text-base leading-none">📄</span>,
      onClick: onSummaryPDF,
      disabled: !hasData,
    },
    { divider: true },
    {
      label: 'Copy share link',
      icon: <span className="text-base leading-none">🔗</span>,
      onClick: onCopyShareLink,
      disabled: !hasData,
    },
    {
      label: 'Save as image',
      icon: <span className="text-base leading-none">📸</span>,
      onClick: onInstagram,
      disabled: !hasData,
    },
    {
      label: 'Share via WhatsApp',
      icon: <span className="text-base leading-none">💬</span>,
      onClick: onWhatsApp,
      disabled: !hasData,
    },
    { divider: true },
    {
      label: 'Collaborate',
      icon: <span className="text-gray-400 text-sm leading-none">⇆</span>,
      onClick: onShare,
      badge: isCollaborating ? (
        <span
          className="ml-auto w-1.5 h-1.5 rounded-full flex-shrink-0"
          style={{ background: syncColor }}
          data-testid="sync-status-dot"
        />
      ) : null,
    },
  ]

  return (
    <div className="flex items-center gap-2 flex-shrink-0">
      <DropdownMenu label="+" items={addItems} align="right" accent />
      <DropdownMenu label="↑" items={shareItems} align="right" />
      {hasData && (
        <button
          onClick={onTravelStats}
          title="Travel Stats"
          className="w-9 h-9 flex items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-violet-600 text-white hover:from-blue-400 hover:to-violet-500 active:scale-95 transition-all shadow-sm"
        >
          <svg width="15" height="15" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <rect x="0" y="7" width="3" height="7" rx="1" fill="white" />
            <rect x="5.5" y="3" width="3" height="11" rx="1" fill="white" />
            <rect x="11" y="0" width="3" height="14" rx="1" fill="white" />
          </svg>
        </button>
      )}
    </div>
  )
}
