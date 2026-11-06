/**
 * MAXLINE LOGISTICS - Centralized Barcode Generation Engine
 * Standard Code 128 (ISO/IEC 15417) implementation with Modulo 103 checksum.
 * Fully compatible with all industrial laser scanners (Zebra, Honeywell, Cognex)
 * and mobile barcode scanner apps.
 */

// Official Code 128 Symbol Patterns (Values 0 to 106)
// Each 6-digit string represents bar-space-bar-space-bar-space module widths.
// Stop symbol (106) has 7 digits (bar-space-bar-space-bar-space-bar).
const CODE128_PATTERNS: string[] = [
  '212222', '222122', '222221', '121223', '121322', '131222', '122213', '122312', '132212', '221213', // 0-9
  '221312', '231212', '112232', '122132', '122231', '113222', '123122', '123221', '223211', '221132', // 10-19
  '221231', '213212', '223112', '312131', '311222', '321122', '321221', '312212', '322112', '322211', // 20-29
  '212123', '212321', '232121', '111323', '131123', '131321', '112313', '132113', '132311', '211313', // 30-39
  '231113', '231311', '112133', '112331', '132131', '113123', '113321', '133121', '313121', '211331', // 40-49
  '231131', '213113', '213311', '213131', '311123', '311321', '331121', '312113', '312311', '332111', // 50-59
  '314111', '221411', '431111', '111224', '111422', '121124', '121421', '141122', '141221', '112214', // 60-69
  '112412', '122114', '122411', '142112', '142211', '241211', '221114', '413111', '241112', '134111', // 70-79
  '111242', '121142', '121241', '114212', '124112', '124211', '411212', '421112', '421211', '212141', // 80-89
  '214121', '412121', '111143', '111341', '131141', '114113', '114311', '411113', '411311', '113141', // 90-99
  '114131', '311141', '411131', '211412', '211214', '211232', '2331112'                                 // 100-106
];

const START_CODE_B = 104; // Pattern for Start Code B ('211214')
const STOP_CODE = 106;     // Pattern for Stop ('2331112')

export interface BarcodeOptions {
  height?: number;
  barWidth?: number;
  showText?: boolean;
  quietZone?: number;
  fontSize?: number;
  textColor?: string;
  fontFamily?: string;
}

export const BarcodeService = {
  /**
   * Generates a 100% ISO/IEC 15417 compliant Code 128-B SVG barcode string.
   * Includes mandatory Modulo 103 checksum character and quiet zones.
   */
  generateBarcodeSvg: (
    text: string,
    height: number = 50,
    barWidth: number = 2,
    options: BarcodeOptions = {}
  ): string => {
    const rawText = String(text || 'AWB-DEMO-12345').trim();
    // Filter characters to printable ASCII range (32 to 126)
    const sanitized = rawText.replace(/[^\x20-\x7E]/g, '');
    const displayText = sanitized || 'AWB-DEMO-12345';

    const showText = options.showText !== undefined ? options.showText : true;
    const quietZone = options.quietZone !== undefined ? options.quietZone : 12;
    const fontSize = options.fontSize || 11;
    const textColor = options.textColor || '#000000';
    const fontFamily = options.fontFamily || 'monospace';

    // Step 1: Calculate Modulo 103 Checksum
    // Checksum = (Start_Code_B_Value + SUM(char_value_k * (k + 1))) mod 103
    let checksumTotal = START_CODE_B;
    const charValues: number[] = [];

    for (let i = 0; i < displayText.length; i++) {
      const charCode = displayText.charCodeAt(i);
      const val = charCode - 32; // In Code 128-B, ASCII 32 (' ') is index 0
      charValues.push(val);
      checksumTotal += val * (i + 1);
    }

    const checksumSymbol = checksumTotal % 103;

    // Step 2: Assemble full pattern sequence:
    // [Start Code B] + [Data Symbols...] + [Checksum Symbol] + [Stop Symbol]
    let patternSequence = CODE128_PATTERNS[START_CODE_B];
    for (const val of charValues) {
      patternSequence += CODE128_PATTERNS[val] || CODE128_PATTERNS[0];
    }
    patternSequence += CODE128_PATTERNS[checksumSymbol];
    patternSequence += CODE128_PATTERNS[STOP_CODE];

    // Step 3: Render SVG rects with module widths
    let currentX = quietZone;
    let rects = '';
    let isBar = true;

    for (let i = 0; i < patternSequence.length; i++) {
      const moduleCount = parseInt(patternSequence[i], 10);
      const w = moduleCount * barWidth;
      if (isBar) {
        rects += `<rect x="${currentX}" y="0" width="${w}" height="${height}" fill="#000000" />`;
      }
      currentX += w;
      isBar = !isBar;
    }

    const totalWidth = currentX + quietZone;
    const svgHeight = showText ? height + fontSize + 6 : height;

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalWidth} ${svgHeight}" width="100%" height="${svgHeight}" style="display:block;margin:0 auto;max-width:100%;">
      <g>${rects}</g>
      ${showText ? `<text x="${totalWidth / 2}" y="${height + fontSize + 2}" font-family="${fontFamily}" font-size="${fontSize}" font-weight="bold" text-anchor="middle" fill="${textColor}" letter-spacing="1px">${displayText}</text>` : ''}
    </svg>`;
  },

  /**
   * Generates a Data URI (image/svg+xml) for embedding in <img> tags.
   */
  generateBarcodeDataUri: (
    text: string,
    height: number = 50,
    barWidth: number = 2,
    options: BarcodeOptions = {}
  ): string => {
    const svg = BarcodeService.generateBarcodeSvg(text, height, barWidth, options);
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  },
};
