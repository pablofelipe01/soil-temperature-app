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
      <div className="py-10">
        <div className="max-w-3xl mx-auto sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <Link
                href={`/locations/${locationId}`}
                className="text-blue-600 hover:text-blue-500 flex items-center"
              >
                ← Volver a detalles
              </Link>
            </div>
            
            <h1 className="text-2xl font-bold leading-7 text-gray-900 dark:text-gray-100 sm:text-3xl">
              Editar Ubicación
            </h1>
            <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">
              Modifica los datos de la ubicación: {location.name}
            </p>
          </div>

          {/* Formulario */}
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {error && (
                <div className="rounded-md bg-red-50 dark:bg-red-900 p-4">
                  <div className="text-sm text-red-800 dark:text-red-200">
                    {error}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                {/* Nombre */}
                <div className="sm:col-span-2">
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Nombre de la ubicación *
                  </label>
                  <input
                    type="text"
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="Ej: Parcela Norte - Finca San Pedro"
                  />
                </div>

                {/* Descripción */}
                <div className="sm:col-span-2">
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Descripción
                  </label>
                  <textarea
                    id="description"
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="Descripción opcional de la ubicación..."
                  />
                </div>

                {/* Coordenadas */}
                <div>
                  <label htmlFor="latitude" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Latitud *
                  </label>
                  <input
                    type="number"
                    id="latitude"
                    step="any"
                    value={latitude}
                    onChange={(e) => setLatitude(e.target.value)}
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="Ej: 4.123456"
                  />
                </div>

                <div>
                  <label htmlFor="longitude" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Longitud *
                  </label>
                  <input
                    type="number"
                    id="longitude"
                    step="any"
                    value={longitude}
                    onChange={(e) => setLongitude(e.target.value)}
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="Ej: -73.654321"
                  />
                </div>

                {/* Elevación */}
                <div>
                  <label htmlFor="elevation" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Elevación (metros)
                  </label>
                  <input
                    type="number"
                    id="elevation"
                    step="any"
                    value={elevation}
                    onChange={(e) => setElevation(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="Ej: 1250"
                  />
                </div>

                {/* Tipo de suelo */}
                <div>
                  <label htmlFor="soilType" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Tipo de suelo
                  </label>
                  <select
                    id="soilType"
                    value={soilType}
                    onChange={(e) => setSoilType(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm focus:border-blue-500 focus:ring-blue-500"
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
                  <label htmlFor="landUse" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Uso del suelo
                  </label>
                  <select
                    id="landUse"
                    value={landUse}
                    onChange={(e) => setLandUse(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm focus:border-blue-500 focus:ring-blue-500"
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

                {/* Cliente */}
                <div>
                  <label htmlFor="clientName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Nombre del cliente *
                  </label>
                  <input
                    type="text"
                    id="clientName"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="Nombre completo del cliente"
                  />
                </div>

                <div>
                  <label htmlFor="clientEmail" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Email del cliente
                  </label>
                  <input
                    type="email"
                    id="clientEmail"
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="cliente@ejemplo.com"
                  />
                </div>

                {/* Estado */}
                <div className="sm:col-span-2">
                  <div className="flex items-center">
                    <input
                      id="isActive"
                      type="checkbox"
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded"
                    />
                    <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                      Ubicación activa
                    </label>
                  </div>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Las ubicaciones inactivas no aparecerán en las consultas de temperatura
                  </p>
                </div>
              </div>

              {/* Botones */}
              <div className="flex justify-end space-x-4">
                <Link
                  href={`/locations/${locationId}`}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                >
                  Cancelar
                </Link>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Guardando...
                    </>
                  ) : (
                    'Guardar Cambios'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </ProtectedLayout>
  )
}