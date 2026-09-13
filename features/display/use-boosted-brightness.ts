import * as Brightness from 'expo-brightness'
import { useEffect } from 'react'

/** Bright enough for another phone's camera, short of a flashbang in a dark room. */
const QR_BRIGHTNESS = 0.9

/**
 * Raise the app window's brightness while a screen is mounted, and hand it back on the way out.
 *
 * The activity's brightness only, never the device's: `setBrightnessAsync` needs no permission,
 * while the system-wide call needs `WRITE_SETTINGS`. The config plugin that would add that
 * permission is deliberately left out of `app.json` — showing a QR code is no reason to take a
 * device-wide setting away from its owner.
 *
 * Failure is silent on purpose. A screen that cannot brighten itself still shows a scannable code,
 * and an unhandled rejection would be a worse outcome than a dim one.
 */
export function useBoostedBrightness(level: number = QR_BRIGHTNESS): void {
  useEffect(() => {
    void Brightness.setBrightnessAsync(level).catch(() => undefined)

    return () => {
      void Brightness.restoreSystemBrightnessAsync().catch(() => undefined)
    }
  }, [level])
}
