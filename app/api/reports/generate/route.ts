import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { aggregateReportData } from '@/lib/reports/data'

const generateSchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha debe estar en formato YYYY-MM-DD'),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha debe estar en formato YYYY-MM-DD'),
  locationIds: z.array(z.string().uuid()).min(1, 'Debe seleccionar al menos una ubicación'),
  format: z.enum(['pdf', 'excel', 'both']),
})

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')
    if (!userId) {
      return NextResponse.json({ error: 'Usuario no autenticado' }, { status: 401 })
    }

    const body = await request.json()
    const validation = generateSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Parámetros inválidos', details: validation.error.format() },
        { status: 400 },
      )
    }

    const { startDate, endDate, locationIds, format } = validation.data

    if (new Date(startDate) > new Date(endDate)) {
      return NextResponse.json(
        { error: 'La fecha de inicio debe ser anterior a la fecha de fin' },
        { status: 400 },
      )
    }

    // Aggregate data from DB
    const reportData = await aggregateReportData(userId, locationIds, startDate, endDate)

    if (reportData.locationSummaries.length === 0) {
      return NextResponse.json(
        { error: 'No se encontraron ubicaciones activas para los IDs proporcionados' },
        { status: 404 },
      )
    }

    const filename = `reporte-temperatura-${startDate}_${endDate}`
    let pdfBase64: string | null = null
    let excelBase64: string | null = null

    // Generate PDF
    if (format === 'pdf' || format === 'both') {
      const { renderToBuffer } = await import('@react-pdf/renderer')
      const { ReportDocument } = await import('@/lib/reports/pdf')
      const React = (await import('react')).default
      // eslint-disable-next-line
      const doc = React.createElement(ReportDocument, { data: reportData }) as any
      const pdfBuffer = await renderToBuffer(doc)
      pdfBase64 = Buffer.from(pdfBuffer).toString('base64')
    }

    // Generate Excel
    if (format === 'excel' || format === 'both') {
      const { generateExcel } = await import('@/lib/reports/excel')
      const excelBuffer = generateExcel(reportData)
      excelBase64 = excelBuffer.toString('base64')
    }

    return NextResponse.json({
      success: true,
      data: {
        pdf: pdfBase64,
        excel: excelBase64,
        filename,
      },
    })
  } catch (error) {
    console.error('Error generando reporte:', error)
    return NextResponse.json(
      { error: 'Error interno al generar el reporte' },
      { status: 500 },
    )
  }
}
