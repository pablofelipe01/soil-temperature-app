'use client'

import { useState, useEffect } from 'react'
import ProtectedLayout from '@/components/layout/ProtectedLayout'
import { supabase } from '@/lib/supabase/client'
import { FileText, FileSpreadsheet, Download, Loader2, AlertTriangle, CheckCircle2, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/Button'

interface LocationOption {
  id: string
  name: string
  clientName: string
  isActive: boolean
}

type ReportFormat = 'pdf' | 'excel' | 'both'

export default function ReportsPage() {
  // Locations
  const [locations, setLocations] = useState<LocationOption[]>([])
  const [loadingLocations, setLoadingLocations] = useState(true)

  // Form state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [startDate, setStartDate] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() - 30)
    return d.toISOString().split('T')[0]
  })
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0])
  const [format, setFormat] = useState<ReportFormat>('both')

  // Generation state
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<{ pdf: string | null; excel: string | null; filename: string } | null>(null)

  // Load active locations
  useEffect(() => {
    async function load() {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) return
        const res = await fetch('/api/locations?active=true&limit=200', {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'x-user-id': session.user.id,
          },
        })
        const json = await res.json()
        if (json.success) {
          setLocations(json.data)
        }
      } catch {
        // silent
      } finally {
        setLoadingLocations(false)
      }
    }
    load()
  }, [])

  function toggleLocation(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function selectAll() {
    if (selectedIds.size === locations.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(locations.map((l) => l.id)))
    }
  }

  async function handleGenerate() {
    setError('')
    setResult(null)

    if (selectedIds.size === 0) {
      setError('Selecciona al menos una ubicación.')
      return
    }
    if (!startDate || !endDate) {
      setError('Selecciona un rango de fechas válido.')
      return
    }
    if (new Date(startDate) > new Date(endDate)) {
      setError('La fecha de inicio debe ser anterior a la fecha de fin.')
      return
    }

    setGenerating(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { setError('Sesión expirada'); return }

      const res = await fetch('/api/reports/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
          'x-user-id': session.user.id,
        },
        body: JSON.stringify({
          startDate,
          endDate,
          locationIds: Array.from(selectedIds),
          format,
        }),
      })

      const json = await res.json()
      if (!res.ok || !json.success) {
        setError(json.error || 'Error al generar el reporte')
        return
      }
      setResult(json.data)
    } catch {
      setError('Error de conexión al generar el reporte')
    } finally {
      setGenerating(false)
    }
  }

  function downloadBase64(base64: string, filename: string, mime: string) {
    const byteChars = atob(base64)
    const byteNumbers = new Array(byteChars.length)
    for (let i = 0; i < byteChars.length; i++) {
      byteNumbers[i] = byteChars.charCodeAt(i)
    }
    const blob = new Blob([new Uint8Array(byteNumbers)], { type: mime })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  const allSelected = locations.length > 0 && selectedIds.size === locations.length

  return (
    <ProtectedLayout>
      <div className="py-10">
        <div className="max-w-4xl mx-auto sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Generación de Reportes
            </h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Genera reportes de temperatura del suelo en formato PDF o Excel para certificación Puro.earth.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            {/* Left column — Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Date range */}
              <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
                <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                  <Calendar className="h-4 w-4" /> Rango de fechas
                </h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fecha inicio</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm focus:border-green-500 focus:ring-green-500 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fecha fin</label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm focus:border-green-500 focus:ring-green-500 text-sm"
                    />
                  </div>
                </div>
                {/* Quick range buttons */}
                <div className="mt-3 flex flex-wrap gap-2">
                  {([
                    ['Última semana', 7],
                    ['Último mes', 30],
                    ['Últimos 3 meses', 90],
                  ] as const).map(([label, days]) => (
                    <button
                      key={label}
                      onClick={() => {
                        const end = new Date().toISOString().split('T')[0]
                        const start = new Date(Date.now() - days * 86400000).toISOString().split('T')[0]
                        setStartDate(start)
                        setEndDate(end)
                      }}
                      className="px-3 py-1 text-xs rounded-full border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Location selector */}
              <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    Ubicaciones ({selectedIds.size} de {locations.length})
                  </h3>
                  <button
                    onClick={selectAll}
                    className="text-xs text-green-600 hover:text-green-500 cursor-pointer"
                  >
                    {allSelected ? 'Deseleccionar todas' : 'Seleccionar todas'}
                  </button>
                </div>

                {loadingLocations ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                  </div>
                ) : locations.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400 py-4 text-center">
                    No hay ubicaciones activas disponibles.
                  </p>
                ) : (
                  <div className="max-h-64 overflow-y-auto space-y-1 border rounded-md border-gray-200 dark:border-gray-600 p-2">
                    {locations.map((loc) => (
                      <label
                        key={loc.id}
                        className={`flex items-center gap-3 p-2 rounded cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 ${
                          selectedIds.has(loc.id) ? 'bg-green-50 dark:bg-green-900/20' : ''
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedIds.has(loc.id)}
                          onChange={() => toggleLocation(loc.id)}
                          className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 dark:border-gray-600 rounded"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{loc.name}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{loc.clientName}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* Format selector */}
              <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
                <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-4">
                  Formato de salida
                </h3>
                <div className="flex flex-wrap gap-3">
                  {([
                    { value: 'pdf' as const, label: 'PDF', icon: FileText },
                    { value: 'excel' as const, label: 'Excel', icon: FileSpreadsheet },
                    { value: 'both' as const, label: 'Ambos', icon: Download },
                  ]).map(({ value, label, icon: Icon }) => (
                    <button
                      key={value}
                      onClick={() => setFormat(value)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-md border text-sm font-medium cursor-pointer transition-colors ${
                        format === value
                          ? 'bg-green-600 border-green-600 text-white'
                          : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Right column — Generate + Results */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 sticky top-6">
                <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-4">
                  Generar reporte
                </h3>

                <div className="space-y-3 text-xs text-gray-600 dark:text-gray-400 mb-4">
                  <p><strong>Período:</strong> {startDate} — {endDate}</p>
                  <p><strong>Ubicaciones:</strong> {selectedIds.size} seleccionadas</p>
                  <p><strong>Formato:</strong> {format === 'both' ? 'PDF + Excel' : format.toUpperCase()}</p>
                </div>

                <Button
                  onClick={handleGenerate}
                  disabled={generating || selectedIds.size === 0}
                  className="w-full"
                  icon={generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
                >
                  {generating ? 'Generando…' : 'Generar reporte'}
                </Button>

                {/* Error */}
                {error && (
                  <div className="mt-4 p-3 rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
                    </div>
                  </div>
                )}

                {/* Success / Downloads */}
                {result && (
                  <div className="mt-4 space-y-3">
                    <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                      <CheckCircle2 className="h-4 w-4" />
                      <span className="text-sm font-medium">Reporte generado</span>
                    </div>

                    {result.pdf && (
                      <button
                        onClick={() => downloadBase64(result.pdf!, `${result.filename}.pdf`, 'application/pdf')}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-md border border-red-300 dark:border-red-700 text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 text-sm font-medium cursor-pointer"
                      >
                        <FileText className="h-4 w-4" /> Descargar PDF
                      </button>
                    )}

                    {result.excel && (
                      <button
                        onClick={() => downloadBase64(result.excel!, `${result.filename}.xlsx`, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-md border border-green-300 dark:border-green-700 text-green-700 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 text-sm font-medium cursor-pointer"
                      >
                        <FileSpreadsheet className="h-4 w-4" /> Descargar Excel
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedLayout>
  )
}
