/**
 * GeoVision-SR Geospatial Utilities
 * Robust Bounding Box parsing and coordinates validation for Leaflet
 */

export interface ParsedBbox {
  bounds: [[number, number], [number, number]]; // [[southLat, westLng], [northLat, eastLng]]
  center: [number, number]; // [lat, lng]
  isValidWgs84: boolean;
  rawString: string;
}

/**
 * Parses any bbox representation from GDAL or metadata fallback:
 * Formats supported:
 * 1. String array "[minX, minY, maxX, maxY]" (e.g. "[77.58, 12.95, 77.62, 12.99]")
 * 2. Comma-separated "minX,minY,maxX,maxY"
 * 3. GeoJSON coordinates string
 * 4. Fallback contextual footprint if unreferenced or projected
 */
export function parseImageryBbox(
  bboxStr?: string | null,
  fallbackCenter: [number, number] = [12.9716, 77.5946],
  width?: number,
  height?: number
): ParsedBbox {
  const defaultSpanLat = 0.02 * ((height || 512) / 512);
  const defaultSpanLng = 0.02 * ((width || 512) / 512);

  const fallbackResult: ParsedBbox = {
    bounds: [
      [fallbackCenter[0] - defaultSpanLat / 2, fallbackCenter[1] - defaultSpanLng / 2],
      [fallbackCenter[0] + defaultSpanLat / 2, fallbackCenter[1] + defaultSpanLng / 2],
    ],
    center: fallbackCenter,
    isValidWgs84: false,
    rawString: bboxStr || 'Simulated Extent',
  };

  if (!bboxStr || typeof bboxStr !== 'string') {
    return fallbackResult;
  }

  try {
    // 1. Check for array-style "[minX, minY, maxX, maxY]"
    const cleanStr = bboxStr.replace(/[\[\]]/g, '').trim();
    const parts = cleanStr.split(',').map((p) => parseFloat(p.trim()));

    if (parts.length >= 4 && parts.every((n) => !isNaN(n))) {
      let [minX, minY, maxX, maxY] = parts;

      // Check if coordinates fit in WGS84 degree space (-180..180, -90..90)
      const isXLongitude = minX >= -180 && minX <= 180 && maxX >= -180 && maxX <= 180;
      const isYLatitude = minY >= -90 && minY <= 90 && maxY >= -90 && maxY <= 90;

      if (isXLongitude && isYLatitude) {
        // Correct order if inverted
        const south = Math.min(minY, maxY);
        const north = Math.max(minY, maxY);
        const west = Math.min(minX, maxX);
        const east = Math.max(minX, maxX);

        return {
          bounds: [
            [south, west],
            [north, east],
          ],
          center: [(south + north) / 2, (west + east) / 2],
          isValidWgs84: true,
          rawString: bboxStr,
        };
      }
    }

    // 2. Check for GeoJSON string
    if (bboxStr.includes('coordinates') || bboxStr.includes('Polygon')) {
      const geojson = JSON.parse(bboxStr);
      const coords = geojson.coordinates?.[0] || geojson.geometry?.coordinates?.[0];
      if (Array.isArray(coords) && coords.length > 0) {
        let minLng = Infinity;
        let maxLng = -Infinity;
        let minLat = Infinity;
        let maxLat = -Infinity;

        for (const pt of coords) {
          const lng = pt[0];
          const lat = pt[1];
          if (typeof lng === 'number' && typeof lat === 'number') {
            minLng = Math.min(minLng, lng);
            maxLng = Math.max(maxLng, lng);
            minLat = Math.min(minLat, lat);
            maxLat = Math.max(maxLat, lat);
          }
        }

        if (minLng !== Infinity && minLat >= -90 && maxLat <= 90) {
          return {
            bounds: [
              [minLat, minLng],
              [maxLat, maxLng],
            ],
            center: [(minLat + maxLat) / 2, (minLng + maxLng) / 2],
            isValidWgs84: true,
            rawString: bboxStr,
          };
        }
      }
    }
  } catch {
    // Return fallback on parsing failure
  }

  return fallbackResult;
}

/**
 * Formats coordinates nicely for UI telemetry display
 */
export function formatCoordinates(lat: number, lng: number): string {
  const latDir = lat >= 0 ? 'N' : 'S';
  const lngDir = lng >= 0 ? 'E' : 'W';
  return `${Math.abs(lat).toFixed(4)}°${latDir}, ${Math.abs(lng).toFixed(4)}°${lngDir}`;
}
