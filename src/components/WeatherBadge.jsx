import { useCurrentWeather, wmoEmoji, isCurrentOrFuture } from '../hooks/useCurrentWeather'

export default function WeatherBadge({ city, countryCode, departure }) {
  const weather = useCurrentWeather(city, countryCode, isCurrentOrFuture(departure))
  if (!weather) return null

  return (
    <span className="inline-flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500 ml-1.5" title="Current weather">
      {wmoEmoji(weather.code)} {weather.temp}° · ↑{weather.high}° ↓{weather.low}°
    </span>
  )
}
