import { prisma } from '@/lib/prisma'
import type {
  ReportData,
  ReportLocationSummary,
  LocationTemperatureData,
  TemperatureRow,
  MonthlyAverage,
  BiocharAnalysis,
  BiocharDepthDelta,
} from './types'

const DEPTH_KEYS = ['tempLevel1', 'tempLevel2', 'tempLevel3', 'tempLevel4'] as const
const DEPTH_LABELS = ['0–7 cm', '7–28 cm', '28–100 cm', '100–289 cm']
const MIN_DAYS_FOR_BIOCHAR = 7

function toNum(v: unknown): number | null {
  if (v == null) return null
  const n = Number(v)
  return isNaN(n) ? null : n
}

/**
 * Aggregate all data needed for a report.
 * Queries DB directly — does NOT call external APIs or trigger GEE.
 */
export async function aggregateReportData(
  userId: string,
  locationIds: string[],
  startDate: string,
  endDate: string,
): Promise<ReportData> {
  // 1. Fetch locations with biochar info
  const locations = await prisma.location.findMany({
    where: {
      id: { in: locationIds },
      userId,
      isActive: true,
    },
    select: {
      id: true,
      name: true,
      latitude: true,
      longitude: true,
      areaHectares: true,
      biocharStartDate: true,
      biocharQuantity: true,
      biocharUnit: true,
    },
  })

  // 2. Fetch all temperature readings for selected locations in range
  const readings = await prisma.soilTemperature.findMany({
    where: {
      locationId: { in: locationIds },
      measurementDate: {
        gte: new Date(startDate),
        lte: new Date(endDate),
      },
    },
    orderBy: { measurementDate: 'asc' },
  })

  // Group readings by locationId
  const readingsByLoc = new Map<string, typeof readings>()
  for (const r of readings) {
    const arr = readingsByLoc.get(r.locationId) ?? []
    arr.push(r)
    readingsByLoc.set(r.locationId, arr)
  }

  const locationSummaries: ReportLocationSummary[] = []
  const locationData: LocationTemperatureData[] = []
  const biocharAnalyses: BiocharAnalysis[] = []

  for (const loc of locations) {
    const hasBiochar = loc.biocharStartDate != null
    const summary: ReportLocationSummary = {
      id: loc.id,
      name: loc.name,
      latitude: toNum(loc.latitude) ?? 0,
      longitude: toNum(loc.longitude) ?? 0,
      areaHectares: toNum(loc.areaHectares),
      periodStart: startDate,
      periodEnd: endDate,
      hasBiochar,
      biocharStartDate: loc.biocharStartDate?.toISOString().split('T')[0] ?? null,
      biocharQuantity: toNum(loc.biocharQuantity),
      biocharUnit: loc.biocharUnit,
    }
    locationSummaries.push(summary)

    const locReadings = readingsByLoc.get(loc.id) ?? []

    // Build temperature rows
    const rows: TemperatureRow[] = locReadings.map((r) => ({
      date: r.measurementDate.toISOString().split('T')[0],
      tempLevel1: toNum(r.tempLevel1),
      tempLevel2: toNum(r.tempLevel2),
      tempLevel3: toNum(r.tempLevel3),
      tempLevel4: toNum(r.tempLevel4),
    }))

    // Monthly averages
    const monthlyAverages = computeMonthlyAverages(rows)

    locationData.push({ location: summary, readings: rows, monthlyAverages })

    // Biochar analysis
    if (hasBiochar && loc.biocharStartDate) {
      const analysis = computeBiocharAnalysis(
        loc.name,
        loc.biocharStartDate,
        locReadings,
      )
      biocharAnalyses.push(analysis)
    }
  }

  return {
    generatedAt: new Date().toISOString(),
    periodStart: startDate,
    periodEnd: endDate,
    locationSummaries,
    locationData,
    biocharAnalyses,
  }
}

function computeMonthlyAverages(rows: TemperatureRow[]): MonthlyAverage[] {
  const monthMap = new Map<string, { sums: number[]; counts: number[] }>()

  for (const row of rows) {
    const month = row.date.slice(0, 7) // "YYYY-MM"
    let entry = monthMap.get(month)
    if (!entry) {
      entry = { sums: [0, 0, 0, 0], counts: [0, 0, 0, 0] }
      monthMap.set(month, entry)
    }
    const vals = [row.tempLevel1, row.tempLevel2, row.tempLevel3, row.tempLevel4]
    for (let i = 0; i < 4; i++) {
      if (vals[i] != null) {
        entry.sums[i] += vals[i]!
        entry.counts[i]++
      }
    }
  }

  const result: MonthlyAverage[] = []
  for (const [month, entry] of monthMap) {
    result.push({
      month,
      tempLevel1: entry.counts[0] > 0 ? entry.sums[0] / entry.counts[0] : null,
      tempLevel2: entry.counts[1] > 0 ? entry.sums[1] / entry.counts[1] : null,
      tempLevel3: entry.counts[2] > 0 ? entry.sums[2] / entry.counts[2] : null,
      tempLevel4: entry.counts[3] > 0 ? entry.sums[3] / entry.counts[3] : null,
    })
  }
  return result
}

function computeBiocharAnalysis(
  locationName: string,
  biocharDate: Date,
  readings: { measurementDate: Date; tempLevel1: unknown; tempLevel2: unknown; tempLevel3: unknown; tempLevel4: unknown }[],
): BiocharAnalysis {
  const biocharTime = biocharDate.getTime()
  const thirtyDaysMs = 30 * 86400000

  const preStart = biocharTime - thirtyDaysMs
  const postEnd = biocharTime + thirtyDaysMs

  const pre = readings.filter((r) => {
    const t = r.measurementDate.getTime()
    return t >= preStart && t < biocharTime
  })
  const post = readings.filter((r) => {
    const t = r.measurementDate.getTime()
    return t >= biocharTime && t <= postEnd
  })

  const sufficient = pre.length >= MIN_DAYS_FOR_BIOCHAR && post.length >= MIN_DAYS_FOR_BIOCHAR

  const depthDeltas: BiocharDepthDelta[] = DEPTH_KEYS.map((key, i) => {
    if (!sufficient) {
      return { depth: DEPTH_LABELS[i], preAvg: null, postAvg: null, delta: null, trend: null }
    }
    const preVals = pre.map((r) => toNum(r[key])).filter((v): v is number => v != null)
    const postVals = post.map((r) => toNum(r[key])).filter((v): v is number => v != null)

    if (preVals.length === 0 || postVals.length === 0) {
      return { depth: DEPTH_LABELS[i], preAvg: null, postAvg: null, delta: null, trend: null }
    }

    const preAvg = preVals.reduce((a, b) => a + b, 0) / preVals.length
    const postAvg = postVals.reduce((a, b) => a + b, 0) / postVals.length
    const delta = postAvg - preAvg
    const trend = Math.abs(delta) < 0.05 ? 'sin cambio' as const : delta > 0 ? 'aumento' as const : 'disminución' as const

    return { depth: DEPTH_LABELS[i], preAvg, postAvg, delta, trend }
  })

  return {
    locationName,
    biocharDate: biocharDate.toISOString().split('T')[0],
    sufficient,
    note: sufficient ? undefined : 'Datos insuficientes para análisis comparativo',
    depthDeltas,
  }
}
