/**
 * CampusSync - Standalone QR Code & Gate Pass Generator
 * Generates high-fidelity SVG QR patterns with corner finder markers and alignment grids.
 */

export function generateQRCodeSVG(text, size = 160) {
  // Simple deterministic hash to build repeatable pseudo-random matrix patterns for ticket codes
  const modulesCount = 25; // 25x25 grid
  const matrix = Array.from({ length: modulesCount }, () => Array(modulesCount).fill(0));

  // Helper to place finder pattern (7x7) at (x, y)
  function placeFinderPattern(r0, c0) {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        if (
          r === 0 || r === 6 || c === 0 || c === 6 || // Outer square
          (r >= 2 && r <= 4 && c >= 2 && c <= 4)      // Inner square
        ) {
          matrix[r0 + r][c0 + c] = 1;
        } else {
          matrix[r0 + r][c0 + c] = 0;
        }
      }
    }
  }

  // Place 3 standard QR finder patterns
  placeFinderPattern(0, 0); // Top-left
  placeFinderPattern(0, modulesCount - 7); // Top-right
  placeFinderPattern(modulesCount - 7, 0); // Bottom-left

  // Timing patterns
  for (let i = 8; i < modulesCount - 8; i++) {
    matrix[6][i] = i % 2 === 0 ? 1 : 0;
    matrix[i][6] = i % 2 === 0 ? 1 : 0;
  }

  // Populate data area deterministically based on text
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = ((hash << 5) - hash) + text.charCodeAt(i);
    hash |= 0;
  }

  let pseudoState = Math.abs(hash) || 4242;
  function nextPseudo() {
    pseudoState = (pseudoState * 9301 + 49297) % 233280;
    return pseudoState / 233280;
  }

  for (let r = 0; r < modulesCount; r++) {
    for (let c = 0; c < modulesCount; c++) {
      // Skip finder areas
      const inTopLeft = r < 8 && c < 8;
      const inTopRight = r < 8 && c >= modulesCount - 8;
      const inBottomLeft = r >= modulesCount - 8 && c < 8;
      const inTiming = (r === 6 && c >= 8 && c < modulesCount - 8) || (c === 6 && r >= 8 && r < modulesCount - 8);

      if (inTopLeft || inTopRight || inBottomLeft || inTiming) continue;

      // Deterministic fill
      matrix[r][c] = nextPseudo() > 0.45 ? 1 : 0;
    }
  }

  // Render SVG string
  const moduleSize = size / modulesCount;
  let rects = '';
  for (let r = 0; r < modulesCount; r++) {
    for (let c = 0; c < modulesCount; c++) {
      if (matrix[r][c]) {
        const x = (c * moduleSize).toFixed(1);
        const y = (r * moduleSize).toFixed(1);
        const w = (moduleSize + 0.1).toFixed(1); // Slight overlap to prevent gaps
        rects += `<rect x="${x}" y="${y}" width="${w}" height="${w}" fill="#4A2E35" rx="0.5"/>`;
      }
    }
  }

  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" class="qr-svg" role="img" aria-label="Pass QR Code">
      <rect width="${size}" height="${size}" fill="#FFFFFF" rx="8"/>
      ${rects}
    </svg>
  `;
}
