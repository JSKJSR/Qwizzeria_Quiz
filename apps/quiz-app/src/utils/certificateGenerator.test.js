import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('certificateGenerator', () => {
  let mockWindow;

  beforeEach(() => {
    mockWindow = {
      document: {
        write: vi.fn(),
        close: vi.fn(),
      },
      print: vi.fn(),
    };
    vi.spyOn(window, 'open').mockReturnValue(mockWindow);
  });

  it('opens a new window with certificate HTML', async () => {
    const { generateCertificate } = await import('./certificateGenerator.js');
    generateCertificate({
      name: 'Alice',
      rank: 1,
      score: 100,
      quizTitle: 'Geography Quiz',
      date: '2026-03-15',
    });

    expect(window.open).toHaveBeenCalledWith('', '_blank');
    expect(mockWindow.document.write).toHaveBeenCalledTimes(1);

    const html = mockWindow.document.write.mock.calls[0][0];
    expect(html).toContain('Alice');
    expect(html).toContain('Geography Quiz');
    expect(html).toContain('1st Place');
    expect(html).toContain('100 points');
    expect(html).toContain('2026-03-15');
    expect(html).toContain('qwizzeria-logo');
    expect(html).toContain('Certificate of Achievement');
  });

  it('handles all three medal ranks', async () => {
    const { generateCertificate } = await import('./certificateGenerator.js');
    const rankLabels = ['1st Place', '2nd Place', '3rd Place'];

    for (let rank = 1; rank <= 3; rank++) {
      mockWindow.document.write.mockClear();

      generateCertificate({
        name: 'Player',
        rank,
        score: 30,
        quizTitle: 'Quiz',
      });

      const html = mockWindow.document.write.mock.calls[0][0];
      expect(html).toContain(rankLabels[rank - 1]);
    }
  });

  it('escapes HTML in name and title', async () => {
    const { generateCertificate } = await import('./certificateGenerator.js');
    generateCertificate({
      name: '<script>alert("xss")</script>',
      rank: 1,
      score: 50,
      quizTitle: 'Test & "Quiz"',
    });

    const html = mockWindow.document.write.mock.calls[0][0];
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
    expect(html).toContain('Test &amp; &quot;Quiz&quot;');
  });

  it('downloadCertificate is a no-op for backward compat', async () => {
    const { downloadCertificate } = await import('./certificateGenerator.js');
    expect(() => downloadCertificate()).not.toThrow();
  });
});
