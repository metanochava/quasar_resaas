import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'happy-dom',
    include: ['**/*.spec.js'],
    exclude: ['node_modules/**'],
  },
})
