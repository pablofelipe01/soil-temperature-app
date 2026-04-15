'use client'

import { useEffect, useRef, useState } from 'react'
import * as L from 'leaflet'
import { supabase } from '@/lib/supabase/client'

interface Location {
  id: string
  name: string
  latitude: string
  longitude: string
}

interface TemperatureData {
  id: string
  date: string
  temperatureCelsius: number
  dataSource: string
  isPostBiochar?: boolean
}

interface BiocharInfo {
  startDate?: string
  quantity?: number
  unit?: string
  frequency?: string
  notes?: string
}

// Data structure for multi-location (dashboard) mode
export interface MapLocation {
  id: string
  name: string
  latitude: number
  longitude: number
  clientName?: string
  latestTemperature?: number | null
  latestDate?: string | null
  dataSource?: string | null
  temperatureCount?: number
}

interface SimpleMapProps {
  locationId?: string // Single-location mode (detail page)
  locations?: MapLocation[] // Multi-location mode (dashboard)
}

// Color scale: blue (cold) → red (hot)
function getTemperatureColor(temperature: number): string {
  if (temperature < 10) return '#3B82F6'
  if (temperature < 15) return '#06B6D4'
  if (temperature < 20) return '#10B981'
  if (temperature < 25) return '#F59E0B'
  if (temperature < 30) return '#F97316'
  return '#EF4444'
}

