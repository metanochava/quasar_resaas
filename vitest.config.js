import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { quasar } from '@quasar/vite-plugin'

export default defineConfig({
  // @vue/test-utils was already a devDependency but unusable without
  // these two plugins - no spec mounted a real .vue SFC (every existing
  // spec only imports plain .js utils), which is exactly why the
  // click-to-native-picker wiring in FileComponent.vue (s-file) kept
  // regressing silently across several rounds of "fixes": nothing ever
  // exercised the actual DOM/event mechanism, only the pure-logic
  // pieces (guessComponent, resolvePreview, ...) extracted for that
  // reason. @quasar/vite-plugin is what a real Quasar app's own build
  // already uses to resolve bare <q-btn>/<q-menu>/... template tags -
  // without it here, those tags never resolve to anything under plain
  // @vitejs/plugin-vue, even with the Quasar runtime plugin installed.
  plugins: [vue(), quasar()],
  resolve: {
    // Vitest's node environment otherwise resolves "quasar" to its SSR
    // server build, which needs an ssrContext this test suite never
    // provides - the client build is what real app code (and the
    // browser) actually runs.
    alias: {
      quasar: 'quasar/dist/quasar.client.js',
    },
  },
  test: {
    environment: 'happy-dom',
    include: ['**/*.spec.js'],
    exclude: ['node_modules/**'],
  },
})
