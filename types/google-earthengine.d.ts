// Declaraciones de tipos para @google/earthengine
declare module '@google/earthengine' {
  export interface EarthEngine {
    Image: (id: string) => Image
    ImageCollection: (id: string) => ImageCollection
    Geometry: {
      Point: (coordinates: number[]) => Geometry
    }
    initialize: (
      opt_baseurl?: string | null,
      opt_tileurl?: string | null,
      success?: () => void,
      failure?: (error: unknown) => void
    ) => void
    data: {
      authenticateViaPrivateKey: (
        credentials: { client_email: string; private_key: string },
        success: () => void,
        failure: (error: unknown) => void
      ) => void
    }
  }

  export interface Image {
    getInfo: (callback: (result: unknown, error?: unknown) => void) => void
  }

  export interface ImageCollection {
    filterDate: (start: string, end: string) => ImageCollection
    filterBounds: (geometry: Geometry) => ImageCollection
    select: (bands: string[]) => ImageCollection
    getRegion: (
      geometry: Geometry, 
      scale: number, 
      crs?: string
    ) => {
      evaluate: (callback: (result: unknown, error?: unknown) => void) => void
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  export interface Geometry {
    // Geometry methods will be added as needed
  }

  const ee: EarthEngine
  export default ee
}