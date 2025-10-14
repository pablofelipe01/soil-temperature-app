# 📋 Checklist de Variables de Entorno

## ✅ Estado Actual

### 🟢 Configuradas y funcionando:
- [x] `NODE_ENV` - Entorno de desarrollo
- [x] `NEXT_PUBLIC_APP_URL` - URL de la aplicación
- [x] `NEXT_PUBLIC_SUPABASE_URL` - URL de Supabase
- [x] `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Clave anónima de Supabase
- [x] `SUPABASE_SERVICE_ROLE_KEY` - Clave de servicio de Supabase
- [x] `DATABASE_URL` - URL de conexión con pooling
- [x] `DIRECT_URL` - URL de conexión directa

### 🟡 Pendientes de configurar:
- [ ] `GEE_PROJECT_ID` - ID del proyecto de Google Earth Engine
- [ ] `GEE_SERVICE_ACCOUNT_EMAIL` - Email del service account
- [ ] `GEE_PRIVATE_KEY` - Clave privada del service account

## 📝 Próximos pasos

1. **Crear proyecto de Google Cloud** (si no tienes)
2. **Habilitar Earth Engine API**
3. **Crear service account**
4. **Descargar credenciales JSON**
5. **Configurar variables GEE**
6. **Probar integración**

## 📖 Recursos

- **Guía completa**: `docs/google-earth-engine-setup.md`
- **Validación**: `config/env.ts`
- **Ejemplo**: `.env.example`

## 🔍 Verificación

Para verificar que todo está correctamente configurado:

```bash
# Verificar variables actuales
npm run dev

# Si hay errores, el sistema te mostrará qué variables faltan
```

## ⚠️ Importante

- **NUNCA** subas archivos `.env*` con valores reales al repositorio
- **SIEMPRE** usa `.env.example` como template
- **REVISA** que `.env.local` esté en `.gitignore`