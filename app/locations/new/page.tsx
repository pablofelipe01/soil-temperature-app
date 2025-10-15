'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import ProtectedLayout from '@/components/layout/ProtectedLayout'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'

interface FormData {
  name: string
  description: string
  latitude: string
  longitude: string
  elevation: string
  soilType: string
  landUse: string
  clientName: string
  clientEmail: string
  // Campos de Biochar
  biocharStartDate: string
  biocharQuantity: string
  biocharUnit: string
  biocharFrequency: string
  biocharNotes: string
}

const initialFormData: FormData = {
  name: '',
  description: '',
  latitude: '',
  longitude: '',
  elevation: '',
  soilType: '',
  landUse: '',
  clientName: '',
  clientEmail: '',
  // Campos de Biochar
  biocharStartDate: '',
  biocharQuantity: '',
  biocharUnit: '',
  biocharFrequency: '',
  biocharNotes: ''
}

export default function NewLocationPage() {
  const router = useRouter()
  const [formData, setFormData] = useState<FormData>(initialFormData)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Validar coordenadas
      const lat = parseFloat(formData.latitude)
      const lng = parseFloat(formData.longitude)
      
      if (isNaN(lat) || lat < -90 || lat > 90) {
        throw new Error('La latitud debe estar entre -90 y 90')
      }
      
      if (isNaN(lng) || lng < -180 || lng > 180) {
        throw new Error('La longitud debe estar entre -180 y 180')
      }

      // Preparar datos para enviar
      const locationData = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        latitude: lat,
        longitude: lng,
        elevation: formData.elevation ? parseFloat(formData.elevation) : undefined,
        soilType: formData.soilType.trim() || undefined,
        landUse: formData.landUse.trim() || undefined,
        clientName: formData.clientName.trim(),
        clientEmail: formData.clientEmail.trim() || undefined,
        // Campos de Biochar
        biocharStartDate: formData.biocharStartDate || undefined,
        biocharQuantity: formData.biocharQuantity ? parseFloat(formData.biocharQuantity) : undefined,
        biocharUnit: formData.biocharUnit || undefined,
        biocharFrequency: formData.biocharFrequency || undefined,
        biocharNotes: formData.biocharNotes.trim() || undefined,
        isActive: true
      }

      // Obtener sesión de usuario
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('Usuario no autenticado')
      }

      // Enviar datos al API
      const response = await fetch('/api/locations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
          'x-user-id': session.user.id
        },
        body: JSON.stringify(locationData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al crear ubicación')
      }

      const result = await response.json()
      
      if (result.success) {
        // Redirigir a la página de ubicaciones
        router.push('/locations')
      } else {
        throw new Error(result.error || 'Error al crear ubicación')
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  // Función para usar coordenadas de Bellacruz del Llano como ejemplo
  const useBellacruzExample = () => {
    setFormData(prev => ({
      ...prev,
      name: 'Bellacruz del Llano - Finca Demo',
      description: 'Ubicación de demostración en Bellacruz del Llano, Colombia',
      latitude: '4.5047',
      longitude: '-73.0572',
      clientName: 'Cliente Demo',
      soilType: 'Franco arenoso',
      landUse: 'Agricultura'
    }))
  }

  return (
    <ProtectedLayout>
      <div className="py-10">
        <div className="max-w-3xl mx-auto sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center mb-4">
              <Link
                href="/locations"
                className="text-blue-600 hover:text-blue-500 flex items-center"
              >
                ← Volver a ubicaciones
              </Link>
            </div>
            <h1 className="text-2xl font-bold leading-7 text-gray-900 dark:text-gray-100 sm:text-3xl">
              Registrar Nueva Ubicación
            </h1>
            <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">
              Añade una nueva ubicación para monitoreo de temperatura del suelo
            </p>
          </div>

          {/* Botón de ejemplo */}
          <div className="mb-6">
            <button
              type="button"
              onClick={useBellacruzExample}
              className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              📍 Usar ejemplo de Bellacruz del Llano
            </button>
          </div>

          {/* Formulario */}
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
            <form onSubmit={handleSubmit} className="space-y-6 p-6">
              {/* Error */}
              {error && (
                <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-4">
                  <div className="text-sm text-red-800 dark:text-red-200">{error}</div>
                </div>
              )}

              {/* Información básica */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
                  Información Básica
                </h3>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Nombre de la ubicación *
                    </label>
                    <input
                      type="text"
                      name="name"
                      id="name"
                      required
                      value={formData.name}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm placeholder-gray-400 dark:placeholder-gray-400"
                      placeholder="Ej: Finca El Paraíso - Sector Norte"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Descripción
                    </label>
                    <textarea
                      name="description"
                      id="description"
                      rows={3}
                      value={formData.description}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm placeholder-gray-400 dark:placeholder-gray-400"
                      placeholder="Descripción detallada de la ubicación, características especiales, etc."
                    />
                  </div>
                </div>
              </div>

              {/* Coordenadas */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
                  Coordenadas Geográficas
                </h3>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                  <div>
                    <label htmlFor="latitude" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Latitud *
                    </label>
                    <input
                      type="number"
                      name="latitude"
                      id="latitude"
                      required
                      step="any"
                      min="-90"
                      max="90"
                      value={formData.latitude}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm placeholder-gray-400 dark:placeholder-gray-400"
                      placeholder="Ej: 4.5047"
                    />
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Entre -90 y 90</p>
                  </div>

                  <div>
                    <label htmlFor="longitude" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Longitud *
                    </label>
                    <input
                      type="number"
                      name="longitude"
                      id="longitude"
                      required
                      step="any"
                      min="-180"
                      max="180"
                      value={formData.longitude}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm placeholder-gray-400 dark:placeholder-gray-400"
                      placeholder="Ej: -73.0572"
                    />
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Entre -180 y 180</p>
                  </div>

                  <div>
                    <label htmlFor="elevation" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Elevación (metros)
                    </label>
                    <input
                      type="number"
                      name="elevation"
                      id="elevation"
                      step="0.1"
                      value={formData.elevation}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm placeholder-gray-400 dark:placeholder-gray-400"
                      placeholder="Ej: 450"
                    />
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Metros sobre el nivel del mar</p>
                  </div>
                </div>
              </div>

              {/* Información del suelo */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
                  Información del Suelo y Uso
                </h3>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <label htmlFor="soilType" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Tipo de suelo
                    </label>
                    <select
                      name="soilType"
                      id="soilType"
                      value={formData.soilType}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    >
                      <option value="" className="text-gray-500 dark:text-gray-400">Seleccionar tipo de suelo</option>
                      <option value="Arcilloso">Arcilloso</option>
                      <option value="Franco">Franco</option>
                      <option value="Franco arcilloso">Franco arcilloso</option>
                      <option value="Franco arenoso">Franco arenoso</option>
                      <option value="Arenoso">Arenoso</option>
                      <option value="Limoso">Limoso</option>
                      <option value="Franco limoso">Franco limoso</option>
                      <option value="Otro">Otro</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="landUse" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Uso del suelo
                    </label>
                    <select
                      name="landUse"
                      id="landUse"
                      value={formData.landUse}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    >
                      <option value="" className="text-gray-500 dark:text-gray-400">Seleccionar uso del suelo</option>
                      <option value="Agricultura">Agricultura</option>
                      <option value="Ganadería">Ganadería</option>
                      <option value="Agroforestería">Agroforestería</option>
                      <option value="Bosque">Bosque</option>
                      <option value="Pastizal">Pastizal</option>
                      <option value="Cultivo de biochar">Cultivo de biochar</option>
                      <option value="Otro">Otro</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Información del cliente */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
                  Información del Cliente
                </h3>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <label htmlFor="clientName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Nombre del cliente *
                    </label>
                    <input
                      type="text"
                      name="clientName"
                      id="clientName"
                      required
                      value={formData.clientName}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm placeholder-gray-400 dark:placeholder-gray-400"
                      placeholder="Nombre completo del cliente"
                    />
                  </div>

                  <div>
                    <label htmlFor="clientEmail" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Email del cliente
                    </label>
                    <input
                      type="email"
                      name="clientEmail"
                      id="clientEmail"
                      value={formData.clientEmail}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm placeholder-gray-400 dark:placeholder-gray-400"
                      placeholder="cliente@ejemplo.com"
                    />
                  </div>
                </div>
              </div>

              {/* Sección Biochar */}
              <div className="border-t border-gray-200 dark:border-gray-600 pt-6">
                <div className="mb-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                    🌱 Información de Biochar
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Datos sobre la aplicación de biochar para análisis de impacto en temperatura
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="biocharStartDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Fecha de inicio de aplicación
                    </label>
                    <input
                      type="date"
                      name="biocharStartDate"
                      id="biocharStartDate"
                      value={formData.biocharStartDate}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>

                  <div>
                    <label htmlFor="biocharQuantity" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Cantidad aplicada
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      name="biocharQuantity"
                      id="biocharQuantity"
                      value={formData.biocharQuantity}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <label htmlFor="biocharUnit" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Unidad
                    </label>
                    <select
                      name="biocharUnit"
                      id="biocharUnit"
                      value={formData.biocharUnit}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    >
                      <option value="">Seleccionar unidad</option>
                      <option value="kg/m²">kg/m²</option>
                      <option value="ton/ha">ton/ha</option>
                      <option value="kg/ha">kg/ha</option>
                      <option value="g/m²">g/m²</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="biocharFrequency" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Frecuencia de aplicación
                    </label>
                    <select
                      name="biocharFrequency"
                      id="biocharFrequency"
                      value={formData.biocharFrequency}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    >
                      <option value="">Seleccionar frecuencia</option>
                      <option value="única vez">Única vez</option>
                      <option value="mensual">Mensual</option>
                      <option value="bimestral">Bimestral</option>
                      <option value="trimestral">Trimestral</option>
                      <option value="semestral">Semestral</option>
                      <option value="anual">Anual</option>
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label htmlFor="biocharNotes" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Notas adicionales
                    </label>
                    <textarea
                      name="biocharNotes"
                      id="biocharNotes"
                      rows={3}
                      value={formData.biocharNotes}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="Información adicional sobre la aplicación de biochar..."
                    />
                  </div>
                </div>
              </div>

              {/* Botones */}
              <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-600">
                <Link
                  href="/locations"
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancelar
                </Link>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Guardando...
                    </>
                  ) : (
                    'Guardar Ubicación'
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