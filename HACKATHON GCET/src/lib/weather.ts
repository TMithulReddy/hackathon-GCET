export type WeatherData = {
  windSpeedKt: number;
  waveHeightM?: number; // optional if API lacks marine data
  tide?: string;
  description?: string;
};

const OWM_BASE = "https://api.openweathermap.org/data/2.5/weather";

export async function fetchWeather(lat: number, lng: number, apiKey?: string): Promise<WeatherData> {
  const key = apiKey || (import.meta.env.VITE_OWM_API_KEY as string | undefined);
  if (key) {
    const url = `${OWM_BASE}?lat=${lat}&lon=${lng}&appid=${key}&units=metric`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("weather_fetch_failed");
    const json = await res.json();
    const windMs = (json?.wind?.speed ?? 0) as number;
    const windSpeedKt = windMs * 1.94384;
    return {
      windSpeedKt: Math.round(windSpeedKt * 10) / 10,
      description: json?.weather?.[0]?.description,
    };
  }
  // Fallback mock if no key
  return {
    windSpeedKt: 12,
    waveHeightM: 1.2,
    tide: "rising",
    description: "partly cloudy",
  };
}


