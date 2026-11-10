export function distanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function insideCircle(
  point: { lat: number; lng: number },
  circle: { lat: number; lng: number; km: number }
): boolean {
  if (![point.lat, point.lng, circle.lat, circle.lng, circle.km].every(Number.isFinite)) return false;
  if (circle.km <= 0) return false;
  return distanceKm(point.lat, point.lng, circle.lat, circle.lng) <= circle.km + 0.05;
}
