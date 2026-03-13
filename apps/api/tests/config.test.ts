import { describe, it, expect } from 'vitest';

describe('config', () => {
  it('exports PORT as a number', async () => {
    const { env } = await import('../src/config.js');
    expect(typeof env.PORT).toBe('number');
  });

  it('exports CORS_ORIGIN as a string', async () => {
    const { env } = await import('../src/config.js');
    expect(typeof env.CORS_ORIGIN).toBe('string');
  });
});
