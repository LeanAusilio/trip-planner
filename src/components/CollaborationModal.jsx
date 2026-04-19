import { useState } from 'react'

const STATUS_COLOR = { idle: '#9ca3af', syncing: '#f59e0b', synced: '#22c55e', error: '#ef4444' }
const STATUS_LABEL = { idle: 'Connected', syncing: 'Syncing…', synced: 'Up to date', error: 'Sync error' }

export default function CollaborationModal({
  isCollaborating, tripCode, syncStatus,
  onStartSharing, onJoinTrip, onStopSharing, onClose,
  supabaseReady = true,
}) {
  const [mode, setMode]     = useState('none') // 'none' | 'join'
  const [joinCode, setJoinCode] = useState('')
  const [error, setError]   = useState('')
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleStart = async () => {
    setLoading(true); setError('')
    try { await onStartSharing() }
    catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }

  const handleJoin = async () => {
    if (joinCode.length !== 6) { setError('Enter the full 6-character code'); return }
    setLoading(true); setError('')
    try { await onJoinTrip(joinCode) }
    catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }

  const copyCode = () => {
    navigator.clipboard.writeText(tripCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-sm p-6"
        onClick={(e) => e.stopPropagation()}
        data-testid="collaboration-modal"
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Collaborate</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-xl leading-none">×</button>
        </div>

        {!supabaseReady && (
          <div className="mb-4 px-3 py-2.5 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/40 text-xs text-amber-700 dark:text-amber-400" data-testid="collab-unavailable-banner">
            Live collaboration requires Supabase environment variables (<code className="font-mono">VITE_SUPABASE_URL</code> and <code className="font-mono">VITE_SUPABASE_ANON_KEY</code>) to be set in your Vercel project settings.
          </div>
        )}

        {isCollaborating ? (
          <>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
              Share this code — anyone who enters it joins your live trip:
            </p>
            <div className="flex items-center gap-2 mb-4">
              <span className="flex-1 text-center text-2xl font-mono font-bold tracking-[0.3em] text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-800 rounded-xl py-3 select-all">
                {tripCode}
              </span>
              <button
                onClick={copyCode}
                className="text-xs px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition-colors whitespace-nowrap"
                data-testid="copy-code-button"
              >
                {copied ? '✓ Copied' : 'Copy'}
              </button>
            </div>
            <div className="flex items-center gap-2 mb-5">
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: STATUS_COLOR[syncStatus] }} data-testid="sync-dot" />
              <span className="text-xs text-gray-400">{STATUS_LABEL[syncStatus]}</span>
            </div>
            <button
              onClick={onStopSharing}
              className="w-full text-xs text-red-400 hover:text-red-500 py-2 rounded-lg border border-red-100 dark:border-red-900/40 hover:border-red-200 transition-colors"
            >Stop sharing</button>
          </>
        ) : (
          <>
            {mode === 'none' && (
              <div className="flex flex-col gap-2">
                <button
                  onClick={handleStart}
                  disabled={loading || !supabaseReady}
                  data-testid="start-sharing-button"
                  className="w-full text-sm py-2.5 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {loading ? 'Creating…' : 'Start sharing this trip'}
                </button>
                <button
                  onClick={() => setMode('join')}
                  disabled={!supabaseReady}
                  data-testid="join-code-button"
                  className="w-full text-sm py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Join with a code
                </button>
              </div>
            )}

            {mode === 'join' && (
              <div>
                <input
                  autoFocus
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6))}
                  placeholder="XXXXXX"
                  data-testid="join-code-input"
                  className="w-full text-center text-2xl font-mono font-bold tracking-[0.3em] bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl py-3 mb-3 text-gray-900 dark:text-gray-100 outline-none focus:border-gray-400 dark:focus:border-gray-500"
                  onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => { setMode('none'); setError('') }}
                    className="flex-1 text-sm py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >Back</button>
                  <button
                    onClick={handleJoin}
                    disabled={loading || joinCode.length !== 6}
                    data-testid="join-submit-button"
                    className="flex-1 text-sm py-2.5 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    {loading ? 'Joining…' : 'Join'}
                  </button>
                </div>
              </div>
            )}

            {error && <p className="text-xs text-red-400 mt-3" data-testid="collab-error">{error}</p>}
          </>
        )}
      </div>
    </div>
  )
}
