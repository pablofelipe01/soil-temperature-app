// Script para probar la integración con Google Earth Engine
import { earthEngineClient } from '../lib/earth-engine/client.js'
import { soilTemperatureService } from '../lib/earth-engine/services.js'

async function testGoogleEarthEngine() {
  console.log('🌍 Iniciando prueba de Google Earth Engine...\n')

  try {
    // 1. Probar health check
    console.log('1️⃣ Probando health check...')
    const healthCheck = await earthEngineClient.healthCheck()
    console.log(`   Estado: ${healthCheck.status}`)
    console.log(`   Mensaje: ${healthCheck.message}\n`)

    if (healthCheck.status !== 'ok') {
      console.error('❌ Health check falló, no se puede continuar')
      return
    }

    // 2. Probar consulta de temperatura (ejemplo: Barcelona, España)
    console.log('2️⃣ Probando consulta de temperatura del suelo...')
    const testQuery = {
      latitude: 41.3851,    // Barcelona
      longitude: 2.1734,    // Barcelona
      startDate: '2023-01-01',
      endDate: '2023-12-31'
    }

    console.log(`   📍 Ubicación: ${testQuery.latitude}, ${testQuery.longitude}`)
    console.log(`   📅 Período: ${testQuery.startDate} - ${testQuery.endDate}`)

    const temperatureData = await soilTemperatureService.getSoilTemperatureData(testQuery)

    if (temperatureData.success) {
      console.log('   ✅ Consulta exitosa!')
      console.log(`   📊 Registros obtenidos: ${temperatureData.data?.length || 0}`)
      
      if (temperatureData.data && temperatureData.data.length > 0) {
        const firstRecord = temperatureData.data[0]
        console.log(`   📈 Primer registro (${firstRecord.date}):`)
        console.log(`      • Nivel 1 (0-7cm): ${firstRecord.temperature_level_1?.toFixed(2)}°C`)
        console.log(`      • Nivel 2 (7-28cm): ${firstRecord.temperature_level_2?.toFixed(2)}°C`)
        console.log(`      • Nivel 3 (28-100cm): ${firstRecord.temperature_level_3?.toFixed(2)}°C`)
        console.log(`      • Nivel 4 (100-289cm): ${firstRecord.temperature_level_4?.toFixed(2)}°C`)
      }

      console.log(`\n   🏷️  Metadata:`)
      console.log(`      • Dataset: ${temperatureData.metadata?.dataset}`)
      console.log(`      • Ubicación: ${temperatureData.metadata?.location.latitude}, ${temperatureData.metadata?.location.longitude}`)
      console.log(`      • Registros: ${temperatureData.metadata?.recordCount}`)

    } else {
      console.error('   ❌ Error en consulta:', temperatureData.error)
    }

    // 3. Probar datos agregados
    console.log('\n3️⃣ Probando datos agregados...')
    const aggregatedData = await soilTemperatureService.getAggregatedTemperatureData(testQuery)

    if (aggregatedData.success && aggregatedData.aggregated) {
      console.log('   ✅ Agregación exitosa!')
      console.log('   📊 Estadísticas por nivel:')
      
      Object.entries(aggregatedData.aggregated).forEach(([level, stats]) => {
        const levelNum = level.split('_')[1]
        console.log(`      • Nivel ${levelNum}: Promedio ${stats.avg}°C, Min ${stats.min}°C, Max ${stats.max}°C`)
      })
    }

    console.log('\n🎉 ¡Todas las pruebas de Google Earth Engine completadas exitosamente!')

  } catch (error) {
    console.error('💥 Error durante las pruebas:', error)
    console.error('   Posibles causas:')
    console.error('   • Credenciales de service account incorrectas')
    console.error('   • Google Earth Engine no habilitado en el proyecto')
    console.error('   • Problemas de conectividad')
    console.error('   • Service account sin permisos de Earth Engine')
  }
}

// Ejecutar pruebas
testGoogleEarthEngine()
  .then(() => {
    console.log('\n✅ Script de prueba finalizado')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Error fatal:', error)
    process.exit(1)
  })