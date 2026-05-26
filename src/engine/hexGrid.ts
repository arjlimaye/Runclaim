const HEX_SIZE_METERS = 100;
const EARTH_RADIUS = 6371000;

export function latLngToHexId(lat: number, lng: number): string {
  const x = EARTH_RADIUS * (lng * Math.PI / 180);
  const y = EARTH_RADIUS * Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI / 180) / 2));
  const q = Math.round((x * Math.sqrt(3) / 3 - y / 3) / HEX_SIZE_METERS);
  const r = Math.round((y * 2 / 3) / HEX_SIZE_METERS);
  return `${q}_${r}`;
}

function haversineMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const sinDLat = Math.sin(dLat / 2);
  const sinDLng = Math.sin(dLng / 2);
  const a = sinDLat * sinDLat +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * sinDLng * sinDLng;
  return EARTH_RADIUS * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function interpolatePath(path: { lat: number; lng: number }[], stepMeters: number = 4): { lat: number; lng: number }[] {
  if (path.length < 2) return path;
  const result: { lat: number; lng: number }[] = [];
  for (let i = 0; i < path.length - 1; i++) {
    const a = path[i];
    const b = path[i + 1];
    const distMeters = haversineMeters(a.lat, a.lng, b.lat, b.lng);
    const steps = Math.max(1, Math.ceil(distMeters / stepMeters));
    for (let s = 0; s < steps; s++) {
      const t = s / steps;
      result.push({ lat: a.lat + (b.lat - a.lat) * t, lng: a.lng + (b.lng - a.lng) * t });
    }
  }
  result.push(path[path.length - 1]);
  return result;
}

export function getClaimedHexes(path: { lat: number; lng: number }[]): string[] {
  const dense = interpolatePath(path, 4);
  const hexCounts: Record<string, number> = {};
  for (const point of dense) {
    const id = latLngToHexId(point.lat, point.lng);
    hexCounts[id] = (hexCounts[id] || 0) + 1;
  }
  return Object.entries(hexCounts)
    .filter(([_, count]) => count >= 1)
    .map(([id]) => id);
}

export function hexIdToPolygon(hexId: string): { latitude: number; longitude: number }[] {
  const parts = hexId.split('_');
  if (parts.length < 2) return [];
  const [q, r] = parts.map(Number);
  if (!isFinite(q) || !isFinite(r)) return [];

  // Invert latLngToHexId:
  // Forward: q = round((x * sqrt(3)/3 - y/3) / SIZE), r = round((y * 2/3) / SIZE)
  // Inverse: y = r * SIZE * 3/2, x = (q * SIZE + y/3) * sqrt(3)
  // BUT this is wrong — let's derive correctly:
  // r = round(y * 2/3 / SIZE) => y_center = r * SIZE * 3/2
  // q = round((x * sqrt(3)/3 - y/3) / SIZE) => x_center = (q * SIZE + y_center/3) * sqrt(3)

  const y_center = r * HEX_SIZE_METERS * 1.5;
  const x_center = (q * HEX_SIZE_METERS + y_center / 3) * Math.sqrt(3);

  const corners: { latitude: number; longitude: number }[] = [];
  for (let i = 0; i < 6; i++) {
    const angle_deg = 60 * i;
    const angle_rad = (Math.PI / 180) * angle_deg;
    const cx = x_center + HEX_SIZE_METERS * Math.cos(angle_rad);
    const cy = y_center + HEX_SIZE_METERS * Math.sin(angle_rad);
    // Inverse Mercator projection
    const lat = (2 * Math.atan(Math.exp(cy / EARTH_RADIUS)) - Math.PI / 2) * (180 / Math.PI);
    const lng = (cx / EARTH_RADIUS) * (180 / Math.PI);
    corners.push({ latitude: lat, longitude: lng });
  }
  return corners;
}

export function calcCityPct(
  claimedHexIds: string[],
  centerLat: number,
  centerLng: number,
  radiusKm: number = 10
): string {
  if (claimedHexIds.length === 0) return '0.00';

  const totalHexIds = new Set<string>();

  // Sample the city area using the same projection as latLngToHexId
  // Step size = HEX_SIZE_METERS in degrees approx
  const latStep = (HEX_SIZE_METERS / EARTH_RADIUS) * (180 / Math.PI) * 0.75;
  const lngStep = latStep / Math.cos(centerLat * Math.PI / 180);

  const latSteps = Math.ceil(radiusKm * 1000 * 2 / (HEX_SIZE_METERS * 0.75));
  const lngSteps = Math.ceil(radiusKm * 1000 * 2 / HEX_SIZE_METERS);

  for (let i = 0; i <= latSteps; i++) {
    for (let j = 0; j <= lngSteps; j++) {
      const lat = (centerLat - latSteps * latStep / 2) + i * latStep;
      const lng = (centerLng - lngSteps * lngStep / 2) + j * lngStep;
      totalHexIds.add(latLngToHexId(lat, lng));
    }
  }

  const totalHexes = totalHexIds.size;
  const claimedCount = claimedHexIds.filter(id => totalHexIds.has(id)).length;

  if (totalHexes === 0) return '0.00';
  return ((claimedCount / totalHexes) * 100).toFixed(2);
}
