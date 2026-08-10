'use client'

import { useEffect, useState } from 'react'
import ProtectedLayout from '@/components/layout/ProtectedLayout'
import { useAuth } from '@/hooks/useAuth'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { Map, Zap, MapPin, Thermometer, ClipboardList, FileText } from 'lucide-react'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { TiltCard } from '@/components/ui/TiltCard'
import HeroBackground from '@/components/layout/HeroBackground'
import type { MapLocation } from '@/components/maps/SimpleMap'
import { supabase } from '@/lib/supabase/client'

const QUICK_ACTIONS = [
  {
    href: '/locations/new',
    icon: MapPin,
    title: 'Nueva Ubicación',
    description: 'Registra un nuevo punto de monitoreo',
    surface:
      'bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 dark:from-blue-950/40 dark:to-indigo-950/40 dark:border-blue-800',
    iconBg: 'bg-blue-500',
  },
  {
    href: '/locations',
    icon: Thermometer,
    title: 'Ver Temperaturas',
    description: 'Explora datos de temperatura por ubicación',
    surface:
      'bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 dark:from-green-950/40 dark:to-emerald-950/40 dark:border-green-800',
    iconBg: 'bg-green-500',
  },
  {
    href: '/locations',
    icon: ClipboardList,
    title: 'Gestionar Ubicaciones',
    description: 'Ver y editar todas las ubicaciones',
    surface:
      'bg-gradient-to-br from-purple-50 to-violet-50 border border-purple-200 dark:from-purple-950/40 dark:to-violet-950/40 dark:border-purple-800',
    iconBg: 'bg-purple-500',
  },
  {
    href: '/reports',
    icon: FileText,
    title: 'Generar Reportes',
    description: 'PDF y Excel para certificación Puro.earth',
    surface:
      'bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 dark:from-amber-950/40 dark:to-orange-950/40 dark:border-amber-800',
    iconBg: 'bg-amber-500',
  },
] as const

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
        {/* Banda de encabezado con fotografía de marca */}
        <section className="relative mb-8 overflow-hidden rounded-2xl border border-slate-800/60 shadow-lg shadow-slate-900/10">
          <HeroBackground overlay="strong" priority />
          <div className="relative px-6 py-10 sm:px-8 sm:py-12">
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/25 bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-200">
              <Thermometer className="h-3.5 w-3.5" />
              Monitoreo activo
            </span>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Panel de control
            </h1>
            <p className="mt-2 text-sm text-white/70 sm:text-base">
              Bienvenido, {user?.user_metadata?.full_name || user?.email}
            </p>
          </div>
        </section>

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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {QUICK_ACTIONS.map(({ href, icon: Icon, title, description, surface, iconBg }) => (
                <TiltCard
                  key={title}
                  maxTilt={8}
                  depth={16}
                  className={`${surface} shadow-sm transition-shadow duration-200 hover:shadow-lg`}
                >
                  <Link href={href} className="group flex h-full flex-col items-center p-6 text-center">
                    <div
                      className={`w-12 h-12 ${iconBg} rounded-lg flex items-center justify-center mb-3 transition-transform duration-200 group-hover:scale-110`}
                    >
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <h4 className="text-base font-medium text-gray-900 dark:text-gray-100 mb-2">
                      {title}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {description}
                    </p>
                  </Link>
                </TiltCard>
              ))}
            </div>
          </CardBody>
        </Card>
      </div>
    </ProtectedLayout>
  )
}