'use client'

import { useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Thermometer,
  MapPin,
  Globe,
  BarChart3,
  ShieldCheck,
  ArrowRight,
  Satellite,
  Layers,
  BellRing,
} from 'lucide-react'
import HeroBackground from '@/components/layout/HeroBackground'
import { TiltCard } from '@/components/ui/TiltCard'

const FEATURES = [
  {
    icon: MapPin,
    title: 'Ubicaciones precisas',
    description:
      'Coordenadas exactas por parcela, con historial completo y control de estado activo/inactivo.',
    accent: 'text-sky-300',
    ring: 'from-sky-400/25 to-sky-400/0',
  },
  {
    icon: Globe,
    title: 'Google Earth Engine',
    description:
      'Temperatura del suelo a cuatro profundidades, obtenida de datos satelitales y trazable al origen.',
    accent: 'text-emerald-300',
    ring: 'from-emerald-400/25 to-emerald-400/0',
  },
  {
    icon: BarChart3,
    title: 'Reportes certificables',
    description:
      'Exportación en PDF y Excel con el detalle que exige la metodología de Puro.earth.',
    accent: 'text-amber-300',
    ring: 'from-amber-400/25 to-amber-400/0',
  },
] as const

const METRICS = [
  { value: '4', label: 'Profundidades monitoreadas', detail: '0–7 · 7–28 · 28–100 · 100–289 cm' },
  { value: '24/7', label: 'Series de datos satelitales', detail: 'Sin sensores en campo' },
  { value: 'PDF + XLSX', label: 'Formatos de reporte', detail: 'Listos para auditoría' },
] as const

const STEPS = [
  {
    icon: Satellite,
    title: 'Registra la parcela',
    description: 'Define nombre, coordenadas y metadatos del punto de monitoreo.',
  },
  {
    icon: Layers,
    title: 'Recibe las series',
    description: 'El sistema consulta Earth Engine y almacena la temperatura por profundidad.',
  },
  {
    icon: BellRing,
    title: 'Vigila y reporta',
    description: 'Índice de salud del suelo, alertas por umbral y reportes de certificación.',
  },
] as const

