import { useState, useEffect } from 'react'

const DISMISSED_KEY = 'wayfar-ios-install-dismissed'
const DISMISS_TTL_MS = 30 * 24 * 60 * 60 * 1000 // 30 days

function isIOSSafari() {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent
  const isIOS = /iphone|ipad|ipod/i.test(ua)
  const isSafari = /safari/i.test(ua) && !/chrome|crios|fxios|opios/i.test(ua)
  const isStandalone = navigator.standalone === true
  return isIOS && isSafari && !isStandalone
}

function wasDismissedRecently() {
  try {
    const ts = localStorage.getItem(DISMISSED_KEY)
    if (!ts) return false
    return Date.now() - parseInt(ts, 10) < DISMISS_TTL_MS
  } catch {
    return false
  }
}

export default function IOSInstallPrompt() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!isIOSSafari() || wasDismissedRecently()) return
    const t = setTimeout(() => setVisible(true), 12000)
    return () => clearTimeout(t)
  }, [])

  if (!visible) return null

  const dismiss = () => {
    try { localStorage.setItem(DISMISSED_KEY, String(Date.now())) } catch {}
    setVisible(false)
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-6 animate-slide-up">
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-xl p-4 flex items-start gap-3">
        <img src="/apple-touch-icon.png" alt="Wayfar" className="w-12 h-12 rounded-xl flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Install Wayfar</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">
            Tap <span className="font-medium text-gray-700 dark:text-gray-300">Share</span>
            {' '}then{' '}
            <span className="font-medium text-gray-700 dark:text-gray-300">Add to Home Screen</span>
            {' '}for the best experience.
          </p>
        </div>
        <button
          onClick={dismiss}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 flex-shrink-0 w-6 h-6 flex items-center justify-center"
          aria-label="Dismiss"
        >
          ✕
        </button>
      </div>
    </div>
  )
}
