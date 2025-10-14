'use client'

import { useState, useEffect, useCallback } from 'react'
import ProtectedLayout from '@/components/layout/ProtectedLayout'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'

interface Location {
  id: number
  name: string
  latitude: string
  longitude: string
  clientName: string
}

interface TemperatureData {
  id: number
  date: string
  temperatureCelsius: number
  dataSource: string
}

interface TemperatureStats {
  count: number
  min: number
  max: number
  average: number
  range: number
}

interface QueryResult {
  success: boolean
  data: TemperatureData[]
  source: string
  location: {
    id: number
    name: string
    latitude: number
    longitude: number
  }
  dateRange: {
    startDate: string
    endDate: string
  }
  stats: TemperatureStats | null
}

export default function TemperatureDataPage() {
  const [locations, setLocations] = useState<Location[]>([])
  const [selectedLocationId, setSelectedLocationId] = useState<number | null>(null)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [loading, setLoading] = useState(false)
  const [temperatureData, setTemperatureData] = useState<QueryResult | null>(null)
  const [error, setError] = useState('')
  const [forceRefresh, setForceRefresh] = useState(false)

  // Cargar ubicaciones al inicializar
  const fetchLocations = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const response = await fetch('/api/locations', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'x-user-id': session.user.id
        }
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          setLocations(result.data)
          if (result.data.length > 0) {
            setSelectedLocationId(result.data[0].id)
          }
        }
      }
    } catch (err) {
      console.error('Error al cargar ubicaciones:', err)
    }
  }, [])

  useEffect(() => {
    fetchLocations()

    // Establecer fechas por defecto (últimos 30 días)
    const today = new Date()
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
    
    setEndDate(today.toISOString().split('T')[0])
    setStartDate(thirtyDaysAgo.toISOString().split('T')[0])
  }, [fetchLocations])

  const handleQuery = async () => {
    if (!selectedLocationId || !startDate || !endDate) {
      setError('Por favor selecciona una ubicación y rango de fechas')
      return
    }

    if (new Date(startDate) > new Date(endDate)) {
      setError('La fecha de inicio debe ser anterior a la fecha de fin')
      return
    }

    setLoading(true)
    setError('')
    setTemperatureData(null)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const params = new URLSearchParams({
        locationId: selectedLocationId.toString(),
        startDate,
        endDate,
        forceRefresh: forceRefresh.toString()
      })

      const response = await fetch(`/api/temperature-data?${params}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'x-user-id': session.user.id
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al obtener datos')
      }

      const result = await response.json()
      if (result.success) {
        setTemperatureData(result)
      } else {
        throw new Error(result.error || 'Error en la respuesta')
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }

  const selectedLocation = locations.find(loc => loc.id === selectedLocationId)

  return (
    <ProtectedLayout>
      <div className="py-10">
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center mb-4">
              <Link
                href="/dashboard"
                className="text-blue-600 hover:text-blue-500 flex items-center"
              >
                ← Volver al dashboard
              </Link>
            </div>
            <h1 className="text-2xl font-bold leading-7 text-gray-900 dark:text-gray-100 sm:text-3xl">
              Consulta de Datos de Temperatura
            </h1>
            <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">
              Obtén datos históricos de temperatura del suelo desde Google Earth Engine
            </p>
          </div>

          {/* Formulario de consulta */}
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg mb-8">
            <div className="p-6">
              <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-6">
                Parámetros de Consulta
              </h2>

              {error && (
                <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-4 mb-6">
                  <div className="text-sm text-red-800 dark:text-red-200">{error}</div>
                </div>
              )}

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <label htmlFor="location" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Ubicación
                  </label>
                  <select
                    id="location"
                    value={selectedLocationId || ''}
                    onChange={(e) => setSelectedLocationId(e.target.value ? parseInt(e.target.value) : null)}
                    className="mt-1 block w-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  >
                    <option value="">Seleccionar ubicación</option>
                    {locations.map((location) => (
                      <option key={location.id} value={location.id}>
                        {location.name} - {location.clientName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Fecha de inicio
                  </label>
                  <input
                    type="date"
                    id="startDate"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="mt-1 block w-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Fecha de fin
                  </label>
                  <input
                    type="date"
                    id="endDate"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="mt-1 block w-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>

                <div className="flex items-end">
                  <div className="w-full">
                    <div className="flex items-center mb-2">
                      <input
                        id="forceRefresh"
                        type="checkbox"
                        checked={forceRefresh}
                        onChange={(e) => setForceRefresh(e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor="forceRefresh" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                        Forzar actualización
                      </label>
                    </div>
                    <button
                      onClick={handleQuery}
                      disabled={loading || !selectedLocationId || !startDate || !endDate}
                      className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Consultando...
                        </>
                      ) : (
                        '🌡️ Consultar Datos'
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Info de la ubicación seleccionada */}
              {selectedLocation && (
                <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-md">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {selectedLocation.name}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    📍 {parseFloat(selectedLocation.latitude).toFixed(6)}, {parseFloat(selectedLocation.longitude).toFixed(6)} • 
                    Cliente: {selectedLocation.clientName}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Resultados */}
          {temperatureData && (
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                    Datos de Temperatura
                  </h2>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    temperatureData.source === 'database' 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                  }`}>
                    {temperatureData.source === 'database' ? '💾 Base de datos' : '🌐 Google Earth Engine'}
                  </span>
                </div>

                {/* Estadísticas */}
                {temperatureData.stats && (
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-5 mb-6">
                    <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-md">
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Registros</dt>
                      <dd className="text-lg font-semibold text-gray-900 dark:text-gray-100">{temperatureData.stats.count}</dd>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-md">
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Mínima</dt>
                      <dd className="text-lg font-semibold text-gray-900 dark:text-gray-100">{temperatureData.stats.min.toFixed(1)}°C</dd>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-md">
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Máxima</dt>
                      <dd className="text-lg font-semibold text-gray-900 dark:text-gray-100">{temperatureData.stats.max.toFixed(1)}°C</dd>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-md">
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Promedio</dt>
                      <dd className="text-lg font-semibold text-gray-900 dark:text-gray-100">{temperatureData.stats.average.toFixed(1)}°C</dd>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-md">
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Rango</dt>
                      <dd className="text-lg font-semibold text-gray-900 dark:text-gray-100">{temperatureData.stats.range.toFixed(1)}°C</dd>
                    </div>
                  </div>
                )}

                {/* Tabla de datos */}
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
                      {temperatureData.data.slice(0, 10).map((record) => (
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

                {temperatureData.data.length > 10 && (
                  <div className="mt-4 text-center">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Mostrando 10 de {temperatureData.data.length} registros
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </ProtectedLayout>
  )
}