// Validación y tipado de variables de entorno
import { z } from 'zod'

// Schema de validación para variables de entorno
const envSchema = z.object({
  // Node Environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  
  // Application
  NEXT_PUBLIC_APP_URL: z.string().url().default('http://localhost:3000'),
  
  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  
  // Database (Prisma)
  DATABASE_URL: z.string().min(1),
  DIRECT_URL: z.string().min(1),
  
  // Google Earth Engine (opcional durante desarrollo inicial)
  GEE_SERVICE_ACCOUNT_EMAIL: z.string().email().optional(),
  GEE_PRIVATE_KEY: z.string().min(1).optional(),
  GEE_PROJECT_ID: z.string().min(1).optional(),
})

// Tipo TypeScript para las variables validadas
export type Env = z.infer<typeof envSchema>

// Función para validar y obtener variables de entorno
function validateEnv(): Env {
  try {
    return envSchema.parse(process.env)
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.issues.map(err => 
        `${err.path.join('.')}: ${err.message}`
      ).join('\n')
      
      throw new Error(
        `❌ Variables de entorno inválidas o faltantes:\n${missingVars}\n\n` +
        `📝 Revisa tu archivo .env.local y asegúrate de que todas las variables requeridas estén configuradas.`
      )
    }
    throw error
  }
}

// Exportar variables validadas
export const env = validateEnv()

// Helper para verificar si Google Earth Engine está configurado
export const isGEEConfigured = (): boolean => {
  return !!(env.GEE_SERVICE_ACCOUNT_EMAIL && env.GEE_PRIVATE_KEY && env.GEE_PROJECT_ID)
}

// Helper para obtener configuración de GEE
export const getGEEConfig = () => {
  if (!isGEEConfigured()) {
    throw new Error(
      '🌍 Google Earth Engine no está configurado.\n' +
      'Por favor, configura las variables GEE_SERVICE_ACCOUNT_EMAIL, GEE_PRIVATE_KEY y GEE_PROJECT_ID.'
    )
  }
  
  return {
    serviceAccountEmail: env.GEE_SERVICE_ACCOUNT_EMAIL!,
    privateKey: env.GEE_PRIVATE_KEY!.replace(/\\n/g, '\n'), // Convertir \\n a saltos de línea reales
    projectId: env.GEE_PROJECT_ID!,
  }
}