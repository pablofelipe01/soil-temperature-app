'use client'

import ProtectedLayout from '@/components/layout/ProtectedLayout'
import { useAuth } from '@/hooks/useAuth'
import Link from 'next/link'
import dynamic from 'next/dynamic'

const SimpleMap = dynamic(() => import('@/components/maps/SimpleMap'), { 
  ssr: false,
  loading: () => <div className="w-full h-96 bg-gray-100 animate-pulse rounded-lg flex items-center justify-center">
    <p className="text-gray-500">Cargando mapa...</p>
  </div>
})

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

        {/* Sección del Mapa - Ahora principal */}
        <div className="bg-white shadow-sm rounded-lg mb-8">
          <div className="px-6 py-3 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">
                🗺️ Mapa de Temperaturas
              </h3>
              <p className="text-xs text-gray-500 hidden sm:block">
                Datos de Google Earth Engine
              </p>
            </div>
          </div>
          <div className="p-4">
            <SimpleMap />
          </div>
        </div>

        {/* Sección de acciones rápidas */}
        <div className="bg-white shadow-sm rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              ⚡ Acciones Rápidas
            </h3>
            <p className="text-sm text-gray-500">
              Herramientas principales para gestionar ubicaciones y datos de temperatura
            </p>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Link 
                href="/locations/new"
                className="group relative bg-gradient-to-br from-blue-50 to-indigo-50 p-6 border border-blue-200 rounded-xl hover:from-blue-100 hover:to-indigo-100 hover:border-blue-300 transition-all duration-200 hover:shadow-md"
              >
                <div className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-200">
                    <span className="text-white text-xl">📍</span>
                  </div>
                  <h4 className="text-base font-medium text-gray-900 mb-2">
                    Nueva Ubicación
                  </h4>
                  <p className="text-sm text-gray-600">
                    Registra un nuevo punto de monitoreo
                  </p>
                </div>
              </Link>

              <Link 
                href="/locations"
                className="group relative bg-gradient-to-br from-green-50 to-emerald-50 p-6 border border-green-200 rounded-xl hover:from-green-100 hover:to-emerald-100 hover:border-green-300 transition-all duration-200 hover:shadow-md"
              >
                <div className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-200">
                    <span className="text-white text-xl">🌡️</span>
                  </div>
                  <h4 className="text-base font-medium text-gray-900 mb-2">
                    Ver Temperaturas
                  </h4>
                  <p className="text-sm text-gray-600">
                    Explora datos de temperatura por ubicación
                  </p>
                </div>
              </Link>

              <Link 
                href="/locations"
                className="group relative bg-gradient-to-br from-purple-50 to-violet-50 p-6 border border-purple-200 rounded-xl hover:from-purple-100 hover:to-violet-100 hover:border-purple-300 transition-all duration-200 hover:shadow-md"
              >
                <div className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-200">
                    <span className="text-white text-xl">📋</span>
                  </div>
                  <h4 className="text-base font-medium text-gray-900 mb-2">
                    Gestionar Ubicaciones
                  </h4>
                  <p className="text-sm text-gray-600">
                    Ver y editar todas las ubicaciones
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