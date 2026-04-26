import '../global.css'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { Stack } from 'expo-router'
import { useColorScheme } from 'react-native'

export default function RootLayout() {
  const colorScheme = useColorScheme()

  return (
    <GestureHandlerRootView style={{ flex: 1 }} className={colorScheme === 'dark' ? 'dark' : ''}>
      <SafeAreaProvider>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="auth" options={{ presentation: 'modal', headerShown: false }} />
          <Stack.Screen name="destination-modal" options={{ presentation: 'formSheet', title: 'Destination' }} />
          <Stack.Screen name="hotel-modal" options={{ presentation: 'formSheet', title: 'Hotel' }} />
          <Stack.Screen name="activity-modal" options={{ presentation: 'formSheet', title: 'Activity' }} />
          <Stack.Screen name="detail" options={{ presentation: 'pageSheet', headerShown: false }} />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  )
}
