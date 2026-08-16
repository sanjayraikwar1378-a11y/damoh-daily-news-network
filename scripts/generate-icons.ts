import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

// Build the exact approved Damoh Daily News Logo SVG
const svgWidth = 1024;
const svgHeight = 1024;

const baseSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024">
  <defs>
    <!-- Gradients -->
    <linearGradient id="outerRedFrame" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FF1A1A" />
      <stop offset="30%" stop-color="#D60000" />
      <stop offset="70%" stop-color="#A80000" />
      <stop offset="100%" stop-color="#660000" />
    </linearGradient>

    <linearGradient id="frameBevel" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.8" />
      <stop offset="15%" stop-color="#FFFFFF" stop-opacity="0.1" />
      <stop offset="85%" stop-color="#000000" stop-opacity="0.2" />
      <stop offset="100%" stop-color="#000000" stop-opacity="0.6" />
    </linearGradient>

    <linearGradient id="innerCardBg" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#EBF4FA" />
      <stop offset="45%" stop-color="#FFFFFF" />
      <stop offset="100%" stop-color="#F2F5F8" />
    </linearGradient>

    <linearGradient id="redBannerGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#B30000" />
      <stop offset="25%" stop-color="#E60000" />
      <stop offset="50%" stop-color="#FF2626" />
      <stop offset="75%" stop-color="#E60000" />
      <stop offset="100%" stop-color="#990000" />
    </linearGradient>

    <linearGradient id="newsRedBadge" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FF1E1E" />
      <stop offset="50%" stop-color="#D80000" />
      <stop offset="100%" stop-color="#8A0000" />
    </linearGradient>

    <linearGradient id="silverPlate" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#FFFFFF" />
      <stop offset="50%" stop-color="#F3F4F6" />
      <stop offset="100%" stop-color="#E5E7EB" />
    </linearGradient>

    <linearGradient id="goldPin" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFE600" />
      <stop offset="100%" stop-color="#E6A100" />
    </linearGradient>

    <linearGradient id="bottomCapsuleGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#800000" />
      <stop offset="50%" stop-color="#A80000" />
      <stop offset="100%" stop-color="#6E0000" />
    </linearGradient>

    <linearGradient id="micMetal" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#4A4A4A" />
      <stop offset="50%" stop-color="#1F1F1F" />
      <stop offset="100%" stop-color="#0A0A0A" />
    </linearGradient>

    <linearGradient id="palaceGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#D9A05B" />
      <stop offset="50%" stop-color="#C2843E" />
      <stop offset="100%" stop-color="#8C531B" />
    </linearGradient>

    <filter id="dropShadow" x="-10%" y="-10%" width="130%" height="130%">
      <feDropShadow dx="0" dy="8" stdDeviation="6" flood-color="#000000" flood-opacity="0.45" />
    </filter>

    <filter id="text3d" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="6" stdDeviation="2" flood-color="#550000" flood-opacity="0.9" />
      <feDropShadow dx="0" dy="10" stdDeviation="5" flood-color="#000000" flood-opacity="0.5" />
    </filter>

    <filter id="badgeShadow" x="-15%" y="-15%" width="130%" height="130%">
      <feDropShadow dx="0" dy="5" stdDeviation="4" flood-color="#000000" flood-opacity="0.35" />
    </filter>
  </defs>

  <!-- 1. Outer Container: Rounded Square with 3D Glossy Red Frame -->
  <rect x="16" y="16" width="992" height="992" rx="200" fill="url(#outerRedFrame)" />
  <rect x="16" y="16" width="992" height="992" rx="200" fill="url(#frameBevel)" />
  
  <!-- Outer metallic stroke -->
  <rect x="24" y="24" width="976" height="976" rx="192" fill="none" stroke="#FFA3A3" stroke-width="6" opacity="0.6" />
  <rect x="36" y="36" width="952" height="952" rx="180" fill="none" stroke="#4A0000" stroke-width="4" opacity="0.8" />

  <!-- 2. Inner White Content Area -->
  <rect x="48" y="48" width="928" height="928" rx="168" fill="url(#innerCardBg)" />
  
  <!-- Halftone / Dot pattern in sky area -->
  <g opacity="0.07">
    <circle cx="200" cy="120" r="3" fill="#000" /><circle cx="240" cy="120" r="3" fill="#000" /><circle cx="280" cy="120" r="3" fill="#000" /><circle cx="320" cy="120" r="3" fill="#000" />
    <circle cx="220" cy="140" r="3" fill="#000" /><circle cx="260" cy="140" r="3" fill="#000" /><circle cx="300" cy="140" r="3" fill="#000" /><circle cx="340" cy="140" r="3" fill="#000" />
    <circle cx="200" cy="160" r="3" fill="#000" /><circle cx="240" cy="160" r="3" fill="#000" /><circle cx="280" cy="160" r="3" fill="#000" /><circle cx="320" cy="160" r="3" fill="#000" />
    <circle cx="680" cy="120" r="3" fill="#000" /><circle cx="720" cy="120" r="3" fill="#000" /><circle cx="760" cy="120" r="3" fill="#000" />
    <circle cx="700" cy="140" r="3" fill="#000" /><circle cx="740" cy="140" r="3" fill="#000" /><circle cx="780" cy="140" r="3" fill="#000" />
  </g>

  <!-- ========================================== -->
  <!-- TOP SECTION: Palace (Left), MP Map (Center), Mic (Right) -->
  <!-- ========================================== -->

  <!-- Top Left: Heritage Domed Palace with trees -->
  <g transform="translate(68, 70)">
    <!-- Palace Background / Trees -->
    <path d="M10 260 Q 40 210, 80 230 Q 130 200, 180 230 Q 230 210, 270 260 Z" fill="#2E6930" opacity="0.9" />
    <path d="M30 270 Q 70 230, 120 250 Q 170 220, 220 250 Q 260 230, 290 270 Z" fill="#1B4D20" />
    
    <!-- Left Small Dome Tower -->
    <rect x="25" y="195" width="45" height="75" fill="url(#palaceGrad)" rx="2" />
    <path d="M47.5 140 C 30 160, 20 180, 25 195 H 70 C 75 180, 65 160, 47.5 140 Z" fill="#D9A05B" />
    <path d="M47.5 125 V 140 M45 128 H50" stroke="#8C531B" stroke-width="2" />
    <path d="M35 210 A 10 15 0 0 1 55 210 V 235 H 35 Z" fill="#422507" />
    <path d="M35 245 A 10 15 0 0 1 55 245 V 270 H 35 Z" fill="#422507" />

    <!-- Main Central Grand Dome -->
    <rect x="80" y="170" width="105" height="100" fill="url(#palaceGrad)" rx="3" />
    <!-- Arches on central building -->
    <path d="M92 195 A 12 18 0 0 1 116 195 V 225 H 92 Z" fill="#422507" />
    <path d="M122 195 A 12 18 0 0 1 146 195 V 225 H 122 Z" fill="#422507" />
    <path d="M152 195 A 12 18 0 0 1 176 195 V 225 H 152 Z" fill="#422507" />
    <path d="M92 238 A 12 18 0 0 1 116 238 V 268 H 92 Z" fill="#422507" />
    <path d="M122 238 A 12 18 0 0 1 146 238 V 268 H 122 Z" fill="#422507" />
    <path d="M152 238 A 12 18 0 0 1 176 238 V 268 H 152 Z" fill="#422507" />
    <!-- Central Dome Structure -->
    <path d="M132.5 70 C 95 105, 80 135, 80 170 H 185 C 185 135, 170 105, 132.5 70 Z" fill="#E5B26E" stroke="#8C531B" stroke-width="1.5" />
    <path d="M132.5 45 V 70 M128 52 H137" stroke="#8C531B" stroke-width="3" />
    <!-- Small pillars/chhatri around dome -->
    <line x1="88" y1="170" x2="88" y2="155" stroke="#C2843E" stroke-width="3" />
    <line x1="177" y1="170" x2="177" y2="155" stroke="#C2843E" stroke-width="3" />

    <!-- Right Dome Tower -->
    <rect x="195" y="195" width="55" height="75" fill="url(#palaceGrad)" rx="2" />
    <path d="M222.5 140 C 205 160, 195 180, 200 195 H 245 C 250 180, 240 160, 222.5 140 Z" fill="#D9A05B" />
    <path d="M222.5 125 V 140 M220 128 H225" stroke="#8C531B" stroke-width="2" />
    <path d="M210 210 A 10 15 0 0 1 230 210 V 235 H 210 Z" fill="#422507" />
    <path d="M210 245 A 10 15 0 0 1 230 245 V 270 H 210 Z" fill="#422507" />

    <!-- Balcony Railings -->
    <line x1="20" y1="195" x2="255" y2="195" stroke="#663B0F" stroke-width="3" />
    <line x1="80" y1="170" x2="185" y2="170" stroke="#663B0F" stroke-width="3" />
  </g>

  <!-- Top Center: Madhya Pradesh Map Silhouette + Yellow Pin + Damoh -->
  <g transform="translate(325, 60)" filter="url(#dropShadow)">
    <!-- MP State Map Path (Stylized accurate shape) -->
    <path d="M 185 10 
             C 210 25, 230 15, 250 35 
             C 280 40, 310 30, 335 55 
             C 365 75, 380 110, 395 130 
             C 410 150, 400 180, 375 195 
             C 360 210, 350 230, 330 240 
             C 300 255, 270 245, 250 265 
             C 230 280, 190 285, 170 270 
             C 145 255, 125 260, 95 245 
             C 65 230, 45 200, 20 190 
             C 5 170, 10 140, 30 120 
             C 45 105, 55 80, 75 65 
             C 95 50, 125 60, 150 40 
             Z" 
          fill="#D60000" 
          stroke="#FFFFFF" 
          stroke-width="5" />
    
    <!-- Inner subtle contour on MP map -->
    <path d="M 185 25 C 240 40, 310 50, 360 110 C 375 145, 350 190, 320 225 C 240 250, 150 240, 60 170 C 50 120, 100 70, 185 25 Z" 
          fill="#E60000" opacity="0.6" />

    <!-- Yellow Location Pin -->
    <g transform="translate(195, 80)" filter="url(#badgeShadow)">
      <!-- Teardrop pin -->
      <path d="M 28 0 C 12.5 0, 0 12.5, 0 28 C 0 49, 28 82, 28 82 C 28 82, 56 49, 56 28 C 56 12.5, 43.5 0, 28 0 Z" fill="url(#goldPin)" stroke="#B37D00" stroke-width="2" />
      <!-- Pin Center Dot -->
      <circle cx="28" cy="28" r="11" fill="#1F1F1F" />
      
      <!-- DAMOH text pill connected to pin -->
      <rect x="52" y="10" width="125" height="36" rx="18" fill="#0A0A0A" stroke="#FFDE00" stroke-width="2" />
      <text x="114" y="35" font-family="'Arial Black', Impact, sans-serif" font-weight="900" font-size="20" fill="#FFFFFF" text-anchor="middle" letter-spacing="1">DAMOH</text>
    </g>

    <!-- "MADHYA PRADESH" on the map -->
    <text x="210" y="210" font-family="'Arial Black', sans-serif" font-weight="900" font-size="18" fill="#FFFFFF" text-anchor="middle" letter-spacing="2" filter="url(#badgeShadow)">MADHYA PRADESH</text>
  </g>

  <!-- Top Right: 3D Television News Microphone -->
  <g transform="translate(710, 80)" filter="url(#dropShadow)">
    <!-- Mic Body Handle -->
    <path d="M 120 230 L 220 370 L 190 390 L 90 250 Z" fill="url(#micMetal)" stroke="#111" stroke-width="2" />
    <path d="M 118 235 L 210 365" stroke="#666" stroke-width="4" opacity="0.6" />
    
    <!-- Red Cube Mic Flag with "NEWS" -->
    <g transform="translate(50, 110) rotate(-18)">
      <!-- 3D Box Faces -->
      <!-- Front Face -->
      <polygon points="20,40 180,30 170,140 10,150" fill="url(#newsRedBadge)" stroke="#FFFFFF" stroke-width="4" />
      <!-- Top Face -->
      <polygon points="20,40 80,0 240,-10 180,30" fill="#FF5252" stroke="#FFFFFF" stroke-width="3" />
      <!-- Right Side Face -->
      <polygon points="180,30 240,-10 230,100 170,140" fill="#800000" stroke="#FFFFFF" stroke-width="3" />
      <!-- "NEWS" text on mic cube -->
      <text x="95" y="112" font-family="'Arial Black', Impact, sans-serif" font-weight="900" font-size="52" fill="#FFFFFF" text-anchor="middle" letter-spacing="2" transform="rotate(-3, 95, 112)">NEWS</text>
    </g>

    <!-- Microphone Grill Head (Metallic Dome) -->
    <g transform="translate(115, 60) rotate(-22)">
      <!-- Base cylinder -->
      <rect x="-35" y="20" width="70" height="30" rx="6" fill="#111" stroke="#888" stroke-width="2" />
      <!-- Mesh Sphere / Dome -->
      <ellipse cx="0" cy="0" rx="42" ry="52" fill="url(#micMetal)" stroke="#CCCCCC" stroke-width="3" />
      <!-- Silver center band ring -->
      <rect x="-42" y="-5" width="84" height="10" rx="3" fill="#E5E7EB" stroke="#666" stroke-width="1.5" />
      <!-- Mesh Texture grid -->
      <line x1="-30" y1="-25" x2="30" y2="25" stroke="#666" stroke-width="1.5" opacity="0.5" />
      <line x1="30" y1="-25" x2="-30" y2="25" stroke="#666" stroke-width="1.5" opacity="0.5" />
      <line x1="-38" y1="0" x2="38" y2="0" stroke="#666" stroke-width="1.5" opacity="0.5" />
    </g>
  </g>

  <!-- ========================================== -->
  <!-- MIDDLE SECTION: Big "DAMOH" + "DAILY NEWS" -->
  <!-- ========================================== -->

  <!-- Red Glossy Background Plate behind "DAMOH" -->
  <g transform="translate(50, 400)" filter="url(#dropShadow)">
    <!-- Main Red Plaque -->
    <path d="M 40 0 L 884 0 C 905 0, 924 18, 924 40 L 924 165 C 924 185, 905 200, 884 200 L 40 200 C 18 200, 0 185, 0 165 L 0 40 C 0 18, 18 0, 40 0 Z" fill="url(#redBannerGrad)" />
    <!-- Metallic upper & lower borders -->
    <path d="M 0 35 L 924 35" stroke="#FF9999" stroke-width="4" opacity="0.7" />
    <path d="M 0 170 L 924 170" stroke="#660000" stroke-width="5" />
  </g>

  <!-- 3D "DAMOH" Big Headline Typography -->
  <g transform="translate(512, 555)" filter="url(#text3d)">
    <!-- 3D extruded back layer -->
    <text x="0" y="8" font-family="'Arial Black', Impact, 'Trebuchet MS', sans-serif" font-weight="900" font-size="195" fill="#660000" text-anchor="middle" letter-spacing="10">DAMOH</text>
    <!-- 3D extruded middle layer -->
    <text x="0" y="4" font-family="'Arial Black', Impact, 'Trebuchet MS', sans-serif" font-weight="900" font-size="195" fill="#A80000" text-anchor="middle" letter-spacing="10">DAMOH</text>
    <!-- Crisp Top 3D White Layer -->
    <text x="0" y="0" font-family="'Arial Black', Impact, 'Trebuchet MS', sans-serif" font-weight="900" font-size="195" fill="#FFFFFF" stroke="#F0F0F0" stroke-width="4" text-anchor="middle" letter-spacing="10">DAMOH</text>
  </g>

  <!-- "DAILY NEWS" Plate -->
  <g transform="translate(68, 580)" filter="url(#dropShadow)">
    <!-- Base Silver/White Plaque -->
    <path d="M 30 0 L 828 0 C 845 0, 858 12, 858 30 L 840 120 C 840 135, 825 145, 810 145 L 30 145 C 12 145, 0 132, 0 115 L 0 30 C 0 12, 12 0, 30 0 Z" fill="url(#silverPlate)" stroke="#D1D5DB" stroke-width="4" />
    
    <!-- "DAILY" in Bold Black -->
    <text x="240" y="102" font-family="'Arial Black', Impact, sans-serif" font-weight="900" font-size="108" fill="#111827" text-anchor="middle" letter-spacing="4">DAILY</text>

    <!-- Red Slanted Trapezoid "NEWS" Badge -->
    <g transform="translate(460, 5)" filter="url(#badgeShadow)">
      <polygon points="35,0 410,0 380,135 0,135" fill="url(#newsRedBadge)" stroke="#FFFFFF" stroke-width="5" />
      <!-- Red badge gloss line -->
      <polygon points="45,10 395,10 385,55 20,55" fill="#FFFFFF" opacity="0.25" />
      <!-- "NEWS" bold white text -->
      <text x="200" y="98" font-family="'Arial Black', Impact, sans-serif" font-weight="900" font-size="108" fill="#FFFFFF" text-anchor="middle" letter-spacing="4">NEWS</text>
    </g>
  </g>

  <!-- ========================================== -->
  <!-- "NETWORK" with Red Flanking Lines -->
  <!-- ========================================== -->
  <g transform="translate(512, 755)">
    <!-- Left Red Line (Triple Bar) -->
    <line x1="-390" y1="-12" x2="-180" y2="-12" stroke="#D60000" stroke-width="8" stroke-linecap="round" />
    <line x1="-370" y1="2" x2="-190" y2="2" stroke="#D60000" stroke-width="6" stroke-linecap="round" />

    <!-- Center "NETWORK" Text -->
    <text x="0" y="4" font-family="'Arial Black', sans-serif" font-weight="900" font-size="44" fill="#111827" text-anchor="middle" letter-spacing="14">NETWORK</text>

    <!-- Right Red Line (Triple Bar) -->
    <line x1="180" y1="-12" x2="390" y2="-12" stroke="#D60000" stroke-width="8" stroke-linecap="round" />
    <line x1="190" y1="2" x2="370" y2="2" stroke="#D60000" stroke-width="6" stroke-linecap="round" />
  </g>

  <!-- ========================================== -->
  <!-- HINDI TAGLINE: "आपका शहर • आपकी खबर" -->
  <!-- ========================================== -->
  <g transform="translate(512, 825)">
    <text x="0" y="0" font-family="'Noto Sans Devanagari', 'Segoe UI', Arial, sans-serif" font-weight="800" font-size="48" fill="#111827" text-anchor="middle" letter-spacing="1">
      आपका शहर <tspan fill="#D60000" font-size="52">•</tspan> आपकी खबर
    </text>
  </g>

  <!-- ========================================== -->
  <!-- BOTTOM PILL BANNER: "DAMOH | MADHYA PRADESH (MP)" -->
  <!-- ========================================== -->
  <g transform="translate(100, 860)" filter="url(#dropShadow)">
    <!-- Red Capsule Pill -->
    <rect x="0" y="0" width="824" height="85" rx="42" fill="url(#bottomCapsuleGrad)" stroke="#FFA3A3" stroke-width="3" />
    
    <!-- White Map Pin Icon -->
    <g transform="translate(45, 18)">
      <path d="M 18 0 C 8 0, 0 8, 0 18 C 0 32, 18 48, 18 48 C 18 48, 36 32, 36 18 C 36 8, 28 0, 18 0 Z" fill="#FFFFFF" />
      <circle cx="18" cy="18" r="7" fill="#800000" />
    </g>

    <!-- Location Text -->
    <text x="95" y="54" font-family="'Arial Black', sans-serif" font-weight="900" font-size="34" fill="#FFFFFF" letter-spacing="1">
      DAMOH <tspan fill="#E5E7EB" font-weight="400">|</tspan> MADHYA PRADESH <tspan fill="#FFDE00">(MP)</tspan>
    </text>

    <!-- MP Map Badge on Far Right -->
    <g transform="translate(685, 6)">
      <!-- White MP Map silhouette background -->
      <path d="M 45 4 C 55 10, 65 6, 75 16 C 85 20, 95 16, 100 26 C 105 36, 95 50, 85 58 C 75 64, 60 70, 45 66 C 30 62, 15 58, 6 48 C 0 38, 4 28, 14 20 C 22 14, 32 18, 45 4 Z" fill="#FFFFFF" stroke="#FFD1D1" stroke-width="2" filter="url(#badgeShadow)" />
      <!-- Red "MP" text inside map -->
      <text x="54" y="46" font-family="'Arial Black', Impact, sans-serif" font-weight="900" font-size="28" fill="#C80000" text-anchor="middle" letter-spacing="1">MP</text>
    </g>
  </g>
