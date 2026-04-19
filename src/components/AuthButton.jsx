import { useState } from 'react'
import { signOut } from '../lib/auth'

export default function AuthButton({ user, onShowWelcome }) {
  const [menuOpen, setMenuOpen] = useState(false)

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
    <button
      onClick={onShowWelcome}
      className="text-xs px-3 h-8 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex-shrink-0"
    >
      Sign in
    </button>
  )
}

