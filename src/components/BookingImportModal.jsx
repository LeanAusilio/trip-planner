import { useState } from 'react'

export default function BookingImportModal({ onImport, onClose }) {
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleParse = async () => {
    if (!text.trim()) { setError('Paste a booking confirmation first'); return }
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/parse-booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Could not parse booking'); return }
      onImport(data)
    } catch {
      setError('Network error — please try again')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-40 flex items-end sm:items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.06)' }}
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-t-2xl sm:rounded-2xl shadow-xl w-full sm:max-w-md mx-0 sm:mx-4 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Import booking</h2>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
              Paste any confirmation email or booking text
            </p>
          </div>
          <button onClick={onClose} className="text-gray-300 hover:text-gray-500 transition-colors w-6 h-6 flex items-center justify-center">
            ✕
          </button>
        </div>

        <textarea
          value={text}
          onChange={(e) => { setText(e.target.value); setError('') }}
          placeholder="Paste your flight, hotel, or booking confirmation here…"
          rows={8}
          className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-sky-400 transition-colors resize-none bg-white dark:bg-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-600"
          autoFocus
        />

        {error && <p className="text-xs text-red-400 mt-2">⚠ {error}</p>}

        <p className="text-[10px] text-gray-300 dark:text-gray-700 mt-2">
          Text is sent to AI for parsing and not stored.
        </p>

        <div className="flex gap-2 mt-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 text-sm text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 rounded-xl py-2.5 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleParse}
            disabled={loading || !text.trim()}
            className="flex-1 text-sm bg-gray-900 dark:bg-gray-100 dark:text-gray-900 text-white rounded-xl py-2.5 hover:bg-gray-700 dark:hover:bg-gray-200 transition-colors font-medium disabled:opacity-40"
          >
            {loading ? 'Parsing…' : 'Import →'}
          </button>
        </div>
      </div>
    </div>
  )
}
