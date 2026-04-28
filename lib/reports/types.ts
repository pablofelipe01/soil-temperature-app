// Shared types for the reports module

export interface ReportLocationSummary {
  id: string
  name: string
  latitude: number
  longitude: number
  areaHectares: number | null
  periodStart: string
  periodEnd: string
  hasBiochar: boolean
  biocharStartDate: string | null
  biocharQuantity: number | null
  biocharUnit: string | null
}

export interface TemperatureRow {
  date: string
  tempLevel1: number | null
  tempLevel2: number | null
  tempLevel3: number | null
  tempLevel4: number | null
}

export interface MonthlyAverage {
  month: string // e.g. "2026-03"
  tempLevel1: number | null
  tempLevel2: number | null
  tempLevel3: number | null
  tempLevel4: number | null
}

export interface LocationTemperatureData {
  location: ReportLocationSummary
  readings: TemperatureRow[]
  monthlyAverages: MonthlyAverage[]
}

export interface BiocharDepthDelta {
  depth: string
  preAvg: number | null
  postAvg: number | null
  delta: number | null
  trend: 'aumento' | 'disminución' | 'sin cambio' | null
}

export interface BiocharAnalysis {
  locationName: string
  biocharDate: string
  sufficient: boolean
  note?: string
  depthDeltas: BiocharDepthDelta[]
}

export interface ReportData {
  generatedAt: string
  periodStart: string
  periodEnd: string
  locationSummaries: ReportLocationSummary[]
  locationData: LocationTemperatureData[]
  biocharAnalyses: BiocharAnalysis[]
}

export const DEPTH_LABELS: Record<string, string> = {
  tempLevel1: '0–7 cm',
  tempLevel2: '7–28 cm',
  tempLevel3: '28–100 cm',
  tempLevel4: '100–289 cm',
}

export const METHODOLOGY_TEXT = `Metodología de medición

Fuente de datos: Google Earth Engine (GEE)
Conjunto de datos satelitales: ERA5-Land (Copernicus Climate Change Service / ECMWF)
Bandas de temperatura del suelo utilizadas:
  • Nivel 1 (stl1): Temperatura del suelo a 0–7 cm de profundidad
  • Nivel 2 (stl2): Temperatura del suelo a 7–28 cm de profundidad
  • Nivel 3 (stl3): Temperatura del suelo a 28–100 cm de profundidad
  • Nivel 4 (stl4): Temperatura del suelo a 100–289 cm de profundidad
Resolución espacial: ~9 km (0.1° × 0.1°)
Frecuencia de muestreo: Diaria (promedios diarios derivados de datos horarios)
Unidad de medida: Grados Celsius (°C)
Conversión: Los valores originales en Kelvin se convierten a Celsius restando 273.15.
Período de disponibilidad: Desde enero de 1950 hasta aproximadamente 3 meses antes de la fecha actual.

Los datos son procesados y almacenados en la base de datos del sistema para consulta histórica y generación de reportes de certificación.`
