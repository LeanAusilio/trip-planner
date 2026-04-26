import { View, Text, Pressable } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import * as WebBrowser from 'expo-web-browser'
import { supabase } from '../src/lib/supabase'

WebBrowser.maybeCompleteAuthSession()

export default function AuthScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()

  const signInWithGoogle = async () => {
    if (!supabase) return
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: 'wayfar://auth-callback',
        skipBrowserRedirect: true,
      },
    })
    if (data?.url) {
      const result = await WebBrowser.openAuthSessionAsync(data.url, 'wayfar://auth-callback')
      if (result.type === 'success') {
        const url = result.url
        const fragment = url.split('#')[1] || url.split('?')[1] || ''
        const params = new URLSearchParams(fragment)
        const accessToken = params.get('access_token')
        const refreshToken = params.get('refresh_token') || ''
        if (accessToken) {
          await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
          router.back()
        }
      }
    }
  }

  return (
    <View
      className="flex-1 bg-white dark:bg-gray-950 items-center justify-center px-8"
      style={{ paddingBottom: insets.bottom + 16 }}
    >
      <Text className="text-sky-500 font-bold text-5xl mb-2">Wayfar</Text>
      <Text className="text-gray-500 dark:text-gray-400 text-base mb-14 text-center">
        Plan and share your trips
      </Text>

      {supabase ? (
        <Pressable
          onPress={signInWithGoogle}
          className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl py-4 items-center flex-row justify-center gap-3 mb-4"
        >
          <Text className="text-lg">🔒</Text>
          <Text className="text-gray-800 dark:text-white font-semibold text-base">
            Continue with Google
          </Text>
        </Pressable>
      ) : (
        <View className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-4 w-full mb-4">
          <Text className="text-amber-800 dark:text-amber-300 text-sm text-center">
            Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY to .env to enable sign-in
          </Text>
        </View>
      )}

      <Pressable onPress={() => router.back()} className="py-3">
        <Text className="text-sky-500 text-sm font-medium">Continue as guest →</Text>
      </Pressable>
    </View>
  )
}
