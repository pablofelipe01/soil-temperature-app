# 📊 Funcionalidad de Reportes de Temperatura

Se ha implementado una funcionalidad completa para generar reportes de temperatura del suelo en formato Excel y PDF.

## ✨ Características Implementadas

### 🎯 Botón Dropdown de Reportes
- **Ubicación**: Página de detalle de ubicación (`/locations/[id]`)
- **Posición**: Junto a los controles de vista (Gráficos/Mapa de Calor)
- **Estados**: 
  - Habilitado cuando hay datos de temperatura
  - Deshabilitado cuando no hay datos
  - Indicador de carga durante la generación

### 📈 Reporte Excel (.xlsx)
**Contenido del reporte:**
- **Hoja 1 - Información General**:
  - Datos de la ubicación (sitio, cliente, coordenadas)
  - Período del reporte
  - Estadísticas generales (min, max, promedio, rango)
  - Fecha de generación

- **Hoja 2 - Datos de Temperatura**:
  - Tabla completa con fecha, temperatura, fuente y estado post-biochar
  - Formato tabular para análisis en Excel

- **Hoja 3 - Análisis Comparativo** (si hay biochar):
  - Estadísticas pre y post aplicación de biochar
  - Cálculo de diferencias
  - Análisis de impacto

### 📄 Reporte PDF (.pdf)
**Contenido del reporte:**
- **Encabezado**: Título profesional del reporte
- **Información de ubicación**: Datos del sitio y cliente
- **Estadísticas visuales**: Métricas clave en formato legible
- **Gráfico de tendencia**: Captura automática del gráfico de temperatura
- **Tabla de datos**: Últimos 15 registros en formato tabular
- **Diseño responsive**: Manejo automático de páginas

## 🛠️ Implementación Técnica

### API Endpoint
```
GET /api/reports/temperature
```

**Parámetros requeridos:**
- `locationId`: UUID de la ubicación
- `startDate`: Fecha de inicio (YYYY-MM-DD)
- `endDate`: Fecha de fin (YYYY-MM-DD)
- `format`: Tipo de reporte ('excel' | 'pdf')

### Dependencias Agregadas
```json
{
  "xlsx": "^0.18.5",
  "jspdf": "^2.5.1", 
  "html2canvas": "^1.4.1",
  "@types/html2canvas": "^1.0.0",
  "chart.js": "^4.4.0",
  "chartjs-adapter-date-fns": "^3.0.0"
}
```

### Funciones Principales

#### `generateExcelReport()`
- Genera archivo Excel con múltiples hojas
- Incluye formateo profesional
- Cálculos automáticos de estadísticas
- Análisis comparativo pre/post biochar

#### `generatePDFReport()`
- Crea PDF con jsPDF
- Captura automática de gráficos con html2canvas
- Layout responsive y profesional
- Manejo automático de páginas

## 🎨 Interfaz de Usuario

### Botón Dropdown
```tsx
📊 Generar Reporte ▼
├── 📄 Descargar Excel (.xlsx)
└── 📋 Descargar PDF (.pdf)
```

### Estados Visuales
- **Normal**: Botón azul con icono de reporte
- **Cargando**: Spinner animado con texto "Generando..."
- **Deshabilitado**: Opacidad reducida cuando no hay datos
- **Dropdown**: Se cierra automáticamente al hacer clic fuera

## 📁 Archivos Modificados

### Backend
- `/app/api/reports/temperature/route.ts` - **NUEVO**: Endpoint para generar reportes

### Frontend  
- `/app/locations/[id]/page.tsx` - **MODIFICADO**: 
  - Botón dropdown agregado
  - Funciones de generación de reportes
  - Manejo de estados y UI
  - Clase CSS para captura de gráficos

### Estilos
- Clase `.temperature-chart` agregada para identificar el gráfico
- Clase `.report-dropdown-container` para manejo del dropdown

## 🚀 Uso

1. **Navegar** a una ubicación con datos de temperatura
2. **Consultar** datos para el período deseado
3. **Hacer clic** en "📊 Generar Reporte"
4. **Seleccionar** formato (Excel o PDF)
5. **Descargar** automáticamente el archivo generado

## 🔧 Características Técnicas

### Validaciones
- Verificación de datos disponibles antes de generar
- Validación de parámetros en el backend
- Manejo de errores con mensajes informativos

### Seguridad
- Autorización con tokens JWT
- Validación de pertenencia de ubicación al usuario
- Sanitización de nombres de archivo

### Performance
- Generación optimizada de archivos
- Captura eficiente de gráficos
- Manejo de memoria para archivos grandes

## 📊 Datos Incluidos en Reportes

### Estadísticas Generales
- Total de registros
- Temperatura mínima, máxima y promedio
- Rango de temperaturas
- Período de análisis

### Datos de Temperatura
- Fecha de medición
- Temperatura en °C
- Fuente de datos (ERA5-Land)
- Indicador post-biochar

### Análisis Comparativo (si aplica)
- Estadísticas pre-biochar
- Estadísticas post-biochar  
- Diferencia en temperatura promedio
- Análisis de impacto

---

**📝 Nota**: Los reportes se generan en tiempo real basados en los datos consultados en la interfaz. Asegúrate de tener datos cargados antes de generar el reporte.