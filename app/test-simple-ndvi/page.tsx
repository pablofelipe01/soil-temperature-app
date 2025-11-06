'use client'

import { useState } from 'react'

interface NDVIResult {
  success: boolean
  url?: string
  originalUrl?: string
  processingTime?: number
  fallback?: boolean
  error?: string
}

export default function TestSimpleNDVIPage() {
  const [result, setResult] = useState<NDVIResult | null>(null)
  const [loading, setLoading] = useState(false)

  const testAPI = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/earth-engine/ndvi-simple?lat=4.316272&lon=-74.669316&startDate=2024-02-01&endDate=2024-02-29&size=200')
      const data = await response.json()
      setResult(data)
      console.log('🧪 Test API Result:', data)
    } catch (error) {
      console.error('❌ Test API Error:', error)
      setResult({ success: false, error: error instanceof Error ? error.message : 'Error desconocido' })
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
          🧪 Test API NDVI Simplificada
        </h1>

        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <button
              onClick={testAPI}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg disabled:opacity-50"
            >
              {loading ? '🔄 Probando...' : '🧪 Probar API NDVI'}
            </button>
          </div>

          {result && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">📊 Resultado</h2>
              
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded text-sm">
                <pre>{JSON.stringify(result, null, 2)}</pre>
              </div>

              {result.success && result.url && (
                <div className="mt-4">
                  <h3 className="font-medium mb-2">🖼️ Imagen generada:</h3>
                  <img
                    src={result.url}
                    alt="Test NDVI"
                    className="border rounded max-w-full"
                    onLoad={() => console.log('✅ Imagen cargada exitosamente')}
                    onError={(e) => console.error('❌ Error cargando imagen:', e)}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}