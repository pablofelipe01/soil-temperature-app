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
      <div className="min-h-screen py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header mejorado */}
          <div className="mb-8">
            <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 dark:border-gray-700/20 p-6">
              <div className="md:flex md:items-center md:justify-between">
                <div className="flex-1 min-w-0">
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 sm:text-4xl mb-2">
                    Ubicaciones de Monitoreo
                  </h1>
                  <p className="text-lg text-gray-600 dark:text-gray-400">
                    Gestiona las ubicaciones donde se monitorea la temperatura del suelo
                  </p>
                </div>
                <div className="mt-6 md:mt-0 md:ml-6">
                  <Link
                    href="/locations/new"
                    className="inline-flex items-center px-6 py-3 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                  >
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                    </svg>
                    Nueva Ubicación
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Filtros mejorados */}
          <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 dark:border-gray-700/20 p-6 mb-8">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Filtros de Búsqueda
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Encuentra ubicaciones específicas usando los filtros
              </p>
            </div>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <label htmlFor="search" className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                  Buscar por cliente
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    id="search"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="block w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm placeholder-gray-400 dark:placeholder-gray-500 transition-colors duration-200"
                    placeholder="Nombre del cliente..."
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                  Estado
                </label>
                <select
                  id="status"
                  value={filterActive === null ? '' : filterActive.toString()}
                  onChange={(e) => setFilterActive(e.target.value === '' ? null : e.target.value === 'true')}
                  className="block w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-colors duration-200"
                >
                  <option value="">Todos</option>
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
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                >
                  Limpiar filtros
                </button>
              </div>
            </div>
          </div>

          {/* Error mejorado */}
          {error && (
            <div className="mb-8">
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-red-800 dark:text-red-200">{error}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Estado vacío mejorado */}
          {locations.length === 0 && !loading ? (
            <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 dark:border-gray-700/20 p-12">
              <div className="text-center">
                <div className="w-24 h-24 mx-auto mb-6 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                  <svg className="w-12 h-12 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3">
                  No hay ubicaciones registradas
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
                  Comienza registrando tu primera ubicación de monitoreo para empezar a recopilar datos de temperatura del suelo
                </p>
                <Link
                  href="/locations/new"
                  className="inline-flex items-center px-6 py-3 border border-transparent text-sm font-semibold rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                >
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                  </svg>
                  Registrar Primera Ubicación
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
              {locations.map((location) => (
                <div key={location.id} className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 dark:border-gray-700/20 overflow-hidden hover:shadow-xl transition-all duration-200">
                  {/* Header de la card */}
                  <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
                          {location.name}
                        </h3>
                        <div className="flex items-center space-x-2">
                          {location.isActive ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">
                              <div className="w-1.5 h-1.5 bg-green-400 rounded-full mr-1"></div>
                              Activo
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300">
                              <div className="w-1.5 h-1.5 bg-red-400 rounded-full mr-1"></div>
                              Inactivo
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Contenido de la card */}
                  <div className="px-6 py-4 space-y-3">
                    {/* Información del cliente */}
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                          <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                          </svg>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {location.clientName}
                        </p>
                        {location.clientEmail && (
                          <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                            {location.clientEmail}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Coordenadas */}
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center">
                          <svg className="w-4 h-4 text-emerald-600 dark:text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                          </svg>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900 dark:text-gray-100 font-mono">
                          {parseFloat(location.latitude.toString()).toFixed(6)}, {parseFloat(location.longitude.toString()).toFixed(6)}
                        </p>
                        {location.elevation && (
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Elevación: {location.elevation}m
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Descripción */}
                    {location.description && (
                      <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {location.description}
                        </p>
                      </div>
                    )}

                    {/* Información del suelo */}
                    <div className="grid grid-cols-1 gap-2">
                      {location.soilType && (
                        <div className="flex items-center space-x-2">
                          <div className="w-6 h-6 bg-amber-100 dark:bg-amber-900/30 rounded flex items-center justify-center">
                            <svg className="w-3 h-3 text-amber-600 dark:text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                            </svg>
                          </div>
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            Suelo: <span className="font-medium text-gray-900 dark:text-gray-100">{location.soilType}</span>
                          </span>
                        </div>
                      )}
                      {location.landUse && (
                        <div className="flex items-center space-x-2">
                          <div className="w-6 h-6 bg-green-100 dark:bg-green-900/30 rounded flex items-center justify-center">
                            <svg className="w-3 h-3 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM12 2a1 1 0 01.967.744L14.146 7.2 17.5 9.134a1 1 0 010 1.732L14.146 12.8l-1.179 4.456a1 1 0 01-1.934 0L9.854 12.8 6.5 10.866a1 1 0 010-1.732L9.854 7.2l1.179-4.456A1 1 0 0112 2z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            Uso: <span className="font-medium text-gray-900 dark:text-gray-100">{location.landUse}</span>
                          </span>
                        </div>
                      )}
                      {location._count && (
                        <div className="flex items-center space-x-2">
                          <div className="w-6 h-6 bg-purple-100 dark:bg-purple-900/30 rounded flex items-center justify-center">
                            <svg className="w-3 h-3 text-purple-600 dark:text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            <span className="font-medium text-gray-900 dark:text-gray-100">{location._count.soilTemperatures}</span> registros de temperatura
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Fecha de creación */}
                    <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Creado el {new Date(location.createdAt).toLocaleDateString('es-ES', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>

                  {/* Acciones */}
                  <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex space-x-3">
                      <Link
                        href={`/locations/${location.id.toString()}`}
                        className="flex-1 inline-flex justify-center items-center px-3 py-2 border border-transparent text-sm font-medium rounded-lg text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/30 hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors duration-200"
                      >
                        Ver Detalles
                      </Link>
                      
                      <Link
                        href={`/locations/${location.id.toString()}/edit`}
                        className="flex-1 inline-flex justify-center items-center px-3 py-2 border border-transparent text-sm font-medium rounded-lg text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/30 hover:bg-amber-200 dark:hover:bg-amber-900/50 transition-colors duration-200"
                      >
                        Editar
                      </Link>
                      
                      <button
                        onClick={() => handleDeleteLocation(location.id.toString())}
                        className="px-3 py-2 border border-transparent text-sm font-medium rounded-lg text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors duration-200"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Loading indicator mejorado */}
          {loading && locations.length > 0 && (
            <div className="mt-8 flex justify-center">
              <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-lg shadow-lg border border-white/20 dark:border-gray-700/20 px-6 py-4">
                <div className="flex items-center space-x-3">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-600 border-t-transparent"></div>
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">Cargando más ubicaciones...</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </ProtectedLayout>
  )
}