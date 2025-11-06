'use client'

import { useState, useEffect, useCallback } from 'react'

interface NDVITimelineProps {
  latitude: number | string
  longitude: number | string
  locationName: string
  startDate?: string
  endDate?: string
}

interface NDVIDataPoint {
  date: string
  imageUrl: string
  loading: boolean
  error?: string
  imageError?: boolean // Nuevo campo para errores de carga de imagen
}

export default function NDVITimeline({ 
  latitude, 
  longitude, 
  locationName, 
  startDate, 
  endDate 
}: NDVITimelineProps) {
  const lat = typeof latitude === 'string' ? parseFloat(latitude) : latitude
  const lng = typeof longitude === 'string' ? parseFloat(longitude) : longitude
  
  const [timelineData, setTimelineData] = useState<NDVIDataPoint[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedPoint, setSelectedPoint] = useState<NDVIDataPoint | null>(null)
  const [viewMode, setViewMode] = useState<'timeline' | 'comparison'>('timeline')
  const [maxPeriods, setMaxPeriods] = useState<number | null>(null)

  // Generar fechas mensuales para el timeline
  const generateMonthlyDates = (start: string, end: string): string[] => {
    const dates: string[] = []
    const startDate = new Date(start)
    const endDate = new Date(end)
    
    const current = new Date(startDate.getFullYear(), startDate.getMonth(), 1)
    
    while (current <= endDate) {
      dates.push(current.toISOString().split('T')[0])
      current.setMonth(current.getMonth() + 1)
    }
    
    // Devolver TODAS las fechas del rango seleccionado
    return dates
  }

  const fetchNDVIForDate = async (date: string): Promise<string | null> => {
    console.log(`🔍 [NDVI FETCH] Iniciando fetch para ${date}`)
    try {
      // Crear un rango de un mes centrado en la fecha
      const targetDate = new Date(date)
      const startMonth = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1)
      const endMonth = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0)
      
      const params = new URLSearchParams({
        lat: String(lat),
        lon: String(lng),
        startDate: startMonth.toISOString().split('T')[0],
        endDate: endMonth.toISOString().split('T')[0],
        size: '200', // Tamaño reducido para velocidad
        radiusMeters: '1500' // Radio reducido para mejor performance
      })

      console.log(`📡 [NDVI FETCH] URL: /api/earth-engine/ndvi?${params.toString()}`)
      console.log(`📊 [NDVI FETCH] Coordenadas: lat=${lat}, lng=${lng}`)

      // Timeout más agresivo para el cliente con mejor manejo de errores
      const controller = new AbortController()
      let isAborted = false
      const timeoutId = setTimeout(() => {
        console.log(`⏱️ Timeout alcanzado para ${date}`)
        isAborted = true
        controller.abort()
      }, 12000) // Reducido a 12 segundos para ser más conservador

      try {
        // Añadir timestamp para evitar cache
        params.set('_t', Date.now().toString())
        
        const res = await fetch(`/api/earth-engine/ndvi-simple?${params.toString()}`, {
          signal: controller.signal,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache'
          },
        })
        
        if (!isAborted) {
          clearTimeout(timeoutId)
        }
        
        console.log(`📥 [NDVI FETCH] Respuesta recibida para ${date}:`, {
          status: res.status,
          ok: res.ok,
          headers: Object.fromEntries(res.headers.entries())
        })

        const data = await res.json()
        console.log(`📄 [NDVI FETCH] Data para ${date}:`, data)

        if (res.ok && data.success && data.url) {
          if (data.fallback) {
            console.log(`🔄 [TIMELINE] NDVI fallback para ${date}:`, data.url)
          } else {
            console.log(`✅ [TIMELINE] NDVI REAL obtenido para ${date}:`, data.url)
            console.log(`🎯 [TIMELINE] Procesamiento: ${data.processingTime}ms`)
          }
          return data.url
        } else {
          console.error(`❌ [TIMELINE] Error NDVI para ${date}:`, {
            status: res.status,
            success: data.success,
            error: data.error,
            hasUrl: !!data.url,
            fullData: data
          })
        }
        
        // Si no hay URL válida, usar fallback directo
        console.log(`🔄 [NDVI FETCH] Usando fallback directo para ${date}`)
        const fallbackUrl = `/api/fallback/ndvi?date=${date}&width=200&height=200`
        console.log(`🎨 [NDVI FETCH] Fallback URL: ${fallbackUrl}`)
        return fallbackUrl
        
      } catch (error) {
        if (!isAborted) {
          clearTimeout(timeoutId)
        }
        
        // Manejo específico de errores de abort
        if (error instanceof Error && error.name === 'AbortError') {
          console.log(`🚫 Request abortado para ${date}:`, error.message || 'Timeout')
        } else {
          console.error(`❌ Error cargando NDVI para ${date}:`, error)
        }
        
        // SIEMPRE usar fallback en caso de error
        console.log(`🔄 [NDVI FETCH] Usando fallback por error para ${date}`)
        const fallbackUrl = `/api/fallback/ndvi?date=${date}&width=200&height=200`
        return fallbackUrl
      }
    } catch (error) {
      console.error(`❌ [NDVI FETCH] Error general para ${date}:`, error)
      // Fallback final
      const fallbackUrl = `/api/fallback/ndvi?date=${date}&width=200&height=200`
      console.log(`🎨 [NDVI FETCH] Fallback final para ${date}: ${fallbackUrl}`)
      return fallbackUrl
    }
  }

  const loadTimelineData = useCallback(async () => {
    if (!startDate || !endDate || !lat || !lng) return
    
    console.log(`🚀 [TIMELINE] Iniciando carga de timeline: ${startDate} a ${endDate}`)
    console.log(`📍 [TIMELINE] Coordenadas: ${lat}, ${lng}`)
    
    setLoading(true)
    setTimelineData([]) // Limpiar datos anteriores
    
    const allDates = generateMonthlyDates(startDate, endDate)
    
    // Si hay más de 36 meses (3 años), aplicar límite o preguntar
    let dates = allDates
    if (allDates.length > 36) {
      if (maxPeriods === null) {
        // Mostrar los últimos 36 meses por defecto
        dates = allDates.slice(-36)
      } else if (maxPeriods > 0) {
        // Usar el límite seleccionado por el usuario
        dates = allDates.slice(-maxPeriods)
      }
    }
    
    // Inicializar con estado de carga
    const initialData: NDVIDataPoint[] = dates.map(date => ({
      date,
      imageUrl: '',
      loading: true
    }))
    
    setTimelineData(initialData)

    // Cargar imágenes en lotes pequeños para debugging
    const batchSize = 2 // Reducido para mejor debugging
    
    for (let i = 0; i < dates.length; i += batchSize) {
      const batch = dates.slice(i, i + batchSize)
      const batchPromises = batch.map(async (date, batchIndex) => {
        const actualIndex = i + batchIndex
        try {
          const imageUrl = await fetchNDVIForDate(date)
          return {
            index: actualIndex,
            success: !!imageUrl,
            imageUrl: imageUrl || '',
            error: !imageUrl ? 'Sin datos disponibles' : undefined
          }
        } catch (error) {
          // fetchNDVIForDate ya maneja AbortError y retorna null, no debería llegar aquí
          console.error(`Error inesperado cargando NDVI para ${date}:`, error)
          return {
            index: actualIndex,
            success: false,
            imageUrl: '',
            error: error instanceof Error ? error.message : 'Error desconocido'
          }
        }
      })
      
      // Esperar a que se complete el lote actual
      const batchResults = await Promise.all(batchPromises)
      
      // Actualizar el estado con los resultados del lote
      setTimelineData(prev => {
        const newData = [...prev]
        batchResults.forEach(result => {
          newData[result.index] = {
            ...newData[result.index],
            imageUrl: result.imageUrl,
            loading: false,
            error: result.error
          }
        })
        return newData
      })
      
      // Mostrar progreso detallado
      const completedCount = i + batchResults.length
      const totalCount = dates.length
      const successCount = batchResults.filter(r => r.success).length
      const errorCount = batchResults.filter(r => !r.success).length
      
      console.log(`📊 [BATCH ${Math.floor(i/3) + 1}] Progreso NDVI: ${completedCount}/${totalCount} procesados`)
      console.log(`✅ Exitosos en este batch: ${successCount}, ❌ Errores: ${errorCount}`)
      
      // Pausa entre lotes para no saturar el servidor
      if (i + batchSize < dates.length) {
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }
    
    // Estadísticas finales
    setTimelineData(prev => {
      const successCount = prev.filter(item => item.imageUrl && !item.error).length
      const errorCount = prev.filter(item => item.error).length
      console.log(`✅ Carga NDVI completada: ${successCount} exitosos, ${errorCount} errores de ${prev.length} total`)
      return prev
    })
    
    setLoading(false)
  }, [startDate, endDate, lat, lng, maxPeriods])

  useEffect(() => {
    if (startDate && endDate) {
      loadTimelineData()
    }
  }, [startDate, endDate, lat, lng, loadTimelineData])

  // Solo cargar automáticamente rangos pequeños, para rangos grandes esperar interacción del usuario
  useEffect(() => {
    if (startDate && endDate) {
      const totalMonths = generateMonthlyDates(startDate, endDate).length
      if (totalMonths <= 36) {
        loadTimelineData()
      }
    }
  }, [startDate, endDate, maxPeriods, lat, lng, loadTimelineData])

  const formatMonthYear = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('es-ES', { 
      month: 'short', 
      year: 'numeric' 
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center">
            <span className="text-2xl mr-2">📈</span>
            Línea de Tiempo NDVI - {locationName}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Evolución del estrés vegetativo a lo largo del tiempo
          </p>
        </div>
        
        <div className="flex space-x-2">
          <button
            onClick={() => setViewMode('timeline')}
            className={`px-3 py-1 rounded-md text-sm transition-colors ${
              viewMode === 'timeline' 
                ? 'bg-green-600 text-white' 
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            📅 Timeline
          </button>
          <button
            onClick={() => setViewMode('comparison')}
            className={`px-3 py-1 rounded-md text-sm transition-colors ${
              viewMode === 'comparison' 
                ? 'bg-green-600 text-white' 
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            🔍 Comparar
          </button>
          <button
            onClick={() => {
              console.log('🔄 [TIMELINE] Forzando recarga con API real...')
              loadTimelineData()
            }}
            className="px-3 py-1 rounded-md text-sm bg-blue-600 text-white hover:bg-blue-700 transition-colors"
          >
            🔄 Recargar Real
          </button>
        </div>
      </div>

      {/* Range Information and Controls */}
      {startDate && endDate && (
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="flex items-start justify-between">
            <div>
              <h4 className="text-sm font-semibold text-blue-800 dark:text-blue-200 mb-2">
                📊 Información del Rango
              </h4>
              {(() => {
                const totalMonths = generateMonthlyDates(startDate, endDate).length
                const years = Math.floor(totalMonths / 12)
                const months = totalMonths % 12
                return (
                  <div className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                    <p><strong>Período:</strong> {startDate} a {endDate}</p>
                    <p><strong>Duración:</strong> {years > 0 ? `${years} años${months > 0 ? ` y ${months} meses` : ''}` : `${months} meses`}</p>
                    <p><strong>Total períodos:</strong> {totalMonths} meses</p>
                    {totalMonths > 36 && (
                      <p className="text-yellow-700 dark:text-yellow-300">
                        ⚠️ Rango extenso detectado ({totalMonths} meses)
                      </p>
                    )}
                  </div>
                )
              })()}
            </div>
            
            {(() => {
              const totalMonths = generateMonthlyDates(startDate, endDate).length
              return totalMonths > 36 && (
                <div className="ml-4">
                  <label className="block text-xs font-medium text-blue-800 dark:text-blue-200 mb-2">
                    Límite de carga:
                  </label>
                  <select
                    value={maxPeriods || 36}
                    onChange={(e) => setMaxPeriods(Number(e.target.value))}
                    className="text-sm border border-blue-300 dark:border-blue-600 rounded px-2 py-1 bg-white dark:bg-gray-800"
                  >
                    <option value={36}>Últimos 36 meses (3 años)</option>
                    <option value={60}>Últimos 60 meses (5 años)</option>
                    <option value={120}>Últimos 120 meses (10 años)</option>
                    <option value={totalMonths}>Todos ({totalMonths} meses)</option>
                  </select>
                  <button
                    onClick={loadTimelineData}
                    className="ml-2 px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                  >
                    🔄 Aplicar
                  </button>
                </div>
              )
            })()}
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && timelineData.length === 0 && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Generando línea de tiempo NDVI...</p>
        </div>
      )}

      {/* Timeline View */}
      {viewMode === 'timeline' && timelineData.length > 0 && (
        <div className="space-y-4">
          {/* Scroll horizontal para el timeline */}
          <div className="overflow-x-auto pb-4">
            <div className="flex space-x-4 min-w-max">
              {timelineData.map((dataPoint) => (
                <div 
                  key={dataPoint.date}
                  className="flex-shrink-0 w-48 cursor-pointer transform transition-all duration-200 hover:scale-105"
                  onClick={() => setSelectedPoint(dataPoint)}
                >
                  <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg border-2 transition-colors ${
                    selectedPoint?.date === dataPoint.date 
                      ? 'border-green-500' 
                      : 'border-gray-200 dark:border-gray-700'
                  }`}>
                    {/* Fecha */}
                    <div className="px-3 py-2 bg-green-50 dark:bg-green-900/20 rounded-t-lg border-b">
                      <p className="text-sm font-semibold text-green-800 dark:text-green-200 text-center">
                        {formatMonthYear(dataPoint.date)}
                      </p>
                    </div>
                    
                    {/* Imagen NDVI */}
                    <div className="p-3">
                      {dataPoint.loading ? (
                        <div className="h-32 bg-gray-100 dark:bg-gray-700 rounded flex items-center justify-center">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
                        </div>
                      ) : dataPoint.error ? (
                        <div className="h-32 bg-red-50 dark:bg-red-900/20 rounded flex items-center justify-center">
                          <div className="text-center">
                            <span className="text-red-500 text-lg">❌</span>
                            <p className="text-xs text-red-600 dark:text-red-400 mt-1">{dataPoint.error}</p>
                          </div>
                        </div>
                      ) : dataPoint.imageUrl ? (
                        <img 
                          src={dataPoint.imageUrl} 
                          alt={`NDVI ${formatMonthYear(dataPoint.date)}`}
                          width={200}
                          height={150}
                          onError={(e) => {
                            console.error(`❌ Error cargando imagen NDVI para ${dataPoint.date}:`, {
                              src: dataPoint.imageUrl,
                              error: e,
                              target: e.currentTarget,
                              message: 'Error cargando imagen'
                            })
                            // Marcar como error de imagen y intentar fallback
                            const fallbackUrl = `/api/fallback/ndvi?date=${dataPoint.date}&width=200&height=200`
                            console.log(`🔄 [IMG ERROR] Usando fallback directo para ${dataPoint.date}: ${fallbackUrl}`)
                            
                            setTimelineData(prev => prev.map(item => 
                              item.date === dataPoint.date 
                                ? { ...item, imageUrl: fallbackUrl, imageError: false }
                                : item
                            ))
                          }}
                          onLoad={() => {
                            console.log(`📸 Imagen NDVI cargada exitosamente para ${dataPoint.date}`)
                          }}
                          className="w-full h-32 object-cover rounded"
                        />
                      ) : (
                        <div className="h-32 bg-gray-100 dark:bg-gray-700 rounded flex items-center justify-center">
                          <span className="text-gray-500">Sin datos</span>
                        </div>
                      )}
                      
                      {/* Progress indicator */}
                      <div className="mt-2 text-center">
                        <div className={`inline-block w-2 h-2 rounded-full ${
                          dataPoint.loading ? 'bg-yellow-400 animate-pulse' :
                          dataPoint.error || dataPoint.imageError ? 'bg-red-400' :
                          dataPoint.imageUrl && !dataPoint.imageError ? 'bg-green-400' : 'bg-gray-400'
                        }`}></div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div 
              className="bg-green-600 h-2 rounded-full transition-all duration-300"
              style={{
                width: `${(timelineData.filter(p => !p.loading).length / timelineData.length) * 100}%`
              }}
            ></div>
          </div>
          
          <p className="text-xs text-center text-gray-500 dark:text-gray-400">
            {timelineData.filter(p => !p.loading).length} de {timelineData.length} períodos cargados
          </p>
        </div>
      )}

      {/* Comparison View */}
      {viewMode === 'comparison' && timelineData.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {timelineData.filter(p => !p.loading && p.imageUrl).map((dataPoint) => (
            <div key={dataPoint.date} className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
              <div className="px-4 py-2 bg-green-50 dark:bg-green-900/20 border-b">
                <h4 className="font-semibold text-green-800 dark:text-green-200 text-center">
                  {formatMonthYear(dataPoint.date)}
                </h4>
              </div>
              <div className="p-4">
                <img 
                  src={dataPoint.imageUrl} 
                  alt={`NDVI ${formatMonthYear(dataPoint.date)}`}
                  width={300}
                  height={200}
                  className="w-full h-48 object-cover rounded"
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Selected Point Detail */}
      {selectedPoint && selectedPoint.imageUrl && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              📊 Detalle - {formatMonthYear(selectedPoint.date)}
            </h4>
            <button 
              onClick={() => setSelectedPoint(null)}
              className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            >
              ✕
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <img 
                src={selectedPoint.imageUrl} 
                alt={`NDVI ${formatMonthYear(selectedPoint.date)}`}
                width={400}
                height={300}
                className="w-full h-64 object-cover rounded-lg"
              />
            </div>
            
            <div className="space-y-4">
              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                <h5 className="font-medium text-green-800 dark:text-green-200 mb-2">
                  📅 Información del Período
                </h5>
                <ul className="text-sm text-green-700 dark:text-green-300 space-y-1">
                  <li><strong>Fecha:</strong> {formatMonthYear(selectedPoint.date)}</li>
                  <li><strong>Ubicación:</strong> {locationName}</li>
                  <li><strong>Coordenadas:</strong> {lat.toFixed(6)}, {lng.toFixed(6)}</li>
                </ul>
              </div>
              
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <h5 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
                  🌱 Interpretación NDVI
                </h5>
                <div className="text-xs space-y-1 text-blue-700 dark:text-blue-300">
                  <div className="flex items-center"><div className="w-3 h-3 bg-red-600 rounded mr-2"></div>Rojo: Estrés severo</div>
                  <div className="flex items-center"><div className="w-3 h-3 bg-yellow-400 rounded mr-2"></div>Amarillo: Estrés moderado</div>
                  <div className="flex items-center"><div className="w-3 h-3 bg-green-500 rounded mr-2"></div>Verde: Saludable</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && timelineData.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📈</div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            Timeline NDVI no disponible
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            Selecciona un rango de fechas para generar la línea de tiempo del estrés vegetativo.
          </p>
        </div>
      )}
    </div>
  )
}