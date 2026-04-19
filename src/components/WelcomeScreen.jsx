import { useState } from 'react'
import PrivacyNotice from './PrivacyNotice'
import { signInWithGoogle } from '../lib/auth'

export default function WelcomeScreen({ onContinueAsGuest }) {
  const [showPrivacy, setShowPrivacy] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSignIn = async () => {
    setLoading(true)
    try { await signInWithGoogle() }
    catch { setLoading(false) }
  }

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-md">
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-xs p-8 flex flex-col items-center">

          {/* Logo */}
          <div className="mb-6 text-center">
            <h1 className="text-3xl font-semibold tracking-tight text-gray-900 dark:text-gray-100">wayfar</h1>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Plan your trips, together.</p>
          </div>

          {/* Actions */}
          <div className="w-full flex flex-col gap-3">
            <button
              onClick={() => setShowPrivacy(true)}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2.5 text-sm py-2.5 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {/* Google "G" icon */}
              <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
                <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
                <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" fill="#34A853"/>
                <path d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" fill="#FBBC05"/>
                <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.961L3.964 6.293C4.672 4.166 6.656 3.58 9 3.58z" fill="#EA4335"/>
              </svg>
              {loading ? 'Redirecting…' : 'Continue with Google'}
            </button>

            <button
              onClick={onContinueAsGuest}
              className="w-full text-sm py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Continue without account
            </button>
          </div>

          <p className="text-xs text-gray-300 dark:text-gray-600 mt-5 text-center">
            Early access · Invite only
          </p>
        </div>
      </div>

      {showPrivacy && (
        <PrivacyNotice
          onAccept={() => { setShowPrivacy(false); handleSignIn() }}
          onDismiss={() => setShowPrivacy(false)}
        />
      )}
    </>
  )
}
