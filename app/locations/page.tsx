'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/hooks/useAuth'
import ProtectedLayout from '@/components/layout/ProtectedLayout'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'

interface Location {
  id: number
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

export default function LocationsPage() {
  const { user } = useAuth()
  const [locations, setLocations] = useState<Location[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterActive, setFilterActive] = useState<boolean | null>(null)

  const fetchLocations = useCallback(async () => {
    try {
      setLoading(true)
      setError('')

      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        setError('Usuario no autenticado')
        return
      }

      // Construir URL con parámetros de filtro
      const params = new URLSearchParams()
      if (searchTerm) params.append('client', searchTerm)
      if (filterActive !== null) params.append('active', filterActive.toString())

      const response = await fetch(`/api/locations?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'x-user-id': session.user.id
        }
      })

      if (!response.ok) {
        throw new Error('Error al cargar ubicaciones')
      }

      const result = await response.json()
      setLocations(result.data || [])

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }, [searchTerm, filterActive])

  useEffect(() => {
    if (user) {
      fetchLocations()
    }
  }, [user, fetchLocations])

  const handleDeleteLocation = async (locationId: string) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar esta ubicación?')) {
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

      if (!response.ok) {
        throw new Error('Error al eliminar ubicación')
      }

      const result = await response.json()
      if (result.success) {
        // Actualizar la lista
        fetchLocations()
        
        // Mostrar mensaje según la acción
        const message = result.action === 'deleted' 
          ? 'Ubicación eliminada exitosamente'
          : 'Ubicación desactivada (tiene datos históricos)'
        
        alert(message)
      }

    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al eliminar ubicación')
    }
  }

  if (loading && locations.length === 0) {
    return (
      <ProtectedLayout>
        <div className="py-10">
          <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Cargando ubicaciones...</span>
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
          <div className="md:flex md:items-center md:justify-between mb-8">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl">
                Ubicaciones de Monitoreo
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Gestiona las ubicaciones donde se monitorea la temperatura del suelo
              </p>
            </div>
            <div className="mt-4 flex md:mt-0 md:ml-4">
              <Link
                href="/locations/new"
                className="ml-3 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                📍 Nueva Ubicación
              </Link>
            </div>
          </div>

          {/* Filtros */}
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow mb-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label htmlFor="search" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Buscar por cliente
                </label>
                <input
                  type="text"
                  id="search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="mt-1 block w-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm placeholder-gray-400 dark:placeholder-gray-400"
                  placeholder="Nombre del cliente..."
                />
              </div>
              
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Estado
                </label>
                <select
                  id="status"
                  value={filterActive === null ? '' : filterActive.toString()}
                  onChange={(e) => setFilterActive(e.target.value === '' ? null : e.target.value === 'true')}
                  className="mt-1 block w-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="" className="text-gray-500 dark:text-gray-400">Todos</option>
                  <option value="true">Activos</option>
                  <option value="false">Inactivos</option>
                </select>
              </div>

              <div className="flex items-end">
                <button
                  onClick={() => {
                    setSearchTerm('')
                    setFilterActive(null)
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Limpiar filtros
                </button>
              </div>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="rounded-md bg-red-50 p-4 mb-6">
              <div className="text-sm text-red-800">{error}</div>
            </div>
          )}

          {/* Lista de ubicaciones */}
          {locations.length === 0 && !loading ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📍</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No hay ubicaciones registradas
              </h3>
              <p className="text-gray-500 mb-6">
                Comienza registrando tu primera ubicación de monitoreo
              </p>
              <Link
                href="/locations/new"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                📍 Registrar Primera Ubicación
              </Link>
            </div>
          ) : (
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <ul className="divide-y divide-gray-200">
                {locations.map((location) => (
                  <li key={location.id}>
                    <div className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center">
                            <h3 className="text-lg font-medium text-gray-900">
                              {location.name}
                            </h3>
                            {!location.isActive && (
                              <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                Inactivo
                              </span>
                            )}
                          </div>
                          
                          <div className="mt-1 text-sm text-gray-500">
                            Cliente: <span className="font-medium">{location.clientName}</span>
                            {location.clientEmail && (
                              <span className="ml-2">({location.clientEmail})</span>
                            )}
                          </div>
                          
                          <div className="mt-1 text-sm text-gray-500">
                            📍 {parseFloat(location.latitude.toString()).toFixed(6)}, {parseFloat(location.longitude.toString()).toFixed(6)}
                            {location.elevation && (
                              <span className="ml-2">⛰️ {location.elevation}m</span>
                            )}
                          </div>

                          {location.description && (
                            <div className="mt-1 text-sm text-gray-500">
                              {location.description}
                            </div>
                          )}

                          <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                            {location.soilType && (
                              <span>🌱 {location.soilType}</span>
                            )}
                            {location.landUse && (
                              <span>🌾 {location.landUse}</span>
                            )}
                            {location._count && (
                              <span>🌡️ {location._count.soilTemperatures} registros</span>
                            )}
                          </div>

                          <div className="mt-1 text-xs text-gray-400">
                            Creado: {new Date(location.createdAt).toLocaleDateString()}
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Link
                            href={`/locations/${location.id.toString()}`}
                            className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200"
                          >
                            Ver
                          </Link>
                          
                          <Link
                            href={`/locations/${location.id.toString()}/edit`}
                            className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-yellow-700 bg-yellow-100 hover:bg-yellow-200"
                          >
                            Editar
                          </Link>
                          
                          <button
                            onClick={() => handleDeleteLocation(location.id.toString())}
                            className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200"
                          >
                            Eliminar
                          </button>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {loading && locations.length > 0 && (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
            </div>
          )}
        </div>
      </div>
    </ProtectedLayout>
  )
}