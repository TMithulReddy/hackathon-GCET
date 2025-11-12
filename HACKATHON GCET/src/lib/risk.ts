export type RiskPoint = { lat: number; lng: number; score: number };

export function computeRiskScore(params: {
  windSpeedKt?: number;
  waveHeightM?: number;
  tideState?: "rising" | "falling" | "slack";
}): number {
  let score = 0;
  if (params.windSpeedKt !== undefined) {
    // 0-40 kt → 0-60 score
    score += Math.min(60, Math.max(0, (params.windSpeedKt / 40) * 60));
  }
  if (params.waveHeightM !== undefined) {
    // 0-3m → 0-35 score
    score += Math.min(35, Math.max(0, (params.waveHeightM / 3) * 35));
  }
  if (params.tideState) {
    // rising adds slight risk
    score += params.tideState === "rising" ? 5 : params.tideState === "falling" ? 2 : 0;
  }
  return Math.round(Math.min(100, score));
}

export function toHeatColor(score: number): string {
  if (score >= 75) return "#ef4444"; // red
  if (score >= 50) return "#f59e0b"; // orange
  if (score >= 25) return "#84cc16"; // lime
  return "#22c55e"; // green
}


