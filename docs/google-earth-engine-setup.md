# 🌍 GUÍA COMPLETA: Google Earth Engine Service Account

## 📋 RESUMEN
Esta guía te llevará paso a paso para crear un proyecto de Google Cloud, habilitar Google Earth Engine, crear un service account y obtener las credenciales necesarias para el sistema de monitoreo de temperatura del suelo.

## 🚀 PASO 1: Crear Proyecto de Google Cloud

### 1.1 Ir a Google Cloud Console
- Ve a: https://console.cloud.google.com/
- Inicia sesión con tu cuenta de Google

### 1.2 Crear nuevo proyecto
1. Haz click en el selector de proyectos (parte superior)
2. Click en "Nuevo proyecto"
3. Nombre del proyecto: `soil-temperature-monitor` (o el que prefieras)
4. Click "Crear"
5. **Espera** a que se cree el proyecto (puede tomar 1-2 minutos)
6. **Selecciona** el proyecto creado

## 🔧 PASO 2: Habilitar APIs Necesarias

### 2.1 Habilitar Earth Engine API
1. Ve a: https://console.cloud.google.com/apis/library
2. Busca "Earth Engine API"
3. Click en "Earth Engine API"
4. Click "Habilitar"
5. **Espera** a que se habilite

### 2.2 Habilitar Cloud Resource Manager API
1. En la misma página de APIs
2. Busca "Cloud Resource Manager API"
3. Click "Habilitar"

## 🔐 PASO 3: Crear Service Account

### 3.1 Ir a Service Accounts
1. Ve a: https://console.cloud.google.com/iam-admin/serviceaccounts
2. Click "Crear cuenta de servicio"

### 3.2 Configurar Service Account
1. **Nombre**: `earth-engine-service`
2. **ID**: `earth-engine-service` (se auto-completa)
3. **Descripción**: `Service account for soil temperature monitoring system`
4. Click "Crear y continuar"

### 3.3 Asignar roles
1. En "Otorgar acceso a este service account":
2. Agregar rol: `Earth Engine Resource Admin`
3. Agregar rol: `Earth Engine Resource Viewer`
4. Click "Continuar"
5. Click "Listo"

## 🔑 PASO 4: Generar Clave Privada

### 4.1 Descargar clave JSON
1. En la lista de service accounts, encuentra tu cuenta creada
2. Click en el **email del service account**
3. Ve a la pestaña "Claves"
4. Click "Agregar clave" > "Crear nueva clave"
5. Selecciona "JSON"
6. Click "Crear"
7. **Guarda el archivo JSON** descargado en lugar seguro

### 4.2 Contenido del archivo JSON
El archivo tendrá esta estructura:
```json
{
  "type": "service_account",
  "project_id": "tu-proyecto-id",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\\n...\\n-----END PRIVATE KEY-----\\n",
  "client_email": "earth-engine-service@tu-proyecto-id.iam.gserviceaccount.com",
  "client_id": "...",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs"
}
```

## 🌍 PASO 5: Registrar en Earth Engine

### 5.1 Ir a Earth Engine
1. Ve a: https://earthengine.google.com/
2. Click "Get Started"
3. Selecciona "Commercial use" (para proyectos comerciales)
4. Completa el formulario de registro
5. **Espera aprobación** (puede tomar 1-2 días)

### 5.2 Alternativa: Uso no comercial
Si es para investigación/educación:
1. Selecciona "Noncommercial use"
2. El proceso es más rápido (minutos u horas)

## 📝 PASO 6: Configurar Variables de Entorno

Con el archivo JSON descargado, extrae estos valores:

### 6.1 Valores a extraer:
- `GEE_PROJECT_ID` = valor de `project_id`
- `GEE_SERVICE_ACCOUNT_EMAIL` = valor de `client_email`  
- `GEE_PRIVATE_KEY` = valor de `private_key` (completo, incluyendo \\n)

### 6.2 Ejemplo de configuración:
```env
GEE_PROJECT_ID=soil-temperature-monitor-12345
GEE_SERVICE_ACCOUNT_EMAIL=earth-engine-service@soil-temperature-monitor-12345.iam.gserviceaccount.com
GEE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC...\\n-----END PRIVATE KEY-----\\n"
```

## ⚠️ NOTAS IMPORTANTES

### Seguridad:
- **NUNCA** subas el archivo JSON al repositorio
- **NUNCA** compartas las claves privadas
- Agrega `*.json` a tu `.gitignore`

### Límites:
- Earth Engine tiene cuotas de uso
- Para uso comercial puede requerir facturación
- Monitorea el uso en Google Cloud Console

### Troubleshooting:
- Si tienes errores de autenticación, verifica que el service account tenga los roles correctos
- Si Earth Engine no está disponible, verifica que esté aprobado tu acceso
- Para errores de cuota, revisa los límites en la consola

## 🎯 SIGUIENTE PASO
Una vez que tengas las 3 variables, actualiza tu archivo `.env.local` y ejecuta:
```bash
npm run dev
```

Para verificar que todo funciona correctamente.