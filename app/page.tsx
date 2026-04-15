'use client'

import { useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Thermometer, MapPin, Globe, BarChart3 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardBody } from '@/components/ui/Card'

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
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600"></div>
      </div>
    )
  }

  if (user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Redirigiendo al dashboard...
          </h2>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-center min-h-screen py-12">
          <div className="text-center">
            <h1 className="text-4xl font-extrabold text-gray-900 dark:text-gray-100 sm:text-5xl md:text-6xl">
              <span className="flex items-center justify-center gap-3">
                <Thermometer className="h-10 w-10 text-green-600 sm:h-12 sm:w-12" />
                Soil Temperature
              </span>
              <span className="block text-green-600">Monitor</span>
            </h1>
            <p className="mt-3 max-w-md mx-auto text-base text-gray-500 dark:text-gray-400 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
              Sistema de monitoreo de temperatura del suelo para certificación de bonos de carbono por biochar.
              Cumple con los estándares de Puro.earth.
            </p>
            <div className="mt-5 max-w-md mx-auto sm:flex sm:justify-center md:mt-8">
              <Link href="/login">
                <Button size="lg" className="w-full sm:w-auto px-10">
                  Iniciar Sesión
                </Button>
              </Link>
            </div>
          </div>

          <div className="mt-16 max-w-4xl mx-auto w-full">
            <Card>
              <CardBody className="px-4 py-5 sm:p-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
                  Características Principales
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="flex justify-center mb-2">
                      <MapPin className="h-8 w-8 text-blue-500" />
                    </div>
                    <h4 className="font-medium text-gray-900 dark:text-gray-100">Ubicaciones Precisas</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Registro de coordenadas exactas para monitoreo específico
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="flex justify-center mb-2">
                      <Globe className="h-8 w-8 text-green-500" />
                    </div>
                    <h4 className="font-medium text-gray-900 dark:text-gray-100">Google Earth Engine</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Datos satelitales de temperatura del suelo en tiempo real
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="flex justify-center mb-2">
                      <BarChart3 className="h-8 w-8 text-purple-500" />
                    </div>
                    <h4 className="font-medium text-gray-900 dark:text-gray-100">Reportes Certificados</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Generación automática de reportes para Puro.earth
                    </p>
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
