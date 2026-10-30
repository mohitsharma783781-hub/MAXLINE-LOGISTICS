/**
 * Centralized Barcode & QR Code SVG Generation Service
 * Pure zero-dependency SVG Code 128 barcode rendering engine.
 */

export const BarcodeService = {
  // Generate Code 128-B SVG Barcode
  generateBarcodeSvg: (text: string, height: number = 50, barWidth: number = 2): string => {
    const sanitized = (text || 'AWB-DEMO-12345').toUpperCase().replace(/[^A-Z0-9-]/g, '');
    
    // Code 128-B character width patterns
    const patterns: Record<string, string> = {
      '0': '212222', '1': '222122', '2': '222221', '3': '121223', '4': '121322',
      '5': '131222', '6': '122213', '7': '122312', '8': '132212', '9': '221213',
      'A': '111323', 'B': '131123', 'C': '131321', 'D': '112313', 'E': '132113',
      'F': '132311', 'G': '211313', 'H': '231113', 'I': '231311', 'J': '112133',
      'K': '112331', 'L': '132131', 'M': '113123', 'N': '113321', 'O': '133121',
      'P': '313121', 'Q': '211331', 'R': '231131', 'S': '312131', 'T': '311123',
      'U': '311321', 'V': '331121', 'W': '312113', 'X': '312311', 'Y': '332111',
      'Z': '314111', '-': '221411',
    };

    // Start Code B pattern: 211214
    let fullPattern = '211214';

    for (let i = 0; i < sanitized.length; i++) {
      const char = sanitized[i];
      fullPattern += patterns[char] || '111323';
    }

    // Stop pattern: 2331112
    fullPattern += '2331112';

    let currentX = 10;
    let rects = '';
    let isBar = true;

    for (let i = 0; i < fullPattern.length; i++) {
      const w = parseInt(fullPattern[i], 10) * barWidth;
      if (isBar) {
        rects += `<rect x="${currentX}" y="0" width="${w}" height="${height}" fill="#000000" />`;
      }
      currentX += w;
      isBar = !isBar;
    }

    const totalWidth = currentX + 10;

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalWidth} ${height + 15}" width="100%" height="${height + 15}">
      <g>${rects}</g>
      <text x="${totalWidth / 2}" y="${height + 12}" font-family="monospace" font-size="11" font-weight="bold" text-anchor="middle" fill="#000000">${sanitized}</text>
    </svg>`;
  },
};
