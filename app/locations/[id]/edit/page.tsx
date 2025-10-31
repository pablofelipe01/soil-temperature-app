'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import ProtectedLayout from '@/components/layout/ProtectedLayout'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'

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
}

export default function EditLocationPage() {
  const params = useParams()
  const router = useRouter()
  const locationId = params.id as string
  
  const [location, setLocation] = useState<Location | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  
  // Form fields
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [latitude, setLatitude] = useState('')
  const [longitude, setLongitude] = useState('')
  const [elevation, setElevation] = useState('')
  const [soilType, setSoilType] = useState('')
  const [landUse, setLandUse] = useState('')
  const [clientName, setClientName] = useState('')
  const [clientEmail, setClientEmail] = useState('')
  const [isActive, setIsActive] = useState(true)

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
            const loc = result.data
            setLocation(loc)
            
            // Llenar el formulario con los datos existentes
            setName(loc.name || '')
            setDescription(loc.description || '')
            setLatitude(loc.latitude?.toString() || '')
            setLongitude(loc.longitude?.toString() || '')
            setElevation(loc.elevation?.toString() || '')
            setSoilType(loc.soilType || '')
            setLandUse(loc.landUse || '')
            setClientName(loc.clientName || '')
            setClientEmail(loc.clientEmail || '')
            setIsActive(loc.isActive)
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')

    try {
      // Validación básica
      if (!name.trim() || !clientName.trim()) {
        setError('El nombre y el cliente son requeridos')
        setSaving(false)
        return
      }

      if (!latitude || !longitude) {
        setError('Las coordenadas son requeridas')
        setSaving(false)
        return
      }

      const lat = parseFloat(latitude)
      const lng = parseFloat(longitude)

      if (isNaN(lat) || isNaN(lng)) {
        setError('Las coordenadas deben ser números válidos')
        setSaving(false)
        return
      }

      if (lat < -90 || lat > 90) {
        setError('La latitud debe estar entre -90 y 90')
        setSaving(false)
        return
      }

      if (lng < -180 || lng > 180) {
        setError('La longitud debe estar entre -180 y 180')
        setSaving(false)
        return
      }

      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        setError('No autenticado')
        setSaving(false)
        return
      }

      const updateData = {
        name: name.trim(),
        description: description.trim() || undefined,
        latitude: lat,
        longitude: lng,
        elevation: elevation ? parseFloat(elevation) : undefined,
        soilType: soilType.trim() || undefined,
        landUse: landUse.trim() || undefined,
        clientName: clientName.trim(),
        clientEmail: clientEmail.trim() || undefined,
        isActive
      }

      const response = await fetch(`/api/locations/${locationId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
          'x-user-id': session.user.id
        },
        body: JSON.stringify(updateData)
      })

      const result = await response.json()

      if (response.ok && result.success) {
        // Redirigir a la página de detalles
        router.push(`/locations/${locationId}`)
      } else {
        setError(result.error || 'Error al actualizar la ubicación')
      }
    } catch (err) {
      console.error('Error updating location:', err)
      setError('Error al actualizar la ubicación')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <ProtectedLayout>
        <div className="py-10">
          <div className="max-w-3xl mx-auto sm:px-6 lg:px-8">
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          </div>
        </div>
      </ProtectedLayout>
    )
  }

  if (!location) {
    return (
      <ProtectedLayout>
        <div className="py-10">
          <div className="max-w-3xl mx-auto sm:px-6 lg:px-8">
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
      <div className="min-h-screen py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header mejorado */}
          <div className="mb-8">
            <div className="flex items-center mb-6">
              <Link
                href={`/locations/${locationId}`}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Volver a detalles
              </Link>
            </div>
            
            <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 dark:border-gray-700/20 p-6">
              <div className="text-center">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 sm:text-4xl mb-4">
                  Editar Ubicación
                </h1>
                <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                  Modifica los datos de la ubicación: <span className="font-semibold">{location.name}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Formulario mejorado */}
          <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 dark:border-gray-700/20">
            <form onSubmit={handleSubmit} className="divide-y divide-gray-200 dark:divide-gray-700">
              {/* Error mejorado */}
              {error && (
                <div className="p-6">
                  <div className="rounded-lg bg-red-50 dark:bg-red-900/20 p-4 border border-red-200 dark:border-red-800">
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

              {/* Información básica */}
              <div className="p-6">
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    Información Básica
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Datos fundamentales de la ubicación de monitoreo
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  {/* Nombre */}
                  <div className="sm:col-span-2">
                    <label htmlFor="name" className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                      Nombre de la ubicación *
                    </label>
                    <input
                      type="text"
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className="block w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-colors duration-200"
                      placeholder="Ej: Parcela Norte - Finca San Pedro"
                    />
                  </div>

                  {/* Descripción */}
                  <div className="sm:col-span-2">
                    <label htmlFor="description" className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                      Descripción
                    </label>
                    <textarea
                      id="description"
                      rows={3}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="block w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-colors duration-200"
                      placeholder="Descripción opcional de la ubicación..."
                    />
                  </div>

                  {/* Cliente */}
                  <div>
                    <label htmlFor="clientName" className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                      Nombre del cliente *
                    </label>
                    <input
                      type="text"
                      id="clientName"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      required
                      className="block w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-colors duration-200"
                      placeholder="Nombre completo del cliente"
                    />
                  </div>

                  <div>
                    <label htmlFor="clientEmail" className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                      Email del cliente
                    </label>
                    <input
                      type="email"
                      id="clientEmail"
                      value={clientEmail}
                      onChange={(e) => setClientEmail(e.target.value)}
                      className="block w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-colors duration-200"
                      placeholder="cliente@ejemplo.com"
                    />
                  </div>
                </div>
              </div>

              {/* Ubicación geográfica */}
              <div className="p-6">
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    Ubicación Geográfica
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Coordenadas y elevación del sitio de monitoreo
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                  {/* Coordenadas */}
                  <div>
                    <label htmlFor="latitude" className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                      Latitud *
                    </label>
                    <input
                      type="number"
                      id="latitude"
                      step="any"
                      value={latitude}
                      onChange={(e) => setLatitude(e.target.value)}
                      required
                      className="block w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-colors duration-200"
                      placeholder="Ej: 4.123456"
                    />
                  </div>

                  <div>
                    <label htmlFor="longitude" className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                      Longitud *
                    </label>
                    <input
                      type="number"
                      id="longitude"
                      step="any"
                      value={longitude}
                      onChange={(e) => setLongitude(e.target.value)}
                      required
                      className="block w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-colors duration-200"
                      placeholder="Ej: -73.654321"
                    />
                  </div>

                  {/* Elevación */}
                  <div>
                    <label htmlFor="elevation" className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                      Elevación (metros)
                    </label>
                    <input
                      type="number"
                      id="elevation"
                      step="any"
                      value={elevation}
                      onChange={(e) => setElevation(e.target.value)}
                      className="block w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-colors duration-200"
                      placeholder="Ej: 1250"
                    />
                  </div>
                </div>
              </div>

              {/* Características del suelo */}
              <div className="p-6">
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    Características del Suelo
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Tipo de suelo y uso actual del terreno
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  {/* Tipo de suelo */}
                  <div>
                    <label htmlFor="soilType" className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                      Tipo de suelo
                    </label>
                    <select
                      id="soilType"
                      value={soilType}
                      onChange={(e) => setSoilType(e.target.value)}
                      className="block w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-colors duration-200"
                    >
                      <option value="">Seleccionar tipo...</option>
                      <option value="Arcilloso">Arcilloso</option>
                      <option value="Arenoso">Arenoso</option>
                      <option value="Franco">Franco</option>
                      <option value="Franco arcilloso">Franco arcilloso</option>
                      <option value="Franco arenoso">Franco arenoso</option>
                      <option value="Limoso">Limoso</option>
                      <option value="Otro">Otro</option>
                    </select>
                  </div>

                  {/* Uso del suelo */}
                  <div>
                    <label htmlFor="landUse" className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                      Uso del suelo
                    </label>
                    <select
                      id="landUse"
                      value={landUse}
                      onChange={(e) => setLandUse(e.target.value)}
                      className="block w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-colors duration-200"
                    >
                      <option value="">Seleccionar uso...</option>
                      <option value="Cultivo anual">Cultivo anual</option>
                      <option value="Cultivo permanente">Cultivo permanente</option>
                      <option value="Ganadería">Ganadería</option>
                      <option value="Forestal">Forestal</option>
                      <option value="Agroforestal">Agroforestal</option>
                      <option value="Otro">Otro</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Estado y configuración */}
              <div className="p-6">
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    Estado y Configuración
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Configuración del estado de la ubicación
                  </p>
                </div>

                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                  <div className="flex items-start">
                    <div className="flex items-center h-5">
                      <input
                        id="isActive"
                        type="checkbox"
                        checked={isActive}
                        onChange={(e) => setIsActive(e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded transition-colors duration-200"
                      />
                    </div>
                    <div className="ml-3 text-sm">
                      <label htmlFor="isActive" className="font-medium text-gray-900 dark:text-gray-100">
                        Ubicación activa
                      </label>
                      <p className="text-gray-500 dark:text-gray-400">
                        Las ubicaciones inactivas no aparecerán en las consultas de temperatura
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Botones mejorados */}
              <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700/50 rounded-b-xl">
                <div className="flex justify-end space-x-4">
                  <Link
                    href={`/locations/${locationId}`}
                    className="inline-flex items-center px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                  >
                    Cancelar
                  </Link>
                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center px-6 py-3 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                  >
                    {saving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Guardando...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Guardar Cambios
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </ProtectedLayout>
  )
}