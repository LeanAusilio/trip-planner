import React, { useState, useRef, useCallback } from 'react'
import {
  View,
  Text,
  TextInput,
  FlatList,
  Pressable,
  ActivityIndicator,
  Image,
} from 'react-native'

// ── Types ──────────────────────────────────────────────────────────────────

export interface CityResult {
  city: string
  country: string
  countryCode: string
  lat: number
  lng: number
}

interface Props {
  value?: CityResult | null
  onChange: (city: CityResult) => void
  placeholder?: string
}

// ── Flag ───────────────────────────────────────────────────────────────────

function Flag({ code, country }: { code?: string; country?: string }) {
  if (!code) return null
  return (
    <Image
      source={{ uri: `https://flagcdn.com/40x30/${code.toLowerCase()}.png` }}
      style={{ width: 20, height: 15, borderRadius: 2 }}
      accessibilityLabel={country}
    />
  )
}

// ── Component ──────────────────────────────────────────────────────────────

export default function CitySearch({
  value,
  onChange,
  placeholder = 'Search city…',
}: Props) {
  const [query, setQuery] = useState(value?.city ?? '')
  const [results, setResults] = useState<CityResult[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [networkError, setNetworkError] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const search = useCallback((q: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current)

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
        const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&addressdetails=1&limit=7&featuretype=city&accept-language=en`
        const res = await fetch(url, {
          headers: { 'Accept-Language': 'en' },
        })
        const data: any[] = await res.json()

        const seen = new Set<string>()
        const cities: CityResult[] = data
          .map((r) => {
            const addr = r.address ?? {}
            const city: string =
              addr.city ||
              addr.town ||
              addr.village ||
              addr.municipality ||
              addr.hamlet ||
              r.name
            const country: string = addr.country ?? ''
            const countryCode: string = (addr.country_code ?? '').toUpperCase()
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
        setOpen(cities.length > 0)
      } catch {
        setNetworkError(true)
        setResults([])
        setOpen(false)
      } finally {
        setLoading(false)
      }
    }, 380)
  }, [])

  const select = (city: CityResult) => {
    setQuery(`${city.city}, ${city.country}`)
    onChange(city)
    setOpen(false)
    setResults([])
  }

  return (
    <View style={{ position: 'relative' }}>
      {/* Input row */}
      <View>
        <TextInput
          value={query}
          onChangeText={(text) => {
            setQuery(text)
            search(text)
          }}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder={placeholder}
          placeholderTextColor="#9ca3af"
          autoCorrect={false}
          autoCapitalize="none"
          style={{
            borderWidth: 1,
            borderColor: '#e5e7eb',
            borderRadius: 12,
            paddingHorizontal: 12,
            paddingVertical: 10,
            fontSize: 14,
            color: '#111827',
            backgroundColor: '#ffffff',
            paddingRight: 36,
          }}
        />
        {loading && (
          <View
            style={{
              position: 'absolute',
              right: 10,
              top: 0,
              bottom: 0,
              justifyContent: 'center',
            }}
          >
            <ActivityIndicator size="small" color="#6b7280" />
          </View>
        )}
      </View>

      {/* Network error */}
      {networkError && !loading && (
        <Text style={{ fontSize: 12, color: '#f87171', marginTop: 4 }}>
          Connection error — check your network and try again
        </Text>
      )}

      {/* Results dropdown */}
      {open && results.length > 0 && (
        <View
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: '100%',
            marginTop: 6,
            backgroundColor: '#ffffff',
            borderWidth: 1,
            borderColor: '#e5e7eb',
            borderRadius: 12,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            elevation: 8,
            zIndex: 50,
            overflow: 'hidden',
          }}
        >
          <FlatList
            data={results}
            keyExtractor={(_, i) => String(i)}
            keyboardShouldPersistTaps="handled"
            scrollEnabled={false}
            renderItem={({ item: r, index: i }) => (
              <Pressable
                onPress={() => select(r)}
                style={({ pressed }) => ({
                  opacity: pressed ? 0.7 : 1,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 10,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  borderBottomWidth: i < results.length - 1 ? 1 : 0,
                  borderBottomColor: '#f3f4f6',
                  backgroundColor: '#ffffff',
                })}
              >
                <Flag code={r.countryCode} country={r.country} />
                <Text style={{ fontWeight: '500', fontSize: 14, color: '#1f2937' }}>
                  {r.city}
                </Text>
                <Text style={{ fontSize: 12, color: '#9ca3af' }}>{r.country}</Text>
              </Pressable>
            )}
          />
        </View>
      )}
    </View>
  )
}
