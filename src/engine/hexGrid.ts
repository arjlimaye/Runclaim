const HEX_SIZE_METERS = 80;
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

function interpolatePath(path: { lat: number; lng: number }[], stepMeters: number = 3): { lat: number; lng: number }[] {
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

function isNearPath(hexId: string, originalPath: { lat: number; lng: number }[], maxDistMeters: number): boolean {
  const corners = hexIdToPolygon(hexId);
  if (corners.length === 0) return false;
  const centerLat = corners.reduce((sum, c) => sum + c.latitude, 0) / corners.length;
  const centerLng = corners.reduce((sum, c) => sum + c.longitude, 0) / corners.length;
  return originalPath.some(p => haversineMeters(p.lat, p.lng, centerLat, centerLng) <= maxDistMeters);
}

export function getClaimedHexes(path: { lat: number; lng: number }[]): string[] {
  const dense = interpolatePath(path, 3);
  const hexCounts: Record<string, number> = {};
  for (const point of dense) {
    const id = latLngToHexId(point.lat, point.lng);
    hexCounts[id] = (hexCounts[id] || 0) + 1;
  }
  return Object.entries(hexCounts)
    .filter(([id, count]) => count >= 1 && isNearPath(id, path, 200))
    .map(([id]) => id);
}

export function hexIdToPolygon(hexId: string): { latitude: number; longitude: number }[] {
  const parts = hexId.split('_');
  if (parts.length < 2) return [];
  const [q, r] = parts.map(Number);
  if (!isFinite(q) || !isFinite(r)) return [];

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
