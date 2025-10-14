import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  // Solo aplicar middleware a rutas de API que requieren autenticación
  if (!request.nextUrl.pathname.startsWith('/api/locations') && 
      !request.nextUrl.pathname.startsWith('/api/reports') &&
      !request.nextUrl.pathname.startsWith('/api/temperature-data')) {
    return NextResponse.next()
  }

  try {
    // Crear cliente Supabase para verificar la sesión
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value
          }
        }
      }
    )

    // Obtener la sesión del usuario
    const { data: { session }, error } = await supabase.auth.getSession()

    if (error || !session?.user) {
      return NextResponse.json(
        { error: 'Usuario no autenticado' },
        { status: 401 }
      )
    }

    // Buscar el usuario en la base de datos para obtener su ID interno
    // Por ahora usaremos el UUID de Supabase como referencia
    const response = NextResponse.next()
    response.headers.set('x-user-id', session.user.id)
    response.headers.set('x-user-email', session.user.email || '')
    response.headers.set('x-user-name', session.user.user_metadata?.name || session.user.email?.split('@')[0] || '')

    return response

  } catch (error) {
    console.error('Error en middleware de autenticación:', error)
    return NextResponse.json(
      { error: 'Error de autenticación' },
      { status: 401 }
    )
  }
}

export const config = {
  matcher: [
    '/api/locations/:path*',
    '/api/reports/:path*',
    '/api/temperature-data/:path*'
  ]
}