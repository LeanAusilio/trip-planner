import { DropdownMenu } from './HeaderMenus'
import { ActivityIcon, BedIcon, TransportIcon } from './Icons'

export default function MobileBottomBar({
  hasData,
  dark,
  onToggleDark,
  onTravelStats,
  onAddDestination,
  onAddTransport,
  onAddHotel,
  onAddActivity,
  onImportBooking,
  onExport,
  onSummaryPDF,
  onCopyShareLink,
  onWhatsApp,
  onInstagram,
  onShare,
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
    { divider: true },
    {
      label: 'Import booking',
      icon: <span className="text-gray-400 text-sm leading-none">↓</span>,
      onClick: onImportBooking,
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
        />
      ) : null,
    },
  ]

  const slotClass = 'flex flex-col items-center justify-center gap-0.5 min-w-[44px] min-h-[44px] text-gray-500 dark:text-gray-400'
  const labelClass = 'text-[10px] leading-none'

  return (
    <div
      className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/90 dark:bg-gray-950/90 backdrop-blur-sm border-t border-gray-100 dark:border-gray-800 flex items-center justify-around px-2"
      style={{ paddingTop: 8, paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}
    >
      {/* + Add */}
      <DropdownMenu
        label={
          <span className="flex flex-col items-center gap-0.5">
            <span className="text-lg font-bold leading-none text-sky-500">+</span>
            <span className={`${labelClass} text-sky-500`}>Add</span>
          </span>
        }
        items={addItems}
        direction="up"
        align="left"
        triggerClassName={`${slotClass} px-3`}
      />

      {/* ↑ Share */}
      <DropdownMenu
        label={
          <span className="flex flex-col items-center gap-0.5">
            <span className="text-base leading-none">↑</span>
            <span className={labelClass}>Share</span>
          </span>
        }
        items={shareItems}
        direction="up"
        align="left"
        triggerClassName={`${slotClass} px-3`}
      />

      {/* Stats */}
      {hasData && (
        <button
          onClick={onTravelStats}
          aria-label="Travel stats"
          className={slotClass}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <rect x="0" y="7" width="3" height="7" rx="1" fill="currentColor" />
            <rect x="5.5" y="3" width="3" height="11" rx="1" fill="currentColor" />
            <rect x="11" y="0" width="3" height="14" rx="1" fill="currentColor" />
          </svg>
          <span className={labelClass}>Stats</span>
        </button>
      )}

      {/* Dark mode */}
      <button
        onClick={onToggleDark}
        aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
        className={slotClass}
      >
        <span className="text-base leading-none">{dark ? '☀' : '☾'}</span>
        <span className={labelClass}>{dark ? 'Light' : 'Dark'}</span>
      </button>
    </div>
  )
}
