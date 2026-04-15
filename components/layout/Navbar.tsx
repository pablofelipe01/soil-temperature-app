'use client'

import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'

export default function Navbar() {
  const { user, loading, signOut } = useAuth()
  const router = useRouter()

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
      <nav className="absolute top-0 left-0 right-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-24">
            <div className="flex items-center">
              <div className="flex items-center">
                <Image
                  src="/Logo-Sirius.png"
                  alt="Sirius Logo"
                  width={80}
                  height={80}
                  className="h-20 w-auto"
                />
              </div>
            </div>
            <div className="flex items-center">
              <div className="animate-pulse bg-white/20 h-8 w-20 rounded-lg backdrop-blur-sm"></div>
            </div>
          </div>
        </div>
      </nav>
    )
  }

  if (!user) {
    return (
      <nav className="absolute top-0 left-0 right-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-24">
            <div className="flex items-center">
              <Link href="/" className="flex items-center group">
                <Image
                  src="/Logo-Sirius.png"
                  alt="Sirius Logo"
                  width={80}
                  height={80}
                  className="h-20 w-auto transition-transform group-hover:scale-105"
                />
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <Link 
                href="/login" 
                className="text-white/90 hover:text-white bg-blue-600/30 hover:bg-blue-600/50 backdrop-blur-sm border border-blue-400/30 hover:border-blue-300/60 px-6 py-3 rounded-lg text-sm font-medium transition-all duration-300"
              >
                Iniciar Sesión
              </Link>
            </div>
          </div>
        </div>
      </nav>
    )
  }

  return (
    <nav className="absolute top-0 left-0 right-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-24">
          <div className="flex items-center space-x-8">
            <Link href="/dashboard" className="flex items-center group">
              <Image
                src="/Logo-Sirius.png"
                alt="Sirius Logo"
                width={80}
                height={80}
                className="h-20 w-auto transition-transform group-hover:scale-105"
              />
            </Link>
            <div className="hidden md:flex space-x-2">
              <Link 
                href="/dashboard" 
                className="text-white/90 hover:text-white bg-blue-600/20 hover:bg-blue-600/40 backdrop-blur-sm border border-blue-400/20 hover:border-blue-300/40 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300"
              >
                Dashboard
              </Link>
              <Link 
                href="/locations" 
                className="text-white/90 hover:text-white bg-blue-600/20 hover:bg-blue-600/40 backdrop-blur-sm border border-blue-400/20 hover:border-blue-300/40 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300"
              >
                Ubicaciones
              </Link>
              <Link 
                href="/reports" 
                className="text-white/90 hover:text-white bg-blue-600/20 hover:bg-blue-600/40 backdrop-blur-sm border border-blue-400/20 hover:border-blue-300/40 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300"
              >
                Reportes
              </Link>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-4">
              <div className="hidden sm:block">
                <span className="text-white/80 text-sm font-medium">
                  {user.user_metadata?.full_name || user.email}
                </span>
              </div>
              <button
                onClick={handleSignOut}
                className="text-white/90 hover:text-white bg-red-600/30 hover:bg-red-600/50 backdrop-blur-sm border border-red-400/30 hover:border-red-300/60 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300"
              >
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}