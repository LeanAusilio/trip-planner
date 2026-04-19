import { useState } from 'react'
import { signInWithGoogle, signOut } from '../lib/auth'

function PrivacyNotice({ onAccept, onDismiss }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onDismiss}>
      <div
        className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-sm p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">Before you sign in</h2>
        <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">Wayfar — Early Access MVP</p>

        <div className="space-y-3 text-xs text-gray-600 dark:text-gray-400 mb-5">
          <p>
            <span className="font-medium text-gray-800 dark:text-gray-200">Invite-only.</span> This is an early-access MVP shared by invitation. Please do not share the link publicly.
          </p>
          <p>
            <span className="font-medium text-gray-800 dark:text-gray-200">Your data is yours.</span> Only your trip data is stored — nothing else. It is not visible to the app owner, not shared with other users, and never used for any purpose other than showing it back to you.
          </p>
          <p>
            <span className="font-medium text-gray-800 dark:text-gray-200">Infrastructure.</span> This app runs on{' '}
            <span className="font-mono bg-gray-100 dark:bg-gray-800 px-1 rounded">Vercel</span> (hosting) and{' '}
            <span className="font-mono bg-gray-100 dark:bg-gray-800 px-1 rounded">Supabase</span> (authentication &amp; database). Sign-in is handled by{' '}
            <span className="font-mono bg-gray-100 dark:bg-gray-800 px-1 rounded">Google OAuth</span>. No passwords are stored.
          </p>
          <p>
            <span className="font-medium text-gray-800 dark:text-gray-200">No analytics.</span> There is no tracking, advertising, or analytics of any kind.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={onDismiss}
            className="flex-1 text-sm py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onAccept}
            className="flex-1 text-sm py-2.5 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-medium hover:opacity-90 transition-opacity"
          >
            Continue with Google
          </button>
        </div>
      </div>
    </div>
  )
}

export default function AuthButton({ user }) {
  const [showNotice, setShowNotice] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSignIn = async () => {
    setLoading(true)
    try { await signInWithGoogle() }
    catch { setLoading(false) }
  }

  const handleSignOut = async () => {
    setMenuOpen(false)
    await signOut()
  }

  if (user) {
    const avatar = user.user_metadata?.avatar_url
    const name = user.user_metadata?.full_name || user.email
    const initials = name?.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() || '?'

    return (
      <div className="relative">
        <button
          onClick={() => setMenuOpen((o) => !o)}
          className="w-8 h-8 rounded-full overflow-hidden border border-gray-200 dark:border-gray-700 flex items-center justify-center bg-sky-100 dark:bg-sky-900 text-sky-700 dark:text-sky-300 text-xs font-semibold flex-shrink-0"
          title={name}
        >
          {avatar
            ? <img src={avatar} alt={name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            : initials}
        </button>
        {menuOpen && (
          <div className="absolute right-0 top-full mt-1.5 w-48 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg z-50 py-1">
            <div className="px-3 py-2 border-b border-gray-100 dark:border-gray-800">
              <p className="text-xs font-medium text-gray-800 dark:text-gray-200 truncate">{name}</p>
              <p className="text-xs text-gray-400 truncate">{user.email}</p>
            </div>
            <button
              onClick={handleSignOut}
              className="w-full text-left px-3 py-2 text-sm text-red-500 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Sign out
            </button>
          </div>
        )}
      </div>
    )
  }

  return (
    <>
      <button
        onClick={() => setShowNotice(true)}
        disabled={loading}
        className="text-xs px-3 h-8 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50 flex-shrink-0"
      >
        {loading ? 'Redirecting…' : 'Sign in'}
      </button>
      {showNotice && (
        <PrivacyNotice
          onAccept={() => { setShowNotice(false); handleSignIn() }}
          onDismiss={() => setShowNotice(false)}
        />
      )}
    </>
  )
}
