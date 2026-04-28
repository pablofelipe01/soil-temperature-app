import React from 'react'
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import type { ReportData } from './types'
import { METHODOLOGY_TEXT } from './types'

const s = StyleSheet.create({
  page: { padding: 40, fontSize: 9, fontFamily: 'Helvetica' },
  header: { marginBottom: 20 },
  title: { fontSize: 16, fontFamily: 'Helvetica-Bold', marginBottom: 4 },
  subtitle: { fontSize: 10, color: '#555', marginBottom: 2 },
  sectionTitle: { fontSize: 12, fontFamily: 'Helvetica-Bold', marginTop: 16, marginBottom: 8, borderBottomWidth: 1, borderBottomColor: '#22c55e', paddingBottom: 4 },
  table: { marginBottom: 12 },
  tableHeaderRow: { flexDirection: 'row', backgroundColor: '#f3f4f6', borderBottomWidth: 1, borderBottomColor: '#d1d5db' },
  tableRow: { flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor: '#e5e7eb' },
  tableRowAlt: { flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor: '#e5e7eb', backgroundColor: '#f9fafb' },
  thCell: { padding: 4, fontFamily: 'Helvetica-Bold', fontSize: 8 },
  tdCell: { padding: 4, fontSize: 8 },
  // flexible column widths
  colSm: { width: '12%' },
  colMd: { width: '18%' },
  colLg: { width: '25%' },
  note: { fontSize: 8, color: '#6b7280', fontStyle: 'italic', marginBottom: 6 },
  footer: { position: 'absolute', bottom: 25, left: 40, right: 40, flexDirection: 'row', justifyContent: 'space-between', fontSize: 7, color: '#9ca3af' },
  methodText: { fontSize: 8, color: '#374151', lineHeight: 1.6 },
  locationSubtitle: { fontSize: 10, fontFamily: 'Helvetica-Bold', marginTop: 10, marginBottom: 4, color: '#374151' },
  monthAvgRow: { flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor: '#e5e7eb', backgroundColor: '#ecfdf5' },
})

function fmtTemp(v: number | null): string {
  return v != null ? v.toFixed(2) : '—'
}

function fmtDate(d: string): string {
  const parts = d.split('-')
  return `${parts[2]}/${parts[1]}/${parts[0]}`
}

