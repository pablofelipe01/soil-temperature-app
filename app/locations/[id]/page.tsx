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
  const [temperatureError, setTemperatureError] = useState('')

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
      <div className="py-10">
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <Link
                href="/locations"
                className="text-blue-600 hover:text-blue-500 flex items-center"
              >
                ← Volver a ubicaciones
              </Link>
              
              <div className="flex items-center space-x-3">
                <Link
                  href={`/locations/${locationId}/edit`}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                >
                  ✏️ Editar
                </Link>
                <button
                  onClick={handleDeleteLocation}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700"
                >
                  🗑️ Eliminar
                </button>
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
                    <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                      📍 {parseFloat(location.latitude.toString()).toFixed(6)}, {parseFloat(location.longitude.toString()).toFixed(6)}
                    </dd>
                  </div>

                  {location.elevation && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Elevación</dt>
                      <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">⛰️ {location.elevation}m</dd>
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
                        {location.isActive ? '✅ Activo' : '❌ Inactivo'}
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
                    className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
                  >
                    🌡️ Ver Datos de Temperatura
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
                    className="w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                  >
                    📅 Últimos 7 días
                  </button>
                  
                  <Link
                    href={`/locations/${locationId}/reports`}
                    className="w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                  >
                    📊 Ver Reportes
                  </Link>
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
                        className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {loadingTemperature ? '🔄' : '🌡️'} Consultar
                      </button>
                    </div>
                  </div>
                  
                  {temperatureError && (
                    <div className="mt-4 p-4 rounded-md bg-yellow-50 dark:bg-yellow-900 border-l-4 border-yellow-400">
                      <div className="flex items-start">
                        <div className="flex-shrink-0">
                          <span className="text-yellow-400 text-lg">⚠️</span>
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
                        className={`px-4 py-2 text-sm font-medium rounded-r-md border-t border-r border-b ${
                          viewMode === 'heatmap'
                            ? 'bg-blue-600 border-blue-600 text-white'
                            : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                        }`}
                      >
                        🗺️ Mapa de Calor
                      </button>
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
                      <div className="mb-6">
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
      </div>
    </ProtectedLayout>
  )
}