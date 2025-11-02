const fs = require('fs');
const path = require('path');

// Simple roof icon as SVG
const roofIconSVG = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="roofGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:#1e40af;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#3b82f6;stop-opacity:1" />
    </linearGradient>
    <linearGradient id="houseGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:#60a5fa;stop-opacity:0.3" />
      <stop offset="100%" style="stop-color:#93c5fd;stop-opacity:0.2" />
    </linearGradient>
  </defs>

  <!-- Background circle -->
  <circle cx="256" cy="256" r="240" fill="white" stroke="#1e40af" stroke-width="16"/>

  <!-- House body -->
  <rect x="156" y="230" width="200" height="180" rx="8" fill="url(#houseGrad)" stroke="#1e40af" stroke-width="4"/>

  <!-- Roof -->
  <path d="M 128 250 L 256 150 L 384 250 Z" fill="url(#roofGrad)" stroke="#1e3a8a" stroke-width="4" stroke-linejoin="round"/>

  <!-- Roof shingles -->
  <line x1="170" y1="250" x2="342" y2="250" stroke="#1e3a8a" stroke-width="2" opacity="0.5"/>
  <line x1="190" y1="235" x2="322" y2="235" stroke="#1e3a8a" stroke-width="2" opacity="0.5"/>
  <line x1="210" y1="220" x2="302" y2="220" stroke="#1e3a8a" stroke-width="2" opacity="0.5"/>

  <!-- Door -->
  <rect x="236" y="300" width="40" height="110" rx="4" fill="#1e40af" opacity="0.8"/>
  <circle cx="268" cy="355" r="4" fill="white"/>

  <!-- Windows -->
  <rect x="176" y="280" width="40" height="40" rx="4" fill="#bfdbfe" stroke="#1e40af" stroke-width="3"/>
  <line x1="196" y1="280" x2="196" y2="320" stroke="#1e40af" stroke-width="2"/>
  <line x1="176" y1="300" x2="216" y2="300" stroke="#1e40af" stroke-width="2"/>

  <rect x="296" y="280" width="40" height="40" rx="4" fill="#bfdbfe" stroke="#1e40af" stroke-width="3"/>
  <line x1="316" y1="280" x2="316" y2="320" stroke="#1e40af" stroke-width="2"/>
  <line x1="296" y1="300" x2="336" y2="300" stroke="#1e40af" stroke-width="2"/>

  <!-- Scout badge -->
  <circle cx="256" cy="180" r="25" fill="white" stroke="#fbbf24" stroke-width="4"/>
  <path d="M 256 165 L 259 173 L 267 173 L 261 178 L 264 186 L 256 181 L 248 186 L 251 178 L 245 173 L 253 173 Z" fill="#fbbf24"/>
</svg>`;

// Save SVG file
fs.writeFileSync(path.join(__dirname, 'src/assets/icons/icon.svg'), roofIconSVG);

console.log('SVG icon created at src/assets/icons/icon.svg');
console.log('Note: You can convert this SVG to PNG using online tools or imagemagick:');
console.log('  convert -resize 192x192 icon.svg icon-192x192.png');
console.log('  convert -resize 512x512 icon.svg icon-512x512.png');
