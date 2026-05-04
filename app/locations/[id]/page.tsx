'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useParams } from 'next/navigation'
import ProtectedLayout from '@/components/layout/ProtectedLayout'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import dynamic from 'next/dynamic'
import '../../../styles/heatmap.css'
import { MapPin, Mountain, Pencil, Trash2, Thermometer, Calendar, BarChart3, ArrowLeft, RefreshCw, Map, AlertTriangle, Info } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import TemperatureChart from '@/components/charts/TemperatureChart'

// Importar dinámicamente el componente del mapa simple
const SimpleMap = dynamic(() => import('@/components/maps/SimpleMap'), { 
  ssr: false,
  loading: () => <div className="h-96 w-full bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse flex items-center justify-center">
    <span className="text-gray-500">Preparando mapa...</span>
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
  biocharStartDate?: string | null
  biocharQuantity?: number | null
  biocharUnit?: string | null
  biocharFrequency?: string | null
  biocharNotes?: string | null
  alertsEnabled?: boolean
  minTempThreshold?: number | null
  maxTempThreshold?: number | null
  minMoistureThreshold?: number | null
  maxMoistureThreshold?: number | null
  alertEmails?: string | null
  lastAlertSentAt?: string | null
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
  tempLevel1?: number | null
  tempLevel2?: number | null
  tempLevel3?: number | null
  tempLevel4?: number | null
  dataSource: string
  isPostBiochar?: boolean
}

interface SoilHealthData {
  location: {
    id: string
    name: string
  }
  period: {
    startDate: string
    endDate: string
  }
  compositeIndex: number
  status: 'optimo' | 'alerta' | 'critico'
  scores: {
    temperature: number
    moisture: number
    biochar: number
  }
  metrics: {
    averageTemperature: number | null
    averageMoisture: number | null
    biocharDeltaAverage: number | null
    preBiocharSamples: number
    postBiocharSamples: number
    temperatureRecords: number
    moistureRecords: number
  }
}

interface BiocharDepthImpact {
  key: 'tempLevel1' | 'tempLevel2' | 'tempLevel3' | 'tempLevel4'
  depth: string
  preAvg: number | null
  postAvg: number | null
  delta: number | null
  available: boolean
}

const DEPTH_CONFIG = [
  { key: 'tempLevel1' as const, depth: '0-7 cm', colorClass: 'border-red-500 bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300' },
  { key: 'tempLevel2' as const, depth: '7-28 cm', colorClass: 'border-orange-500 bg-orange-50 dark:bg-orange-950/30 text-orange-700 dark:text-orange-300' },
  { key: 'tempLevel3' as const, depth: '28-100 cm', colorClass: 'border-blue-500 bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300' },
  { key: 'tempLevel4' as const, depth: '100-289 cm', colorClass: 'border-violet-500 bg-violet-50 dark:bg-violet-950/30 text-violet-700 dark:text-violet-300' },
]

function average(values: number[]): number | null {
  if (values.length === 0) return null
  return values.reduce((sum, value) => sum + value, 0) / values.length
}

function computeBiocharImpactByDepth(
  readings: TemperatureData[],
  biocharDate: string | null | undefined,
): { depthImpacts: BiocharDepthImpact[]; preCount: number; postCount: number } {
  if (!biocharDate) {
    return {
      depthImpacts: DEPTH_CONFIG.map((depth) => ({
        key: depth.key,
        depth: depth.depth,
        preAvg: null,
        postAvg: null,
        delta: null,
        available: false,
      })),
      preCount: 0,
      postCount: 0,
    }
  }

  const biocharTs = new Date(biocharDate).getTime()
  if (!Number.isFinite(biocharTs)) {
    return {
      depthImpacts: DEPTH_CONFIG.map((depth) => ({
        key: depth.key,
        depth: depth.depth,
        preAvg: null,
        postAvg: null,
        delta: null,
        available: false,
      })),
      preCount: 0,
      postCount: 0,
    }
  }

  const pre = readings.filter((r) => new Date(r.date).getTime() < biocharTs)
  const post = readings.filter((r) => new Date(r.date).getTime() >= biocharTs)

  const depthImpacts: BiocharDepthImpact[] = DEPTH_CONFIG.map((depth) => {
    const preVals = pre
      .map((r) => r[depth.key])
      .filter((v): v is number => v != null)
    const postVals = post
      .map((r) => r[depth.key])
      .filter((v): v is number => v != null)

    const preAvg = average(preVals)
    const postAvg = average(postVals)
    const delta = preAvg != null && postAvg != null ? postAvg - preAvg : null

    return {
      key: depth.key,
      depth: depth.depth,
      preAvg,
      postAvg,
      delta,
      available: preVals.length > 0 && postVals.length > 0,
    }
  })

  return {
    depthImpacts,
    preCount: pre.length,
    postCount: post.length,
  }
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
  const [viewMode, setViewMode] = useState<'charts' | 'heatmap'>('charts')
  
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
  const [timeRange, setTimeRange] = useState<'1w' | '1m' | '3m' | 'custom'>('1m')
  const [temperatureError, setTemperatureError] = useState('')
  const [soilHealth, setSoilHealth] = useState<SoilHealthData | null>(null)
  const [soilHealthLoading, setSoilHealthLoading] = useState(false)
  const [soilHealthError, setSoilHealthError] = useState('')
  const [alertsEnabled, setAlertsEnabled] = useState(false)
  const [minTempThreshold, setMinTempThreshold] = useState('')
  const [maxTempThreshold, setMaxTempThreshold] = useState('')
  const [minMoistureThreshold, setMinMoistureThreshold] = useState('')
  const [maxMoistureThreshold, setMaxMoistureThreshold] = useState('')
  const [alertEmails, setAlertEmails] = useState('')
  const [savingAlerts, setSavingAlerts] = useState(false)
  const [alertsConfigMsg, setAlertsConfigMsg] = useState('')
  const [alertsConfigError, setAlertsConfigError] = useState('')

  const biocharComparison = useMemo(
    () => computeBiocharImpactByDepth(temperatureData, location?.biocharStartDate),
    [temperatureData, location?.biocharStartDate],
  )

  const fetchSoilHealth = useCallback(async (queryStartDate: string, queryEndDate: string) => {
    if (!locationId || !location) return

    setSoilHealthLoading(true)
    setSoilHealthError('')

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const params = new URLSearchParams({
        locationId,
        startDate: queryStartDate,
        endDate: queryEndDate,
      })

      const response = await fetch(`/api/soil-health?${params}`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'x-user-id': session.user.id,
        },
      })

      const result = await response.json()

      if (response.ok && result.success) {
        setSoilHealth(result.data)
        setSoilHealthError('')
      } else {
        setSoilHealth(null)
        setSoilHealthError(result.error || 'No se pudo calcular el índice de salud del suelo')
      }
    } catch (err) {
      console.error('Error fetching soil health:', err)
      setSoilHealth(null)
      setSoilHealthError('Error de conexión al calcular salud del suelo')
    } finally {
      setSoilHealthLoading(false)
    }
  }, [locationId, location])

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
          errorMessage += '\n\n' + result.suggestion
        }
        
        if (result.availableDataUntil) {
          errorMessage += '\nDatos disponibles hasta: ' + new Date(result.availableDataUntil).toLocaleDateString('es-ES')
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

  const saveAlertSettings = useCallback(async () => {
    if (!location) return

    setSavingAlerts(true)
    setAlertsConfigError('')
    setAlertsConfigMsg('')

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        setAlertsConfigError('No autenticado')
        return
      }

      const payload = {
        alertsEnabled,
        minTempThreshold: minTempThreshold ? parseFloat(minTempThreshold) : undefined,
        maxTempThreshold: maxTempThreshold ? parseFloat(maxTempThreshold) : undefined,
        minMoistureThreshold: minMoistureThreshold ? parseFloat(minMoistureThreshold) : undefined,
        maxMoistureThreshold: maxMoistureThreshold ? parseFloat(maxMoistureThreshold) : undefined,
        alertEmails: alertEmails.trim() || undefined,
      }

      const response = await fetch(`/api/locations/${locationId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
          'x-user-id': session.user.id,
        },
        body: JSON.stringify(payload),
      })

      const result = await response.json()
      if (!response.ok || !result.success) {
        setAlertsConfigError(result.error || 'No se pudo guardar la configuración de alertas')
        return
      }

      const updated = result.data as Location
      setLocation(updated)
      setAlertsConfigMsg('Configuración de alertas guardada')
    } catch (err) {
      console.error('Error saving alert settings:', err)
      setAlertsConfigError('Error de conexión al guardar alertas')
    } finally {
      setSavingAlerts(false)
    }
  }, [
    alertEmails,
    alertsEnabled,
    location,
    locationId,
    maxMoistureThreshold,
    maxTempThreshold,
    minMoistureThreshold,
    minTempThreshold,
  ])

  // Cargar datos de temperatura iniciales
  useEffect(() => {
    if (location) {
      fetchTemperatureData()
    }
  }, [location, fetchTemperatureData])

  useEffect(() => {
    if (location) {
      fetchSoilHealth(startDate, endDate)
      setAlertsEnabled(!!location.alertsEnabled)
      setMinTempThreshold(location.minTempThreshold != null ? String(location.minTempThreshold) : '')
      setMaxTempThreshold(location.maxTempThreshold != null ? String(location.maxTempThreshold) : '')
      setMinMoistureThreshold(location.minMoistureThreshold != null ? String(location.minMoistureThreshold) : '')
      setMaxMoistureThreshold(location.maxMoistureThreshold != null ? String(location.maxMoistureThreshold) : '')
      setAlertEmails(location.alertEmails || location.clientEmail || '')
    }
  }, [location, startDate, endDate, fetchSoilHealth])

  // Manejar consulta personalizada
  const handleCustomQuery = async () => {
    await fetchTemperatureData(startDate, endDate, forceRefresh)
    await fetchSoilHealth(startDate, endDate)
  }

  // Manejar selector de rango rápido
  const handleTimeRange = (range: '1w' | '1m' | '3m' | 'custom') => {
    setTimeRange(range)
    if (range === 'custom') return
    const end = new Date().toISOString().split('T')[0]
    const days = range === '1w' ? 7 : range === '1m' ? 30 : 90
    const start = new Date(Date.now() - days * 86400000).toISOString().split('T')[0]
    setStartDate(start)
    setEndDate(end)
    fetchTemperatureData(start, end, false)
    fetchSoilHealth(start, end)
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

  if (loading) {
    return (
      <ProtectedLayout>
        <div className="py-10">
          <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
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
                className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
              >
                <ArrowLeft className="h-4 w-4 mr-1" /> Volver a ubicaciones
              </Link>
            </div>
          </div>
        </div>
      </ProtectedLayout>
    )
  }

  return (
    <ProtectedLayout>
      <div className="py-10">
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <Link
                href="/locations"
                className="text-green-600 hover:text-green-500 flex items-center gap-1"
              >
                <ArrowLeft className="h-4 w-4" /> Volver a ubicaciones
              </Link>
              
              <div className="flex items-center space-x-3">
                <Link
                  href={`/locations/${locationId}/edit`}
                  className="inline-flex items-center gap-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                >
                  <Pencil className="h-4 w-4" /> Editar
                </Link>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={handleDeleteLocation}
                  icon={<Trash2 className="h-4 w-4" />}
                >
                  Eliminar
                </Button>
              </div>
            </div>
            
            <h1 className="text-2xl font-bold leading-7 text-gray-900 dark:text-gray-100 sm:text-3xl">
              {location.name}
            </h1>
            <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">
              {location.description || 'Sin descripción'}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            {/* Información general */}
            <div className="lg:col-span-1">
              <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                    Información General
                  </h3>
                </div>
                <div className="p-6 space-y-4">
                  <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Cliente</dt>
                    <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">{location.clientName}</dd>
                    {location.clientEmail && (
                      <dd className="text-sm text-gray-500 dark:text-gray-400">{location.clientEmail}</dd>
                    )}
                  </div>
                  
                  <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Coordenadas</dt>
                    <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100 flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" /> {parseFloat(location.latitude.toString()).toFixed(6)}, {parseFloat(location.longitude.toString()).toFixed(6)}
                    </dd>
                  </div>

                  {location.elevation && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Elevación</dt>
                      <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100 flex items-center gap-1"><Mountain className="h-3.5 w-3.5" /> {location.elevation}m</dd>
                    </div>
                  )}

                  {location.soilType && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Tipo de suelo</dt>
                      <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">{location.soilType}</dd>
                    </div>
                  )}

                  {location.landUse && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Uso del suelo</dt>
                      <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">{location.landUse}</dd>
                    </div>
                  )}

                  <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Estado</dt>
                    <dd className="mt-1">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        location.isActive 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                      }`}>
                        {location.isActive ? 'Activo' : 'Inactivo'}
                      </span>
                    </dd>
                  </div>

                  <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Creado</dt>
                    <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                      {new Date(location.createdAt).toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </dd>
                  </div>

                  {location._count && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Datos de temperatura</dt>
                      <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                        {location._count.soilTemperatures} registros
                      </dd>
                    </div>
                  )}
                </div>
              </div>

              {/* Acciones rápidas */}
              <div className="mt-6 bg-white dark:bg-gray-800 shadow rounded-lg">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                    Acciones Rápidas
                  </h3>
                </div>
                <div className="p-6 space-y-3">
                  <button
                    onClick={() => {
                      // Scroll to temperature section
                      const tempSection = document.querySelector('[data-temperature-section]')
                      tempSection?.scrollIntoView({ behavior: 'smooth' })
                    }}
                    className="w-full inline-flex justify-center items-center gap-1 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 cursor-pointer"
                  >
                    <Thermometer className="h-4 w-4" /> Ver Datos de Temperatura
                  </button>
                  
                  <button
                    onClick={() => {
                      // Quick query for last 7 days
                      const endD = new Date().toISOString().split('T')[0]
                      const startD = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
                      setStartDate(startD)
                      setEndDate(endD)
                      fetchTemperatureData(startD, endD, false)
                    }}
                    className="w-full inline-flex justify-center items-center gap-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 cursor-pointer"
                  >
                    <Calendar className="h-4 w-4" /> Últimos 7 días
                  </button>
                  
                  <Link
                    href={`/locations/${locationId}/reports`}
                    className="w-full inline-flex justify-center items-center gap-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                  >
                    <BarChart3 className="h-4 w-4" /> Ver Reportes
                  </Link>
                </div>
              </div>

              <div className="mt-6 bg-white dark:bg-gray-800 shadow rounded-lg">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                    Alertas por Umbral
                  </h3>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Se evalúan cuando se consultan datos nuevos desde GEE
                  </p>
                </div>
                <div className="p-6 space-y-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={alertsEnabled}
                      onChange={(e) => setAlertsEnabled(e.target.checked)}
                      className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 dark:border-gray-600 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Activar alertas para esta ubicación</span>
                  </label>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Temperatura mínima (°C)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={minTempThreshold}
                        onChange={(e) => setMinTempThreshold(e.target.value)}
                        className="block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                        placeholder="5"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Temperatura máxima (°C)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={maxTempThreshold}
                        onChange={(e) => setMaxTempThreshold(e.target.value)}
                        className="block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                        placeholder="35"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Humedad mínima (m³/m³)</label>
                      <input
                        type="number"
                        step="0.001"
                        value={minMoistureThreshold}
                        onChange={(e) => setMinMoistureThreshold(e.target.value)}
                        className="block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                        placeholder="0.10"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Humedad máxima (m³/m³)</label>
                      <input
                        type="number"
                        step="0.001"
                        value={maxMoistureThreshold}
                        onChange={(e) => setMaxMoistureThreshold(e.target.value)}
                        className="block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                        placeholder="0.45"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Correos destino (separados por coma)</label>
                    <input
                      type="text"
                      value={alertEmails}
                      onChange={(e) => setAlertEmails(e.target.value)}
                      className="block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                      placeholder="agronomo@empresa.com, alertas@empresa.com"
                    />
                  </div>

                  {location.lastAlertSentAt && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Última alerta enviada: {new Date(location.lastAlertSentAt).toLocaleString('es-ES')}
                    </p>
                  )}

                  {alertsConfigError && (
                    <p className="text-xs text-red-600 dark:text-red-400">{alertsConfigError}</p>
                  )}
                  {alertsConfigMsg && (
                    <p className="text-xs text-green-600 dark:text-green-400">{alertsConfigMsg}</p>
                  )}

                  <button
                    onClick={saveAlertSettings}
                    disabled={savingAlerts}
                    className="w-full inline-flex justify-center items-center gap-1 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {savingAlerts ? 'Guardando...' : 'Guardar alertas'}
                  </button>
                </div>
              </div>
            </div>

            {/* Datos de temperatura */}
            <div className="lg:col-span-2" data-temperature-section>
              <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                      Consulta de Temperatura del Suelo
                    </h3>
                    {loadingTemperature && (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                    )}
                  </div>
                </div>
                
                {/* Controles de consulta */}
                <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Fecha de inicio
                      </label>
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Fecha de fin
                      </label>
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                      />
                    </div>
                    
                    <div className="flex items-end">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={forceRefresh}
                          onChange={(e) => setForceRefresh(e.target.checked)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded"
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
                        className="w-full inline-flex justify-center items-center gap-1 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                      >
                        <Thermometer className="h-4 w-4" /> Consultar
                      </button>
                    </div>
                  </div>
                  
                  {temperatureError && (
                    <div className="mt-4 p-4 rounded-md bg-yellow-50 dark:bg-yellow-900 border-l-4 border-yellow-400">
                      <div className="flex items-start">
                        <div className="flex-shrink-0">
                          <AlertTriangle className="h-5 w-5 text-yellow-400" />
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

                {/* Controles de vista */}
                <div className="px-6 py-3 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Vista de datos
                    </h4>
                    <div className="flex rounded-md shadow-sm">
                      <button
                        onClick={() => setViewMode('charts')}
                        className={`px-4 py-2 text-sm font-medium rounded-l-md border cursor-pointer ${
                          viewMode === 'charts'
                            ? 'bg-green-600 border-green-600 text-white'
                            : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                        }`}
                      >
                        <BarChart3 className="h-4 w-4 inline mr-1" /> Gráficos
                      </button>
                      <button
                        onClick={() => setViewMode('heatmap')}
                        className={`px-4 py-2 text-sm font-medium rounded-r-md border-t border-r border-b cursor-pointer ${
                          viewMode === 'heatmap'
                            ? 'bg-green-600 border-green-600 text-white'
                            : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                        }`}
                      >
                        <Map className="h-4 w-4 inline mr-1" /> Mapa de Calor
                      </button>
                    </div>
                  </div>
                </div>
                
                <div className="p-6">
                  <div className="mb-6 rounded-xl border border-emerald-200 dark:border-emerald-900 bg-gradient-to-br from-white via-emerald-50 to-lime-50 dark:from-gray-800 dark:via-emerald-950/20 dark:to-lime-950/20 p-4 sm:p-5">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
                      <div>
                        <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Salud del Suelo (compuesto)</h4>
                        <p className="text-xs text-gray-600 dark:text-gray-400">Índice combinado de temperatura, humedad y biochar</p>
                      </div>
                      {soilHealthLoading && (
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-emerald-600" />
                      )}
                    </div>

                    {soilHealthError ? (
                      <div className="rounded-md border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 p-3 text-sm text-amber-800 dark:text-amber-200">
                        {soilHealthError}
                      </div>
                    ) : soilHealth ? (
                      <>
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-center mb-4">
                          <div className="lg:col-span-1 flex flex-col items-center justify-center">
                            <div
                              className="relative h-32 w-32 rounded-full"
                              style={{
                                background: `conic-gradient(#16a34a 0 ${(soilHealth.compositeIndex / 100) * 360}deg, #e5e7eb ${(soilHealth.compositeIndex / 100) * 360}deg 360deg)`,
                              }}
                            >
                              <div className="absolute inset-3 rounded-full bg-white dark:bg-gray-900 flex items-center justify-center">
                                <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">{soilHealth.compositeIndex}</span>
                              </div>
                            </div>
                            <span className="mt-2 text-xs text-gray-600 dark:text-gray-400">Índice 0-100</span>
                          </div>

                          <div className="lg:col-span-2">
                            <div className="mb-3 flex items-center gap-2">
                              <span className={`h-3 w-3 rounded-full ${soilHealth.status === 'optimo' ? 'bg-green-500' : soilHealth.status === 'alerta' ? 'bg-yellow-500' : 'bg-red-500'}`} />
                              <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                Estado: {soilHealth.status === 'optimo' ? 'Óptimo' : soilHealth.status === 'alerta' ? 'Alerta' : 'Crítico'}
                              </span>
                            </div>

                            <div className="space-y-2">
                              {[
                                { label: 'Temperatura', value: soilHealth.scores.temperature, color: 'bg-red-500' },
                                { label: 'Humedad', value: soilHealth.scores.moisture, color: 'bg-blue-500' },
                                { label: 'Biochar', value: soilHealth.scores.biochar, color: 'bg-emerald-500' },
                              ].map((item) => (
                                <div key={item.label}>
                                  <div className="flex items-center justify-between text-xs text-gray-700 dark:text-gray-300 mb-1">
                                    <span>{item.label}</span>
                                    <span className="font-semibold">{item.value}/100</span>
                                  </div>
                                  <div className="h-2 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                                    <div className={`h-full ${item.color}`} style={{ width: `${item.value}%` }} />
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          <div className="rounded-md bg-white/70 dark:bg-gray-900/40 p-3">
                            <p className="text-[11px] uppercase tracking-wide text-gray-500 dark:text-gray-400">Temp. media</p>
                            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{soilHealth.metrics.averageTemperature != null ? `${soilHealth.metrics.averageTemperature.toFixed(2)}°C` : 'N/D'}</p>
                          </div>
                          <div className="rounded-md bg-white/70 dark:bg-gray-900/40 p-3">
                            <p className="text-[11px] uppercase tracking-wide text-gray-500 dark:text-gray-400">Humedad media</p>
                            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{soilHealth.metrics.averageMoisture != null ? `${soilHealth.metrics.averageMoisture.toFixed(3)} m³/m³` : 'N/D'}</p>
                          </div>
                          <div className="rounded-md bg-white/70 dark:bg-gray-900/40 p-3">
                            <p className="text-[11px] uppercase tracking-wide text-gray-500 dark:text-gray-400">Delta biochar</p>
                            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{soilHealth.metrics.biocharDeltaAverage != null ? `${soilHealth.metrics.biocharDeltaAverage > 0 ? '+' : ''}${soilHealth.metrics.biocharDeltaAverage.toFixed(2)}°C` : 'N/D'}</p>
                          </div>
                          <div className="rounded-md bg-white/70 dark:bg-gray-900/40 p-3">
                            <p className="text-[11px] uppercase tracking-wide text-gray-500 dark:text-gray-400">Muestras</p>
                            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">T:{soilHealth.metrics.temperatureRecords} | H:{soilHealth.metrics.moistureRecords}</p>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="text-sm text-gray-600 dark:text-gray-400">Calculando índice de salud del suelo...</div>
                    )}
                  </div>

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
                        // Visualización con gráficos Recharts
                        <>
                      {/* Selector de rango temporal */}
                      <div className="mb-4 flex flex-wrap items-center gap-2">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Rango:</span>
                        {([
                          ['1w', 'Última semana'],
                          ['1m', 'Último mes'],
                          ['3m', 'Últimos 3 meses'],
                          ['custom', 'Personalizado'],
                        ] as const).map(([key, label]) => (
                          <button
                            key={key}
                            onClick={() => handleTimeRange(key)}
                            className={`px-3 py-1 text-xs rounded-full border cursor-pointer transition-colors ${
                              timeRange === key
                                ? 'bg-green-600 border-green-600 text-white'
                                : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                            }`}
                          >
                            {label}
                          </button>
                        ))}
                      </div>

                      {/* Gráfico de línea Recharts */}
                      <div className="mb-6">
                        <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
                          Tendencia de Temperatura
                        </h4>
                        <TemperatureChart
                          data={temperatureData}
                          biocharDate={location.biocharStartDate}
                          loading={loadingTemperature}
                        />
                      </div>

                      <div className="mb-6 rounded-lg border border-green-200 dark:border-green-900 bg-gradient-to-br from-white to-green-50 dark:from-gray-800 dark:to-green-950/20 p-4 sm:p-5">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-4">
                          <div>
                            <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                              Comparativo pre/post-biochar
                            </h4>
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                              Delta = promedio posterior - promedio anterior por profundidad
                            </p>
                          </div>
                          {location.biocharStartDate && (
                            <span className="inline-flex items-center rounded-full bg-green-100 dark:bg-green-900/50 px-3 py-1 text-xs font-medium text-green-800 dark:text-green-300">
                              Aplicacion: {new Date(location.biocharStartDate).toLocaleDateString('es-ES')}
                            </span>
                          )}
                        </div>

                        {!location.biocharStartDate ? (
                          <div className="rounded-md border border-dashed border-gray-300 dark:border-gray-600 p-3 text-sm text-gray-600 dark:text-gray-400">
                            Esta ubicacion no tiene fecha de aplicacion de biochar configurada.
                          </div>
                        ) : (
                          <>
                            <div className="mb-4 text-xs text-gray-600 dark:text-gray-400">
                              Muestras pre: <span className="font-semibold text-gray-900 dark:text-gray-100">{biocharComparison.preCount}</span> | Muestras post: <span className="font-semibold text-gray-900 dark:text-gray-100">{biocharComparison.postCount}</span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {biocharComparison.depthImpacts.map((impact) => {
                                const depthUi = DEPTH_CONFIG.find((depth) => depth.key === impact.key)
                                const delta = impact.delta
                                const trend = delta == null ? 'Sin datos' : Math.abs(delta) < 0.05 ? 'Sin cambio' : delta > 0 ? 'Aumento' : 'Disminucion'
                                const deltaClass = delta == null
                                  ? 'text-gray-500 dark:text-gray-400'
                                  : delta > 0
                                    ? 'text-red-600 dark:text-red-400'
                                    : 'text-green-700 dark:text-green-400'

                                return (
                                  <div
                                    key={impact.key}
                                    className={`rounded-lg border-l-4 p-3 ${depthUi?.colorClass ?? 'border-gray-300 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300'}`}
                                  >
                                    <div className="flex items-center justify-between mb-1">
                                      <span className="text-xs font-semibold uppercase tracking-wide">{impact.depth}</span>
                                      <span className={`text-xs font-semibold ${deltaClass}`}>{trend}</span>
                                    </div>
                                    <div className="text-xs opacity-90">
                                      Pre: {impact.preAvg != null ? `${impact.preAvg.toFixed(2)}°C` : 'N/D'} | Post: {impact.postAvg != null ? `${impact.postAvg.toFixed(2)}°C` : 'N/D'}
                                    </div>
                                    <div className={`mt-1 text-sm font-bold ${deltaClass}`}>
                                      Delta: {delta != null ? `${delta > 0 ? '+' : ''}${delta.toFixed(2)}°C` : 'N/D'}
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          </>
                        )}
                      </div>

                      {/* Tabla de datos recientes */}
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
                          Datos Recientes
                        </h4>
                        <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                          <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-600">
                            <thead className="bg-gray-50 dark:bg-gray-700">
                              <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                  Fecha
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                  Temperatura
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                  Fuente
                                </th>
                              </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                              {temperatureData.slice(-10).reverse().map((record) => (
                                <tr key={record.id}>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                                    {new Date(record.date).toLocaleDateString('es-ES')}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                    {parseFloat(record.temperatureCelsius.toString()).toFixed(2)}°C
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                    {record.dataSource}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                        </>
                      ) : (
                        // Visualización con mapa de calor
                        <div className="space-y-6">
                          <div>
                            <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
                              Mapa de Calor de Temperaturas
                            </h4>
                            <div className="relative">
                              {viewMode === 'heatmap' ? (
                                <SimpleMap locationId={locationId} />
                              ) : (
                                <div className="h-96 w-full bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                                  <span className="text-gray-500">Cambia a vista de mapa para cargar la visualización</span>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <div>
                            <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
                              Información del Mapa
                            </h4>
                            <div className="bg-blue-50 dark:bg-blue-900 p-4 rounded-lg">
                              <div className="flex">
                                <div className="flex-shrink-0">
                                  <Info className="h-5 w-5 text-blue-400" />
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
                                      <li><span className="text-blue-600">Azul:</span> Temperaturas más bajas (frías)</li>
                                      <li><span className="text-green-600">Verde:</span> Temperaturas medias</li>
                                      <li><span className="text-red-600">Rojo:</span> Temperaturas más altas (cálidas)</li>
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
                      )}
                    </>
                  ) : (
                    <div className="text-center py-8">
                      <BarChart3 className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
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
                          className="inline-flex items-center gap-1 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                        >
                          <Thermometer className="h-4 w-4" /> Obtener datos (90 días)
                        </button>
                        
                        <button
                          onClick={() => {
                            setForceRefresh(true)
                            fetchTemperatureData(startDate, endDate, true)
                          }}
                          disabled={loadingTemperature}
                          className="inline-flex items-center gap-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                        >
                          <RefreshCw className="h-4 w-4" /> Actualizar desde GEE
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedLayout>
  )
}