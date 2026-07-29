import React from "react"
import { useWeather } from "@/context/WeatherContext"
import { 
  Sun, 
  CloudSun, 
  Cloud, 
  CloudFog, 
  CloudDrizzle, 
  CloudRain, 
  CloudSnow, 
  CloudLightning, 
  Wind, 
  Eye, 
  Droplets, 
  Thermometer, 
  Sunrise, 
  Sunset, 
  RefreshCw, 
  AlertCircle, 
  MapPin, 
  Clock,
  ArrowUp,
  ArrowDown
} from "lucide-react"
import { Button } from "@/components/ui/button"

interface WeatherWidgetProps {
  className?: string
  compact?: boolean
}

export const WeatherWidget: React.FC<WeatherWidgetProps> = ({ className = "", compact = false }) => {
  const { weather, loading, error, refreshWeather } = useWeather()
  const [refreshing, setRefreshing] = React.useState(false)

  const handleManualRefresh = async () => {
    setRefreshing(true)
    await refreshWeather()
    setTimeout(() => setRefreshing(false), 500)
  }

  const renderWeatherIcon = (iconType?: string, sizeClass = "h-8 w-8") => {
    switch (iconType) {
      case "sun":
        return <Sun className={`${sizeClass} text-amber-400 animate-spin-slow`} />
      case "cloud-sun":
        return <CloudSun className={`${sizeClass} text-amber-300`} />
      case "cloud":
        return <Cloud className={`${sizeClass} text-slate-300`} />
      case "cloud-fog":
        return <CloudFog className={`${sizeClass} text-slate-400`} />
      case "cloud-drizzle":
        return <CloudDrizzle className={`${sizeClass} text-sky-400`} />
      case "cloud-rain":
        return <CloudRain className={`${sizeClass} text-blue-400`} />
      case "cloud-snow":
        return <CloudSnow className={`${sizeClass} text-cyan-200`} />
      case "cloud-lightning":
        return <CloudLightning className={`${sizeClass} text-amber-400`} />
      default:
        return <CloudSun className={`${sizeClass} text-amber-300`} />
    }
  }

  if (loading && !weather) {
    return (
      <div className={`border border-zinc-800 rounded-2xl p-5 bg-zinc-900 text-white shadow-lg space-y-4 animate-pulse ${className}`}>
        <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
          <div className="h-4 w-32 bg-zinc-800 rounded"></div>
          <div className="h-4 w-12 bg-zinc-800 rounded"></div>
        </div>
        <div className="flex items-center justify-between py-2">
          <div className="space-y-2">
            <div className="h-10 w-24 bg-zinc-800 rounded"></div>
            <div className="h-3 w-28 bg-zinc-800 rounded"></div>
          </div>
          <div className="h-12 w-12 bg-zinc-800 rounded-full"></div>
        </div>
        <div className="grid grid-cols-2 gap-2 pt-2">
          <div className="h-12 bg-zinc-800 rounded-xl"></div>
          <div className="h-12 bg-zinc-800 rounded-xl"></div>
        </div>
      </div>
    )
  }

  if (error && !weather) {
    return (
      <div className={`border border-red-500/30 rounded-2xl p-5 bg-zinc-900 text-white shadow-lg space-y-3 ${className}`}>
        <div className="flex items-center justify-between border-b border-zinc-800 pb-2.5">
          <h3 className="font-bold text-xs uppercase tracking-wider text-red-400 flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 text-red-500" />
            <span>दमोह मौसम (Damoh, MP)</span>
          </h3>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleManualRefresh}
            className="h-6 w-6 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-full"
            title="पुनः प्रयास करें (Retry)"
          >
            <RefreshCw className={`h-3 w-3 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-center space-y-2">
          <AlertCircle className="h-6 w-6 text-red-400 mx-auto" />
          <p className="text-xs font-bold text-red-300 leading-snug">
            Weather data is temporarily unavailable.
          </p>
          <p className="text-[11px] text-zinc-400">
            मौसम संबंधी जानकारी अस्थायी रूप से उपलब्ध नहीं है।
          </p>
          <Button 
            size="sm" 
            variant="outline" 
            onClick={handleManualRefresh}
            className="text-[11px] h-7 border-red-500/30 text-red-300 hover:bg-red-500/20"
          >
            Retry Fetching Live Data
          </Button>
        </div>
      </div>
    )
  }

  if (!weather) return null

  if (compact) {
    return (
      <div className={`flex items-center gap-2 text-xs font-medium ${className}`}>
        <span className="flex items-center gap-1 font-bold text-amber-400">
          {renderWeatherIcon(weather.iconType, "h-4 w-4")}
          <span>{weather.temp}°C</span>
        </span>
        <span className="text-zinc-300 hidden sm:inline">
          {weather.conditionHi}
        </span>
      </div>
    )
  }

  return (
    <div className={`border border-zinc-800 rounded-2xl p-5 bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-950 text-white space-y-4 shadow-xl relative overflow-hidden ${className}`}>
      
      {/* Decorative subtle background gradient blur */}
      <div className="absolute -right-8 -top-8 w-28 h-28 bg-amber-500/10 rounded-full blur-2xl pointer-events-none"></div>

      {/* Header Bar */}
      <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
        <div>
          <h3 className="font-extrabold text-sm uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
            <MapPin className="h-4 w-4 text-amber-400 shrink-0" />
            <span>दमोह मौसम (Damoh, MP)</span>
          </h3>
          <p className="text-[10px] text-zinc-400 font-medium">
            Damoh, Madhya Pradesh, India
          </p>
        </div>

        <div className="flex items-center gap-1">
          <span className="text-[9px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full">
            LIVE API
          </span>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleManualRefresh}
            disabled={loading || refreshing}
            className="h-7 w-7 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-full transition-all"
            title="ताज़ा करें (Refresh Live Weather)"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing || loading ? 'animate-spin text-amber-400' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Main Temperature & Condition Display */}
      <div className="flex items-center justify-between py-1">
        <div className="space-y-1">
          <div className="flex items-baseline gap-2">
            <span className="text-4xl sm:text-5xl font-black text-white tracking-tight">
              {weather.temp}°C
            </span>
            <span className="text-xs font-bold text-zinc-400 flex items-center gap-0.5">
              <Thermometer className="h-3.5 w-3.5 text-amber-400" />
              आभासी {weather.feelsLike}°C
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-bold text-sm text-amber-300">
              {weather.conditionHi}
            </span>
            <span className="text-xs text-zinc-400 font-medium">
              ({weather.condition})
            </span>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center p-2.5 bg-zinc-800/50 rounded-2xl border border-zinc-700/40 shrink-0">
          {renderWeatherIcon(weather.iconType, "h-10 w-10 sm:h-12 sm:w-12")}
          <div className="flex items-center gap-1 text-[10px] text-zinc-400 font-bold mt-1">
            <span className="text-red-400 flex items-center"><ArrowUp className="h-2.5 w-2.5" />{weather.highTemp}°</span>
            <span className="text-zinc-600">/</span>
            <span className="text-blue-400 flex items-center"><ArrowDown className="h-2.5 w-2.5" />{weather.lowTemp}°</span>
          </div>
        </div>
      </div>

      {/* Grid of Weather Vitals */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs pt-1">
        
        {/* Humidity */}
        <div className="p-2.5 bg-zinc-800/60 rounded-xl border border-zinc-700/40 hover:border-sky-500/40 transition-colors">
          <span className="text-zinc-400 block text-[10px] font-medium flex items-center gap-1">
            <Droplets className="h-3 w-3 text-sky-400" /> नमी (Humidity)
          </span>
          <span className="font-bold text-sky-300 text-sm mt-0.5 block">
            {weather.humidity}%
          </span>
        </div>

        {/* Wind Speed */}
        <div className="p-2.5 bg-zinc-800/60 rounded-xl border border-zinc-700/40 hover:border-teal-500/40 transition-colors">
          <span className="text-zinc-400 block text-[10px] font-medium flex items-center gap-1">
            <Wind className="h-3 w-3 text-teal-400" /> हवा (Wind)
          </span>
          <span className="font-bold text-teal-300 text-sm mt-0.5 block">
            {weather.windSpeed} km/h
          </span>
        </div>

        {/* Visibility */}
        <div className="p-2.5 bg-zinc-800/60 rounded-xl border border-zinc-700/40 hover:border-indigo-500/40 transition-colors">
          <span className="text-zinc-400 block text-[10px] font-medium flex items-center gap-1">
            <Eye className="h-3 w-3 text-indigo-400" /> दृश्यता (Visibility)
          </span>
          <span className="font-bold text-indigo-300 text-sm mt-0.5 block">
            {weather.visibilityKm} km
          </span>
        </div>

        {/* Sun Times */}
        <div className="p-2.5 bg-zinc-800/60 rounded-xl border border-zinc-700/40 hover:border-amber-500/40 transition-colors">
          <span className="text-zinc-400 block text-[10px] font-medium flex items-center gap-1">
            <Sunrise className="h-3 w-3 text-amber-400" /> उदय / अस्त
          </span>
          <span className="font-bold text-amber-300 text-[11px] mt-0.5 block leading-tight">
            {weather.sunriseTime} / {weather.sunsetTime}
          </span>
        </div>

      </div>

      {/* Footer / Last Updated */}
      <div className="flex items-center justify-between text-[11px] text-zinc-400 pt-2 border-t border-zinc-800/80">
        <span className="flex items-center gap-1 text-zinc-400 text-[10px]">
          <Clock className="h-3 w-3 text-amber-400" /> अंतिम अपडेट (Last Updated):
        </span>
        <span className="font-semibold text-zinc-300 text-[10px]">
          {weather.lastUpdated}
        </span>
      </div>

    </div>
  )
}
