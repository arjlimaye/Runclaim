const HEX_SIZE_METERS = 150;
const EARTH_RADIUS = 6371000;

export function latLngToHexId(lat: number, lng: number): string {
  const x = EARTH_RADIUS * (lng * Math.PI / 180);
  const y = EARTH_RADIUS * Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI / 180) / 2));
  const q = Math.round((x * Math.sqrt(3) / 3 - y / 3) / HEX_SIZE_METERS);
  const r = Math.round((y * 2 / 3) / HEX_SIZE_METERS);
  return `${q}_${r}`;
}

export function getClaimedHexes(path: { lat: number; lng: number }[]): string[] {
  const hexCounts: Record<string, number> = {};
  for (const point of path) {
    const id = latLngToHexId(point.lat, point.lng);
    hexCounts[id] = (hexCounts[id] || 0) + 1;
  }
  return Object.entries(hexCounts)
    .filter(([_, count]) => count >= 10)
    .map(([id]) => id);
}

export function hexIdToPolygon(hexId: string): { latitude: number; longitude: number }[] {
  const [q, r] = hexId.split('_').map(Number);

  // Inverse of latLngToHexId: recover Mercator x/y from q/r
  const y = (r * HEX_SIZE_METERS * 3) / 2;
  const x = (q * HEX_SIZE_METERS + y / 3) * Math.sqrt(3);

  const corners: { latitude: number; longitude: number }[] = [];
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 180) * (60 * i + 30);
    const cx = x + HEX_SIZE_METERS * Math.cos(angle);
    const cy = y + HEX_SIZE_METERS * Math.sin(angle);
    const lat = ((Math.atan(Math.exp(cy / EARTH_RADIUS)) - Math.PI / 4) * 2) * (180 / Math.PI);
    const lng = (cx / EARTH_RADIUS) * (180 / Math.PI);
    corners.push({ latitude: lat, longitude: lng });
  }
  return corners;
}

export function calcCityPct(
  claimedHexIds: string[],
  centerLat: number,
  centerLng: number,
  radiusKm: number = 15
): string {
  // Generate all hex IDs within a bounding box around the city center
  const radiusMeters = radiusKm * 1000;
  const latDelta = (radiusMeters / EARTH_RADIUS) * (180 / Math.PI);
  const lngDelta = latDelta / Math.cos(centerLat * Math.PI / 180);

  const latSteps = Math.ceil((radiusMeters * 2) / HEX_SIZE_METERS);
  const lngSteps = Math.ceil((radiusMeters * 2) / HEX_SIZE_METERS);

  const totalHexIds = new Set<string>();

  for (let i = 0; i <= latSteps; i++) {
    for (let j = 0; j <= lngSteps; j++) {
      const lat = (centerLat - latDelta) + (i / latSteps) * latDelta * 2;
      const lng = (centerLng - lngDelta) + (j / lngSteps) * lngDelta * 2;
      totalHexIds.add(latLngToHexId(lat, lng));
    }
  }

  const totalHexes = totalHexIds.size;
  const claimedCount = claimedHexIds.filter(id => totalHexIds.has(id)).length;

  if (totalHexes === 0) return '0.00';
  return ((claimedCount / totalHexes) * 100).toFixed(2);
}