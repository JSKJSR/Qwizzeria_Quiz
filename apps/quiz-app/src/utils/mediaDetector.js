export function detectMediaType(url) {
  if (!url || url.trim() === '') {
    return { type: 'none', embedUrl: null };
  }

  const trimmed = url.trim();

  // YouTube detection
  const youtubePatterns = [
    /(?:youtube\.com\/watch\?v=)([\w-]+)/,
    /(?:youtu\.be\/)([\w-]+)/,
    /(?:youtube\.com\/embed\/)([\w-]+)/,
    /(?:youtube\.com\/shorts\/)([\w-]+)/,
  ];

  for (const pattern of youtubePatterns) {
    const match = trimmed.match(pattern);
    if (match) {
      return {
        type: 'video',
        embedUrl: `https://www.youtube.com/embed/${match[1]}?autoplay=0&rel=0`,
      };
    }
  }

  // Vimeo detection
  const vimeoMatch = trimmed.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) {
    return {
      type: 'video',
      embedUrl: `https://player.vimeo.com/video/${vimeoMatch[1]}`,
    };
  }

  // Direct video files
  if (/\.(mp4|webm|ogg)(\?.*)?$/i.test(trimmed)) {
    return { type: 'video', embedUrl: trimmed };
  }

  // Image detection
  if (/\.(jpg|jpeg|png|gif|webp|svg|bmp)(\?.*)?$/i.test(trimmed)) {
    return { type: 'image', embedUrl: trimmed };
  }

  // Default: treat unknown URLs as images
  return { type: 'image', embedUrl: trimmed };
}
