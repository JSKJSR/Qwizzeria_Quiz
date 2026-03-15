import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock canvas context
function createMockContext() {
  return {
    fillRect: vi.fn(),
    strokeRect: vi.fn(),
    fillText: vi.fn(),
    beginPath: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    stroke: vi.fn(),
    createRadialGradient: vi.fn(() => ({
      addColorStop: vi.fn(),
    })),
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 0,
    font: '',
    textAlign: '',
    letterSpacing: '',
  };
}

describe('certificateGenerator', () => {
  let mockCtx;

  beforeEach(() => {
    mockCtx = createMockContext();
    vi.spyOn(document, 'createElement').mockImplementation((tag) => {
      if (tag === 'canvas') {
        return {
          width: 0,
          height: 0,
          getContext: () => mockCtx,
          toDataURL: () => 'data:image/png;base64,mockdata',
        };
      }
      if (tag === 'a') {
        return { href: '', download: '', click: vi.fn() };
      }
      return {};
    });
    vi.spyOn(document.body, 'appendChild').mockImplementation(() => {});
    vi.spyOn(document.body, 'removeChild').mockImplementation(() => {});
  });

  it('returns a data URL string', async () => {
    const { generateCertificate } = await import('./certificateGenerator.js');
    const result = generateCertificate({
      name: 'Alice',
      rank: 1,
      score: 100,
      quizTitle: 'Geography Quiz',
      date: '2026-03-15',
    });
    expect(result).toMatch(/^data:image\/png/);
  });

  it('handles long names without error', async () => {
    const { generateCertificate } = await import('./certificateGenerator.js');
    const result = generateCertificate({
      name: 'A Very Long Participant Name That Goes On And On',
      rank: 2,
      score: 50,
      quizTitle: 'Test Quiz',
    });
    expect(result).toMatch(/^data:image\/png/);
  });

  it('handles all three medal ranks', async () => {
    const { generateCertificate } = await import('./certificateGenerator.js');
    for (const rank of [1, 2, 3]) {
      const result = generateCertificate({
        name: 'Player',
        rank,
        score: 30,
        quizTitle: 'Quiz',
      });
      expect(result).toMatch(/^data:image\/png/);
    }
  });

  it('downloadCertificate triggers download', async () => {
    const { downloadCertificate } = await import('./certificateGenerator.js');
    downloadCertificate('data:image/png;base64,test', 'cert.png');
    expect(document.body.appendChild).toHaveBeenCalled();
    expect(document.body.removeChild).toHaveBeenCalled();
  });
});
