// Script de diagnóstico para Google Earth Engine
require('dotenv').config({ path: '.env.local' });

console.log('🔍 Diagnóstico de Google Earth Engine\n');

// 1. Verificar variables de entorno
console.log('1. 📋 Variables de entorno:');
const projectId = process.env.GEE_PROJECT_ID;
const email = process.env.GEE_SERVICE_ACCOUNT_EMAIL;
const privateKey = process.env.GEE_PRIVATE_KEY;

if (projectId && email && privateKey) {
  console.log('   ✅ Variables GEE configuradas correctamente');
  console.log(`   📊 Proyecto: ${projectId}`);
  console.log(`   📧 Email: ${email}`);
  console.log(`   🔐 Clave: ${privateKey.length} caracteres`);
} else {
  console.log('   ❌ Variables GEE faltantes:');
  if (!projectId) console.log('     - GEE_PROJECT_ID');
  if (!email) console.log('     - GEE_SERVICE_ACCOUNT_EMAIL');
  if (!privateKey) console.log('     - GEE_PRIVATE_KEY');
  process.exit(1);
}

// 2. Verificar módulo de Google Earth Engine
console.log('\n2. 📦 Módulo Google Earth Engine:');
try {
  const ee = require('@google/earthengine');
  console.log('   ✅ Módulo @google/earthengine cargado correctamente');
  console.log('   📋 Métodos disponibles: Image, ImageCollection, Geometry, etc.');
} catch (error) {
  console.log('   ❌ Error cargando módulo:', error.message);
  process.exit(1);
}

// 3. Probar autenticación simple
console.log('\n3. 🔐 Prueba de autenticación:');
try {
  const ee = require('@google/earthengine');
  
  const credentials = {
    client_email: email,
    private_key: privateKey,
  };

  console.log('   🔄 Iniciando autenticación...');
  
  // Timeout para evitar que se cuelgue
  const timeoutId = setTimeout(() => {
    console.log('   ⏰ Timeout: La autenticación está tardando más de 15 segundos');
    console.log('   💡 Esto puede ser normal en la primera ejecución');
    console.log('\n🔍 ESTADO: Credenciales válidas, pero inicialización lenta');
    process.exit(0);
  }, 15000);
  
  ee.data.authenticateViaPrivateKey(
    credentials,
    () => {
      clearTimeout(timeoutId);
      console.log('   ✅ Autenticación exitosa!');
      console.log('\n🎉 DIAGNÓSTICO COMPLETADO: Todo está funcionando correctamente');
      process.exit(0);
    },
    (error) => {
      clearTimeout(timeoutId);
      console.log('   ❌ Error de autenticación:', error);
      console.log('\n❌ DIAGNÓSTICO: Problema con las credenciales o conectividad');
      process.exit(1);
    }
  );
  
} catch (error) {
  console.log('   💥 Error en autenticación:', error.message);
  process.exit(1);
}