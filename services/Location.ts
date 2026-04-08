import * as Location from 'expo-location';

let permissionChecked = false;
let permissionGranted = false;

/**
 * Silently request location permission on first call.
 * Returns current coordinates if granted, null otherwise.
 * Never blocks the user or shows repeated prompts.
 */
export async function captureLocation(): Promise<{ latitude: number; longitude: number } | null> {
  try {
    if (!permissionChecked) {
      permissionChecked = true;
      const { status } = await Location.requestForegroundPermissionsAsync();
      permissionGranted = status === 'granted';
    }

    if (!permissionGranted) return null;

    const loc = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    return {
      latitude: loc.coords.latitude,
      longitude: loc.coords.longitude,
    };
  } catch {
    // Silently fail — location is optional
    return null;
  }
}
