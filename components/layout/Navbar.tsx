'use client'

import { useAuth } from '@/hooks/useAuth'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { Thermometer, Menu, X, LogOut } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/Button'

const NAV_LINKS = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/locations', label: 'Ubicaciones' },
  { href: '/reports', label: 'Reportes' },
] as const

const shellStyles =
  'sticky top-0 z-40 border-b border-gray-200/80 bg-white/85 backdrop-blur-xl dark:border-slate-700/80 dark:bg-slate-900/85'

function Brand({ href }: { href: string }) {
  return (
    <Link href={href} className="flex items-center gap-2.5">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-600/10 ring-1 ring-green-600/20 dark:bg-green-500/15 dark:ring-green-400/25">
        <Thermometer className="h-4.5 w-4.5 text-green-600 dark:text-green-400" />
      </span>
      <span className="text-base font-semibold tracking-tight text-gray-900 dark:text-gray-100">
        Soil Monitor
      </span>
    </Link>
  )
}

export default function Navbar() {
  const { user, loading, signOut } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`)

  const handleSignOut = async () => {
    try {
      await signOut()
      router.push('/login')
    } catch (error) {
      console.error('Error al cerrar sesión:', error)
    }
  }

  if (loading) {
    return (
      <nav className={shellStyles}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Brand href="/dashboard" />
            <div className="h-8 w-24 animate-pulse rounded-lg bg-gray-200 dark:bg-slate-700" />
          </div>
        </div>
      </nav>
    )
  }

  if (!user) {
    return (
      <nav className={shellStyles}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Brand href="/" />
            <Link
              href="/login"
              className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-green-700"
            >
              Iniciar Sesión
            </Link>
          </div>
        </div>
      </nav>
    )
  }

  const userLabel = user.user_metadata?.full_name || user.email
  const initial = (userLabel ?? '?').charAt(0).toUpperCase()

  return (
    <nav className={shellStyles}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-8">
            <Brand href="/dashboard" />
            <div className="hidden items-center gap-1 md:flex">
              {NAV_LINKS.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  aria-current={isActive(href) ? 'page' : undefined}
                  className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    isActive(href)
                      ? 'bg-green-600/10 text-green-700 dark:bg-green-500/15 dark:text-green-300'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-slate-800 dark:hover:text-gray-100'
                  }`}
                >
                  {label}
                </Link>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-3 md:flex">
              <span className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-green-600 text-xs font-semibold text-white">
                  {initial}
                </span>
                <span className="max-w-[16ch] truncate">{userLabel}</span>
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                icon={<LogOut className="h-4 w-4" />}
              >
                Cerrar Sesión
              </Button>
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="inline-flex cursor-pointer items-center justify-center rounded-lg p-2 text-gray-600 hover:bg-gray-100 hover:text-gray-900 md:hidden dark:text-gray-300 dark:hover:bg-slate-800 dark:hover:text-gray-100"
              aria-label="Abrir menú"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="space-y-1 border-t border-gray-200 py-3 md:hidden dark:border-slate-700">
            {NAV_LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                aria-current={isActive(href) ? 'page' : undefined}
                className={`block rounded-lg px-3 py-2 text-base font-medium ${
                  isActive(href)
                    ? 'bg-green-600/10 text-green-700 dark:bg-green-500/15 dark:text-green-300'
                    : 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-slate-800'
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                {label}
              </Link>
            ))}
            <div className="mt-2 border-t border-gray-200 px-3 pt-3 dark:border-slate-700">
              <p className="mb-2 truncate text-sm text-gray-500 dark:text-gray-400">{userLabel}</p>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleSignOut}
                icon={<LogOut className="h-4 w-4" />}
                className="w-full"
              >
                Cerrar Sesión
              </Button>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}