</svg>
`;

// Maskable Icon SVG (Contains safe area padding ~15% on all sides so Android round/squircle mask does not clip)
const maskableSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024">
  <!-- Solid background for maskable canvas filling edge to edge -->
  <rect width="1024" height="1024" fill="#990000" />
  
  <!-- Scaled down logo centered in safe zone (80% scale) -->
  <g transform="translate(102.4, 102.4) scale(0.8)">
    ${baseSvg.replace(/<\?xml.*?\?>/, '').replace(/<svg[^>]*>/, '').replace(/<\/svg>/, '')}
  </g>
</svg>
`;

async function generateAssets() {
  const publicDir = path.join(process.cwd(), 'public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  // 1. Write the high-resolution vector SVG
  fs.writeFileSync(path.join(publicDir, 'icon.svg'), baseSvg.trim());
  console.log('Created icon.svg');

  // 2. Generate standard sizes using Sharp
  const svgBuffer = Buffer.from(baseSvg);
  const maskableBuffer = Buffer.from(maskableSvg);

  // 512x512 PNG
  await sharp(svgBuffer)
    .resize(512, 512)
    .png({ quality: 100, compressionLevel: 9 })
    .toFile(path.join(publicDir, 'icon-512.png'));
  console.log('Created icon-512.png');

  // 192x192 PNG
  await sharp(svgBuffer)
    .resize(192, 192)
    .png({ quality: 100, compressionLevel: 9 })
    .toFile(path.join(publicDir, 'icon-192.png'));
  console.log('Created icon-192.png');

  // 180x180 Apple Touch Icon
  await sharp(svgBuffer)
    .resize(180, 180)
    .png({ quality: 100, compressionLevel: 9 })
    .toFile(path.join(publicDir, 'apple-touch-icon.png'));
  console.log('Created apple-touch-icon.png');

  // 48x48 Favicon PNG
  await sharp(svgBuffer)
    .resize(48, 48)
    .png({ quality: 100 })
    .toFile(path.join(publicDir, 'favicon-48x48.png'));
  console.log('Created favicon-48x48.png');

  // 32x32 Favicon PNG
  await sharp(svgBuffer)
    .resize(32, 32)
    .png({ quality: 100 })
    .toFile(path.join(publicDir, 'favicon-32x32.png'));
  console.log('Created favicon-32x32.png');

  // 16x16 Favicon PNG
  await sharp(svgBuffer)
    .resize(16, 16)
    .png({ quality: 100 })
    .toFile(path.join(publicDir, 'favicon-16x16.png'));
  console.log('Created favicon-16x16.png');

  // Standard favicon.png
  await sharp(svgBuffer)
    .resize(48, 48)
    .png({ quality: 100 })
    .toFile(path.join(publicDir, 'favicon.png'));
  console.log('Created favicon.png');

  // 512x512 Maskable Icon
  await sharp(maskableBuffer)
    .resize(512, 512)
    .png({ quality: 100, compressionLevel: 9 })
    .toFile(path.join(publicDir, 'icon-512-maskable.png'));
  console.log('Created icon-512-maskable.png');

  // 192x192 Maskable Icon
  await sharp(maskableBuffer)
    .resize(192, 192)
    .png({ quality: 100, compressionLevel: 9 })
    .toFile(path.join(publicDir, 'icon-192-maskable.png'));
  console.log('Created icon-192-maskable.png');

  console.log('All PWA & Favicon assets generated successfully!');
}

generateAssets().catch(err => {
  console.error('Error generating assets:', err);
  process.exit(1);
});
