'use client'

import { useState, useEffect } from 'react'

interface SatelliteImageryProps {
  latitude: number | string
  longitude: number | string
  locationName: string
}

interface SatelliteLayer {
  id: string
  name: string
  description: string
  icon: string
  mapType: string
}

const satelliteLayers: SatelliteLayer[] = [
  {
    id: 'satellite',
    name: 'Imagen Satelital',
    description: 'Vista satelital de alta resolución',
    icon: '🛰️',
    mapType: 'k'
  },
  {
    id: 'hybrid',
    name: 'Híbrido',
    description: 'Combinación de satelital y etiquetas',
    icon: '🗺️',
    mapType: 'h'
  },
  {
    id: 'terrain',
    name: 'Terreno',
    description: 'Vista topográfica del terreno',
    icon: '⛰️',
    mapType: 'p'
  },
  {
    id: 'roadmap',
    name: 'Mapa de Carreteras',
    description: 'Vista tradicional de mapa',
    icon: '🛣️',
    mapType: 'm'
  }
]

const zoomLevels = [
  { level: 10, name: 'Regional', description: 'Vista amplia de la región' },
  { level: 13, name: 'Local', description: 'Vista del área local' },
  { level: 15, name: 'Detallado', description: 'Vista detallada' },
  { level: 18, name: 'Máximo', description: 'Máximo nivel de detalle' }
]

