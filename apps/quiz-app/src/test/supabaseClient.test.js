import { describe, it, expect, beforeEach } from 'vitest';

// Reset module state between tests by dynamically importing
describe('supabase-client', () => {
  let initSupabase, getSupabase;

  beforeEach(async () => {
    // Re-import to get fresh module state
    const mod = await import('@qwizzeria/supabase-client');
    initSupabase = mod.initSupabase;
    getSupabase = mod.getSupabase;
  });

  it('should throw when initSupabase is called without credentials', () => {
    expect(() => initSupabase('', '')).toThrow('Missing Supabase credentials');
    expect(() => initSupabase(null, null)).toThrow('Missing Supabase credentials');
  });

  it('should initialize and return a client with valid credentials', () => {
    const client = initSupabase('https://test.supabase.co', 'test-anon-key');
    expect(client).toBeDefined();
    expect(getSupabase()).toBe(client);
  });
});