export default function Home() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard')
    }
  }, [user, loading, router])

  if (loading || user) {
    return (
      <div className="relative min-h-screen bg-slate-950">
        <HeroBackground overlay="strong" priority />
        <div className="relative flex min-h-screen flex-col items-center justify-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-2 border-white/20 border-t-emerald-400" />
          <p className="text-sm font-medium text-white/70">
            {user ? 'Redirigiendo al panel…' : 'Cargando…'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen bg-slate-950 text-white">
      {/* Fondo anclado al viewport: el contenido se desplaza sobre la fotografía */}
      <HeroBackground overlay="medium" position="fixed" priority />

      <div className="relative flex min-h-screen flex-col">
        {/* ---------- Encabezado ---------- */}
        <header className="sticky top-0 z-30 border-b border-white/10 bg-slate-950/40 backdrop-blur-xl">
          <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
            <Link href="/" className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/15 ring-1 ring-emerald-400/30">
                <Thermometer className="h-5 w-5 text-emerald-300" />
              </span>
              <span className="text-sm font-semibold tracking-tight text-white sm:text-base">
                Soil Temperature Monitor
              </span>
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition-colors hover:bg-emerald-50"
            >
              Iniciar sesión
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </header>

        {/* ---------- Hero ---------- */}
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 sm:px-6 lg:px-8">
          <section className="flex flex-col items-center pt-20 pb-16 text-center sm:pt-28 md:pt-32">
            <span className="animate-fade-up inline-flex items-center gap-2 rounded-full border border-emerald-400/25 bg-emerald-400/10 px-4 py-1.5 text-xs font-medium tracking-wide text-emerald-200">
              <ShieldCheck className="h-3.5 w-3.5" />
              Metodología Puro.earth · Biochar
            </span>

            <h1
              className="animate-fade-up mt-7 max-w-4xl text-balance text-4xl font-semibold leading-[1.08] tracking-tight sm:text-5xl md:text-6xl"
              style={{ animationDelay: '80ms' }}
            >
              Monitoreo satelital de la
              <span className="bg-gradient-to-r from-emerald-300 via-emerald-200 to-teal-200 bg-clip-text text-transparent">
                {' '}temperatura del suelo
              </span>{' '}
              para bonos de carbono
            </h1>

            <p
              className="animate-fade-up mt-6 max-w-2xl text-base leading-relaxed text-white/70 sm:text-lg"
              style={{ animationDelay: '160ms' }}
            >
              Evidencia continua, trazable y auditable de tus parcelas de biochar. Sin instalar
              sensores: datos de Google Earth Engine convertidos en reportes de certificación.
            </p>

            <div
              className="animate-fade-up mt-9 flex w-full flex-col items-center gap-3 sm:flex-row sm:justify-center"
              style={{ animationDelay: '240ms' }}
            >
              <Link
                href="/login"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-7 py-3.5 text-base font-semibold text-white shadow-lg shadow-emerald-500/25 transition-all hover:bg-emerald-400 hover:shadow-emerald-400/30 sm:w-auto"
              >
                Acceder a la plataforma
                <ArrowRight className="h-4.5 w-4.5" />
              </Link>
              <a
                href="#capacidades"
                className="inline-flex w-full items-center justify-center rounded-xl border border-white/15 bg-white/5 px-7 py-3.5 text-base font-medium text-white backdrop-blur transition-colors hover:bg-white/10 sm:w-auto"
              >
                Ver capacidades
              </a>
            </div>

            {/* Métricas */}
            <dl
              className="animate-fade-up mt-16 grid w-full max-w-4xl grid-cols-1 gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md sm:grid-cols-3"
              style={{ animationDelay: '320ms' }}
            >
              {METRICS.map(({ value, label, detail }) => (
                <div key={label} className="bg-slate-950/30 px-6 py-7 text-center">
                  <dd className="text-2xl font-semibold tracking-tight text-emerald-300">{value}</dd>
                  <dt className="mt-1.5 text-sm font-medium text-white/85">{label}</dt>
                  <p className="mt-1 text-xs text-white/45">{detail}</p>
                </div>
              ))}
            </dl>
          </section>

          {/* ---------- Capacidades ---------- */}
          <section id="capacidades" className="scroll-mt-20 pb-20 pt-4">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                Capacidades principales
              </h2>
              <p className="mt-3 text-white/60">
                Todo lo necesario para sostener una certificación con datos verificables.
              </p>
            </div>

            <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
              {FEATURES.map(({ icon: Icon, title, description, accent, ring }, i) => (
                <div
                  key={title}
                  className="animate-fade-up"
                  style={{ animationDelay: `${i * 90}ms` }}
                >
                  <TiltCard
                    maxTilt={9}
                    depth={22}
                    className="glass-panel shadow-2xl shadow-black/40"
                  >
                    <div className="flex h-full flex-col p-7">
                      <span
                        className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${ring} ring-1 ring-white/15`}
                      >
                        <Icon className={`h-6 w-6 ${accent}`} />
                      </span>
                      <h3 className="mt-5 text-lg font-semibold tracking-tight">{title}</h3>
                      <p className="mt-2.5 text-sm leading-relaxed text-white/65">{description}</p>
                    </div>
                  </TiltCard>
                </div>
              ))}
            </div>
          </section>

          {/* ---------- Cómo funciona ---------- */}
          <section className="hairline-top py-20">
            <div className="grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:gap-16">
              <div>
                <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                  Del campo al certificado en tres pasos
                </h2>
                <p className="mt-4 leading-relaxed text-white/60">
                  El flujo está diseñado para equipos de proyecto que deben demostrar permanencia
                  del carbono con evidencia periódica y reproducible.
                </p>
              </div>

              <ol className="space-y-4">
                {STEPS.map(({ icon: Icon, title, description }, i) => (
                  <li
                    key={title}
                    className="glass-panel flex items-start gap-5 rounded-xl p-5 transition-colors hover:bg-white/10"
                  >
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-slate-950/50 ring-1 ring-white/10">
                      <Icon className="h-5 w-5 text-emerald-300" />
                    </span>
                    <div>
                      <h3 className="flex items-baseline gap-2 font-semibold tracking-tight">
                        <span className="font-mono text-xs text-emerald-400/70">
                          0{i + 1}
                        </span>
                        {title}
                      </h3>
                      <p className="mt-1 text-sm leading-relaxed text-white/60">{description}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </section>

          {/* ---------- CTA final ---------- */}
          <section className="pb-24">
            <div className="glass-panel-strong flex flex-col items-center gap-6 rounded-2xl px-8 py-12 text-center shadow-2xl shadow-black/40">
              <h2 className="max-w-xl text-2xl font-semibold tracking-tight sm:text-3xl">
                Empieza a documentar tus parcelas hoy
              </h2>
              <p className="max-w-lg text-white/65">
                Accede con tu cuenta para registrar ubicaciones, consultar series de temperatura y
                generar reportes.
              </p>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-7 py-3.5 font-semibold text-white shadow-lg shadow-emerald-500/25 transition-all hover:bg-emerald-400"
              >
                Iniciar sesión
                <ArrowRight className="h-4.5 w-4.5" />
              </Link>
            </div>
          </section>
        </main>

        {/* ---------- Pie ---------- */}
        <footer className="border-t border-white/10 bg-slate-950/50 backdrop-blur-xl">
          <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 py-7 text-sm text-white/50 sm:flex-row sm:px-6 lg:px-8">
            <p className="flex items-center gap-2">
              <Thermometer className="h-4 w-4 text-emerald-400/70" />
              Soil Temperature Monitor
            </p>
            <p>Monitoreo de biochar conforme a Puro.earth</p>
          </div>
        </footer>

      </div>
    </div>
  )
}
