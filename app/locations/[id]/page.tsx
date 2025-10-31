'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import ProtectedLayout from '@/components/layout/ProtectedLayout'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import dynamic from 'next/dynamic'
import '../../../styles/heatmap.css'

// Importar dinámicamente el componente del mapa simple
const SimpleMap = dynamic(() => import('@/components/maps/SimpleMap'), { 
  ssr: false,
  loading: () => <div className="h-96 w-full bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse flex items-center justify-center">
    <span className="text-gray-500">Preparando mapa...</span>
  </div>
})

// Importar dinámicamente el componente de imagen satelital
const SatelliteImagery = dynamic(() => import('@/components/maps/SatelliteImagery'), { 
  ssr: false,
  loading: () => <div className="h-96 w-full bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse flex items-center justify-center">
    <span className="text-gray-500">Cargando imagen satelital...</span>
  </div>
})

interface Location {
  id: string
  name: string
  description?: string
  latitude: number
  longitude: number
  elevation?: number
  soilType?: string
  landUse?: string
  clientName: string
  clientEmail?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  _count?: {
    soilTemperatures: number
  }
}

interface TemperatureStats {
  count: number
  min: number
  max: number
  average: number
  range: number
}

interface TemperatureData {
  id: string
  date: string
  temperatureCelsius: number
  dataSource: string
}



