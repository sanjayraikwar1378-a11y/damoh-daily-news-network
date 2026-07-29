import React, { createContext, useContext, useState, useEffect, useCallback } from "react"

export interface WeatherData {
  location: string
  subLocation: string
  lat: number
  lon: number
  temp: number
  feelsLike: number
  condition: string
  conditionHi: string
  conditionCode: number
  iconType: 'sun' | 'cloud-sun' | 'cloud' | 'cloud-fog' | 'cloud-drizzle' | 'cloud-rain' | 'cloud-snow' | 'cloud-lightning'
  humidity: number
  windSpeed: number
  visibilityKm: string
  highTemp: number
  lowTemp: number
  sunriseTime: string
  sunsetTime: string
  lastUpdated: string
  lastUpdatedTimestamp: number
}

interface WeatherContextType {
  weather: WeatherData | null
  loading: boolean
  error: string | null
  refreshWeather: () => Promise<void>
}

const WeatherContext = createContext<WeatherContextType>({
  weather: null,
  loading: true,
  error: null,
  refreshWeather: async () => {},
})

const DAMOH_LAT = 23.8388
const DAMOH_LON = 79.4422
const CACHE_KEY = "damoh_weather_live_cache_v1"
const CACHE_TTL_MS = 15 * 60 * 1000 // 15 minutes

// Helper to map WMO Weather Interpretation Codes
function parseWMOCode(code: number): { condition: string; conditionHi: string; iconType: WeatherData['iconType'] } {
  switch (code) {
    case 0:
      return { condition: "Clear Sky", conditionHi: "साफ आसमान", iconType: "sun" }
    case 1:
    case 2:
      return { condition: "Partly Cloudy", conditionHi: "आंशिक रूप से बादल", iconType: "cloud-sun" }
    case 3:
      return { condition: "Overcast", conditionHi: "घने बादल", iconType: "cloud" }
    case 45:
    case 48:
      return { condition: "Foggy", conditionHi: "कोहरा व धुंध", iconType: "cloud-fog" }
    case 51:
    case 53:
    case 55:
    case 56:
    case 57:
      return { condition: "Light Drizzle", conditionHi: "हल्की बूंदाबांदी", iconType: "cloud-drizzle" }
    case 61:
    case 63:
    case 65:
    case 80:
    case 81:
    case 82:
      return { condition: "Rainy", conditionHi: "बारिश", iconType: "cloud-rain" }
    case 71:
    case 73:
    case 75:
    case 77:
    case 85:
    case 86:
      return { condition: "Snowfall", conditionHi: "बर्फबारी", iconType: "cloud-snow" }
    case 95:
    case 96:
    case 99:
      return { condition: "Thunderstorm", conditionHi: "आंधी-तूफान", iconType: "cloud-lightning" }
    default:
      return { condition: "Cloudy", conditionHi: "बादलयुक्त", iconType: "cloud" }
  }
}

// Helper to format ISO time (e.g. 2026-07-29T05:40) to 12h AM/PM format
function formatIsoTo12h(isoStr: string): string {
  try {
    if (!isoStr) return "--:--"
    const timePart = isoStr.includes("T") ? isoStr.split("T")[1] : isoStr
    const [hStr, mStr] = timePart.split(":")
    let hours = parseInt(hStr, 10)
    const minutes = mStr || "00"
    const ampm = hours >= 12 ? "PM" : "AM"
    hours = hours % 12
    hours = hours ? hours : 12
    const formattedHours = hours < 10 ? `0${hours}` : `${hours}`
    return `${formattedHours}:${minutes} ${ampm}`
  } catch {
    return isoStr
  }
}

// Format date & time for Last Updated badge
function formatLastUpdated(date: Date): string {
  try {
    const hours = date.getHours()
    const mins = date.getMinutes()
    const ampm = hours >= 12 ? "PM" : "AM"
    const h12 = hours % 12 || 12
    const formattedMins = mins < 10 ? `0${mins}` : `${mins}`
    const day = date.getDate()
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    const month = monthNames[date.getMonth()]
    return `${day} ${month}, ${h12}:${formattedMins} ${ampm}`
  } catch {
    return date.toLocaleTimeString()
  }
}

export const WeatherProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [weather, setWeather] = useState<WeatherData | null>(() => {
    try {
      const saved = localStorage.getItem(CACHE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (parsed && parsed.lastUpdatedTimestamp && (Date.now() - parsed.lastUpdatedTimestamp < CACHE_TTL_MS)) {
          return parsed
        }
      }
    } catch {
      // Ignore cache error
    }
    return null
  })

  const [loading, setLoading] = useState<boolean>(!weather)
  const [error, setError] = useState<string | null>(null)

  const fetchLiveWeather = useCallback(async () => {
    setLoading(true)
    setError(null)

    const apiUrl = `https://api.open-meteo.com/v1/forecast?latitude=${DAMOH_LAT}&longitude=${DAMOH_LON}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,wind_speed_10m,visibility&daily=temperature_2m_max,temperature_2m_min,sunrise,sunset&timezone=Asia%2FKolkata`

    try {
      const res = await fetch(apiUrl, { cache: "no-store" })
      if (!res.ok) {
        throw new Error(`Weather API HTTP error: ${res.status}`)
      }

      const data = await res.json()

      if (!data || !data.current || !data.daily) {
        throw new Error("Invalid weather data format received from API")
      }

      const wmoInfo = parseWMOCode(data.current.weather_code)
      const now = new Date()

      const parsedWeather: WeatherData = {
        location: "Damoh",
        subLocation: "Madhya Pradesh, India",
        lat: DAMOH_LAT,
        lon: DAMOH_LON,
        temp: Math.round(data.current.temperature_2m),
        feelsLike: Math.round(data.current.apparent_temperature),
        condition: wmoInfo.condition,
        conditionHi: wmoInfo.conditionHi,
        conditionCode: data.current.weather_code,
        iconType: wmoInfo.iconType,
        humidity: Math.round(data.current.relative_humidity_2m),
        windSpeed: Math.round(data.current.wind_speed_10m),
        visibilityKm: data.current.visibility != null ? (data.current.visibility / 1000).toFixed(1) : "10.0",
        highTemp: Math.round(data.daily.temperature_2m_max[0]),
        lowTemp: Math.round(data.daily.temperature_2m_min[0]),
        sunriseTime: formatIsoTo12h(data.daily.sunrise[0]),
        sunsetTime: formatIsoTo12h(data.daily.sunset[0]),
        lastUpdated: formatLastUpdated(now),
        lastUpdatedTimestamp: now.getTime(),
      }

      setWeather(parsedWeather)
      setError(null)

      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(parsedWeather))
      } catch {
        // LocalStorage quota error ignored
      }

    } catch (err: any) {
      console.error("Failed to fetch Damoh weather data:", err)
      setError("Weather data is temporarily unavailable.")
      // If no valid cached data exists, clear weather state
      if (!weather) {
        setWeather(null)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // Initial fetch if cache expired or missing
    if (!weather || (Date.now() - (weather.lastUpdatedTimestamp || 0) > CACHE_TTL_MS)) {
      fetchLiveWeather()
    }

    // Interval refresh every 15 minutes
    const interval = setInterval(() => {
      fetchLiveWeather()
    }, CACHE_TTL_MS)

    return () => clearInterval(interval)
  }, [fetchLiveWeather])

  return (
    <WeatherContext.Provider
      value={{
        weather,
        loading,
        error,
        refreshWeather: fetchLiveWeather,
      }}
    >
      {children}
    </WeatherContext.Provider>
  )
}

export const useWeather = () => useContext(WeatherContext)
