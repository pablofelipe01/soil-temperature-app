export interface ThresholdConfig {
  minTempThreshold?: number | null
  maxTempThreshold?: number | null
  minMoistureThreshold?: number | null
  maxMoistureThreshold?: number | null
}

export interface TemperatureSample {
  date: string
  temperature_level_1?: number
  temperature_level_2?: number
  temperature_level_3?: number
  temperature_level_4?: number
}

export interface MoistureSample {
  date: string
  moisture_level_1?: number
  moisture_level_2?: number
  moisture_level_3?: number
  moisture_level_4?: number
}

export interface ThresholdBreach {
  type: 'temperature' | 'moisture'
  condition: 'above_max' | 'below_min'
  date: string
  value: number
  threshold: number
  message: string
}

function avg(values: number[]): number | null {
  if (values.length === 0) return null
  return values.reduce((sum, v) => sum + v, 0) / values.length
}

function round(value: number): number {
  return Math.round(value * 1000) / 1000
}

export function evaluateThresholdBreaches(
  thresholds: ThresholdConfig,
  temperatureData: TemperatureSample[],
  moistureData: MoistureSample[],
): ThresholdBreach[] {
  const breaches: ThresholdBreach[] = []

  const moistureByDate = new Map<string, MoistureSample>()
  for (const sample of moistureData) {
    moistureByDate.set(sample.date, sample)
  }

  for (const tempSample of temperatureData) {
    const tempValues = [
      tempSample.temperature_level_1,
      tempSample.temperature_level_2,
      tempSample.temperature_level_3,
      tempSample.temperature_level_4,
    ].filter((v): v is number => v != null)

    const temperature = avg(tempValues)

    if (temperature != null && thresholds.maxTempThreshold != null && temperature > thresholds.maxTempThreshold) {
      breaches.push({
        type: 'temperature',
        condition: 'above_max',
        date: tempSample.date,
        value: round(temperature),
        threshold: thresholds.maxTempThreshold,
        message: `Temperatura alta detectada (${round(temperature)}°C > ${thresholds.maxTempThreshold}°C)`,
      })
    }

    if (temperature != null && thresholds.minTempThreshold != null && temperature < thresholds.minTempThreshold) {
      breaches.push({
        type: 'temperature',
        condition: 'below_min',
        date: tempSample.date,
        value: round(temperature),
        threshold: thresholds.minTempThreshold,
        message: `Temperatura baja detectada (${round(temperature)}°C < ${thresholds.minTempThreshold}°C)`,
      })
    }

    const moistureSample = moistureByDate.get(tempSample.date)
    if (!moistureSample) continue

    const moistureValues = [
      moistureSample.moisture_level_1,
      moistureSample.moisture_level_2,
      moistureSample.moisture_level_3,
      moistureSample.moisture_level_4,
    ].filter((v): v is number => v != null)

    const moisture = avg(moistureValues)

    if (moisture != null && thresholds.maxMoistureThreshold != null && moisture > thresholds.maxMoistureThreshold) {
      breaches.push({
        type: 'moisture',
        condition: 'above_max',
        date: tempSample.date,
        value: round(moisture),
        threshold: thresholds.maxMoistureThreshold,
        message: `Humedad alta detectada (${round(moisture)} > ${thresholds.maxMoistureThreshold})`,
      })
    }

    if (moisture != null && thresholds.minMoistureThreshold != null && moisture < thresholds.minMoistureThreshold) {
      breaches.push({
        type: 'moisture',
        condition: 'below_min',
        date: tempSample.date,
        value: round(moisture),
        threshold: thresholds.minMoistureThreshold,
        message: `Sequía o humedad baja detectada (${round(moisture)} < ${thresholds.minMoistureThreshold})`,
      })
    }
  }

  return breaches
}

export function buildAlertHash(locationId: string, breaches: ThresholdBreach[]): string {
  const basis = breaches
    .slice(0, 5)
    .map((b) => `${b.type}:${b.condition}:${b.date}:${b.threshold}:${b.value}`)
    .join('|')

  const raw = `${locationId}|${basis}`
  let hash = 0
  for (let i = 0; i < raw.length; i++) {
    hash = (hash << 5) - hash + raw.charCodeAt(i)
    hash |= 0
  }
  return String(hash)
}