export default function SimpleMap({ locationId, locations }: SimpleMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)
  const [location, setLocation] = useState<Location | null>(null)
  const [temperatureData, setTemperatureData] = useState<TemperatureData[]>([])
  const [biocharInfo, setBiocharInfo] = useState<BiocharInfo | null>(null)
  const [loadingTemperature, setLoadingTemperature] = useState(false)

  // Determine mode
  const isMultiMode = !!locations

  // =========================================================================
  // SINGLE-LOCATION MODE: load location + temperature data (detail page)
  // =========================================================================

  // Cargar ubicación específica o la primera disponible
  useEffect(() => {
    if (isMultiMode) return
    const loadLocation = async () => {
      try {
        if (locationId) {
          const response = await fetch(`/api/locations/${locationId}`)
          
          if (response.ok) {
            const result = await response.json()
            
            if (result && (result.id || result.data?.id)) {
              const locationData = result.data || result
              setLocation({
                id: locationData.id,
                name: locationData.name,
                latitude: locationData.latitude.toString(),
                longitude: locationData.longitude.toString()
              })
              return
            }
          }
        }
        
        // Fallback: cargar la primera ubicación disponible (autenticado)
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) return

        const fallbackResponse = await fetch('/api/locations?limit=1', {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'x-user-id': session.user.id
          }
        })

        if (fallbackResponse.ok) {
          const fallbackResult = await fallbackResponse.json()
          if (fallbackResult.success && fallbackResult.data?.length > 0) {
            const loc = fallbackResult.data[0]
            setLocation({
              id: loc.id,
              name: loc.name,
              latitude: loc.latitude.toString(),
              longitude: loc.longitude.toString()
            })
          }
        }
      } catch (error) {
        console.error('❌ Error cargando ubicación:', error)
      }
    }

    loadLocation()
  }, [locationId, isMultiMode])

  // Cargar datos de temperatura cuando se carga la ubicación
  useEffect(() => {
    if (isMultiMode) return
    if (!location) return

    const loadTemperatureData = async () => {
      try {
        setLoadingTemperature(true)
        console.log('🌡️ Cargando datos de temperatura para:', location.name)
        
        // Usar rango de fechas con datos disponibles (hace 3-4 meses)
        const endDate = '2025-07-31' // Fecha hasta la cual hay datos disponibles
        const startDate = '2025-07-01' // Mes completo de julio 2025
        
        const response = await fetch(
          `/api/temperature-data?locationId=${location.id}&startDate=${startDate}&endDate=${endDate}`
        )
        
        if (response.ok) {
          const result = await response.json()
          if (result.success && result.data) {
            setTemperatureData(result.data)
            setBiocharInfo(result.biochar || null)
            console.log('🌡️ Datos de temperatura cargados:', result.data.length, 'registros')
            console.log('🌱 Información de biochar:', result.biochar)
          } else {
            console.log('⚠️ No hay datos de temperatura disponibles:', result.error)
            // Intentar con fechas más antiguas si fallan las actuales
            if (result.error && result.error.includes('datos más recientes')) {
              console.log('🔄 Intentando con fechas más antiguas...')
              const olderEndDate = '2025-06-30'
              const olderStartDate = '2025-06-01'
              
              const retryResponse = await fetch(
                `/api/temperature-data?locationId=${location.id}&startDate=${olderStartDate}&endDate=${olderEndDate}`
              )
              
              if (retryResponse.ok) {
                const retryResult = await retryResponse.json()
                if (retryResult.success && retryResult.data) {
                  setTemperatureData(retryResult.data)
                  setBiocharInfo(retryResult.biochar || null)
                  console.log('🌡️ Datos de temperatura cargados (fechas antiguas):', retryResult.data.length, 'registros')
                  console.log('🌱 Información de biochar:', retryResult.biochar)
                }
              }
            }
          }
        }
      } catch (error) {
        console.error('❌ Error cargando temperatura:', error)
      } finally {
        setLoadingTemperature(false)
      }
    }

    loadTemperatureData()
  }, [location, isMultiMode])

  // Función para determinar color basado en temperatura (single-location, with biochar support)
  const getDetailTemperatureColor = (temperature: number, isPostBiochar?: boolean) => {
    if (isPostBiochar) {
      // Colores más cálidos/naranjas para datos post-biochar
      if (temperature < 10) return '#7C3AED'  // Púrpura - muy frío post-biochar
      if (temperature < 15) return '#A855F7'  // Púrpura claro - frío post-biochar
      if (temperature < 20) return '#EC4899'  // Rosa - templado post-biochar
      if (temperature < 25) return '#F97316'  // Naranja - cálido post-biochar
      if (temperature < 30) return '#DC2626'  // Rojo - caliente post-biochar
      return '#991B1B'                        // Rojo oscuro - muy caliente post-biochar
    } else {
      // Colores originales para datos pre-biochar
      if (temperature < 10) return '#3B82F6'  // Azul - muy frío
      if (temperature < 15) return '#06B6D4'  // Cian - frío
      if (temperature < 20) return '#10B981'  // Verde - templado
      if (temperature < 25) return '#F59E0B'  // Amarillo - cálido
      if (temperature < 30) return '#F97316'  // Naranja - caliente
      return '#EF4444'                        // Rojo - muy caliente
    }
  }

  // =========================================================================
  // SINGLE-LOCATION MODE: initialize map with heatmap (detail page)
  // =========================================================================
  useEffect(() => {
    if (isMultiMode) return
    if (!location) return // Esperar a que se cargue la ubicación

    const initMap = async () => {
      try {
        console.log('🗺️ Inicializando mapa con ubicación real:', location.name)
        
        // Si ya existe un mapa, removerlo primero para evitar conflictos
        if (mapInstanceRef.current) {
          console.log('🧹 Removiendo mapa existente para recargar con nueva ubicación')
          mapInstanceRef.current.remove()
          mapInstanceRef.current = null
        }
        
        // Cargar Leaflet
        const L = await import('leaflet')
        
        // Configurar icono por defecto
        const DefaultIcon = L.icon({
          iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          popupAnchor: [1, -34],
          shadowSize: [41, 41]
        })
        L.Marker.prototype.options.icon = DefaultIcon
        
        if (!mapRef.current) {
          console.log('❌ No hay contenedor para el mapa')
          return
        }
        
        // Verificar si el contenedor ya tiene un mapa
        if (mapRef.current.innerHTML.trim() !== '') {
          console.log('⚠️ El contenedor ya tiene contenido, limpiando...')
          mapRef.current.innerHTML = ''
        }
        
        // Usar coordenadas de la ubicación real
        const lat = parseFloat(location.latitude.toString())
        const lng = parseFloat(location.longitude.toString())
        
        console.log('🎯 Coordenadas para el mapa:', {
          raw_lat: location.latitude,
          raw_lng: location.longitude,
          parsed_lat: lat,
          parsed_lng: lng
        })
        
        // Crear mapa centrado en la ubicación real
        const map = L.map(mapRef.current).setView([lat, lng], 13)
        mapInstanceRef.current = map
        
        // Agregar tiles de OpenStreetMap
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors'
        }).addTo(map)
        
        // Agregar visualización basada en datos de temperatura
        if (temperatureData.length > 0) {
          console.log('🎨 Agregando visualización de temperatura con', temperatureData.length, 'puntos de datos')
          
          // Usar la temperatura más reciente
          const latestTemp = temperatureData[temperatureData.length - 1]
          const color = getDetailTemperatureColor(latestTemp.temperatureCelsius, latestTemp.isPostBiochar)
          
          // Crear círculo coloreado por temperatura
          L.circle([lat, lng], {
            color: color,
            fillColor: color,
            fillOpacity: 0.6,
            radius: 2000, // Radio de 2km
            weight: 3
          }).addTo(map)
          
          // Preparar información de biochar para el popup
          let biocharStatusText = ''
          if (biocharInfo && biocharInfo.startDate) {
            const biocharDate = new Date(biocharInfo.startDate)
            const recordDate = new Date(latestTemp.date)
            const isPeriodPostBiochar = recordDate >= biocharDate
            
            biocharStatusText = isPeriodPostBiochar 
              ? `<br/>🌱 <span style="color: #DC2626; font-weight: bold;">Post-Biochar</span> (desde ${biocharDate.toLocaleDateString('es-CO')})`
              : `<br/>📊 <span style="color: #3B82F6; font-weight: bold;">Pre-Biochar</span> (biochar aplicado ${biocharDate.toLocaleDateString('es-CO')})`
            
            if (biocharInfo.quantity && biocharInfo.unit) {
              biocharStatusText += `<br/>💧 ${biocharInfo.quantity} ${biocharInfo.unit}`
            }
          }

          // Marcador principal con información detallada
          L.marker([lat, lng])
            .addTo(map)
            .bindPopup(`
              <div style="font-family: system-ui; padding: 8px; min-width: 220px;">
                <strong style="color: #374151; font-size: 14px;">${location.name}</strong><br/>
                <div style="margin: 8px 0;">
                  <span style="color: ${color}; font-weight: bold; font-size: 16px;">
                    🌡️ ${latestTemp.temperatureCelsius.toFixed(1)}°C
                  </span>${biocharStatusText}<br/>
                  <small style="color: #6b7280;">
                    📅 ${new Date(latestTemp.date).toLocaleDateString('es-CO')}<br/>
                    📊 ${temperatureData.length} registros<br/>
                    🛰️ Datos satelitales ERA5-Land<br/>
                    📍 ${lat.toFixed(6)}, ${lng.toFixed(6)}
                  </small>
                </div>
              </div>
            `)
        } else {
          // Fallback: marcador simple sin datos de temperatura
          console.log('📍 No hay datos de temperatura, usando marcador simple')
          L.marker([lat, lng])
            .addTo(map)
            .bindPopup(`
              <div style="font-family: system-ui; padding: 8px;">
                <strong style="color: #374151;">${location.name}</strong><br/>
                <small style="color: #6b7280;">
                  📍 ${lat.toFixed(6)}, ${lng.toFixed(6)}<br/>
                  🌡️ Cargando datos de temperatura...
                </small>
              </div>
            `)
        }
        
        console.log('✅ Mapa creado exitosamente')
        
      } catch (error) {
        console.error('❌ Error creando el mapa:', error)
      }
    }

    // Dar un pequeño delay para asegurar que el DOM esté listo
    const timer = setTimeout(initMap, 100)
    
    return () => {
      clearTimeout(timer)
      // Limpiar el mapa al desmontar el componente
      if (mapInstanceRef.current) {
        console.log('🧹 Limpiando mapa al desmontar')
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [location, temperatureData, biocharInfo, isMultiMode])

  // =========================================================================
  // MULTI-LOCATION MODE: show all locations with colored markers (dashboard)
  // =========================================================================
  useEffect(() => {
    if (!isMultiMode) return

    const initMultiMap = async () => {
      try {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove()
          mapInstanceRef.current = null
        }

        const L = await import('leaflet')

        const DefaultIcon = L.icon({
          iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          popupAnchor: [1, -34],
          shadowSize: [41, 41]
        })
        L.Marker.prototype.options.icon = DefaultIcon

        if (!mapRef.current) return
        if (mapRef.current.innerHTML.trim() !== '') {
          mapRef.current.innerHTML = ''
        }

        // Default center (Colombia) if no locations
        const map = L.map(mapRef.current).setView([4.6, -74.1], 6)
        mapInstanceRef.current = map

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors'
        }).addTo(map)

        if (!locations || locations.length === 0) return

        const bounds = L.latLngBounds([])

        locations.forEach((loc) => {
          const lat = loc.latitude
          const lng = loc.longitude
          const temp = loc.latestTemperature != null ? Number(loc.latestTemperature) : null
          const color = temp != null
            ? getTemperatureColor(temp)
            : '#9CA3AF' // gray when no data

          // Colored circle marker
          L.circleMarker([lat, lng], {
            radius: 10,
            color: color,
            fillColor: color,
            fillOpacity: 0.7,
            weight: 2,
          })
            .addTo(map)
            .bindPopup(`
              <div style="font-family: system-ui; padding: 8px; min-width: 180px;">
                <strong style="color: #374151; font-size: 14px;">${loc.name}</strong><br/>
                ${temp != null
                  ? `<span style="color: ${color}; font-weight: bold; font-size: 15px;">🌡️ ${temp.toFixed(1)}°C</span><br/>
                     <small style="color: #6b7280;">📏 Profundidad: 0–7 cm</small><br/>`
                  : '<span style="color: #9CA3AF;">Sin datos de temperatura</span><br/>'
                }
                ${loc.latestDate
                  ? `<small style="color: #6b7280;">📅 ${new Date(loc.latestDate).toLocaleDateString('es-CO')}</small><br/>`
                  : ''
                }
                <small style="color: #6b7280;">📍 ${lat.toFixed(4)}, ${lng.toFixed(4)}</small>
              </div>
            `)

          bounds.extend([lat, lng])
        })

        if (bounds.isValid()) {
          map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 })
        }
      } catch (error) {
        console.error('Error inicializando mapa multi-ubicación:', error)
      }
    }

    const timer = setTimeout(initMultiMap, 100)
    return () => {
      clearTimeout(timer)
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [isMultiMode, locations])

  // =========================================================================
  // RENDER
  // =========================================================================

  // Multi-location mode: no locations loaded yet → spinner; empty array → empty state
  if (isMultiMode) {
    if (!locations) {
      return (
        <div className="w-full h-96 flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Cargando ubicaciones...</p>
          </div>
        </div>
      )
    }

    return (
      <div className="w-full h-96">
        <div className="relative w-full h-full" style={{ position: 'relative' }}>
          <div
            ref={mapRef}
            className="w-full h-full rounded-lg border border-gray-300 dark:border-gray-700"
            style={{ minHeight: '400px', position: 'relative', zIndex: 1 }}
          />
          {/* Simple legend for multi mode */}
          <div className="absolute bottom-4 right-4 bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 backdrop-blur-sm bg-opacity-95" style={{ zIndex: 1000 }}>
            <h4 className="text-xs font-semibold text-gray-900 dark:text-gray-100 mb-2">
              🌡️ Temperatura del Suelo
            </h4>
            <div className="space-y-1">
              <div className="flex items-center space-x-1 text-xs">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <span className="text-gray-600 dark:text-gray-400">&lt;10°C Muy frío</span>
              </div>
              <div className="flex items-center space-x-1 text-xs">
                <div className="w-3 h-3 rounded-full bg-cyan-500"></div>
                <span className="text-gray-600 dark:text-gray-400">10-15°C Frío</span>
              </div>
              <div className="flex items-center space-x-1 text-xs">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="text-gray-600 dark:text-gray-400">15-20°C Templado</span>
              </div>
              <div className="flex items-center space-x-1 text-xs">
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <span className="text-gray-600 dark:text-gray-400">20-25°C Cálido</span>
              </div>
              <div className="flex items-center space-x-1 text-xs">
                <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                <span className="text-gray-600 dark:text-gray-400">25-30°C Caliente</span>
              </div>
              <div className="flex items-center space-x-1 text-xs">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <span className="text-gray-600 dark:text-gray-400">&gt;30°C Muy caliente</span>
              </div>
              <div className="flex items-center space-x-1 text-xs">
                <div className="w-3 h-3 rounded-full bg-gray-400"></div>
                <span className="text-gray-600 dark:text-gray-400">Sin datos</span>
              </div>
            </div>
            <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-600 text-xs text-gray-500 dark:text-gray-400">
              📍 {locations.length} ubicación{locations.length !== 1 ? 'es' : ''}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Single-location mode: loading state
  if (!location) {
    return (
      <div className="w-full h-96 flex items-center justify-center bg-gray-100 rounded-lg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-sm text-gray-600">Cargando ubicación...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full h-96">
      <div className="relative w-full h-full" style={{ position: 'relative' }}>
        <div
          ref={mapRef}
          className="w-full h-full rounded-lg border border-gray-300"
          style={{ minHeight: '400px', position: 'relative', zIndex: 1 }}
        />
        
        {/* Leyenda de temperatura */}
        <div className="absolute bottom-4 right-4 bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 backdrop-blur-sm bg-opacity-95" style={{ zIndex: 1000 }}>
          <h4 className="text-xs font-semibold text-gray-900 dark:text-gray-100 mb-2">
            🌡️ Temperatura del Suelo
          </h4>
          
          {/* Mostrar información de biochar si está disponible */}
          {biocharInfo && biocharInfo.startDate && (
            <div className="mb-2 pb-2 border-b border-gray-200 dark:border-gray-600">
              <div className="text-xs text-gray-700 dark:text-gray-300 mb-1">
                <strong>🌱 Análisis con Biochar:</strong>
              </div>
              <div className="flex items-center space-x-1 text-xs mb-1">
                <div className="w-3 h-3 rounded-full" style={{backgroundColor: '#3B82F6'}}></div>
                <span className="text-gray-600 dark:text-gray-400">Pre-Biochar (azules)</span>
              </div>
              <div className="flex items-center space-x-1 text-xs">
                <div className="w-3 h-3 rounded-full" style={{backgroundColor: '#7C3AED'}}></div>
                <span className="text-gray-600 dark:text-gray-400">Post-Biochar (púrpuras/rosas)</span>
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                📅 Aplicado: {new Date(biocharInfo.startDate).toLocaleDateString('es-CO')}
              </div>
            </div>
          )}
          
          <div className="space-y-1">
            <div className="flex items-center space-x-1 text-xs">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span className="text-gray-600 dark:text-gray-400">&lt;10°C Muy frío</span>
            </div>
            <div className="flex items-center space-x-1 text-xs">
              <div className="w-3 h-3 rounded-full bg-cyan-500"></div>
              <span className="text-gray-600 dark:text-gray-400">10-15°C Frío</span>
            </div>
            <div className="flex items-center space-x-1 text-xs">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="text-gray-600 dark:text-gray-400">15-20°C Templado</span>
            </div>
            <div className="flex items-center space-x-1 text-xs">
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <span className="text-gray-600 dark:text-gray-400">20-25°C Cálido</span>
            </div>
            <div className="flex items-center space-x-1 text-xs">
              <div className="w-3 h-3 rounded-full bg-orange-500"></div>
              <span className="text-gray-600 dark:text-gray-400">25-30°C Caliente</span>
            </div>
            <div className="flex items-center space-x-1 text-xs">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <span className="text-gray-600 dark:text-gray-400">&gt;30°C Muy caliente</span>
            </div>
          </div>
          
          {temperatureData.length > 0 && (
            <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-600">
              <div className="text-xs text-gray-500 dark:text-gray-400">
                📊 {temperatureData.length} registros<br/>
                {loadingTemperature && <span>🔄 Actualizando...</span>}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}