import { describe, it, expect } from 'vitest';
import { matchAnswer } from './answerMatcher';

describe('matchAnswer', () => {
  it('matches exact answers', () => {
    expect(matchAnswer('Einstein', 'Einstein').isMatch).toBe(true);
  });

  it('matches case-insensitively', () => {
    expect(matchAnswer('einstein', 'Einstein').isMatch).toBe(true);
    expect(matchAnswer('EINSTEIN', 'einstein').isMatch).toBe(true);
  });

  it('strips leading articles', () => {
    expect(matchAnswer('Nile River', 'The Nile River').isMatch).toBe(true);
    expect(matchAnswer('The Nile River', 'Nile River').isMatch).toBe(true);
    expect(matchAnswer('apple', 'An Apple').isMatch).toBe(true);
  });

  it('handles substring containment', () => {
    expect(matchAnswer('nile', 'The Nile River').isMatch).toBe(true);
    expect(matchAnswer('Nile River', 'Nile').isMatch).toBe(true);
  });

  it('rejects very short substrings (< 3 chars)', () => {
    expect(matchAnswer('ni', 'The Nile River').isMatch).toBe(false);
  });

  it('tolerates typos via Levenshtein (short answers)', () => {
    expect(matchAnswer('einsten', 'einstein').isMatch).toBe(true);
    expect(matchAnswer('einstan', 'einstein').isMatch).toBe(true);
  });

  it('tolerates typos via Levenshtein (long answers)', () => {
    expect(matchAnswer('alexandar the gret', 'alexander the great').isMatch).toBe(true);
  });

  it('rejects completely wrong answers', () => {
    expect(matchAnswer('amazon', 'The Nile River').isMatch).toBe(false);
    expect(matchAnswer('paris', 'London').isMatch).toBe(false);
  });

  it('rejects empty input', () => {
    expect(matchAnswer('', 'Einstein').isMatch).toBe(false);
    expect(matchAnswer('   ', 'Einstein').isMatch).toBe(false);
  });

  it('handles null/undefined input', () => {
    expect(matchAnswer(null, 'Einstein').isMatch).toBe(false);
    expect(matchAnswer(undefined, 'Einstein').isMatch).toBe(false);
  });

  it('strips punctuation', () => {
    expect(matchAnswer("it's", "its").isMatch).toBe(true);
    expect(matchAnswer('new york!', 'New York').isMatch).toBe(true);
  });

  it('handles numeric answers', () => {
    expect(matchAnswer('1969', '1969').isMatch).toBe(true);
    expect(matchAnswer('1968', '1969').isMatch).toBe(true); // Levenshtein = 1
  });

  it('returns normalized strings', () => {
    const result = matchAnswer('The Nile', 'the nile river');
    expect(result.normalizedInput).toBe('nile');
    expect(result.normalizedAnswer).toBe('nile river');
  });
});
