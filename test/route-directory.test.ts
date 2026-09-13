import { readdirSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const APP_DIR = fileURLToPath(new URL('../app', import.meta.url))

function filesUnder(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory() ? filesUnder(join(dir, entry.name)) : [join(dir, entry.name)],
  )
}

describe('the app/ route directory', () => {
  /**
   * Expo Router loads every file under `app/` through a `require.context` whose regex excludes only
   * `+api`, `+html` and `+middleware`. A test file there is therefore bundled as a route, drags
   * `@testing-library/react-native` into the app bundle, and the build dies on its `node:console`
   * import — a failure that only appears on device, long after the test suite has gone green.
   *
   * There is no supported way to exclude a pattern, so the rule is the fix: tests live beside the
   * component they cover, and route files stay thin enough that there is nothing there to test.
   */
  it('holds no test files', () => {
    const tests = filesUnder(APP_DIR)
      .filter((file) => /\.(test|spec)\.[tj]sx?$/.test(file))
      .map((file) => file.slice(APP_DIR.length + 1))

    expect(tests).toEqual([])
  })
})
