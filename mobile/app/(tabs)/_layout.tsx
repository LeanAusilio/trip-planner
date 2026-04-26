import { Text } from 'react-native'
import { Tabs } from 'expo-router'
import { useColorScheme } from 'react-native'

export default function TabLayout() {
  const colorScheme = useColorScheme()
  const isDark = colorScheme === 'dark'

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#0ea5e9',
        tabBarInactiveTintColor: isDark ? '#6b7280' : '#9ca3af',
        tabBarStyle: {
          backgroundColor: isDark ? '#111827' : '#ffffff',
          borderTopColor: isDark ? '#1f2937' : '#f3f4f6',
        },
        headerStyle: { backgroundColor: isDark ? '#111827' : '#ffffff' },
        headerTintColor: isDark ? '#ffffff' : '#111827',
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Trip',
          tabBarIcon: ({ color, size }) => <Text style={{ fontSize: size - 4 }}>✈️</Text>,
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: 'Map',
          tabBarIcon: ({ color, size }) => <Text style={{ fontSize: size - 4 }}>🗺️</Text>,
          headerShown: true,
          headerTitle: 'Map',
        }}
      />
      <Tabs.Screen
        name="stats"
        options={{
          title: 'Stats',
          tabBarIcon: ({ color, size }) => <Text style={{ fontSize: size - 4 }}>📊</Text>,
          headerShown: true,
          headerTitle: 'Travel Stats',
        }}
      />
    </Tabs>
  )
}
