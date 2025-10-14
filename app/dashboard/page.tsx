'use client'

import ProtectedLayout from '@/components/layout/ProtectedLayout'
import { useAuth } from '@/hooks/useAuth'
import SimpleMap from '@/components/maps/SimpleMap'
import Link from 'next/link'

export default function DashboardPage() {
  const { user } = useAuth()

  return (
    <ProtectedLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Dashboard
          </h1>
          <p className="mt-2 text-gray-600">
            Bienvenido, {user?.user_metadata?.full_name || user?.email}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Tarjeta de resumen - Ubicaciones */}
          <div className="bg-white overflow-hidden shadow-sm rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                    📍
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Ubicaciones Registradas
                    </dt>
                    <dd className="text-lg font-semibold text-gray-900">
                      0
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-5 py-3">
              <div className="text-sm">
                <Link href="/locations" className="font-medium text-blue-600 hover:text-blue-500">
                  Ver todas las ubicaciones
                </Link>
              </div>
            </div>
          </div>

          {/* Tarjeta de resumen - Consultas recientes */}
          <div className="bg-white overflow-hidden shadow-sm rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                    🌡️
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Consultas del Mes
                    </dt>
                    <dd className="text-lg font-semibold text-gray-900">
                      0
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-5 py-3">
              <div className="text-sm">
                <a href="/temperature-data" className="font-medium text-green-600 hover:text-green-500">
                  Consultar datos
                </a>
              </div>
            </div>
          </div>

          {/* Tarjeta de resumen - Reportes */}
          <div className="bg-white overflow-hidden shadow-sm rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                    📊
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Reportes Generados
                    </dt>
                    <dd className="text-lg font-semibold text-gray-900">
                      0
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-5 py-3">
              <div className="text-sm">
                <a href="/reports" className="font-medium text-purple-600 hover:text-purple-500">
                  Ver reportes
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Sección del Mapa */}
        <div className="bg-white shadow-sm rounded-lg mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              🗺️ Mapa de Ubicaciones
            </h3>
            <p className="text-sm text-gray-500">
              Visualización simple de puntos de monitoreo
            </p>
          </div>
          <div className="p-6">
            <SimpleMap />
          </div>
        </div>

        {/* Sección de acciones rápidas */}
        <div className="bg-white shadow-sm rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              Acciones Rápidas
            </h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Link 
                href="/locations/new"
                className="flex items-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors"
              >
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    ➕
                  </div>
                </div>
                <div className="ml-4">
                  <h4 className="text-sm font-medium text-gray-900">
                    Agregar Nueva Ubicación
                  </h4>
                  <p className="text-sm text-gray-500">
                    Registra una nueva ubicación para monitoreo
                  </p>
                </div>
              </Link>

              <Link 
                href="/temperature-data"
                className="flex items-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-400 hover:bg-green-50 transition-colors"
              >
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    🌡️
                  </div>
                </div>
                <div className="ml-4">
                  <h4 className="text-sm font-medium text-gray-900">
                    Consultar Datos de Temperatura
                  </h4>
                  <p className="text-sm text-gray-500">
                    Obtén datos históricos del suelo desde Google Earth Engine
                  </p>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </ProtectedLayout>
  )
}