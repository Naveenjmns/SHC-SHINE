const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const iconsDir = path.join(__dirname, "../public/icons");
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Generate SVG string for the icon
function createSvgIcon(size, isMaskable = false) {
  const padding = isMaskable ? size * 0.15 : size * 0.05;
  const contentSize = size - padding * 2;
  const rx = isMaskable ? 0 : size * 0.22; // square for maskable, squircle for standard

  return `
  <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="shineGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#1C1917" />
        <stop offset="30%" stop-color="#FF6B1A" />
        <stop offset="70%" stop-color="#E8551F" />
        <stop offset="100%" stop-color="#D9A441" />
      </linearGradient>
      <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#FFFFFF" />
        <stop offset="100%" stop-color="#FEF3C7" />
      </linearGradient>
      <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="${size * 0.02}" stdDeviation="${size * 0.03}" flood-color="#FF6B1A" flood-opacity="0.4" />
      </filter>
    </defs>

    <!-- Background Base -->
    <rect width="${size}" height="${size}" fill="#FAF8F5" />

    <!-- Gradient Squircle -->
    <rect x="${padding}" y="${padding}" width="${contentSize}" height="${contentSize}" rx="${rx}" fill="url(#shineGrad)" filter="url(#glow)" />

    <!-- Inner Border Ring -->
    <rect x="${padding + 2}" y="${padding + 2}" width="${contentSize - 4}" height="${contentSize - 4}" rx="${Math.max(0, rx - 2)}" fill="none" stroke="#FFFFFF" stroke-opacity="0.25" stroke-width="${size * 0.01}" />

    <!-- Center 'S' Wordmark Glyph -->
    <text x="${size * 0.46}" y="${size * 0.63}" font-family="'Outfit', 'Inter', -apple-system, sans-serif" font-weight="900" font-size="${size * 0.44}" fill="url(#goldGrad)" text-anchor="middle" letter-spacing="-0.03em">
      S
    </text>

    <!-- '26' Accent Badge -->
    <text x="${size * 0.72}" y="${size * 0.42}" font-family="'Outfit', 'Inter', -apple-system, sans-serif" font-weight="900" font-size="${size * 0.16}" fill="#FFFFFF" text-anchor="middle">
      26
    </text>

    <!-- Sparkle Star Accent -->
    <path d="M ${size * 0.75} ${size * 0.66} Q ${size * 0.75} ${size * 0.72} ${size * 0.81} ${size * 0.72} Q ${size * 0.75} ${size * 0.72} ${size * 0.75} ${size * 0.78} Q ${size * 0.75} ${size * 0.72} ${size * 0.69} ${size * 0.72} Q ${size * 0.75} ${size * 0.72} ${size * 0.75} ${size * 0.66} Z" fill="#FDE68A" />
  </svg>
  `;
}

async function run() {
  const sizes = [
    { name: "icon-192x192.png", size: 192, maskable: false },
    { name: "icon-512x512.png", size: 512, maskable: false },
    { name: "icon-maskable-192x192.png", size: 192, maskable: true },
    { name: "icon-maskable-512x512.png", size: 512, maskable: true },
    { name: "apple-touch-icon.png", size: 180, maskable: false },
    { name: "favicon-32x32.png", size: 32, maskable: false },
    { name: "favicon-16x16.png", size: 16, maskable: false },
  ];

  // Save base SVG
  const masterSvg = createSvgIcon(512, false);
  fs.writeFileSync(path.join(iconsDir, "icon.svg"), masterSvg);

  for (const { name, size, maskable } of sizes) {
    const svg = createSvgIcon(size, maskable);
    const dest = path.join(iconsDir, name);
    await sharp(Buffer.from(svg)).png().toFile(dest);
    console.log(`Generated: ${name} (${size}x${size})`);
  }

  // Also copy apple-touch-icon to public root for default crawlers
  fs.copyFileSync(
    path.join(iconsDir, "apple-touch-icon.png"),
    path.join(__dirname, "../public/apple-touch-icon.png")
  );
  console.log("PWA Icons generated successfully!");
}

run().catch(console.error);
