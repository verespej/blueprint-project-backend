import { resolve } from 'path';

import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '#config': resolve(__dirname, 'config'),
      '#src':    resolve(__dirname, 'src'),
      '#test':   resolve(__dirname, 'test'),
    },
  },
  test: {
    environment: 'node',
    globals: true, // Allow describe() and it() without import
    include: ['src/**/*.test.ts', 'test/**/*.test.ts'],
    setupFiles: ['test/setup.ts'],
  },
});
