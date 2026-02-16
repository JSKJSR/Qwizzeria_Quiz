import { describe, it, expect } from 'vitest';
import { detectMediaType } from './mediaDetector';

describe('detectMediaType', () => {
  it('should return none for empty/null input', () => {
    expect(detectMediaType('')).toEqual({ type: 'none', embedUrl: null });
    expect(detectMediaType(null)).toEqual({ type: 'none', embedUrl: null });
    expect(detectMediaType(undefined)).toEqual({ type: 'none', embedUrl: null });
  });

  it('should detect YouTube watch URLs', () => {
    const result = detectMediaType('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    expect(result.type).toBe('video');
    expect(result.embedUrl).toContain('youtube.com/embed/dQw4w9WgXcQ');
  });

  it('should detect YouTube short URLs', () => {
    const result = detectMediaType('https://youtu.be/dQw4w9WgXcQ');
    expect(result.type).toBe('video');
    expect(result.embedUrl).toContain('youtube.com/embed/dQw4w9WgXcQ');
  });

  it('should detect Vimeo URLs', () => {
    const result = detectMediaType('https://vimeo.com/123456789');
    expect(result.type).toBe('video');
    expect(result.embedUrl).toContain('player.vimeo.com/video/123456789');
  });

  it('should detect image URLs', () => {
    for (const ext of ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg']) {
      const result = detectMediaType(`https://example.com/image.${ext}`);
      expect(result.type).toBe('image');
    }
  });

  it('should detect direct video files', () => {
    for (const ext of ['mp4', 'webm', 'ogg']) {
      const result = detectMediaType(`https://example.com/video.${ext}`);
      expect(result.type).toBe('video');
    }
  });

  it('should treat unknown URLs as images', () => {
    const result = detectMediaType('https://example.com/something');
    expect(result.type).toBe('image');
  });
});
