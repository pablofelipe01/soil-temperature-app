// Script de prueba para verificar variables de Google Earth Engine
require('dotenv').config({ path: '.env.local' });

console.log('🔍 Verificando variables de entorno...\n');

// Verificar variables básicas
console.log('📱 NODE_ENV:', process.env.NODE_ENV || 'undefined');
console.log('🌐 NEXT_PUBLIC_APP_URL:', process.env.NEXT_PUBLIC_APP_URL || 'undefined');

// Verificar Supabase
console.log('\n🗄️  SUPABASE:');
console.log('URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Configurado' : '❌ Faltante');
console.log('Anon Key:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Configurado' : '❌ Faltante');
console.log('Service Role:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ Configurado' : '❌ Faltante');

// Verificar Database
console.log('\n🗃️  DATABASE:');
console.log('Database URL:', process.env.DATABASE_URL ? '✅ Configurado' : '❌ Faltante');
console.log('Direct URL:', process.env.DIRECT_URL ? '✅ Configurado' : '❌ Faltante');

// Verificar Google Earth Engine
console.log('\n🌍 GOOGLE EARTH ENGINE:');
const geeProjectId = process.env.GEE_PROJECT_ID;
const geeEmail = process.env.GEE_SERVICE_ACCOUNT_EMAIL;
const geeKey = process.env.GEE_PRIVATE_KEY;

console.log('Project ID:', geeProjectId || '❌ Faltante');
console.log('Service Account Email:', geeEmail || '❌ Faltante');
console.log('Private Key:', geeKey ? `✅ Configurado (${geeKey.length} chars)` : '❌ Faltante');

if (geeProjectId && geeEmail && geeKey) {
  console.log('\n🎉 ¡TODAS las variables de Google Earth Engine están configuradas!');
  console.log('\n📋 RESUMEN:');
  console.log(`   • Proyecto: ${geeProjectId}`);
  console.log(`   • Email: ${geeEmail}`);
  console.log(`   • Clave privada: ${geeKey.substring(0, 50)}...`);
} else {
  console.log('\n⚠️  Faltan variables de Google Earth Engine');
}