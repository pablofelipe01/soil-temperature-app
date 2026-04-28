import * as XLSX from 'xlsx'
import type { ReportData } from './types'

function fmtDate(d: string): string {
  const parts = d.split('-')
  return `${parts[2]}/${parts[1]}/${parts[0]}`
}

function num2(v: number | null): number | string {
  return v != null ? Math.round(v * 100) / 100 : ''
}

export function generateExcel(data: ReportData): Buffer {
  const wb = XLSX.utils.book_new()

  // ---- Sheet 1: Resumen ----
  const summaryRows = data.locationSummaries.map((loc) => ({
    Ubicación: loc.name,
    Latitud: loc.latitude,
    Longitud: loc.longitude,
    'Hectáreas': loc.areaHectares ?? '',
    'Período inicio': fmtDate(loc.periodStart),
    'Período fin': fmtDate(loc.periodEnd),
    'Biochar aplicado': loc.hasBiochar ? 'Sí' : 'No',
    'Fecha aplicación biochar': loc.biocharStartDate ? fmtDate(loc.biocharStartDate) : '',
    'Cantidad biochar': loc.biocharQuantity ?? '',
    'Unidad': loc.biocharUnit ?? '',
  }))
  const summaryWs = XLSX.utils.json_to_sheet(summaryRows)
  XLSX.utils.book_append_sheet(wb, summaryWs, 'Resumen')

  // ---- Per-location sheets ----
  for (const locData of data.locationData) {
    // Sanitize sheet name (max 31 chars, no invalid chars)
    const sheetName = locData.location.name
      .replace(/[\\/*?:\[\]]/g, '_')
      .slice(0, 31)

    const rows = locData.readings.map((r) => ({
      Fecha: fmtDate(r.date),
      '0–7 cm (°C)': num2(r.tempLevel1),
      '7–28 cm (°C)': num2(r.tempLevel2),
      '28–100 cm (°C)': num2(r.tempLevel3),
      '100–289 cm (°C)': num2(r.tempLevel4),
    }))

    // Append monthly averages
    for (const avg of locData.monthlyAverages) {
      rows.push({
        Fecha: `Prom. ${avg.month}`,
        '0–7 cm (°C)': num2(avg.tempLevel1),
        '7–28 cm (°C)': num2(avg.tempLevel2),
        '28–100 cm (°C)': num2(avg.tempLevel3),
        '100–289 cm (°C)': num2(avg.tempLevel4),
      })
    }

    const ws = XLSX.utils.json_to_sheet(rows)

    // Set column widths
    ws['!cols'] = [
      { wch: 14 },
      { wch: 14 },
      { wch: 14 },
      { wch: 14 },
      { wch: 14 },
    ]

    XLSX.utils.book_append_sheet(wb, ws, sheetName)
  }

  // ---- Biochar sheet ----
  if (data.biocharAnalyses.length > 0) {
    const biocharRows: Record<string, string | number>[] = []

    for (const analysis of data.biocharAnalyses) {
      // Header row for this location
      biocharRows.push({
        Ubicación: analysis.locationName,
        Profundidad: '',
        'Prom. pre-biochar (°C)': '',
        'Prom. post-biochar (°C)': '',
        'Delta (°C)': '',
        Tendencia: analysis.sufficient ? '' : (analysis.note ?? ''),
      })

      if (analysis.sufficient) {
        for (const d of analysis.depthDeltas) {
          biocharRows.push({
            Ubicación: '',
            Profundidad: d.depth,
            'Prom. pre-biochar (°C)': num2(d.preAvg),
            'Prom. post-biochar (°C)': num2(d.postAvg),
            'Delta (°C)': num2(d.delta),
            Tendencia: d.trend ?? '',
          })
        }
      }

      // Blank separator row
      biocharRows.push({ Ubicación: '', Profundidad: '', 'Prom. pre-biochar (°C)': '', 'Prom. post-biochar (°C)': '', 'Delta (°C)': '', Tendencia: '' })
    }

    const biocharWs = XLSX.utils.json_to_sheet(biocharRows)
    biocharWs['!cols'] = [
      { wch: 28 },
      { wch: 16 },
      { wch: 22 },
      { wch: 22 },
      { wch: 12 },
      { wch: 20 },
    ]
    XLSX.utils.book_append_sheet(wb, biocharWs, 'Biochar')
  }

  // Write to buffer
  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })
  return Buffer.from(buf)
}
