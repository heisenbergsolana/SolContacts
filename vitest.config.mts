import { fileURLToPath } from 'node:url'
import { presets, reactNative } from 'vitest-native'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [
    reactNative({
      // Mobile Wallet Adapter is Android-only, so tests resolve the Android variant of native modules.
      platform: 'android',
      // Mocks for the native modules these libraries expect to find at runtime.
      presets: [presets.asyncStorage(), presets.gestureHandler(), presets.reanimated(), presets.safeAreaContext()],
      // Ships untranspiled JSX, so Node cannot load it the way it loads a normal dependency.
      transform: ['react-native-qrcode-svg'],
    }),
  ],
  resolve: {
    // Mirrors the `@/*` path alias from tsconfig.json.
    alias: {
      '@': fileURLToPath(new URL('.', import.meta.url)),
      /**
       * `expo-linear-gradient` re-exports `expo-modules-core`, which ships TypeScript source that
       * the loader will not strip inside node_modules. The stub is a plain view, which is what the
       * component is once its colours are painted — every assertion in this suite is about layout,
       * labels and children, none about the gradient itself.
       */
      'expo-linear-gradient': fileURLToPath(new URL('./test/linear-gradient-stub.tsx', import.meta.url)),
    },
  },
  test: {
    coverage: {
      exclude: ['**/*.config.*', '**/*.test.*', 'android/**', 'app.json', 'dist/**', 'index.js', 'test/**'],
      include: ['app/**', 'components/**', 'constants/**', 'features/**', 'modules/**', 'utils/**'],
      provider: 'v8',
      reporter: ['text', 'lcov'],
    },
    include: ['**/*.test.{ts,tsx}'],
  },
})
