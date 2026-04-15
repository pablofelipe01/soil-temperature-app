'use client'

import { useParams } from 'next/navigation'
import ProtectedLayout from '@/components/layout/ProtectedLayout'
import Link from 'next/link'
import { ArrowLeft, BarChart3, Thermometer } from 'lucide-react'
import { Card, CardBody } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

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
                className="text-green-600 hover:text-green-500 flex items-center gap-1"
              >
                <ArrowLeft className="h-4 w-4" /> Volver a detalles de ubicación
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
          <Card>
            <CardBody className="px-6 py-12 text-center">
              <BarChart3 className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
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
                <Link href={`/locations/${locationId}`}>
                  <Button icon={<Thermometer className="h-4 w-4" />}>
                    Ver Datos de Temperatura en Mapa
                  </Button>
                </Link>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </ProtectedLayout>
  )
}