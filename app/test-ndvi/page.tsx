'use client'

import { useState } from 'react'
import Image from 'next/image'

interface TestResults {
  error?: string
  direct?: {
    success?: boolean
    apiResponse?: {
      url?: string
    }
  }
  fallbackWorking?: boolean
  timestamp?: string
}

export default function NDVITestPage() {
  const [testResults, setTestResults] = useState<TestResults | null>(null)
  const [loading, setLoading] = useState(false)

  const runTest = async () => {
    setLoading(true)
    try {
      // Test 1: Debug directo
      console.log('🧪 Ejecutando test directo de NDVI...')
      const directResponse = await fetch('/api/debug/ndvi-direct')
      const directData = await directResponse.json()
      
      // Test 2: Test de fallback
      console.log('🎨 Ejecutando test de fallback...')
      const fallbackResponse = await fetch('/api/fallback/ndvi?date=2024-02-01&width=256&height=256')
      const fallbackWorking = fallbackResponse.ok
      
      setTestResults({
        direct: directData,
        fallbackWorking,
        timestamp: new Date().toISOString()
      })
      
    } catch (error) {
      console.error('Error en test:', error)
      setTestResults({ error: error instanceof Error ? error.message : 'Error desconocido' })
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
          🧪 Test NDVI System
        </h1>

        <div className="space-y-6">
          {/* Test Controls */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <button
              onClick={runTest}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg disabled:opacity-50"
            >
              {loading ? '🔄 Ejecutando Tests...' : '🧪 Ejecutar Tests NDVI'}
            </button>
          </div>

          {/* Test Results */}
          {testResults && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">📊 Resultados de Test</h2>
              
              {testResults.error ? (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-800">❌ Error: {testResults.error}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Direct API Test */}
                  <div className="border rounded-lg p-4">
                    <h3 className="font-semibold mb-2">🔗 Test API Directo</h3>
                    <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded text-sm">
                      <pre>{JSON.stringify(testResults.direct, null, 2)}</pre>
                    </div>
                    
                    {testResults.direct?.success && testResults.direct?.apiResponse?.url && (
                      <div className="mt-4">
                        <p className="text-sm font-medium mb-2">Imagen generada:</p>
                        <Image
                          src={testResults.direct.apiResponse.url}
                          alt="Test NDVI"
                          width={256}
                          height={256}
                          className="border rounded"
                          onError={() => console.log('Error cargando imagen de test')}
                          onLoad={() => console.log('Imagen de test cargada exitosamente')}
                        />
                      </div>
                    )}
                  </div>

                  {/* Fallback Test */}
                  <div className="border rounded-lg p-4">
                    <h3 className="font-semibold mb-2">🎨 Test Fallback</h3>
                    <p className={testResults.fallbackWorking ? 'text-green-600' : 'text-red-600'}>
                      {testResults.fallbackWorking ? '✅ Fallback funcionando' : '❌ Fallback falla'}
                    </p>
                    
                    {testResults.fallbackWorking && (
                      <div className="mt-4">
                        <p className="text-sm font-medium mb-2">Imagen de fallback:</p>
                        <Image
                          src="/api/fallback/ndvi?date=2024-02-01&width=256&height=256"
                          alt="Fallback NDVI"
                          width={256}
                          height={256}
                          className="border rounded"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              <p className="text-xs text-gray-500 mt-4">
                Test ejecutado: {testResults.timestamp}
              </p>
            </div>
          )}

          {/* Quick Image Tests */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">🖼️ Tests Rápidos de Imágenes</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-medium mb-2">Fallback SVG</h3>
                <Image
                  src="/api/fallback/ndvi?date=2024-02-01&width=200&height=200"
                  alt="Test Fallback"
                  width={200}
                  height={200}
                  className="border rounded"
                />
              </div>
              
              <div>
                <h3 className="font-medium mb-2">NDVI Real (Feb 2024)</h3>
                <Image
                  src="/api/earth-engine/ndvi?lat=4.316272&lon=-74.669316&startDate=2024-02-01&endDate=2024-02-29&size=200&radiusMeters=1500"
                  alt="Test NDVI Real"
                  width={200}
                  height={200}
                  className="border rounded"
                  onError={() => {
                    console.log('NDVI real falló, probablemente usará fallback')
                    // La imagen automáticamente usará fallback si falla
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}