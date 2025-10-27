'use client'

import { useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'

interface ProtectedLayoutProps {
  children: React.ReactNode
}

export default function ProtectedLayout({ children }: ProtectedLayoutProps) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="relative min-h-screen overflow-hidden">
        {/* Background Image */}
        <div 
          className="absolute top-0 left-0 w-full h-full bg-cover bg-center bg-fixed"
          style={{
            backgroundImage: 'url(/textura-biochar.jpg)',
          }}
        ></div>
        
        {/* Dark overlay */}
        <div className="absolute top-0 left-0 w-full h-full bg-black/60"></div>
        
        <Navbar />
        <div className="relative z-10 flex items-center justify-center h-96 pt-24">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-400"></div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="relative min-h-screen overflow-hidden">
        {/* Background Image */}
        <div 
          className="absolute top-0 left-0 w-full h-full bg-cover bg-center bg-fixed"
          style={{
            backgroundImage: 'url(/textura-biochar.jpg)',
          }}
        ></div>
        
        {/* Dark overlay */}
        <div className="absolute top-0 left-0 w-full h-full bg-black/60"></div>
        
        <Navbar />
        <div className="relative z-10 flex items-center justify-center h-96 pt-24">
          <div className="text-center backdrop-blur-lg bg-white/10 border border-white/20 rounded-2xl p-8">
            <h2 className="text-xl font-medium text-white mb-2">
              Acceso no autorizado
            </h2>
            <p className="text-gray-300">Redirigiendo al login...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute top-0 left-0 w-full h-full bg-cover bg-center bg-fixed"
        style={{
          backgroundImage: 'url(/textura-biochar.jpg)',
        }}
      ></div>
      
      {/* Dark overlay */}
      <div className="absolute top-0 left-0 w-full h-full bg-black/40"></div>
      
      <Navbar />
      <main className="relative z-10 flex-1 pt-24">
        {children}
      </main>
    </div>
  )
}