export default function SatelliteImagery({ latitude, longitude, locationName }: SatelliteImageryProps) {
  // Convert coordinates to numbers if they're strings
  const lat = typeof latitude === 'string' ? parseFloat(latitude) : latitude
  const lng = typeof longitude === 'string' ? parseFloat(longitude) : longitude
  
  const [selectedLayer, setSelectedLayer] = useState<SatelliteLayer>(satelliteLayers[0])
  const [zoomLevel, setZoomLevel] = useState(15)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [displayMode, setDisplayMode] = useState<'base' | 'ndvi'>('base')
  const [ndviUrl, setNdviUrl] = useState<string | null>(null)
  const [loadingNdvi, setLoadingNdvi] = useState(false)
  const [ndviDateRange, setNdviDateRange] = useState<'week' | 'month' | 'quarter' | 'year'>('month')

  const generateMapUrl = () => {
    return `https://maps.google.com/maps?q=${lat},${lng}&t=${selectedLayer.mapType}&z=${zoomLevel}&ie=UTF8&iwloc=&output=embed`
  }

  const handleLayerChange = (layer: SatelliteLayer) => {
    setSelectedLayer(layer)
    setLoading(true)
  }

  const handleZoomChange = (zoom: number) => {
    setZoomLevel(zoom)
    setLoading(true)
  }

  const handleIframeLoad = () => {
    setLoading(false)
    setError('')
  }

  const handleIframeError = () => {
    setLoading(false)
    setError('Error al cargar la imagen satelital')
  }

  // Helper: map zoom level to approximate radius in meters for thumbnail region
  const zoomToRadiusMeters = (z: number) => {
    if (z >= 18) return 200
    if (z >= 15) return 2000
    if (z >= 13) return 5000
    if (z >= 10) return 20000
    return 40000
  }

  const fetchNdviThumbnail = async () => {
    // Ensure numeric coordinates
    if (typeof lat !== 'number' || typeof lng !== 'number' || Number.isNaN(lat) || Number.isNaN(lng)) {
      setError('Coordenadas inválidas para NDVI')
      return
    }

    setLoadingNdvi(true)
    setError('')

    try {
      const endDate = new Date().toISOString().split('T')[0]
      const start = new Date()
      
      // Calculate start date based on selected range
      switch (ndviDateRange) {
        case 'week':
          start.setDate(start.getDate() - 7)
          break
        case 'month':
          start.setDate(start.getDate() - 30)
          break
        case 'quarter':
          start.setDate(start.getDate() - 90)
          break
        case 'year':
          start.setDate(start.getDate() - 365)
          break
      }
      
      const startDate = start.toISOString().split('T')[0]

      const params = new URLSearchParams({
        lat: String(lat),
        lon: String(lng),
        startDate,
        endDate,
        size: '640',
        radiusMeters: String(zoomToRadiusMeters(zoomLevel))
      })

      const res = await fetch(`/api/earth-engine/ndvi?${params.toString()}`)
      const data = await res.json()

      if (res.ok && data.success && data.url) {
        setNdviUrl(data.url)
      } else {
        setNdviUrl(null)
        setError(data.error || 'No se pudo obtener NDVI')
      }
    } catch (err) {
      console.error('Error fetching NDVI thumbnail:', err)
      setError('Error al solicitar NDVI')
      setNdviUrl(null)
    } finally {
      setLoadingNdvi(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Layer Selection */}
      <div>
        <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
          Tipo de Vista
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {satelliteLayers.map((layer) => (
            <button
              key={layer.id}
              onClick={() => handleLayerChange(layer)}
              className={`p-3 rounded-lg border-2 transition-all duration-200 ${
                selectedLayer.id === layer.id
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                  : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-500'
              }`}
            >
              <div className="text-center">
                <div className="text-xl mb-1">{layer.icon}</div>
                <div className="text-xs font-medium">{layer.name}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {layer.description}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Zoom Level Controls */}
      <div>
        <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
          Nivel de Zoom
        </h4>
        <div className="flex flex-wrap gap-2">
          {zoomLevels.map((zoom) => (
            <button
              key={zoom.level}
              onClick={() => handleZoomChange(zoom.level)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                zoomLevel === zoom.level
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
              title={zoom.description}
            >
              {zoom.name}
            </button>
          ))}
        </div>
      </div>

      {/* Satellite Image */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {selectedLayer.name} - {locationName}
          </h4>
          {loading && (
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span className="text-sm text-gray-500 dark:text-gray-400">Cargando...</span>
            </div>
          )}
        </div>
        
        <div className="relative bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden shadow-lg">
          {error ? (
            <div className="h-96 flex items-center justify-center">
              <div className="text-center">
                <div className="text-red-500 text-4xl mb-2">⚠️</div>
                <p className="text-red-600 dark:text-red-400 font-medium">{error}</p>
                <button
                  onClick={() => {
                    setError('')
                    setLoading(true)
                  }}
                  className="mt-2 px-4 py-2 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded-lg text-sm hover:bg-red-200 dark:hover:bg-red-800 transition-colors"
                >
                  Reintentar
                </button>
              </div>
            </div>
          ) : (
            <div className="relative">
              {loading && (
                <div className="absolute inset-0 z-10 bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Cargando imagen satelital...
                    </p>
                  </div>
                </div>
              )}
              <div>
                <div className="mb-3 flex items-center gap-3">
                  <button
                    onClick={() => setDisplayMode('base')}
                    className={`px-3 py-1 rounded-md text-sm ${displayMode === 'base' ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}>
                    Mapa base
                  </button>
                  <button
                    onClick={() => {
                      setDisplayMode('ndvi')
                      // Fetch NDVI when switched on
                      fetchNdviThumbnail()
                    }}
                    className={`px-3 py-1 rounded-md text-sm ${displayMode === 'ndvi' ? 'bg-green-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}>
                    Mostrar NDVI
                  </button>
                </div>

                {/* NDVI Date Range Controls - only show when NDVI is selected */}
                {displayMode === 'ndvi' && (
                  <div className="mb-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <label className="block text-xs font-medium text-green-800 dark:text-green-300 mb-2">
                      Período de análisis:
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { key: 'week', label: 'Última semana', days: 7 },
                        { key: 'month', label: 'Último mes', days: 30 },
                        { key: 'quarter', label: 'Últimos 3 meses', days: 90 },
                        { key: 'year', label: 'Último año', days: 365 }
                      ].map((range) => (
                        <button
                          key={range.key}
                          onClick={() => {
                            setNdviDateRange(range.key as any)
                            // Re-fetch NDVI with new date range
                            setTimeout(fetchNdviThumbnail, 100)
                          }}
                          className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                            ndviDateRange === range.key
                              ? 'bg-green-600 text-white'
                              : 'bg-white dark:bg-gray-700 text-green-700 dark:text-green-300 border border-green-300 dark:border-green-600 hover:bg-green-100 dark:hover:bg-green-800'
                          }`}
                        >
                          {range.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {displayMode === 'base' ? (
                  <iframe
                    src={generateMapUrl()}
                    width="100%"
                    height="400"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    className="rounded-lg"
                    title={`${selectedLayer.name} de ${locationName}`}
                    onLoad={handleIframeLoad}
                    onError={handleIframeError}
                  />
                ) : (
                  <div className="rounded-lg overflow-hidden bg-black">
                    {loadingNdvi ? (
                      <div className="h-64 flex items-center justify-center text-sm text-gray-300">Cargando NDVI...</div>
                    ) : ndviUrl ? (
                      <div>
                        {/* Mostrar la miniatura NDVI retornada por el endpoint */}
                        <img src={ndviUrl} alt={`NDVI ${locationName}`} style={{ width: '100%', height: 400, objectFit: 'cover' }} />
                        
                        {/* Panel informativo sobre NDVI */}
                        <div className="mt-4 bg-green-50 dark:bg-green-900/30 p-4 rounded-lg">
                          <div className="flex">
                            <div className="flex-shrink-0">
                              <span className="text-green-500 text-lg">🌱</span>
                            </div>
                            <div className="ml-3">
                              <h5 className="text-sm font-medium text-green-800 dark:text-green-200 mb-2">
                                Índice de Vegetación (NDVI)
                              </h5>
                              <div className="text-sm text-green-700 dark:text-green-300 space-y-2">
                                <p>El NDVI mide la salud y densidad de la vegetación usando datos satelitales:</p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                                  <div className="flex items-center">
                                    <div className="w-3 h-3 bg-amber-600 rounded mr-2"></div>
                                    <span>🟤 Marrón: Suelo desnudo, poca vegetación</span>
                                  </div>
                                  <div className="flex items-center">
                                    <div className="w-3 h-3 bg-yellow-400 rounded mr-2"></div>
                                    <span>🟡 Amarillo: Vegetación escasa o estresada</span>
                                  </div>
                                  <div className="flex items-center">
                                    <div className="w-3 h-3 bg-lime-400 rounded mr-2"></div>
                                    <span>🟢 Verde claro: Vegetación moderada</span>
                                  </div>
                                  <div className="flex items-center">
                                    <div className="w-3 h-3 bg-green-600 rounded mr-2"></div>
                                    <span>🟢 Verde oscuro: Vegetación densa y saludable</span>
                                  </div>
                                </div>
                                <p className="text-xs mt-2 italic">
                                  💡 Valores altos (verde) indican cultivos saludables y vigorosos. Útil para monitoreo agrícola y detección temprana de estrés en las plantas.
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="h-64 flex items-center justify-center text-sm text-gray-300">NDVI no disponible</div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Information Panel */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Coordinates */}
        <div className="bg-green-50 dark:bg-green-900/30 p-4 rounded-lg">
          <div className="flex">
            <div className="flex-shrink-0">
              <span className="text-green-500 text-lg">📍</span>
            </div>
            <div className="ml-3">
              <h5 className="text-sm font-medium text-green-800 dark:text-green-200 mb-2">
                Coordenadas Exactas
              </h5>
              <div className="text-sm text-green-700 dark:text-green-300 space-y-1">
                <p><strong>Latitud:</strong> {lat.toFixed(6)}°</p>
                <p><strong>Longitud:</strong> {lng.toFixed(6)}°</p>
                <div className="mt-3 space-y-2">
                  <a
                    href={`https://www.google.com/maps?q=${lat},${lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-200 text-xs font-medium"
                  >
                    <svg className="mr-1 h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    Abrir en Google Maps
                  </a>
                  <br />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`${lat}, ${lng}`)
                    }}
                    className="inline-flex items-center text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-200 text-xs font-medium"
                  >
                    <svg className="mr-1 h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Copiar coordenadas
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Layer Information */}
        <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg">
          <div className="flex">
            <div className="flex-shrink-0">
              <span className="text-blue-500 text-lg">{selectedLayer.icon}</span>
            </div>
            <div className="ml-3">
              <h5 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
                {selectedLayer.name}
              </h5>
              <div className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                <p>{selectedLayer.description}</p>
                <p><strong>Nivel de zoom:</strong> {zoomLevel}/20</p>
                <div className="mt-2 text-xs">
                  <p><strong>Características de esta vista:</strong></p>
                  <ul className="list-disc list-inside mt-1 space-y-1">
                    {selectedLayer.id === 'satellite' && (
                      <>
                        <li>Imágenes de alta resolución</li>
                        <li>Colores naturales del terreno</li>
                        <li>Ideal para análisis visual</li>
                      </>
                    )}
                    {selectedLayer.id === 'hybrid' && (
                      <>
                        <li>Combina satelital con etiquetas</li>
                        <li>Nombres de lugares visibles</li>
                        <li>Mejor orientación geográfica</li>
                      </>
                    )}
                    {selectedLayer.id === 'terrain' && (
                      <>
                        <li>Relieve y elevación</li>
                        <li>Características topográficas</li>
                        <li>Ideal para análisis de terreno</li>
                      </>
                    )}
                    {selectedLayer.id === 'roadmap' && (
                      <>
                        <li>Vista tradicional de mapa</li>
                        <li>Carreteras y calles</li>
                        <li>Referencias urbanas</li>
                      </>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Usage Tips */}
      <div className="bg-yellow-50 dark:bg-yellow-900/30 p-4 rounded-lg">
        <div className="flex">
          <div className="flex-shrink-0">
            <span className="text-yellow-500 text-lg">💡</span>
          </div>
          <div className="ml-3">
            <h5 className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-2">
              Consejos de Uso
            </h5>
            <div className="text-sm text-yellow-700 dark:text-yellow-300">
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>Usa la vista satelital para análisis visual del terreno</li>
                <li>La vista híbrida es útil para orientación con referencias</li>
                <li>El modo terreno muestra las características topográficas</li>
                <li>Ajusta el zoom según el nivel de detalle necesario</li>
                <li>Puedes hacer clic en el mapa para navegar interactivamente</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}