function PageFooter({ generatedAt }: { generatedAt: string }) {
  return (
    <View style={s.footer} fixed>
      <Text>Soil Temperature Monitor — Reporte generado el {fmtDate(generatedAt.split('T')[0])}</Text>
      <Text render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`} />
    </View>
  )
}

export function ReportDocument({ data }: { data: ReportData }) {
  const genDate = data.generatedAt.split('T')[0]

  return (
    <Document>
      {/* ---- Section 1: Location summary ---- */}
      <Page size="A4" style={s.page}>
        <View style={s.header}>
          <Text style={s.title}>Reporte de Monitoreo de Temperatura del Suelo</Text>
          <Text style={s.subtitle}>Período: {fmtDate(data.periodStart)} — {fmtDate(data.periodEnd)}</Text>
          <Text style={s.subtitle}>Fecha de generación: {fmtDate(genDate)}</Text>
        </View>

        <Text style={s.sectionTitle}>Sección 1 — Resumen de ubicaciones monitoreadas</Text>

        <View style={s.table}>
          <View style={s.tableHeaderRow}>
            <Text style={[s.thCell, s.colLg]}>Ubicación</Text>
            <Text style={[s.thCell, s.colMd]}>Coordenadas</Text>
            <Text style={[s.thCell, s.colSm]}>Hectáreas</Text>
            <Text style={[s.thCell, s.colMd]}>Período</Text>
            <Text style={[s.thCell, s.colSm]}>Biochar</Text>
            <Text style={[s.thCell, s.colMd]}>Fecha aplicación</Text>
          </View>
          {data.locationSummaries.map((loc, i) => (
            <View key={loc.id} style={i % 2 === 0 ? s.tableRow : s.tableRowAlt}>
              <Text style={[s.tdCell, s.colLg]}>{loc.name}</Text>
              <Text style={[s.tdCell, s.colMd]}>{loc.latitude.toFixed(4)}, {loc.longitude.toFixed(4)}</Text>
              <Text style={[s.tdCell, s.colSm]}>{loc.areaHectares != null ? loc.areaHectares.toFixed(1) : '—'}</Text>
              <Text style={[s.tdCell, s.colMd]}>{fmtDate(loc.periodStart)} – {fmtDate(loc.periodEnd)}</Text>
              <Text style={[s.tdCell, s.colSm]}>{loc.hasBiochar ? 'Sí' : 'No'}</Text>
              <Text style={[s.tdCell, s.colMd]}>{loc.biocharStartDate ? fmtDate(loc.biocharStartDate) : '—'}</Text>
            </View>
          ))}
        </View>

        <PageFooter generatedAt={data.generatedAt} />
      </Page>

      {/* ---- Section 2: Temperature data per location ---- */}
      {data.locationData.map((locData) => (
        <Page key={locData.location.id} size="A4" style={s.page}>
          <Text style={s.sectionTitle}>Sección 2 — Datos de temperatura: {locData.location.name}</Text>
          <Text style={s.note}>
            Coordenadas: {locData.location.latitude.toFixed(4)}, {locData.location.longitude.toFixed(4)} | Registros: {locData.readings.length}
          </Text>

          <View style={s.table}>
            <View style={s.tableHeaderRow}>
              <Text style={[s.thCell, { width: '20%' }]}>Fecha</Text>
              <Text style={[s.thCell, { width: '20%' }]}>0–7 cm (°C)</Text>
              <Text style={[s.thCell, { width: '20%' }]}>7–28 cm (°C)</Text>
              <Text style={[s.thCell, { width: '20%' }]}>28–100 cm (°C)</Text>
              <Text style={[s.thCell, { width: '20%' }]}>100–289 cm (°C)</Text>
            </View>
            {locData.readings.map((row, i) => (
              <View key={row.date} style={i % 2 === 0 ? s.tableRow : s.tableRowAlt}>
                <Text style={[s.tdCell, { width: '20%' }]}>{fmtDate(row.date)}</Text>
                <Text style={[s.tdCell, { width: '20%' }]}>{fmtTemp(row.tempLevel1)}</Text>
                <Text style={[s.tdCell, { width: '20%' }]}>{fmtTemp(row.tempLevel2)}</Text>
                <Text style={[s.tdCell, { width: '20%' }]}>{fmtTemp(row.tempLevel3)}</Text>
                <Text style={[s.tdCell, { width: '20%' }]}>{fmtTemp(row.tempLevel4)}</Text>
              </View>
            ))}
            {/* Monthly averages */}
            {locData.monthlyAverages.map((avg) => (
              <View key={avg.month} style={s.monthAvgRow}>
                <Text style={[s.tdCell, { width: '20%', fontFamily: 'Helvetica-Bold' }]}>Prom. {avg.month}</Text>
                <Text style={[s.tdCell, { width: '20%' }]}>{fmtTemp(avg.tempLevel1)}</Text>
                <Text style={[s.tdCell, { width: '20%' }]}>{fmtTemp(avg.tempLevel2)}</Text>
                <Text style={[s.tdCell, { width: '20%' }]}>{fmtTemp(avg.tempLevel3)}</Text>
                <Text style={[s.tdCell, { width: '20%' }]}>{fmtTemp(avg.tempLevel4)}</Text>
              </View>
            ))}
          </View>

          <PageFooter generatedAt={data.generatedAt} />
        </Page>
      ))}

      {/* ---- Section 3: Biochar analysis ---- */}
      {data.biocharAnalyses.length > 0 && (
        <Page size="A4" style={s.page}>
          <Text style={s.sectionTitle}>Sección 3 — Análisis de impacto del biochar</Text>

          {data.biocharAnalyses.map((analysis) => (
            <View key={analysis.locationName} style={{ marginBottom: 16 }}>
              <Text style={s.locationSubtitle}>
                {analysis.locationName} — Fecha de aplicación: {fmtDate(analysis.biocharDate)}
              </Text>

              {!analysis.sufficient ? (
                <Text style={s.note}>{analysis.note}</Text>
              ) : (
                <View style={s.table}>
                  <View style={s.tableHeaderRow}>
                    <Text style={[s.thCell, { width: '25%' }]}>Profundidad</Text>
                    <Text style={[s.thCell, { width: '20%' }]}>Prom. pre (°C)</Text>
                    <Text style={[s.thCell, { width: '20%' }]}>Prom. post (°C)</Text>
                    <Text style={[s.thCell, { width: '15%' }]}>Delta (°C)</Text>
                    <Text style={[s.thCell, { width: '20%' }]}>Tendencia</Text>
                  </View>
                  {analysis.depthDeltas.map((d, i) => (
                    <View key={d.depth} style={i % 2 === 0 ? s.tableRow : s.tableRowAlt}>
                      <Text style={[s.tdCell, { width: '25%' }]}>{d.depth}</Text>
                      <Text style={[s.tdCell, { width: '20%' }]}>{fmtTemp(d.preAvg)}</Text>
                      <Text style={[s.tdCell, { width: '20%' }]}>{fmtTemp(d.postAvg)}</Text>
                      <Text style={[s.tdCell, { width: '15%' }]}>{d.delta != null ? (d.delta >= 0 ? '+' : '') + d.delta.toFixed(2) : '—'}</Text>
                      <Text style={[s.tdCell, { width: '20%' }]}>{d.trend ?? '—'}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          ))}

          <PageFooter generatedAt={data.generatedAt} />
        </Page>
      )}

      {/* ---- Section 4: Methodology ---- */}
      <Page size="A4" style={s.page}>
        <Text style={s.sectionTitle}>Sección 4 — Metodología de medición</Text>
        <Text style={s.methodText}>{METHODOLOGY_TEXT}</Text>
        <PageFooter generatedAt={data.generatedAt} />
      </Page>
    </Document>
  )
}
