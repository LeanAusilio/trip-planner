import { View, Text } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTrips } from '../../src/hooks/useTrips'
import { differenceInDays } from 'date-fns'

// react-native-maps requires a native build — graceful fallback for Expo Go
let MapView: any, Marker: any, Polyline: any, Callout: any
try {
  const maps = require('react-native-maps')
  MapView = maps.default
  Marker = maps.Marker
  Polyline = maps.Polyline
  Callout = maps.Callout
} catch {}

export default function MapScreen() {
  const insets = useSafeAreaInsets()
  const { activeTrip } = useTrips()
  const destinations = (activeTrip?.destinations || []).filter(
    (d) => d.lat != null && d.lng != null
  )

  if (!MapView) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50 dark:bg-gray-950 px-8">
        <Text className="text-4xl mb-4">🗺️</Text>
        <Text className="text-base font-semibold text-gray-900 dark:text-white mb-2">Map requires a dev build</Text>
        <Text className="text-sm text-gray-500 text-center">
          Run `eas build --profile development` to enable the interactive map.
        </Text>
      </View>
    )
  }

  if (destinations.length === 0) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50 dark:bg-gray-950 px-8">
        <Text className="text-4xl mb-4">🗺️</Text>
        <Text className="text-base text-gray-500 text-center">
          Add destinations with city search to see your route on the map
        </Text>
      </View>
    )
  }

  const lats = destinations.map((d) => d.lat!)
  const lngs = destinations.map((d) => d.lng!)
  const region = {
    latitude: (Math.max(...lats) + Math.min(...lats)) / 2,
    longitude: (Math.max(...lngs) + Math.min(...lngs)) / 2,
    latitudeDelta: Math.max(Math.max(...lats) - Math.min(...lats) + 2, 2),
    longitudeDelta: Math.max(Math.max(...lngs) - Math.min(...lngs) + 4, 4),
  }

  const polylineCoords = destinations.map((d) => ({
    latitude: d.lat!,
    longitude: d.lng!,
  }))

  return (
    <View className="flex-1">
      <MapView
        style={{ flex: 1 }}
        initialRegion={region}
        showsUserLocation
        showsCompass
      >
        <Polyline
          coordinates={polylineCoords}
          strokeColor="#0ea5e9"
          strokeWidth={2}
          lineDashPattern={[6, 4]}
        />
        {destinations.map((dest, idx) => (
          <Marker
            key={dest.id}
            coordinate={{ latitude: dest.lat!, longitude: dest.lng! }}
            pinColor="#0ea5e9"
          >
            <Callout>
              <View style={{ padding: 8, minWidth: 120 }}>
                <Text style={{ fontWeight: '600', fontSize: 13 }}>{dest.city}</Text>
                <Text style={{ fontSize: 11, color: '#6b7280' }}>
                  {differenceInDays(new Date(dest.departure), new Date(dest.arrival))} nights
                </Text>
              </View>
            </Callout>
          </Marker>
        ))}
      </MapView>
    </View>
  )
}
