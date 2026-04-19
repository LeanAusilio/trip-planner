export default function PrivacyNotice({ onAccept, onDismiss }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onDismiss}>
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
            Back
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
