'use client'

import { useParams } from 'next/navigation'
import ProtectedLayout from '@/components/layout/ProtectedLayout'
import Link from 'next/link'

export default function LocationReportsPage() {
  const params = useParams()
  const locationId = params.id as string

  return (
    <ProtectedLayout>
      <div className="py-10">
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <Link
                href={`/locations/${locationId}`}
                className="text-blue-600 hover:text-blue-500 flex items-center"
              >
                ← Volver a detalles de ubicación
              </Link>
            </div>
            
            <h1 className="text-2xl font-bold leading-7 text-gray-900 dark:text-gray-100 sm:text-3xl">
              Reportes de Ubicación
            </h1>
            <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">
              Consulta y genera reportes de datos de temperatura y análisis históricos
            </p>
          </div>

          {/* Coming Soon */}
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
            <div className="px-6 py-12 text-center">
              <div className="text-6xl mb-4">📊</div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                Reportes Próximamente
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                Esta sección permitirá generar reportes detallados de temperatura del suelo, 
                análisis estadísticos y documentos para certificación de bonos de carbono.
              </p>
              
              <div className="space-y-4 max-w-md mx-auto">
                <div className="text-left space-y-2">
                  <h4 className="font-medium text-gray-900 dark:text-gray-100">Funciones planeadas:</h4>
                  <ul className="text-sm text-gray-500 dark:text-gray-400 space-y-1">
                    <li>• Reportes PDF de temperatura histórica</li>
                    <li>• Análisis estadísticos detallados</li>
                    <li>• Gráficos y visualizaciones</li>
                    <li>• Exportación de datos CSV/Excel</li>
                    <li>• Certificación de bonos de carbono</li>
                  </ul>
                </div>
              </div>

              <div className="mt-8">
                <Link
                  href={`/locations/${locationId}`}
                  className="inline-flex items-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  🌡️ Ver Datos de Temperatura en Mapa
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedLayout>
  )
}