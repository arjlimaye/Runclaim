// Hex grid uses axial coordinates with flat-top orientation
// Forward: x = R * lng_rad, y = R * ln(tan(pi/4 + lat_rad/2)) (Mercator)
// q = round((x * sqrt(3)/3 - y/3) / SIZE), r = round(y * 2/3 / SIZE)
// Inverse: y_center = r * SIZE * 1.5, x_center = q * SIZE * sqrt(3) + y_center / sqrt(3)

const HEX_SIZE_METERS = 150;
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

function interpolatePath(path: { lat: number; lng: number }[], stepMeters: number = 7): { lat: number; lng: number }[] {
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

  const y_center = r * HEX_SIZE_METERS * 1.5;
  const x_center = q * HEX_SIZE_METERS * Math.sqrt(3) + y_center / Math.sqrt(3);

  const corners: { latitude: number; longitude: number }[] = [];
  for (let i = 0; i < 6; i++) {
    const angle_rad = (Math.PI / 180) * (60 * i);
    const cx = x_center + HEX_SIZE_METERS * Math.cos(angle_rad);
    const cy = y_center + HEX_SIZE_METERS * Math.sin(angle_rad);
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
  const PUNE_WALKABLE_HEXES = 9589;
  if (claimedHexIds.length === 0) return '0.00';
  return ((claimedHexIds.length / PUNE_WALKABLE_HEXES) * 100).toFixed(2);
}
