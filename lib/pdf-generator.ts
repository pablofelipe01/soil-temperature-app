// Utilidad para generar reportes PDF de temperatura

interface TemperatureData {
  id: string
  date: string
  temperatureCelsius: number
  dataSource: string
  isPostBiochar?: boolean
}

interface TemperatureStats {
  count: number
  min: number
  max: number
  average: number
  range: number
}

interface LocationData {
  id: string
  name: string
  clientName?: string
  clientEmail?: string
  latitude: number
  longitude: number
  areaHectares?: number | null
}

interface PDFReportData {
  location: LocationData
  temperatureData: TemperatureData[]
  temperatureStats: TemperatureStats
  startDate: string
  endDate: string
}

export async function generateTemperaturePDFReport(data: PDFReportData): Promise<void> {
  try {
    // Crear un reporte más simple sin dependencias complejas del lado del cliente
    const reportContent = createPDFContent(data)
    
    // Crear un blob con el contenido HTML y convertirlo a PDF usando window.print
    const printWindow = window.open('', '_blank')
    if (!printWindow) {
      throw new Error('No se pudo abrir la ventana de impresión')
    }
    
    printWindow.document.write(reportContent)
    printWindow.document.close()
    
    // Configurar para impresión/guardado como PDF
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print()
        printWindow.close()
      }, 500)
    }
    
  } catch (error) {
    console.error('Error generando reporte PDF:', error)
    throw error
  }
}

