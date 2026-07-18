/**
 * Formats a distance in miles, switching to feet below 0.25 mi.
 * At ≥10 mi precision drops to whole miles.
 */
export function formatMiles(miles: number): string {
  if (miles < 0.25) {
    return `${Math.round(miles * 5280).toLocaleString("en-US")} ft`;
  }
  if (miles >= 10) return `${Math.round(miles).toLocaleString("en-US")} mi`;
  return `${miles.toFixed(1)} mi`;
}

/**
 * Formats a distance in kilometers, switching to meters below 0.5 km.
 * At ≥10 km precision drops to whole kilometers. (Future use.)
 */
export function formatKm(km: number): string {
  if (km < 0.5) {
    return `${Math.round(km * 1000).toLocaleString("en-US")} m`;
  }
  if (km >= 10) return `${Math.round(km).toLocaleString("en-US")} km`;
  return `${km.toFixed(1)} km`;
}
