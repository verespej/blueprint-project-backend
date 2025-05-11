import { describe, it, expect } from 'vitest';

import { generateSlug } from './slugs';

describe('generateSlug', () => {
  it('generates a slug', async () => {
    const slug = generateSlug();
    expect(slug).toBeDefined();
  });

  it('generates a slug of a specific length', async () => {
    const length = 12;
    const slug = generateSlug(length);
    expect(slug).toBeDefined();
    expect(slug.length).toBe(length);
  });
});
