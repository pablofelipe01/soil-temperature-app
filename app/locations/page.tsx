'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/hooks/useAuth'
import ProtectedLayout from '@/components/layout/ProtectedLayout'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import { MapPin, Plus, Mountain, Sprout, Wheat, Thermometer, Eye, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'

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
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
              <span className="ml-3 text-gray-600 dark:text-gray-400">Cargando ubicaciones...</span>
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
              <h1 className="text-2xl font-bold leading-7 text-gray-900 dark:text-gray-100 sm:text-3xl">
                Ubicaciones de Monitoreo
              </h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Gestiona las ubicaciones donde se monitorea la temperatura del suelo
              </p>
            </div>
            <div className="mt-4 flex md:mt-0 md:ml-4">
              <Link href="/locations/new">
                <Button icon={<Plus className="h-4 w-4" />}>
                  Nueva Ubicación
                </Button>
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
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setSearchTerm('')
                    setFilterActive(null)
                  }}
                >
                  Limpiar filtros
                </Button>
              </div>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-4 mb-6">
              <div className="text-sm text-red-800 dark:text-red-200">{error}</div>
            </div>
          )}

          {/* Lista de ubicaciones */}
          {locations.length === 0 && !loading ? (
            <div className="text-center py-12">
              <MapPin className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                No hay ubicaciones registradas
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                Comienza registrando tu primera ubicación de monitoreo
              </p>
              <Link href="/locations/new">
                <Button icon={<MapPin className="h-4 w-4" />}>
                  Registrar Primera Ubicación
                </Button>
              </Link>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-md">
              <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                {locations.map((location) => (
                  <li key={location.id}>
                    <div className="px-4 py-4 sm:px-6 hover:bg-gray-50 dark:hover:bg-gray-750">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center">
                            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                              {location.name}
                            </h3>
                            {!location.isActive && (
                              <Badge variant="error" className="ml-2">Inactivo</Badge>
                            )}
                          </div>
                          
                          <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                            Cliente: <span className="font-medium">{location.clientName}</span>
                            {location.clientEmail && (
                              <span className="ml-2">({location.clientEmail})</span>
                            )}
                          </div>
                          
                          <div className="mt-1 text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5" /> {parseFloat(location.latitude.toString()).toFixed(6)}, {parseFloat(location.longitude.toString()).toFixed(6)}
                            {location.elevation && (
                              <span className="ml-2 flex items-center gap-1"><Mountain className="h-3.5 w-3.5" /> {location.elevation}m</span>
                            )}
                          </div>

                          {location.description && (
                            <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                              {location.description}
                            </div>
                          )}

                          <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                            {location.soilType && (
                              <span className="flex items-center gap-1"><Sprout className="h-3.5 w-3.5" /> {location.soilType}</span>
                            )}
                            {location.landUse && (
                              <span className="flex items-center gap-1"><Wheat className="h-3.5 w-3.5" /> {location.landUse}</span>
                            )}
                            {location._count && (
                              <span className="flex items-center gap-1"><Thermometer className="h-3.5 w-3.5" /> {location._count.soilTemperatures} registros</span>
                            )}
                          </div>

                          <div className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                            Creado: {new Date(location.createdAt).toLocaleDateString()}
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Link
                            href={`/locations/${location.id.toString()}`}
                            className="inline-flex items-center gap-1 px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/30 hover:bg-blue-200 dark:hover:bg-blue-900/50"
                          >
                            <Eye className="h-3.5 w-3.5" /> Ver
                          </Link>
                          
                          <Link
                            href={`/locations/${location.id.toString()}/edit`}
                            className="inline-flex items-center gap-1 px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-yellow-700 dark:text-yellow-300 bg-yellow-100 dark:bg-yellow-900/30 hover:bg-yellow-200 dark:hover:bg-yellow-900/50"
                          >
                            <Pencil className="h-3.5 w-3.5" /> Editar
                          </Link>
                          
                          <button
                            onClick={() => handleDeleteLocation(location.id.toString())}
                            className="inline-flex items-center gap-1 px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 cursor-pointer"
                          >
                            <Trash2 className="h-3.5 w-3.5" /> Eliminar
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
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600 mx-auto"></div>
            </div>
          )}
        </div>
      </div>
    </ProtectedLayout>
  )
}