// MongoDB GeoJSON = [lng, lat], Leaflet/Browser = [lat, lng]
export const toGeoJSON = (lat: number, lng: number): [number, number] => [lng, lat];
export const fromGeoJSON = ([lng, lat]: [number, number]): { lat: number; lng: number } => ({ lat, lng });
