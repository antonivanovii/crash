import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'node',
    // Монте-Карло на 10⁷ раундов не помещается в дефолтные 5 секунд.
    testTimeout: 120_000,
  },
});
