import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    threads: false,
    timeout: 30_000,
  },
})
