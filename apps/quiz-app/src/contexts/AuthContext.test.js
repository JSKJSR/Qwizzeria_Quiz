import { describe, it, expect } from 'vitest';
import { AuthContext } from './AuthContext';

describe('AuthContext', () => {
  it('should be a valid React context', () => {
    expect(AuthContext).toBeDefined();
    expect(AuthContext.Provider).toBeDefined();
  });
});
