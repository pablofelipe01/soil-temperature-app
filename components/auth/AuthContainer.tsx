'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Thermometer, ShieldCheck, Satellite, FileCheck2 } from 'lucide-react'
import HeroBackground from '@/components/layout/HeroBackground'
import LoginForm from './LoginForm'
import RegisterForm from './RegisterForm'

const HIGHLIGHTS = [
  { icon: Satellite, text: 'Series de temperatura del suelo desde Google Earth Engine' },
  { icon: ShieldCheck, text: 'Trazabilidad conforme a la metodología de Puro.earth' },
  { icon: FileCheck2, text: 'Reportes en PDF y Excel listos para auditoría' },
] as const

export default function AuthContainer() {
  const [isLoginMode, setIsLoginMode] = useState(true)

  const toggleMode = () => {
    setIsLoginMode(!isLoginMode)
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* ---------- Panel de marca ---------- */}
      <aside className="relative hidden overflow-hidden lg:flex lg:flex-col lg:justify-between lg:p-12">
        <HeroBackground overlay="medium" priority />

        <Link href="/" className="relative flex items-center gap-2.5 text-white">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/15 ring-1 ring-emerald-400/30">
            <Thermometer className="h-5 w-5 text-emerald-300" />
          </span>
          <span className="text-base font-semibold tracking-tight">Soil Temperature Monitor</span>
        </Link>

        <div className="relative max-w-md">
          <h2 className="text-3xl font-semibold leading-tight tracking-tight text-white">
            Evidencia continua para tus proyectos de biochar
          </h2>
          <ul className="mt-8 space-y-4">
            {HIGHLIGHTS.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-start gap-3 text-sm text-white/75">
                <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-white/10 ring-1 ring-white/15">
                  <Icon className="h-4 w-4 text-emerald-300" />
                </span>
                <span className="leading-relaxed">{text}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-white/40">
          Monitoreo de temperatura del suelo · Certificación de bonos de carbono
        </p>
      </aside>

      {/* ---------- Panel del formulario ---------- */}
      <main className="flex flex-col justify-center bg-[var(--background)] px-4 py-12 sm:px-8 lg:px-12">
        <div className="mx-auto w-full max-w-md">
          <div className="mb-8 text-center lg:hidden">
            <Link href="/" className="inline-flex items-center gap-2">
              <Thermometer className="h-7 w-7 text-green-600" />
              <span className="text-xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
                Soil Temperature Monitor
              </span>
            </Link>
          </div>

          <div className="mb-6 hidden lg:block">
            <h1 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-gray-100">
              {isLoginMode ? 'Bienvenido de nuevo' : 'Crea tu cuenta'}
            </h1>
            <p className="mt-1.5 text-sm text-gray-500 dark:text-gray-400">
              {isLoginMode
                ? 'Ingresa tus credenciales para acceder al panel de monitoreo.'
                : 'Regístrate para comenzar a monitorear tus parcelas.'}
            </p>
          </div>

          {isLoginMode ? (
            <LoginForm onToggleMode={toggleMode} />
          ) : (
            <RegisterForm onToggleMode={toggleMode} />
          )}
        </div>
      </main>
    </div>
  )
}