export default function LocationDetailPage() {
  const params = useParams()
  const locationId = params.id as string
  
  const [location, setLocation] = useState<Location | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [temperatureData, setTemperatureData] = useState<TemperatureData[]>([])
  const [temperatureStats, setTemperatureStats] = useState<TemperatureStats | null>(null)
  const [loadingTemperature, setLoadingTemperature] = useState(false)
  
  // Estado para controlar qué vista mostrar
  const [viewMode, setViewMode] = useState<'charts' | 'heatmap' | 'satellite'>('charts')
  
  // Estado para el dropdown de reportes
  const [showReportDropdown, setShowReportDropdown] = useState(false)
  const [generatingReport, setGeneratingReport] = useState(false)
  
  // Estados para control de fechas de consulta
  const [startDate, setStartDate] = useState(() => {
    const date = new Date()
    date.setDate(date.getDate() - 30)
    return date.toISOString().split('T')[0]
  })
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split('T')[0]
  })
  const [forceRefresh, setForceRefresh] = useState(false)
  const [temperatureError, setTemperatureError] = useState('')

  // Efecto para cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (!target.closest('.report-dropdown-container')) {
        setShowReportDropdown(false)
      }
    }

    if (showReportDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showReportDropdown])

  // Cargar datos de la ubicación
  useEffect(() => {
    const fetchLocation = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) return

        const response = await fetch(`/api/locations/${locationId}`, {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'x-user-id': session.user.id
          }
        })

        if (response.ok) {
          const result = await response.json()
          if (result.success) {
            setLocation(result.data)
          } else {
            setError(result.error || 'Error al cargar la ubicación')
          }
        } else {
          setError('Error al cargar la ubicación')
        }
      } catch (err) {
        setError('Error al conectar con el servidor')
        console.error('Error fetching location:', err)
      } finally {
        setLoading(false)
      }
    }

    if (locationId) {
      fetchLocation()
    } else {
      setError('ID de ubicación inválido')
      setLoading(false)
    }
  }, [locationId])

  // Función para consultar datos de temperatura con parámetros configurables
  const fetchTemperatureData = useCallback(async (queryStartDate?: string, queryEndDate?: string, refresh = false) => {
    if (!location) return

    setLoadingTemperature(true)
    setTemperatureError('')
    
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const params = new URLSearchParams({
        locationId: locationId,
        startDate: queryStartDate || startDate,
        endDate: queryEndDate || endDate,
        forceRefresh: refresh.toString()
      })

      const response = await fetch(`/api/temperature-data?${params}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'x-user-id': session.user.id
        }
      })

      const result = await response.json()
      
      if (response.ok && result.success) {
        setTemperatureData(result.data || [])
        setTemperatureStats(result.stats)
        setTemperatureError('') // Limpiar errores previos
      } else {
        // Manejar errores informativos de disponibilidad de datos
        let errorMessage = result.error || 'Error al consultar datos de temperatura'
        
        if (result.suggestion) {
          errorMessage += '\n\n💡 ' + result.suggestion
        }
        
        if (result.availableDataUntil) {
          errorMessage += '\n\n📅 Datos disponibles hasta: ' + new Date(result.availableDataUntil).toLocaleDateString('es-ES')
        }
        
        setTemperatureError(errorMessage)
        setTemperatureData([])
        setTemperatureStats(null)
      }
    } catch (err) {
      console.error('Error fetching temperature data:', err)
      setTemperatureError('Error de conexión')
    } finally {
      setLoadingTemperature(false)
    }
  }, [locationId, startDate, endDate, location])

  // Cargar datos de temperatura iniciales
  useEffect(() => {
    if (location) {
      fetchTemperatureData()
    }
  }, [location, fetchTemperatureData])

  // Manejar consulta personalizada
  const handleCustomQuery = async () => {
    await fetchTemperatureData(startDate, endDate, forceRefresh)
  }

  const handleDeleteLocation = async () => {
    if (!location || !window.confirm('¿Estás seguro de que deseas eliminar esta ubicación?')) {
      return
    }

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const response = await fetch(`/api/locations/${locationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'x-user-id': session.user.id
        }
      })

      if (response.ok) {
        // Redirigir a la lista de ubicaciones
        window.location.href = '/locations'
      } else {
        const result = await response.json()
        alert(result.error || 'Error al eliminar la ubicación')
      }
    } catch (err) {
      console.error('Error deleting location:', err)
      alert('Error al eliminar la ubicación')
    }
  }

  // Funciones para generar reportes
  const generateExcelReport = async () => {
    if (!location || temperatureData.length === 0) {
      alert('No hay datos disponibles para generar el reporte')
      return
    }

    try {
      setGeneratingReport(true)
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const params = new URLSearchParams({
        locationId: locationId,
        startDate: startDate,
        endDate: endDate,
        format: 'excel'
      })

      const response = await fetch(`/api/reports/temperature?${params}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        }
      })

      if (response.ok) {
        // Descargar el archivo
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `reporte_temperatura_${location.name.replace(/[^a-zA-Z0-9]/g, '_')}_${startDate}_${endDate}.xlsx`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)
      } else {
        const result = await response.json()
        alert(result.error || 'Error al generar el reporte Excel')
      }
    } catch (err) {
      console.error('Error generating Excel report:', err)
      alert('Error al generar el reporte Excel')
    } finally {
      setGeneratingReport(false)
      setShowReportDropdown(false)
    }
  }

  const generatePDFReport = async () => {
    if (!location || temperatureData.length === 0) {
      alert('No hay datos disponibles para generar el reporte')
      return
    }

    try {
      setGeneratingReport(true)
      
      // Usar la nueva utilidad de generación de PDF más simple
      const { generateTemperaturePDFReport } = await import('@/lib/pdf-generator')
      
      // Convertir los datos al formato esperado
      const reportData = {
        location: {
          id: location.id,
          name: location.name,
          clientName: location.clientName,
          clientEmail: location.clientEmail,
          latitude: Number(location.latitude),
          longitude: Number(location.longitude),
          areaHectares: null // No está disponible en esta interfaz
        },
        temperatureData,
        temperatureStats: temperatureStats!,
        startDate,
        endDate
      }
      
      await generateTemperaturePDFReport(reportData)

    } catch (err) {
      console.error('Error generating PDF report:', err)
      alert('Error al generar el reporte PDF')
    } finally {
      setGeneratingReport(false)
      setShowReportDropdown(false)
    }
  }

  if (loading) {
    return (
      <ProtectedLayout>
        <div className="py-10">
          <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          </div>
        </div>
      </ProtectedLayout>
    )
  }

  if (error || !location) {
    return (
      <ProtectedLayout>
        <div className="py-10">
          <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                {error || 'Ubicación no encontrada'}
              </h3>
              <Link
                href="/locations"
                className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
              >
                ← Volver a ubicaciones
              </Link>
            </div>
          </div>
        </div>
      </ProtectedLayout>
    )
  }

  return (
    <ProtectedLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header con navegación y acciones */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <Link
                href="/locations"
                className="inline-flex items-center text-sm font-medium text-white hover:text-blue-200 transition-colors drop-shadow-md"
              >
                <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Volver a ubicaciones
              </Link>
              
              <div className="flex items-center space-x-3">
                <Link
                  href={`/locations/${locationId}/edit`}
                  className="inline-flex items-center px-4 py-2 border border-white/30 rounded-lg text-sm font-medium text-white bg-white/10 hover:bg-white/20 backdrop-blur-md transition-colors shadow-lg"
                >
                  <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Editar
                </Link>
                <button
                  onClick={handleDeleteLocation}
                  className="inline-flex items-center px-4 py-2 border border-red-400/50 rounded-lg text-sm font-medium text-white bg-red-600/30 hover:bg-red-600/50 backdrop-blur-md transition-colors shadow-lg"
                >
                  <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Eliminar
                </button>
              </div>
            </div>

            {/* Título y descripción */}
            <div className="backdrop-blur-xl bg-white/15 rounded-xl shadow-2xl border border-white/30 p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h1 className="text-3xl font-bold text-white mb-2 drop-shadow-lg">
                    {location.name}
                  </h1>
                  {location.description && (
                    <p className="text-white/90 max-w-3xl drop-shadow-md">
                      {location.description}
                    </p>
                  )}
                </div>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium backdrop-blur-md shadow-lg ${
                  location.isActive 
                    ? 'bg-green-500/40 text-white border border-green-300/40'
                    : 'bg-gray-500/40 text-white border border-gray-300/40'
                }`}>
                  {location.isActive ? '✓ Activo' : 'Inactivo'}
                </span>
              </div>
            </div>
          </div>

          {/* Grid principal */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Sidebar con información */}
            <div className="lg:col-span-1 space-y-6">
              {/* Información de la ubicación */}
              <div className="backdrop-blur-xl bg-white/15 rounded-xl shadow-2xl border border-white/30 overflow-hidden">
                <div className="px-5 py-4 border-b border-white/20">
                  <h2 className="text-sm font-semibold text-white uppercase tracking-wide drop-shadow-md">
                    Detalles
                  </h2>
                </div>
                <div className="p-5 space-y-4">
                  <div>
                    <p className="text-xs font-medium text-white/70 uppercase tracking-wide mb-1">Cliente</p>
                    <p className="text-sm font-medium text-white drop-shadow-md">{location.clientName}</p>
                    {location.clientEmail && (
                      <p className="text-xs text-white/80 mt-0.5">{location.clientEmail}</p>
                    )}
                  </div>
                  
                  <div>
                    <p className="text-xs font-medium text-white/70 uppercase tracking-wide mb-1">Coordenadas</p>
                    <p className="text-sm text-white font-mono drop-shadow-md">
                      {parseFloat(location.latitude.toString()).toFixed(6)}
                    </p>
                    <p className="text-sm text-white font-mono drop-shadow-md">
                      {parseFloat(location.longitude.toString()).toFixed(6)}
                    </p>
                  </div>

                  {location.elevation && (
                    <div>
                      <p className="text-xs font-medium text-white/70 uppercase tracking-wide mb-1">Elevación</p>
                      <p className="text-sm text-white drop-shadow-md">{location.elevation}m</p>
                    </div>
                  )}

                  {location.soilType && (
                    <div>
                      <p className="text-xs font-medium text-white/70 uppercase tracking-wide mb-1">Tipo de suelo</p>
                      <p className="text-sm text-white drop-shadow-md">{location.soilType}</p>
                    </div>
                  )}

                  {location.landUse && (
                    <div>
                      <p className="text-xs font-medium text-white/70 uppercase tracking-wide mb-1">Uso del suelo</p>
                      <p className="text-sm text-white drop-shadow-md">{location.landUse}</p>
                    </div>
                  )}

                  <div className="pt-4 border-t border-white/20">
                    <p className="text-xs font-medium text-white/70 uppercase tracking-wide mb-1">Creado</p>
                    <p className="text-sm text-white drop-shadow-md">
                      {new Date(location.createdAt).toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>

                  {location._count && (
                    <div>
                      <p className="text-xs font-medium text-white/70 uppercase tracking-wide mb-1">Registros</p>
                      <p className="text-2xl font-bold text-blue-300 drop-shadow-lg">
                        {location._count.soilTemperatures}
                      </p>
                      <p className="text-xs text-white/70">datos de temperatura</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Acciones rápidas */}
              <div className="backdrop-blur-xl bg-white/15 rounded-xl shadow-2xl border border-white/30 overflow-hidden">
                <div className="px-5 py-4 border-b border-white/20">
                  <h2 className="text-sm font-semibold text-white uppercase tracking-wide drop-shadow-md">
                    Acciones
                  </h2>
                </div>
                <div className="p-5 space-y-2">
                  <button
                    onClick={() => {
                      const tempSection = document.querySelector('[data-temperature-section]')
                      tempSection?.scrollIntoView({ behavior: 'smooth' })
                    }}
                    className="w-full inline-flex items-center justify-center px-4 py-2.5 bg-blue-600/60 hover:bg-blue-600/80 text-white rounded-lg text-sm font-medium transition-colors shadow-lg backdrop-blur-sm"
                  >
                    <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    Ver Temperatura
                  </button>
                  
                  <button
                    onClick={() => {
                      const endD = new Date().toISOString().split('T')[0]
                      const startD = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
                      setStartDate(startD)
                      setEndDate(endD)
                      fetchTemperatureData(startD, endD, false)
                    }}
                    className="w-full inline-flex items-center justify-center px-4 py-2.5 bg-white/20 backdrop-blur-md border border-white/30 hover:bg-white/30 text-white rounded-lg text-sm font-medium transition-colors shadow-lg"
                  >
                    <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Últimos 7 días
                  </button>
                  
                  <Link
                    href={`/locations/${locationId}/reports`}
                    className="w-full inline-flex items-center justify-center px-4 py-2.5 bg-white/20 backdrop-blur-md border border-white/30 hover:bg-white/30 text-white rounded-lg text-sm font-medium transition-colors shadow-lg"
                  >
                    <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Ver Reportes
                  </Link>
                </div>
              </div>
            </div>

            {/* Contenido principal */}
            <div className="lg:col-span-3 space-y-6" data-temperature-section>
              {/* Panel de consulta de temperatura */}
              <div className="backdrop-blur-xl bg-white/15 rounded-xl shadow-2xl border border-white/30 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Consulta de Temperatura del Suelo
                    </h2>
                    {loadingTemperature && (
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                        <span className="text-sm text-gray-500 dark:text-gray-400">Cargando...</span>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Controles de consulta */}
                <div className="px-6 py-5 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">
                        Fecha de inicio
                      </label>
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="block w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm px-3 py-2"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">
                        Fecha de fin
                      </label>
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="block w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm px-3 py-2"
                      />
                    </div>
                    
                    <div className="flex items-end">
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={forceRefresh}
                          onChange={(e) => setForceRefresh(e.target.checked)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded cursor-pointer"
                        />
                        <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                          Forzar actualización
                        </span>
                      </label>
                    </div>
                    
                    <div className="flex items-end">
                      <button
                        onClick={handleCustomQuery}
                        disabled={loadingTemperature}
                        className="w-full inline-flex justify-center items-center px-4 py-2.5 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <svg className={`mr-2 h-4 w-4 ${loadingTemperature ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={loadingTemperature ? "M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" : "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"} />
                        </svg>
                        Consultar
                      </button>
                    </div>
                  </div>
                  
                  {temperatureError && (
                    <div className="mt-4 p-4 rounded-lg bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800">
                      <div className="flex items-start">
                        <div className="flex-shrink-0">
                          <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="ml-3 flex-1">
                          <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-1">
                            Datos no disponibles
                          </h4>
                          <div className="text-sm text-yellow-700 dark:text-yellow-300 whitespace-pre-line">
                            {temperatureError}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Controles de vista y reportes */}
                <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                      Visualización
                    </h4>
                    <div className="flex items-center space-x-3">
                      {/* Botón de generar reporte */}
                      <div className="relative report-dropdown-container">
                        <button
                          onClick={() => setShowReportDropdown(!showReportDropdown)}
                          disabled={generatingReport || temperatureData.length === 0}
                          className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {generatingReport ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                              Generando...
                            </>
                          ) : (
                            <>
                              📊 Generar Reporte
                              <svg className="ml-2 -mr-1 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                              </svg>
                            </>
                          )}
                        </button>

                        {/* Dropdown de opciones */}
                        {showReportDropdown && !generatingReport && (
                          <div className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 z-50">
                            <div className="py-1">
                              <button
                                onClick={generateExcelReport}
                                className="group flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 w-full text-left"
                              >
                                <svg className="mr-3 h-5 w-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm0 2h12v10H4V5z"/>
                                  <path d="M6 7h8v2H6V7zm0 4h8v2H6v-2z"/>
                                </svg>
                                Descargar Excel
                                <span className="ml-auto text-xs text-gray-500">.xlsx</span>
                              </button>
                              <button
                                onClick={generatePDFReport}
                                className="group flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 w-full text-left"
                              >
                                <svg className="mr-3 h-5 w-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd"/>
                                  <path d="M8 10a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z"/>
                                  <path d="M8 12a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z"/>
                                  <path d="M8 14a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z"/>
                                </svg>
                                Descargar PDF
                                <span className="ml-auto text-xs text-gray-500">.pdf</span>
                              </button>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Botones de vista */}
                      <div className="flex rounded-md shadow-sm">
                        <button
                          onClick={() => setViewMode('charts')}
                          className={`px-4 py-2 text-sm font-medium rounded-l-md border ${
                            viewMode === 'charts'
                              ? 'bg-blue-600 border-blue-600 text-white'
                              : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                          }`}
                        >
                          📊 Gráficos
                        </button>
                        <button
                          onClick={() => setViewMode('heatmap')}
                          className={`px-4 py-2 text-sm font-medium border-t border-r border-b ${
                            viewMode === 'heatmap'
                              ? 'bg-blue-600 border-blue-600 text-white'
                              : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                          }`}
                        >
                          🗺️ Mapa de Calor
                        </button>
                        <button
                          onClick={() => setViewMode('satellite')}
                          className={`px-4 py-2 text-sm font-medium rounded-r-md border ${
                            viewMode === 'satellite'
                              ? 'bg-blue-600 border-blue-600 text-white'
                              : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                          }`}
                        >
                          🛰️ Imagen Satelital
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="p-6">
                  {temperatureStats && (
                    <div className="mb-6">
                      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 mb-4">
                        <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg text-center border-l-4 border-gray-500">
                          <dt className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Registros</dt>
                          <dd className="text-2xl font-bold text-gray-900 dark:text-gray-100">{temperatureStats.count}</dd>
                        </div>
                        <div className="bg-blue-50 dark:bg-blue-900 p-4 rounded-lg text-center border-l-4 border-blue-500">
                          <dt className="text-xs font-medium text-blue-600 dark:text-blue-300 uppercase tracking-wide">Mínima</dt>
                          <dd className="text-2xl font-bold text-blue-700 dark:text-blue-200">{temperatureStats.min.toFixed(1)}°C</dd>
                        </div>
                        <div className="bg-red-50 dark:bg-red-900 p-4 rounded-lg text-center border-l-4 border-red-500">
                          <dt className="text-xs font-medium text-red-600 dark:text-red-300 uppercase tracking-wide">Máxima</dt>
                          <dd className="text-2xl font-bold text-red-700 dark:text-red-200">{temperatureStats.max.toFixed(1)}°C</dd>
                        </div>
                        <div className="bg-green-50 dark:bg-green-900 p-4 rounded-lg text-center border-l-4 border-green-500">
                          <dt className="text-xs font-medium text-green-600 dark:text-green-300 uppercase tracking-wide">Promedio</dt>
                          <dd className="text-2xl font-bold text-green-700 dark:text-green-200">{temperatureStats.average.toFixed(1)}°C</dd>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div className="bg-orange-50 dark:bg-orange-900 p-4 rounded-lg text-center border-l-4 border-orange-500">
                          <dt className="text-xs font-medium text-orange-600 dark:text-orange-300 uppercase tracking-wide">Rango</dt>
                          <dd className="text-xl font-bold text-orange-700 dark:text-orange-200">{temperatureStats.range.toFixed(1)}°C</dd>
                        </div>
                        <div className="bg-purple-50 dark:bg-purple-900 p-4 rounded-lg text-center border-l-4 border-purple-500">
                          <dt className="text-xs font-medium text-purple-600 dark:text-purple-300 uppercase tracking-wide">Período</dt>
                          <dd className="text-lg font-bold text-purple-700 dark:text-purple-200">
                            {startDate} al {endDate}
                          </dd>
                        </div>
                      </div>
                    </div>
                  )}

                  {temperatureData.length > 0 ? (
                    <>
                      {viewMode === 'charts' ? (
                        // Visualización con gráficos
                        <>
                      {/* Gráfico visual de temperatura */}
                      <div className="mb-6 temperature-chart">
                        <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
                          Tendencia de Temperatura
                        </h4>
                        <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg border">
                          {(() => {
                            if (!temperatureStats || temperatureData.length === 0) return null
                            
                            const maxTemp = temperatureStats.max
                            const minTemp = temperatureStats.min
                            const range = maxTemp - minTemp
                            
                            // Tomar una muestra de datos para el gráfico
                            const sampleData = temperatureData.slice(-20) // Últimos 20 puntos
                            
                            return (
                              <div className="space-y-2">
                                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                                  <span>Máx: {maxTemp.toFixed(1)}°C</span>
                                  <span>Promedio: {temperatureStats.average.toFixed(1)}°C</span>
                                  <span>Mín: {minTemp.toFixed(1)}°C</span>
                                </div>
                                
                                <div className="relative h-24 bg-white dark:bg-gray-800 rounded border">
                                  <div className="absolute inset-0 flex items-end justify-between px-1">
                                    {sampleData.map((point) => {
                                      const height = range > 0 ? ((parseFloat(point.temperatureCelsius.toString()) - minTemp) / range) * 100 : 50
                                      const color = height > 70 ? 'bg-red-500' : height > 30 ? 'bg-yellow-500' : 'bg-blue-500'
                                      
                                      return (
                                        <div
                                          key={point.id}
                                          className={`w-1 ${color} rounded-t transition-all duration-300 hover:opacity-75`}
                                          style={{ height: `${Math.max(height, 5)}%` }}
                                          title={`${point.date}: ${parseFloat(point.temperatureCelsius.toString()).toFixed(1)}°C`}
                                        />
                                      )
                                    })}
                                  </div>
                                </div>
                                
                                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                                  <span>{sampleData[0]?.date}</span>
                                  <span className="text-center">📊 {sampleData.length} puntos</span>
                                  <span>{sampleData[sampleData.length - 1]?.date}</span>
                                </div>
                                
                                <div className="flex justify-center items-center space-x-4 text-xs">
                                  <div className="flex items-center">
                                    <div className="w-3 h-3 bg-red-500 rounded mr-1"></div>
                                    <span className="text-gray-600 dark:text-gray-300">Alta</span>
                                  </div>
                                  <div className="flex items-center">
                                    <div className="w-3 h-3 bg-yellow-500 rounded mr-1"></div>
                                    <span className="text-gray-600 dark:text-gray-300">Media</span>
                                  </div>
                                  <div className="flex items-center">
                                    <div className="w-3 h-3 bg-blue-500 rounded mr-1"></div>
                                    <span className="text-gray-600 dark:text-gray-300">Baja</span>
                                  </div>
                                </div>
                              </div>
                            )
                          })()}
                        </div>
                      </div>

                      {/* Tabla de datos */}
                      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                        <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                          <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wide">
                            Todos los Datos
                          </h4>
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                            {temperatureData.length} registros
                          </span>
                        </div>
                        <div className="max-h-96 overflow-y-auto">
                          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-900/50 sticky top-0 z-10">
                              <tr>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                  Fecha
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                  Temperatura
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                  Fuente
                                </th>
                              </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                              {temperatureData.slice().reverse().map((record, index) => (
                                <tr key={record.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                                    {new Date(record.date).toLocaleDateString('es-ES', { 
                                      year: 'numeric', 
                                      month: 'short', 
                                      day: 'numeric' 
                                    })}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                                      {parseFloat(record.temperatureCelsius.toString()).toFixed(2)}°C
                                    </span>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                                    <div className="flex items-center">
                                      <svg className="mr-2 h-4 w-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z"/>
                                      </svg>
                                      {record.dataSource}
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        {temperatureData.length > 10 && (
                          <div className="bg-gray-50 dark:bg-gray-900/50 px-6 py-3 border-t border-gray-200 dark:border-gray-700">
                            <p className="text-xs text-center text-gray-500 dark:text-gray-400 flex items-center justify-center">
                              <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              Desplázate para ver todos los registros
                            </p>
                          </div>
                        )}
                      </div>
                        </>
                      ) : viewMode === 'heatmap' ? (
                        // Visualización con mapa de calor
                        <div className="space-y-6">
                          <div>
                            <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
                              Mapa de Calor de Temperaturas
                            </h4>
                            <div className="relative">
                              <SimpleMap locationId={locationId} />
                            </div>
                          </div>
                          
                          <div>
                            <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
                              Información del Mapa
                            </h4>
                            <div className="bg-blue-50 dark:bg-blue-900 p-4 rounded-lg">
                              <div className="flex">
                                <div className="flex-shrink-0">
                                  <span className="text-blue-400 text-lg">ℹ️</span>
                                </div>
                                <div className="ml-3 flex-1">
                                  <h5 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-1">
                                    Visualización Interactiva
                                  </h5>
                                  <div className="text-sm text-blue-700 dark:text-blue-300">
                                    <p className="mb-2">
                                      El mapa muestra la distribución de temperaturas del suelo utilizando un gradiente de colores:
                                    </p>
                                    <ul className="list-disc list-inside space-y-1 text-xs">
                                      <li><span className="text-blue-600">🟦 Azul:</span> Temperaturas más bajas (frías)</li>
                                      <li><span className="text-green-600">🟢 Verde:</span> Temperaturas medias</li>
                                      <li><span className="text-red-600">🟥 Rojo:</span> Temperaturas más altas (cálidas)</li>
                                    </ul>
                                    <p className="mt-2 text-xs">
                                      Pasa el cursor sobre los puntos para ver detalles específicos de cada ubicación.
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        // Visualización con imagen satelital
                        <SatelliteImagery 
                          latitude={Number(location.latitude)}
                          longitude={Number(location.longitude)}
                          locationName={location.name}
                        />
                      )}
                    </>
                  ) : (
                    <div className="text-center py-8">
                      <div className="text-6xl mb-4">📊</div>
                      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                        No hay datos para el período seleccionado
                      </h3>
                      <p className="text-gray-500 dark:text-gray-400 mb-6">
                        Intenta cambiar el rango de fechas o forzar la actualización para obtener datos desde Google Earth Engine.
                      </p>
                      
                      <div className="flex flex-col sm:flex-row gap-3 justify-center items-center max-w-md mx-auto">
                        <button
                          onClick={() => {
                            const endD = new Date().toISOString().split('T')[0]
                            const startD = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
                            setStartDate(startD)
                            setEndDate(endD)
                            fetchTemperatureData(startD, endD, true)
                          }}
                          disabled={loadingTemperature}
                          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          � Obtener datos (90 días)
                        </button>
                        
                        <button
                          onClick={() => {
                            setForceRefresh(true)
                            fetchTemperatureData(startDate, endDate, true)
                          }}
                          disabled={loadingTemperature}
                          className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          🔄 Actualizar desde GEE
                        </button>
                      </div>
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