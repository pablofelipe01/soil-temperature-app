'use client'

import { useEffect, useState } from 'react'
import ProtectedLayout from '@/components/layout/ProtectedLayout'
import { useAuth } from '@/hooks/useAuth'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { Map, Zap, MapPin, Thermometer, ClipboardList } from 'lucide-react'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import type { MapLocation } from '@/components/maps/SimpleMap'
import { supabase } from '@/lib/supabase/client'

const SimpleMap = dynamic(() => import('@/components/maps/SimpleMap'), { 
  ssr: false,
  loading: () => <div className="w-full h-96 bg-gray-100 dark:bg-gray-800 animate-pulse rounded-lg flex items-center justify-center">
    <p className="text-gray-500 dark:text-gray-400">Cargando mapa...</p>
  </div>
})

export default function DashboardPage() {
  const { user } = useAuth()
  const [mapLocations, setMapLocations] = useState<MapLocation[] | null>(null)

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) return

        const res = await fetch('/api/locations?active=true&includeLatestTemp=true', {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'x-user-id': session.user.id,
          },
        })

        if (!res.ok) return

        const json = await res.json()
        if (!json.success || !json.data) return

        const locations: MapLocation[] = json.data.map((loc: {
          id: string
          name: string
          latitude: number
          longitude: number
          soilTemperatures?: { measurementDate: string; tempLevel1: number | null; dataSource: string }[]
        }) => {
          const latest = loc.soilTemperatures?.[0]
          return {
            id: loc.id,
            name: loc.name,
            latitude: loc.latitude,
            longitude: loc.longitude,
            latestTemperature: latest?.tempLevel1 ?? null,
            latestDate: latest?.measurementDate ?? null,
            dataSource: latest?.dataSource ?? null,
          }
        })

        setMapLocations(locations)
      } catch (err) {
        console.error('Error fetching locations for dashboard map:', err)
      }
    }

    fetchLocations()
  }, [])

  return (
    <ProtectedLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Dashboard
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Bienvenido, {user?.user_metadata?.full_name || user?.email}
          </p>
        </div>

        {/* Sección del Mapa */}
        <Card className="mb-8">
          <CardHeader
            action={
              <p className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block">
                Datos de Google Earth Engine
              </p>
            }
          >
            <span className="flex items-center gap-2 text-lg font-medium">
              <Map className="h-5 w-5 text-green-600" />
              Mapa de Temperaturas
            </span>
          </CardHeader>
          <CardBody className="p-4">
            {mapLocations !== null && mapLocations.length === 0 ? (
              <div className="w-full h-96 flex items-center justify-center bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-dashed border-gray-300 dark:border-gray-700">
                <div className="text-center">
                  <MapPin className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600 dark:text-gray-400 font-medium mb-1">No tienes ubicaciones activas</p>
                  <p className="text-sm text-gray-500 dark:text-gray-500 mb-4">Crea tu primera ubicación para ver datos de temperatura en el mapa.</p>
                  <Link
                    href="/locations/new"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <MapPin className="h-4 w-4" />
                    Nueva Ubicación
                  </Link>
                </div>
              </div>
            ) : (
              <SimpleMap locations={mapLocations ?? undefined} />
            )}
          </CardBody>
        </Card>

        {/* Sección de acciones rápidas */}
        <Card>
          <CardHeader>
            <span className="flex items-center gap-2 text-lg font-medium">
              <Zap className="h-5 w-5 text-amber-500" />
              Acciones Rápidas
            </span>
          </CardHeader>
          <div className="px-6 pb-2 -mt-2">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Herramientas principales para gestionar ubicaciones y datos de temperatura
            </p>
          </div>
          <CardBody className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Link 
                href="/locations/new"
                className="group relative bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40 p-6 border border-blue-200 dark:border-blue-800 rounded-xl hover:from-blue-100 hover:to-indigo-100 dark:hover:from-blue-950/60 dark:hover:to-indigo-950/60 hover:border-blue-300 dark:hover:border-blue-700 transition-all duration-200 hover:shadow-md"
              >
                <div className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-200">
                    <MapPin className="h-6 w-6 text-white" />
                  </div>
                  <h4 className="text-base font-medium text-gray-900 dark:text-gray-100 mb-2">
                    Nueva Ubicación
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Registra un nuevo punto de monitoreo
                  </p>
                </div>
              </Link>

              <Link 
                href="/locations"
                className="group relative bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/40 dark:to-emerald-950/40 p-6 border border-green-200 dark:border-green-800 rounded-xl hover:from-green-100 hover:to-emerald-100 dark:hover:from-green-950/60 dark:hover:to-emerald-950/60 hover:border-green-300 dark:hover:border-green-700 transition-all duration-200 hover:shadow-md"
              >
                <div className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-200">
                    <Thermometer className="h-6 w-6 text-white" />
                  </div>
                  <h4 className="text-base font-medium text-gray-900 dark:text-gray-100 mb-2">
                    Ver Temperaturas
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Explora datos de temperatura por ubicación
                  </p>
                </div>
              </Link>

              <Link 
                href="/locations"
                className="group relative bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-950/40 dark:to-violet-950/40 p-6 border border-purple-200 dark:border-purple-800 rounded-xl hover:from-purple-100 hover:to-violet-100 dark:hover:from-purple-950/60 dark:hover:to-violet-950/60 hover:border-purple-300 dark:hover:border-purple-700 transition-all duration-200 hover:shadow-md"
              >
                <div className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-200">
                    <ClipboardList className="h-6 w-6 text-white" />
                  </div>
                  <h4 className="text-base font-medium text-gray-900 dark:text-gray-100 mb-2">
                    Gestionar Ubicaciones
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Ver y editar todas las ubicaciones
                  </p>
                </div>
              </Link>
            </div>
          </CardBody>
        </Card>
      </div>
    </ProtectedLayout>
  )
}