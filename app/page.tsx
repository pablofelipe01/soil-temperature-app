'use client'

import { useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'

export default function Home() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Redirigiendo al dashboard...
          </h2>
        </div>
      </div>
    )
  }

  return (
    <>
      <Navbar />
      <div className="relative min-h-screen overflow-hidden">
        {/* Background Image */}
        <div 
          className="absolute top-0 left-0 w-full h-full bg-cover bg-center bg-fixed"
          style={{
            backgroundImage: 'url(/textura-biochar.jpg)',
          }}
        ></div>
        
        {/* Dark overlay for better text readability */}
        <div className="absolute top-0 left-0 w-full h-full bg-black/50"></div>
        
        {/* Content */}
        <div className="relative z-10 min-h-screen flex flex-col pt-24">
          {/* Hero Section */}
          <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-4xl mx-auto">
              <h1 className="text-6xl md:text-8xl font-light text-white mb-8 tracking-wide">
                <span className="block">Soil Temperature</span>
                <span className="block text-blue-400 font-normal">Monitor</span>
              </h1>
              <p className="text-xl md:text-2xl text-gray-200 mb-10 font-light leading-relaxed max-w-3xl mx-auto">
                Sistema de monitoreo de temperatura del suelo para certificación de bonos de carbono por biochar.
                <span className="block mt-3">Cumple con los estándares de Puro.earth.</span>
              </p>
              <div className="mt-12">
                <Link
                  href="/login"
                  className="inline-flex items-center px-10 py-4 text-lg font-medium text-white bg-blue-600/40 hover:bg-blue-600/60 rounded-xl transition-all duration-300 backdrop-blur-md border border-blue-400/30 hover:border-blue-300/60 shadow-lg hover:shadow-blue-500/25"
                >
                  Iniciar Sesión
                  <svg className="ml-3 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                  </svg>
                </Link>
              </div>
              <br /><br />
            </div>
          </div>

          {/* Features Section */}
          <div className="pb-24 px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto">
              <div className="backdrop-blur-lg bg-white/5 rounded-3xl border border-white/10 p-10 md:p-16 shadow-2xl">
                <h3 className="text-3xl md:text-4xl font-light text-white text-center mb-16 tracking-wide">
                  Características Principales
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                  <div className="text-center group">
                    <div className="w-20 h-20 mx-auto mb-6 bg-blue-500/20 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-blue-400/20 group-hover:bg-blue-500/30 group-hover:border-blue-300/40 transition-all duration-500 group-hover:scale-105">
                      <svg className="w-10 h-10 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                      </svg>
                    </div>
                    <h4 className="text-xl font-medium text-white mb-4 tracking-wide">Ubicaciones Precisas</h4>
                    <p className="text-gray-300 font-light leading-relaxed text-lg">
                      Registro de coordenadas exactas para monitoreo específico de cada sitio
                    </p>
                  </div>
                  <div className="text-center group">
                    <div className="w-20 h-20 mx-auto mb-6 bg-green-500/20 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-green-400/20 group-hover:bg-green-500/30 group-hover:border-green-300/40 transition-all duration-500 group-hover:scale-105">
                      <svg className="w-10 h-10 text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                      </svg>
                    </div>
                    <h4 className="text-xl font-medium text-white mb-4 tracking-wide">Google Earth Engine</h4>
                    <p className="text-gray-300 font-light leading-relaxed text-lg">
                      Datos satelitales de temperatura del suelo en tiempo real y análisis histórico
                    </p>
                  </div>
                  <div className="text-center group">
                    <div className="w-20 h-20 mx-auto mb-6 bg-purple-500/20 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-purple-400/20 group-hover:bg-purple-500/30 group-hover:border-purple-300/40 transition-all duration-500 group-hover:scale-105">
                      <svg className="w-10 h-10 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                      </svg>
                    </div>
                    <h4 className="text-xl font-medium text-white mb-4 tracking-wide">Reportes Certificados</h4>
                    <p className="text-gray-300 font-light leading-relaxed text-lg">
                      Generación automática de reportes compatibles con Puro.earth
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
