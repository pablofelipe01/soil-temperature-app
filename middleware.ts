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
    // Obtener el token de autorización del header
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Token de autorización requerido' },
        { status: 401 }
      )
    }

    const token = authHeader.replace('Bearer ', '')

    // Crear cliente Supabase para verificar el JWT token
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

    // Verificar el JWT token directamente
    const { data: { user }, error } = await supabase.auth.getUser(token)

    if (error || !user) {
      console.error('Error de autenticación en middleware:', error)
      return NextResponse.json(
        { error: 'Token de autorización inválido' },
        { status: 401 }
      )
    }

    // Debug: Log del user ID para diagnosticar problemas
    console.log(`[MIDDLEWARE] User authenticated: ${user.id} (${user.email})`)

    // Buscar el usuario en la base de datos para obtener su ID interno
    // Por ahora usaremos el UUID de Supabase como referencia
    const response = NextResponse.next()
    response.headers.set('x-user-id', user.id)
    response.headers.set('x-user-email', user.email || '')
    response.headers.set('x-user-name', user.user_metadata?.name || user.email?.split('@')[0] || '')

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