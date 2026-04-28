import exifr from 'exifr';

// Returns lat/lng if the picked photo has GPS EXIF tags. Many Android galleries
// strip these on share — fall back to current GPS at the call site.
export async function exifGps(
  file: File
): Promise<{ lat: number; lng: number; takenAt: Date | null } | null> {
  try {
    const data = await exifr.parse(file, {
      gps: true,
      pick: ['latitude', 'longitude', 'DateTimeOriginal', 'CreateDate'],
    });
    if (!data) return null;
    const lat = data.latitude as number | undefined;
    const lng = data.longitude as number | undefined;
    if (typeof lat !== 'number' || typeof lng !== 'number') return null;
    const takenAt =
      (data.DateTimeOriginal as Date | undefined) ??
      (data.CreateDate as Date | undefined) ??
      null;
    return { lat, lng, takenAt };
  } catch {
    return null;
  }
}
