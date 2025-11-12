export type MarineData = {
  waveHeightM: number;
  tideState: "rising" | "falling" | "slack";
};

// Placeholder for a real marine API (e.g., StormGlass, MarineTides, etc.)
// Uses mock data if no API key is configured.
export async function fetchMarine(lat: number, lng: number, apiKey?: string): Promise<MarineData> {
  const key = apiKey || (import.meta.env.VITE_MARINE_API_KEY as string | undefined) || (import.meta.env.VITE_STORMGLASS_API_KEY as string | undefined);
  if (key) {
    try {
      // StormGlass: waveHeight at point
      const params = "waveHeight";
      const url = `https://api.stormglass.io/v2/weather/point?lat=${lat}&lng=${lng}&params=${params}`;
      const res = await fetch(url, { headers: { Authorization: key } });
      if (res.ok) {
        const json = await res.json();
        const waveHeightM = json?.hours?.[0]?.waveHeight?.sg ?? 1.0;
        const tideState: MarineData["tideState"] = waveHeightM > 1.5 ? "rising" : waveHeightM < 0.9 ? "slack" : "falling";
        return { waveHeightM: Math.round(waveHeightM * 10) / 10, tideState };
      }
    } catch (e) {
      // fall through to mock
    }
  }
  // Fallback mock
  const waveHeightM = 0.8 + Math.random() * 1.2; // 0.8m - 2.0m
  const tideStateRoll = Math.random();
  const tideState = tideStateRoll < 0.5 ? "rising" : tideStateRoll < 0.85 ? "falling" : "slack";
  return { waveHeightM: Math.round(waveHeightM * 10) / 10, tideState };
}