function createPDFContent(data: PDFReportData): string {
  const { location, temperatureData, temperatureStats, startDate, endDate } = data
  
  // Crear gráfico simple con ASCII art o CSS
  const createSimpleChart = () => {
    if (temperatureData.length === 0) return ''
    
    const recentData = temperatureData.slice(-20)
    const maxTemp = Math.max(...recentData.map(d => d.temperatureCelsius))
    const minTemp = Math.min(...recentData.map(d => d.temperatureCelsius))
    const range = maxTemp - minTemp
    
    const chartBars = recentData.map((point) => {
      const height = range > 0 ? ((point.temperatureCelsius - minTemp) / range) * 100 : 50
      const color = height > 70 ? '#ef4444' : height > 30 ? '#f59e0b' : '#3b82f6'
      
      return `
        <div style="
          display: inline-block;
          width: 12px;
          height: ${height}%;
          background-color: ${color};
          margin: 0 1px;
          vertical-align: bottom;
          border-radius: 2px 2px 0 0;
        " title="${point.date}: ${point.temperatureCelsius.toFixed(1)}°C"></div>
      `
    }).join('')
    
    return `
      <div style="margin: 20px 0;">
        <h3 style="margin-bottom: 10px; color: #374151;">📈 Tendencia de Temperatura</h3>
        <div style="
          border: 1px solid #d1d5db;
          padding: 20px;
          background: #f9fafb;
          border-radius: 8px;
          text-align: center;
        ">
          <div style="margin-bottom: 10px; font-size: 12px; color: #6b7280;">
            Máx: ${maxTemp.toFixed(1)}°C | Promedio: ${temperatureStats.average.toFixed(1)}°C | Mín: ${minTemp.toFixed(1)}°C
          </div>
          <div style="
            height: 120px;
            display: flex;
            align-items: flex-end;
            justify-content: center;
            background: white;
            border-radius: 4px;
            padding: 10px;
          ">
            ${chartBars}
          </div>
          <div style="margin-top: 10px; font-size: 11px; color: #9ca3af;">
            📊 ${recentData.length} puntos de datos más recientes
          </div>
        </div>
      </div>
    `
  }
  
  const createDataTable = () => {
    // Mostrar todos los datos en lugar de solo los recientes
    const allData = temperatureData.slice().reverse() // Más recientes primero
    
    const rows = allData.map(record => `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${record.date}</td>
        <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: center; font-weight: bold;">
          ${record.temperatureCelsius.toFixed(2)}°C
        </td>
        <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: center;">${record.dataSource}</td>
        <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: center;">
          ${record.isPostBiochar ? '✅ Sí' : '❌ No'}
        </td>
      </tr>
    `).join('')
    
    return `
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 12px;">
        <thead>
          <tr style="background-color: #f3f4f6;">
            <th style="padding: 12px 8px; border-bottom: 2px solid #d1d5db; text-align: left;">Fecha</th>
            <th style="padding: 12px 8px; border-bottom: 2px solid #d1d5db; text-align: center;">Temperatura</th>
            <th style="padding: 12px 8px; border-bottom: 2px solid #d1d5db; text-align: center;">Fuente</th>
            <th style="padding: 12px 8px; border-bottom: 2px solid #d1d5db; text-align: center;">Post-Biochar</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    `
  }
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Reporte de Temperatura del Suelo - ${location.name}</title>
      <style>
        @media print {
          body { margin: 0; }
          .no-print { display: none; }
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          line-height: 1.5;
          color: #1f2937;
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
          border-bottom: 3px solid #3b82f6;
          padding-bottom: 20px;
        }
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 15px;
          margin: 20px 0;
        }
        .stat-card {
          padding: 15px;
          border-radius: 8px;
          text-align: center;
          border-left: 4px solid;
        }
        .stat-card.registros { background: #f3f4f6; border-left-color: #6b7280; }
        .stat-card.minima { background: #dbeafe; border-left-color: #3b82f6; }
        .stat-card.maxima { background: #fef2f2; border-left-color: #ef4444; }
        .stat-card.promedio { background: #f0fdf4; border-left-color: #10b981; }
        .info-section {
          background: #f9fafb;
          padding: 20px;
          border-radius: 8px;
          margin: 20px 0;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1 style="margin: 0; color: #1f2937; font-size: 28px;">🌡️ REPORTE DE TEMPERATURA DEL SUELO</h1>
        <p style="margin: 10px 0 0 0; font-size: 16px; color: #6b7280;">
          Análisis de Datos Satelitales - ERA5-Land
        </p>
      </div>
      
      <div class="info-section">
        <h2 style="margin-top: 0; color: #374151;">📍 Información de la Ubicación</h2>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 10px;">
          <div><strong>Sitio:</strong> ${location.name}</div>
          <div><strong>Cliente:</strong> ${location.clientName || 'N/A'}</div>
          <div><strong>Email:</strong> ${location.clientEmail || 'N/A'}</div>
          <div><strong>Coordenadas:</strong> ${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}</div>
          <div><strong>Área:</strong> ${location.areaHectares ? `${location.areaHectares} hectáreas` : 'N/A'}</div>
          <div><strong>Período:</strong> ${startDate} al ${endDate}</div>
        </div>
      </div>
      
      <div class="info-section">
        <h2 style="margin-top: 0; color: #374151;">📊 Estadísticas Generales</h2>
        <div class="stats-grid">
          <div class="stat-card registros">
            <div style="font-size: 11px; text-transform: uppercase; color: #6b7280; margin-bottom: 5px;">Registros</div>
            <div style="font-size: 24px; font-weight: bold;">${temperatureStats.count}</div>
          </div>
          <div class="stat-card minima">
            <div style="font-size: 11px; text-transform: uppercase; color: #3b82f6; margin-bottom: 5px;">Mínima</div>
            <div style="font-size: 24px; font-weight: bold; color: #1e40af;">${temperatureStats.min.toFixed(1)}°C</div>
          </div>
          <div class="stat-card maxima">
            <div style="font-size: 11px; text-transform: uppercase; color: #ef4444; margin-bottom: 5px;">Máxima</div>
            <div style="font-size: 24px; font-weight: bold; color: #dc2626;">${temperatureStats.max.toFixed(1)}°C</div>
          </div>
          <div class="stat-card promedio">
            <div style="font-size: 11px; text-transform: uppercase; color: #10b981; margin-bottom: 5px;">Promedio</div>
            <div style="font-size: 24px; font-weight: bold; color: #059669;">${temperatureStats.average.toFixed(1)}°C</div>
          </div>
        </div>
      </div>
      
      ${createSimpleChart()}
      
      <div style="margin: 30px 0;">
        <h2 style="color: #374151;">📋 Todos los Datos de Temperatura</h2>
        ${createDataTable()}
        <p style="font-style: italic; color: #6b7280; text-align: center;">Total de registros consultados: ${temperatureData.length}</p>
      </div>
      
      <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #9ca3af; text-align: center;">
        <p>📅 Reporte generado el ${new Date().toLocaleDateString('es-CO')} a las ${new Date().toLocaleTimeString('es-CO')}</p>
        <p>🛰️ Datos obtenidos del conjunto de datos ERA5-Land de Copernicus Climate Data Store</p>
      </div>
    </body>
    </html>
  `
}