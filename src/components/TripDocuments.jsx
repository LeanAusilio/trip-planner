import { useState, useRef } from 'react'
import { supabase } from '../lib/supabase'

const MAX_FILES = 5
const MAX_FILE_MB = 5

function LinkIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
    </svg>
  )
}

function FileIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
    </svg>
  )
}

function DocIcon({ size = 12, color = '#9ca3af' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="16" y1="13" x2="8" y2="13"/>
      <line x1="16" y1="17" x2="8" y2="17"/>
      <polyline points="10 9 9 9 8 9"/>
    </svg>
  )
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function TripDocuments({ documents, tripId, userId, onAdd, onDelete, dark }) {
  const [open, setOpen] = useState(true)
  const [showLinkForm, setShowLinkForm] = useState(false)
  const [linkUrl, setLinkUrl] = useState('')
  const [linkTitle, setLinkTitle] = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const fileInputRef = useRef(null)

  const fileCount = documents.filter((d) => d.type === 'file').length
  const canUploadFiles = !!userId && !!supabase

  const handleAddLink = () => {
    const url = linkUrl.trim()
    const title = linkTitle.trim()
    if (!url) return
    let finalUrl = url
    if (!/^https?:\/\//i.test(url)) finalUrl = 'https://' + url
    onAdd({ id: crypto.randomUUID(), type: 'link', title: title || finalUrl, url: finalUrl })
    setLinkUrl('')
    setLinkTitle('')
    setShowLinkForm(false)
  }

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''
    setUploadError('')

    if (file.size > MAX_FILE_MB * 1024 * 1024) {
      setUploadError(`File must be under ${MAX_FILE_MB} MB`)
      return
    }
    if (fileCount >= MAX_FILES) {
      setUploadError(`Maximum ${MAX_FILES} files per trip`)
      return
    }

    setUploading(true)
    const path = `${userId}/${tripId}/${Date.now()}-${file.name}`
    const { error } = await supabase.storage.from('trip-docs').upload(path, file)
    setUploading(false)
    if (error) { setUploadError(error.message); return }
    onAdd({ id: crypto.randomUUID(), type: 'file', title: file.name, path, size: file.size })
  }

  const handleOpenFile = async (doc) => {
    if (!supabase) return
    const { data, error } = await supabase.storage.from('trip-docs').createSignedUrl(doc.path, 3600)
    if (error || !data?.signedUrl) return
    window.open(data.signedUrl, '_blank', 'noopener')
  }

  const handleDeleteFile = async (doc) => {
    if (doc.type === 'file' && supabase) {
      await supabase.storage.from('trip-docs').remove([doc.path]).catch(() => {})
    }
    onDelete(doc.id)
  }

  return (
    <section>
      <div
        className="flex items-center justify-between mb-3 cursor-pointer select-none"
        onClick={() => setOpen((o) => !o)}
      >
        <h2 className="text-xs font-medium text-gray-500 dark:text-gray-500 uppercase tracking-wider flex items-center gap-2">
          <DocIcon size={12} color={dark ? '#9ca3af' : '#6b7280'} /> Documents
          {documents.length > 0 && (
            <span className="normal-case text-gray-300 dark:text-gray-600 font-normal tracking-normal">
              {documents.length}
            </span>
          )}
        </h2>
        <span className="text-xs text-gray-300 dark:text-gray-600">{open ? '▲' : '▼'}</span>
      </div>

      {open && (
        <div className="border border-gray-100 dark:border-gray-800 rounded-xl overflow-hidden bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm">
          {/* Document list */}
          {documents.length > 0 && (
            <ul className="divide-y divide-gray-50 dark:divide-gray-800/60">
              {documents.map((doc) => (
                <li key={doc.id} className="flex items-center gap-3 px-4 py-3">
                  <span className="text-gray-300 dark:text-gray-600 flex-shrink-0">
                    {doc.type === 'file' ? <FileIcon /> : <LinkIcon />}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-800 dark:text-gray-200 truncate">{doc.title}</p>
                    {doc.size && (
                      <p className="text-xs text-gray-400 dark:text-gray-500">{formatBytes(doc.size)}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => doc.type === 'link' ? window.open(doc.url, '_blank', 'noopener') : handleOpenFile(doc)}
                      className="text-xs text-gray-400 hover:text-sky-500 px-2 py-1 rounded transition-colors"
                    >
                      Open
                    </button>
                    <button
                      onClick={() => handleDeleteFile(doc)}
                      className="text-xs text-gray-300 hover:text-red-400 px-2 py-1 rounded transition-colors"
                    >
                      ✕
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {/* Add link form */}
          {showLinkForm && (
            <div className="px-4 py-3 border-t border-gray-50 dark:border-gray-800/60 space-y-2">
              <input
                autoFocus
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://airbnb.com/rooms/..."
                className="w-full text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-gray-900 dark:text-gray-100 placeholder-gray-300 dark:placeholder-gray-600 outline-none focus:border-gray-400 dark:focus:border-gray-500"
                onKeyDown={(e) => e.key === 'Enter' && handleAddLink()}
              />
              <input
                value={linkTitle}
                onChange={(e) => setLinkTitle(e.target.value)}
                placeholder="Title (optional)"
                className="w-full text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-gray-900 dark:text-gray-100 placeholder-gray-300 dark:placeholder-gray-600 outline-none focus:border-gray-400 dark:focus:border-gray-500"
                onKeyDown={(e) => e.key === 'Enter' && handleAddLink()}
              />
              <div className="flex gap-2">
                <button
                  onClick={() => { setShowLinkForm(false); setLinkUrl(''); setLinkTitle('') }}
                  className="flex-1 text-xs py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddLink}
                  disabled={!linkUrl.trim()}
                  className="flex-1 text-xs py-2 rounded-lg bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-medium hover:opacity-90 transition-opacity disabled:opacity-40"
                >
                  Add link
                </button>
              </div>
            </div>
          )}

          {/* Error */}
          {uploadError && (
            <p className="px-4 py-2 text-xs text-red-400">{uploadError}</p>
          )}

          {/* Action buttons */}
          {!showLinkForm && (
            <div className="flex border-t border-gray-50 dark:border-gray-800/60">
              <button
                onClick={() => { setShowLinkForm(true); setUploadError('') }}
                className="flex-1 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center justify-center gap-1.5"
              >
                <LinkIcon /> Add link
              </button>
              <div className="w-px bg-gray-50 dark:bg-gray-800" />
              <button
                onClick={() => { if (canUploadFiles) fileInputRef.current?.click() }}
                disabled={!canUploadFiles || fileCount >= MAX_FILES || uploading}
                title={!canUploadFiles ? 'Sign in to upload files' : undefined}
                className="flex-1 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <FileIcon /> {uploading ? 'Uploading…' : `Upload PDF${canUploadFiles ? ` (${MAX_FILES - fileCount} left)` : ' — sign in'}`}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                className="hidden"
                onChange={handleFileUpload}
              />
            </div>
          )}
        </div>
      )}
    </section>
  )
}
