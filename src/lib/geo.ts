export function distanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export type MapPoint = { lat: number; lng: number };

/** `lat,lng;lat,lng;...` with at least three corners. */
export function parseShape(value?: string | null): MapPoint[] | null {
  if (!value) return null;
  const points = value
    .split(";")
    .map((pair) => pair.split(",").map(Number))
    .filter((pair) => pair.length === 2 && pair.every(Number.isFinite))
    .map(([lat, lng]) => ({ lat, lng }));
  return points.length >= 3 ? points.slice(0, 80) : null;
}

export function encodeShape(points: MapPoint[]): string {
  return points
    .slice(0, 80)
    .map((point) => `${point.lat.toFixed(5)},${point.lng.toFixed(5)}`)
    .join(";");
}

export function shapeBounds(points: MapPoint[]) {
  const lats = points.map((point) => point.lat);
  const lngs = points.map((point) => point.lng);
  return {
    minLat: Math.min(...lats),
    maxLat: Math.max(...lats),
    minLng: Math.min(...lngs),
    maxLng: Math.max(...lngs),
  };
}

/** Ray cast. Points on the boundary count as inside. */
export function pointInPolygon(point: MapPoint, polygon: MapPoint[]): boolean {
  if (polygon.length < 3) return false;
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const a = polygon[i];
    const b = polygon[j];
    const crosses = a.lat > point.lat !== b.lat > point.lat;
    if (!crosses) continue;
    const lng = ((b.lng - a.lng) * (point.lat - a.lat)) / (b.lat - a.lat || 1e-12) + a.lng;
    if (Math.abs(lng - point.lng) < 1e-8) return true;
    if (lng > point.lng) inside = !inside;
  }
  return inside;
}

export function insideCircle(
  point: { lat: number; lng: number },
  circle: { lat: number; lng: number; km: number }
): boolean {
  if (![point.lat, point.lng, circle.lat, circle.lng, circle.km].every(Number.isFinite)) return false;
  if (circle.km <= 0) return false;
  return distanceKm(point.lat, point.lng, circle.lat, circle.lng) <= circle.km + 0.05;
}
