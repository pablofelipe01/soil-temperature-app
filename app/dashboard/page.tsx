'use client'

import ProtectedLayout from '@/components/layout/ProtectedLayout'
import { useAuth } from '@/hooks/useAuth'
import Link from 'next/link'
import dynamic from 'next/dynamic'

const SimpleMap = dynamic(() => import('@/components/maps/SimpleMap'), { 
  ssr: false,
  loading: () => <div className="w-full h-96 bg-white/5 backdrop-blur-sm animate-pulse rounded-xl flex items-center justify-center border border-white/10">
    <p className="text-gray-300">Cargando mapa...</p>
  </div>
})

export default function DashboardPage() {
  const { user } = useAuth()

  return (
    <ProtectedLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="backdrop-blur-lg bg-white/10 border border-white/20 rounded-2xl p-6">
            <h1 className="text-4xl font-light text-white tracking-wide">
              Dashboard
            </h1>
            <p className="mt-2 text-gray-200 text-lg">
              Bienvenido, {user?.user_metadata?.full_name || user?.email}
            </p>
          </div>
        </div>

        {/* Sección del Mapa - Ahora principal */}
        <div className="backdrop-blur-lg bg-white/10 border border-white/20 rounded-2xl mb-8 shadow-2xl">
          <div className="px-6 py-4 border-b border-white/20">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-medium text-white flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-500/30 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"></path>
                  </svg>
                </div>
                Mapa de Temperaturas
              </h3>
              <p className="text-sm text-gray-300 hidden sm:block">
                Datos de Google Earth Engine
              </p>
            </div>
          </div>
          <div className="p-6">
            <div className="backdrop-blur-sm bg-white/5 rounded-xl border border-white/10 overflow-hidden">
              <SimpleMap />
            </div>
          </div>
        </div>

        {/* Sección de acciones rápidas */}
        <div className="backdrop-blur-lg bg-white/10 border border-white/20 rounded-2xl shadow-2xl">
          <div className="px-6 py-4 border-b border-white/20">
            <h3 className="text-xl font-medium text-white flex items-center gap-3">
              <div className="w-8 h-8 bg-purple-500/30 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                </svg>
              </div>
              Acciones Rápidas
            </h3>
            <p className="text-sm text-gray-300 mt-1">
              Herramientas principales para gestionar ubicaciones y datos de temperatura
            </p>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Link 
                href="/locations/new"
                className="group relative backdrop-blur-sm bg-blue-500/10 border border-blue-400/20 rounded-xl p-6 hover:bg-blue-500/20 hover:border-blue-300/40 transition-all duration-300 hover:scale-105"
              >
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 bg-blue-500/20 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-blue-500/30 transition-all duration-300 group-hover:scale-110">
                    <svg className="w-8 h-8 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                    </svg>
                  </div>
                  <h4 className="text-lg font-medium text-white mb-2">
                    Nueva Ubicación
                  </h4>
                  <p className="text-sm text-gray-300">
                    Registra un nuevo punto de monitoreo
                  </p>
                </div>
              </Link>

              <Link 
                href="/locations"
                className="group relative backdrop-blur-sm bg-green-500/10 border border-green-400/20 rounded-xl p-6 hover:bg-green-500/20 hover:border-green-300/40 transition-all duration-300 hover:scale-105"
              >
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 bg-green-500/20 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-green-500/30 transition-all duration-300 group-hover:scale-110">
                    <svg className="w-8 h-8 text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                    </svg>
                  </div>
                  <h4 className="text-lg font-medium text-white mb-2">
                    Ver Temperaturas
                  </h4>
                  <p className="text-sm text-gray-300">
                    Explora datos de temperatura por ubicación
                  </p>
                </div>
              </Link>

              <Link 
                href="/locations"
                className="group relative backdrop-blur-sm bg-purple-500/10 border border-purple-400/20 rounded-xl p-6 hover:bg-purple-500/20 hover:border-purple-300/40 transition-all duration-300 hover:scale-105"
              >
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 bg-purple-500/20 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-purple-500/30 transition-all duration-300 group-hover:scale-110">
                    <svg className="w-8 h-8 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path>
                    </svg>
                  </div>
                  <h4 className="text-lg font-medium text-white mb-2">
                    Gestionar Ubicaciones
                  </h4>
                  <p className="text-sm text-gray-300">
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