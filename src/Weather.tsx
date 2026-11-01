import { useEffect, useState } from "react"

import { Icon } from "@/components/m3e/icon"
import { Popover } from "./Popover"

/** Current weather in Medan from Open-Meteo (no API key; metric units: °C and km/h). */
const URL =
  "https://api.open-meteo.com/v1/forecast?latitude=3.5952&longitude=98.6722&timezone=Asia%2FJakarta" +
  "&current=temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,is_day,wind_speed_10m"
const REFRESH_MS = 15 * 60_000

type Weather = {
  temperature: number
  feelsLike: number
  humidity: number
  wind: number
  code: number
  day: boolean
  time: string
}

/** WMO weather codes, as Open-Meteo reports them. `day` limits an entry to day or night. */
const CONDITIONS: { codes: number[]; day?: boolean; label: string; icon: string }[] = [
  { codes: [0], day: true, label: "Clear", icon: "sunny" },
  { codes: [0], day: false, label: "Clear", icon: "bedtime" },
  { codes: [1], day: true, label: "Mainly clear", icon: "sunny" },
  { codes: [1], day: false, label: "Mainly clear", icon: "bedtime" },
  { codes: [2], day: true, label: "Partly cloudy", icon: "partly_cloudy_day" },
  { codes: [2], day: false, label: "Partly cloudy", icon: "partly_cloudy_night" },
  { codes: [3], label: "Overcast", icon: "cloud" },
  { codes: [45, 48], label: "Fog", icon: "foggy" },
  { codes: [51, 53, 55, 56, 57], label: "Drizzle", icon: "rainy_light" },
  { codes: [61, 63, 66, 80, 81], label: "Rain", icon: "rainy" },
  { codes: [65, 67, 82], label: "Heavy rain", icon: "rainy_heavy" },
  { codes: [71, 73, 75, 77, 85, 86], label: "Snow", icon: "weather_snowy" },
  { codes: [95, 96, 99], label: "Thunderstorm", icon: "thunderstorm" },
]

const conditionOf = (w: Weather) =>
  CONDITIONS.find((c) => c.codes.includes(w.code) && (c.day === undefined || c.day === w.day)) ??
  { label: "Cloudy", icon: "cloud" }

function useWeather() {
  const [weather, setWeather] = useState<Weather | null>(null)
  useEffect(() => {
    let alive = true
    const load = async () => {
      try {
        const res = await fetch(URL)
        if (!res.ok) return
        const { current: c } = await res.json()
        if (!alive) return
        setWeather({
          temperature: c.temperature_2m,
          feelsLike: c.apparent_temperature,
          humidity: c.relative_humidity_2m,
          wind: c.wind_speed_10m,
          code: c.weather_code,
          day: c.is_day === 1,
          time: c.time.slice(11, 16),
        })
      } catch {
        // offline or blocked: the top bar simply leaves the weather out
      }
    }
    load()
    const timer = setInterval(load, REFRESH_MS)
    return () => {
      alive = false
      clearInterval(timer)
    }
  }, [])
  return weather
}

/** Medan's current weather in the top bar; clicking it shows the details. */
export function WeatherMenu({ triggerClassName }: { triggerClassName: string }) {
  const weather = useWeather()
  if (!weather) return null
  const condition = conditionOf(weather)
  const round = Math.round

  return (
    <Popover
      label="Weather in Medan"
      triggerLabel={`Medan: ${condition.label}, ${round(weather.temperature)}°C`}
      tip={`Weather in Medan: ${condition.label.toLowerCase()}, feels like ${round(weather.feelsLike)}°C`}
      triggerClassName={triggerClassName}
      trigger={
        <>
          <Icon name={condition.icon} size={16} />
          <span className="tabular-nums">{round(weather.temperature)}°C</span>
        </>
      }
      className="w-60 p-4"
    >
      <div className="mb-3 flex items-center gap-3">
        <span className="grid size-11 place-items-center rounded-xl bg-(--chip) text-(--accent-ink)">
          <Icon name={condition.icon} size={26} />
        </span>
        <div>
          <p className="text-[22px] leading-none font-semibold tabular-nums">{round(weather.temperature)}°C</p>
          <p className="mt-1 text-(--ink-2)">{condition.label} in Medan</p>
        </div>
      </div>
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-(--ink-2)">
        <dt className="text-(--muted)">Feels like</dt>
        <dd className="text-right tabular-nums">{round(weather.feelsLike)}°C</dd>
        <dt className="text-(--muted)">Humidity</dt>
        <dd className="text-right tabular-nums">{weather.humidity}%</dd>
        <dt className="text-(--muted)">Wind</dt>
        <dd className="text-right tabular-nums">{round(weather.wind)} km/h</dd>
      </dl>
      <p className="mt-3 text-[11px] text-(--muted)">
        Updated {weather.time} WIB · data from{" "}
        <a href="https://open-meteo.com/" target="_blank" rel="noopener noreferrer" className="whitespace-nowrap underline underline-offset-2">
          Open-Meteo
        </a>
      </p>
    </Popover>
  )
}
