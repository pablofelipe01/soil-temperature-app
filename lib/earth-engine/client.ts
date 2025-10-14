// Cliente Google Earth Engine para Next.js
import ee from '@google/earthengine'
import { getGEEConfig, isGEEConfigured } from '@/config/env'
import type { GEEError } from '@/types/earth-engine'

class EarthEngineClient {
  private initialized = false
  private initializePromise: Promise<void> | null = null

  /**
   * Inicializa la autenticación con Google Earth Engine
   */
  async initialize(): Promise<void> {
    // Si ya está inicializado, no hacer nada
    if (this.initialized) {
      return
    }

    // Si ya hay un proceso de inicialización en curso, esperar a que termine
    if (this.initializePromise) {
      return this.initializePromise
    }

    // Crear nueva promesa de inicialización
    this.initializePromise = this._performInitialization()
    
    try {
      await this.initializePromise
      this.initialized = true
    } catch (error) {
      this.initializePromise = null
      throw error
    }
  }

  /**
   * Proceso interno de inicialización
   */
  private async _performInitialization(): Promise<void> {
    try {
      // Verificar que las variables de entorno estén configuradas
      if (!isGEEConfigured()) {
        throw new Error(
          '🌍 Google Earth Engine no está configurado. ' +
          'Verifica las variables GEE_PROJECT_ID, GEE_SERVICE_ACCOUNT_EMAIL y GEE_PRIVATE_KEY.'
        )
      }

      const config = getGEEConfig()

      // Configurar credenciales para el service account
      const credentials = {
        client_email: config.serviceAccountEmail,
        private_key: config.privateKey,
      }

      // Autenticar con service account
      await new Promise<void>((resolve, reject) => {
        ee.data.authenticateViaPrivateKey(
          credentials,
          () => {
            console.log('✅ Google Earth Engine autenticado exitosamente')
            resolve()
          },
          (error: unknown) => {
            console.error('❌ Error autenticando Google Earth Engine:', error)
            reject(new Error(`Error de autenticación GEE: ${error}`))
          }
        )
      })

      // Inicializar la librería
      await new Promise<void>((resolve, reject) => {
        ee.initialize(
          null, // Usar credenciales por defecto (ya autenticadas)
          null, // Sin URL base personalizada
          () => {
            console.log('✅ Google Earth Engine inicializado exitosamente')
            resolve()
          },
          (error: unknown) => {
            console.error('❌ Error inicializando Google Earth Engine:', error)
            reject(new Error(`Error de inicialización GEE: ${error}`))
          }
        )
      })

    } catch (error) {
      const geeError: GEEError = {
        message: error instanceof Error ? error.message : 'Error desconocido',
        details: error
      }
      
      console.error('❌ Error en inicialización de Google Earth Engine:', geeError)
      throw new Error(`Fallo al inicializar Google Earth Engine: ${geeError.message}`)
    }
  }

  /**
   * Verifica si el cliente está inicializado y lo inicializa si es necesario
   */
  async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await this.initialize()
    }
  }

  /**
   * Obtiene una referencia al objeto ee (Earth Engine)
   * Asegura que esté inicializado antes de devolverlo
   */
  async getEE(): Promise<typeof ee> {
    await this.ensureInitialized()
    return ee
  }

  /**
   * Verifica el estado de la conexión
   */
  async healthCheck(): Promise<{ status: 'ok' | 'error', message: string }> {
    try {
      await this.ensureInitialized()
      
      // Para health check, solo verificar que la inicialización fue exitosa
      // No hacer consultas complejas que pueden fallar por otros motivos
      return {
        status: 'ok',
        message: 'Google Earth Engine conectado, autenticado e inicializado correctamente'
      }
    } catch (error) {
      return {
        status: 'error',
        message: `Error de conexión: ${error instanceof Error ? error.message : 'Desconocido'}`
      }
    }
  }

  /**
   * Resetea el estado de inicialización (útil para testing)
   */
  reset(): void {
    this.initialized = false
    this.initializePromise = null
  }
}

// Exportar instancia singleton
export const earthEngineClient = new EarthEngineClient()

// Exportar la clase para testing
export { EarthEngineClient }