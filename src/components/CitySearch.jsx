import { useState, useRef, useEffect, useCallback } from 'react'

function Flag({ code, country }) {
  if (!code) return null
  return (
    <img
      src={`https://flagcdn.com/20x15/${code.toLowerCase()}.png`}
      srcSet={`https://flagcdn.com/40x30/${code.toLowerCase()}.png 2x`}
      width={20}
      height={15}
      alt={country}
      className="flex-shrink-0 rounded-sm"
      style={{ objectFit: 'cover' }}
    />
  )
}

export { Flag }

export default function CitySearch({ value, onChange, placeholder = 'Search city…' }) {
  const [query, setQuery] = useState(value?.city || '')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [highlighted, setHighlighted] = useState(-1)
  const [networkError, setNetworkError] = useState(false)
  const debounceRef = useRef(null)
  const containerRef = useRef(null)
  const inputRef = useRef(null)

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const search = useCallback((q) => {
    clearTimeout(debounceRef.current)
    if (q.length < 2) {
      setResults([])
      setOpen(false)
      setNetworkError(false)
      return
    }
    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      setNetworkError(false)
      try {
        const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&addressdetails=1&limit=10&featuretype=city&accept-language=en`
        const res = await fetch(url, {
          headers: { 'Accept-Language': 'en' },
        })
        const data = await res.json()

        const seen = new Set()
        const cities = data
          .map((r) => {
            const addr = r.address || {}
            const city =
              addr.city ||
              addr.town ||
              addr.village ||
              addr.municipality ||
              addr.hamlet ||
              r.name
            const country = addr.country || ''
            const countryCode = (addr.country_code || '').toUpperCase()
            const lat = parseFloat(r.lat)
            const lng = parseFloat(r.lon)
            return { city, country, countryCode, lat, lng }
          })
          .filter((r) => {
            if (!r.city || !r.countryCode) return false
            const key = `${r.city}|${r.countryCode}`
            if (seen.has(key)) return false
            seen.add(key)
            return true
          })
          .slice(0, 7)

        setResults(cities)
        setHighlighted(-1)
        setOpen(cities.length > 0)
      } catch {
        setNetworkError(true)
      } finally {
        setLoading(false)
      }
    }, 380)
  }, [])

  const select = (city) => {
    setQuery(city.city)
    onChange(city)
    setOpen(false)
    setResults([])
  }

  const handleKeyDown = (e) => {
    if (!open) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlighted((h) => Math.min(h + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlighted((h) => Math.max(h - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (highlighted >= 0 && results[highlighted]) {
        select(results[highlighted])
      }
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  return (
    <div className="relative" ref={containerRef}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            search(e.target.value)
          }}
          onFocus={() => results.length > 0 && setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoComplete="off"
          className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-sky-400 dark:focus:border-sky-500 transition-colors pr-8 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-600"
        />
        {loading && (
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 border border-gray-300 border-t-gray-500 rounded-full animate-spin" />
        )}
      </div>
      {networkError && !loading && (
        <p className="text-xs text-red-400 mt-1">Connection error — check your network and try again</p>
      )}

      {open && results.length > 0 && (
        <div className="absolute left-0 right-0 top-full mt-1.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg z-50 overflow-hidden">
          {results.map((r, i) => (
            <button
              key={i}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => select(r)}
              className={`w-full text-left px-3 py-2.5 text-sm flex items-center gap-2.5 transition-colors ${
                i === highlighted
                  ? 'bg-gray-50 dark:bg-gray-800'
                  : 'hover:bg-gray-50 dark:hover:bg-gray-800'
              } ${i < results.length - 1 ? 'border-b border-gray-100 dark:border-gray-800' : ''}`}
            >
              <Flag code={r.countryCode} country={r.country} />
              <span className="font-medium text-gray-800 dark:text-gray-200">{r.city}</span>
              <span className="text-gray-400 dark:text-gray-500 text-xs">{r.country}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
