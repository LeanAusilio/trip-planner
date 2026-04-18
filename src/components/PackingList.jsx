import { useState } from 'react'
import { SuitcaseIcon } from './Icons'

export default function PackingList({ items, onAdd, onToggle, onDelete, onClearChecked, dark }) {
  const [input, setInput] = useState('')
  const [open, setOpen] = useState(true)

  const checkedCount = items.filter((i) => i.checked).length
  const totalCount   = items.length

  const handleAdd = () => {
    const text = input.trim()
    if (!text) return
    onAdd(text)
    setInput('')
  }

  return (
    <section>
      {/* Header */}
      <div
        className="flex items-center justify-between mb-3 cursor-pointer select-none"
        onClick={() => setOpen((o) => !o)}
      >
        <h2 className="text-xs font-medium text-gray-500 dark:text-gray-500 uppercase tracking-wider flex items-center gap-2">
          <SuitcaseIcon size={12} color={dark ? 'white' : 'black'} /> Packing List
          {totalCount > 0 && (
            <span className="normal-case text-gray-300 dark:text-gray-600 font-normal tracking-normal">
              {checkedCount}/{totalCount}
            </span>
          )}
        </h2>
        <span className="text-xs text-gray-300 dark:text-gray-600">{open ? '▲' : '▼'}</span>
      </div>

      {open && (
        <div className="border border-gray-100 dark:border-gray-800 rounded-xl overflow-hidden bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm">
          {/* Items */}
          {items.length > 0 && (
            <ul className="divide-y divide-gray-50 dark:divide-gray-800/60">
              {items.map((item) => (
                <li
                  key={item.id}
                  className="flex items-center gap-3 px-4 py-2.5 group"
                >
                  <button
                    onClick={() => onToggle(item.id)}
                    className={`w-4 h-4 rounded flex-shrink-0 border transition-colors flex items-center justify-center ${
                      item.checked
                        ? 'bg-gray-400 border-gray-400 dark:bg-gray-500 dark:border-gray-500'
                        : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                    }`}
                  >
                    {item.checked && (
                      <svg width="9" height="9" viewBox="0 0 12 12" fill="none">
                        <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </button>
                  <span className={`flex-1 text-sm transition-colors ${item.checked ? 'line-through text-gray-300 dark:text-gray-600' : 'text-gray-700 dark:text-gray-300'}`}>
                    {item.text}
                  </span>
                  <button
                    onClick={() => onDelete(item.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-300 hover:text-red-400 dark:text-gray-600 dark:hover:text-red-400 text-xs w-5 h-5 flex items-center justify-center"
                  >✕</button>
                </li>
              ))}
            </ul>
          )}

          {/* Add input */}
          <div className="flex gap-2 px-4 py-3 border-t border-gray-50 dark:border-gray-800/60">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleAdd() }}
              placeholder="Add an item…"
              className="flex-1 text-sm border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded px-3 py-1.5 focus:outline-none focus:border-gray-400 transition-colors text-gray-800 dark:text-gray-200 placeholder:text-gray-300 dark:placeholder:text-gray-600"
            />
            <button
              onClick={handleAdd}
              className="text-sm px-3 py-1.5 rounded border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >Add</button>
            {checkedCount > 0 && (
              <button
                onClick={onClearChecked}
                className="text-xs px-2.5 py-1.5 rounded border border-gray-100 dark:border-gray-800 text-gray-300 dark:text-gray-600 hover:text-red-400 hover:border-red-100 transition-colors"
                title="Remove checked items"
              >Clear checked</button>
            )}
          </div>
        </div>
      )}
    </section>
  )
}
