// Tipos para leaflet.heat plugin
import * as L from 'leaflet'

declare module 'leaflet' {
  interface HeatMapOptions {
    radius?: number
    blur?: number
    maxZoom?: number
    max?: number
    minOpacity?: number
    gradient?: { [key: number]: string }
  }

  interface HeatLayer extends L.Layer {
    setLatLngs(latlngs: Array<[number, number] | [number, number, number]>): this
    addLatLng(latlng: [number, number] | [number, number, number]): this
  }

  function heatLayer(
    latlngs: Array<[number, number] | [number, number, number]>, 
    options?: HeatMapOptions
  ): HeatLayer

  namespace heatLayer {
    function addTo(map: L.Map): HeatLayer
  }
}

declare module 'leaflet.heat' {
  // Este módulo extiende Leaflet con funcionalidad de heatmap
}