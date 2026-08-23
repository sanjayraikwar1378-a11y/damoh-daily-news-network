import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import toIco from 'to-ico';
import { execSync } from 'child_process';

/**
 * Official Damoh Daily News Network 3D Emblem Vector Logo
 * Precision crafted to exactly match the uploaded official logo:
 * - 3D Crimson Red "DAMOH" + 3D Silver "DAILY"
 * - High-detail spherical globe with world continents & satellite dish
 * - Red quill feather pen with metallic nib
 * - Crimson woodgrain shield with multi-tier chrome bevel border
 * - "NEWS NETWORK" silver block text on bottom plate
 * - Dark backdrop matching original asset
 */
export const officialLogoSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 512" width="1024" height="512">
  <defs>
    <!-- Background Vignette -->
    <radialGradient id="darkBackdrop" cx="50%" cy="50%" r="70%">
      <stop offset="0%" stop-color="#0a0a0a" />
      <stop offset="70%" stop-color="#000000" />
      <stop offset="100%" stop-color="#000000" />
    </radialGradient>

    <!-- Chrome Metallic Rim Gradients -->
    <linearGradient id="chromeBevelTop" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#FFFFFF" />
      <stop offset="18%" stop-color="#E2E8F0" />
      <stop offset="42%" stop-color="#94A3B8" />
      <stop offset="50%" stop-color="#475569" />
      <stop offset="75%" stop-color="#CBD5E1" />
      <stop offset="90%" stop-color="#F8FAFC" />
      <stop offset="100%" stop-color="#334155" />
    </linearGradient>

    <linearGradient id="chromeBevelAngle" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFFFFF" />
      <stop offset="25%" stop-color="#CBD5E1" />
      <stop offset="50%" stop-color="#64748B" />
      <stop offset="75%" stop-color="#CBD5E1" />
      <stop offset="100%" stop-color="#1E293B" />
    </linearGradient>

    <!-- Crimson Shield Woodgrain Texture Gradient -->
    <linearGradient id="crimsonWoodGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#800A10" />
      <stop offset="20%" stop-color="#A5101A" />
      <stop offset="45%" stop-color="#6E080E" />
      <stop offset="70%" stop-color="#50050A" />
      <stop offset="90%" stop-color="#380306" />
      <stop offset="100%" stop-color="#240204" />
    </linearGradient>

    <!-- Globe Sphere Shading -->
    <radialGradient id="globeSphere" cx="42%" cy="38%" r="58%">
      <stop offset="0%" stop-color="#FFFFFF" />
      <stop offset="30%" stop-color="#E2E8F0" />
      <stop offset="60%" stop-color="#94A3B8" />
      <stop offset="85%" stop-color="#475569" />
      <stop offset="100%" stop-color="#1E293B" />
    </radialGradient>

    <!-- 3D Red DAMOH Text Gradient -->
    <linearGradient id="redTextGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#FF4D5E" />
      <stop offset="25%" stop-color="#E6192A" />
      <stop offset="55%" stop-color="#B30F1D" />
      <stop offset="80%" stop-color="#7A0811" />
      <stop offset="100%" stop-color="#4D0308" />
    </linearGradient>

    <!-- 3D Silver DAILY & NEWS NETWORK Gradient -->
    <linearGradient id="silverTextGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#FFFFFF" />
      <stop offset="22%" stop-color="#F1F5F9" />
      <stop offset="48%" stop-color="#E2E8F0" />
      <stop offset="52%" stop-color="#94A3B8" />
      <stop offset="78%" stop-color="#CBD5E1" />
      <stop offset="100%" stop-color="#F8FAFC" />
    </linearGradient>

    <!-- Quill Feather Gradient -->
    <linearGradient id="quillGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FF3849" />
      <stop offset="35%" stop-color="#D61324" />
      <stop offset="75%" stop-color="#7A0812" />
      <stop offset="100%" stop-color="#3D0206" />
    </linearGradient>

    <!-- 3D Depth Shadows -->
    <filter id="shieldShadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="10" stdDeviation="12" flood-color="#000000" flood-opacity="0.9" />
    </filter>

    <filter id="textPopShadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="4" stdDeviation="3" flood-color="#000000" flood-opacity="0.85" />
    </filter>
  </defs>

  <!-- Background Base: Fully transparent with no black box -->

  <g filter="url(#shieldShadow)">

    <!-- ======================================================== -->
    <!-- 1. TOP CIRCULAR ARCH & GLOBE CASING                      -->
    <!-- ======================================================== -->
    <!-- Outer Arch -->
    <path d="M 330 180 C 330 50, 694 50, 694 180 Z" fill="url(#chromeBevelTop)" stroke="#0F172A" stroke-width="2" />
    <path d="M 340 180 C 340 64, 684 64, 684 180 Z" fill="#1C0204" />
    <path d="M 348 180 C 348 76, 676 76, 676 180 Z" fill="url(#crimsonWoodGrad)" />
    
    <!-- Chrome Inner Arch Rings -->
    <circle cx="512" cy="180" r="160" fill="none" stroke="url(#chromeBevelTop)" stroke-width="14" />
    <circle cx="512" cy="180" r="148" fill="none" stroke="#1E293B" stroke-width="3" />

    <!-- ======================================================== -->
    <!-- 2. GLOBE WITH WORLD CONTINENTS & LAT/LONG COORDINATES    -->
    <!-- ======================================================== -->
    <g transform="translate(512, 180)">
      <!-- Globe Shaded Sphere -->
      <circle cx="0" cy="0" r="144" fill="url(#globeSphere)" />
      
      <!-- Coordinate Grid Lines -->
      <ellipse cx="0" cy="0" rx="144" ry="42" fill="none" stroke="#64748B" stroke-width="1.8" opacity="0.6" />
      <ellipse cx="0" cy="-55" rx="133" ry="28" fill="none" stroke="#64748B" stroke-width="1.5" opacity="0.5" />
      <ellipse cx="0" cy="55" rx="133" ry="28" fill="none" stroke="#64748B" stroke-width="1.5" opacity="0.5" />
      
      <ellipse cx="0" cy="0" rx="46" ry="144" fill="none" stroke="#64748B" stroke-width="1.8" opacity="0.6" />
      <ellipse cx="0" cy="0" rx="96" ry="144" fill="none" stroke="#64748B" stroke-width="1.8" opacity="0.5" />
      <line x1="-144" y1="0" x2="144" y2="0" stroke="#64748B" stroke-width="2" opacity="0.7" />
      <line x1="0" y1="-144" x2="0" y2="144" stroke="#64748B" stroke-width="2" opacity="0.7" />

      <!-- World Continents (White / Silver Embossed) -->
      <!-- Eurasia & India -->
      <path d="M 10 -70 C 25 -80, 50 -75, 75 -55 C 98 -35, 88 -8, 65 8 C 48 18, 22 22, 12 38 C 6 46, -8 28, -4 14 C 0 -12, -22 -26, -12 -48 C -2 -62, -6 -65, 10 -70 Z" fill="#FFFFFF" opacity="0.8" />
      <!-- Africa / Middle East -->
      <path d="M -28 -18 C -12 -22, 2 -12, -4 12 C -8 32, -4 62, -18 82 C -32 92, -42 72, -38 42 C -42 16, -38 -8, -28 -18 Z" fill="#FFFFFF" opacity="0.8" />
      <!-- North & South America -->
      <path d="M -115 -62 C -92 -56, -82 -32, -96 -12 C -112 4, -86 32, -92 62 C -102 82, -116 66, -112 42 C -106 22, -126 -4, -120 -42 Z" fill="#FFFFFF" opacity="0.75" />
      <!-- Australia & Pacific -->
      <path d="M 86 46 C 106 42, 116 62, 102 76 C 82 82, 76 62, 86 46 Z" fill="#FFFFFF" opacity="0.8" />
      
      <!-- Outer Globe Specular Rim -->
      <circle cx="0" cy="0" r="144" fill="none" stroke="#FFFFFF" stroke-width="3.5" opacity="0.85" />
    </g>

    <!-- ======================================================== -->
    <!-- 3. SATELLITE DISH (TOP RIGHT AT ~2 O'CLOCK)              -->
    <!-- ======================================================== -->
    <g transform="translate(605, 68) rotate(16)">
      <!-- Mount Strut -->
      <line x1="0" y1="26" x2="0" y2="46" stroke="#CBD5E1" stroke-width="4.5" />
      <circle cx="0" cy="46" r="4.5" fill="#475569" />
      <!-- Parabolic Dish -->
      <path d="M -28 14 C -22 -16, 22 -16, 28 14 C 16 18, -16 18, -28 14 Z" fill="url(#chromeBevelTop)" stroke="#0F172A" stroke-width="1.5" />
      <!-- Feed Horn & Red Indicator Tip -->
      <line x1="0" y1="4" x2="0" y2="-14" stroke="#FFFFFF" stroke-width="3" />
      <circle cx="0" cy="-14" r="4" fill="#EF4444" stroke="#FFFFFF" stroke-width="1" />
      <line x1="-18" y1="10" x2="0" y2="-14" stroke="#94A3B8" stroke-width="1.2" />
      <line x1="18" y1="10" x2="0" y2="-14" stroke="#94A3B8" stroke-width="1.2" />
    </g>

    <!-- ======================================================== -->
    <!-- 4. 3D EMBOSSED RED 'D' MONOGRAM (CENTER GLOBE)           -->
    <!-- ======================================================== -->
    <g transform="translate(512, 174)" filter="url(#textPopShadow)">
      <!-- 'D' Shadow / Bevel Base -->
      <path d="M -92 -66 L -10 -66 C 46 -66, 82 -36, 82 0 C 82 36, 46 66, -10 66 L -92 66 Z" fill="#240204" />
      <!-- 'D' Crimson Face Plate -->
      <path d="M -88 -62 L -12 -62 C 42 -62, 76 -32, 76 0 C 76 32, 42 62, -12 62 L -88 62 Z" fill="url(#crimsonWoodGrad)" stroke="#FFA3A3" stroke-width="2.5" />
      <!-- 'D' Inner Cutout -->
      <path d="M -62 -36 L -16 -36 C 18 -36, 44 -18, 44 0 C 44 18, 18 36, -16 36 L -62 36 Z" fill="#1C0204" stroke="#FFA3A3" stroke-width="2" />
      <!-- Top Chrome Highlight -->
      <path d="M -88 -62 L 0 -62 C 44 -62, 76 -30, 76 0" fill="none" stroke="#FFFFFF" stroke-width="3.5" opacity="0.9" />
    </g>

    <!-- ======================================================== -->
    <!-- 5. CRIMSON QUILL FEATHER PEN                             -->
    <!-- ======================================================== -->
    <g transform="translate(585, 94) rotate(-32)" filter="url(#textPopShadow)">
      <!-- Feather Body -->
      <path d="M 0 -72 C 20 -46, 28 12, 0 102 C -28 12, -20 -46, 0 -72 Z" fill="url(#quillGrad)" stroke="#3D0206" stroke-width="2" />
      <!-- Feather Details -->
      <path d="M 0 -62 C 14 -36, 20 10, 0 82 C -20 10, -14 -36, 0 -62 Z" fill="none" stroke="#FFA3A3" stroke-width="1.5" opacity="0.6" />
      <!-- Shaft / Quill Rachis -->
      <line x1="0" y1="-76" x2="0" y2="122" stroke="#FFFFFF" stroke-width="3" />
      <!-- Chrome Pen Nib -->
      <path d="M -6 112 L 6 112 L 0 134 Z" fill="url(#chromeBevelTop)" stroke="#1E293B" stroke-width="1" />
      <line x1="0" y1="112" x2="0" y2="130" stroke="#0F172A" stroke-width="1" />
    </g>

    <!-- ======================================================== -->
    <!-- 6. HORIZONTAL SHIELD / PLAQUE STRUCTURE                  -->
    <!-- ======================================================== -->
    <!-- Outer Heavy Chrome Beveled Shield -->
    <path d="M 68 185 
             L 320 185 
             C 335 155, 365 140, 400 140 
             L 624 140 
             C 659 140, 689 155, 704 185 
             L 956 185 
             C 972 185, 984 198, 984 214 
             L 984 390 
             C 984 406, 972 418, 956 418 
             L 590 418 
             L 512 458 
             L 434 418 
             L 68 418 
             C 52 418, 40 406, 40 390 
             L 40 214 
             C 40 198, 52 185, 68 185 Z" 
          fill="url(#chromeBevelTop)" 
          stroke="#0F172A" 
          stroke-width="3.5" />

    <!-- Dark Inner Recess Groove -->
    <path d="M 74 192 
             L 322 192 
             C 338 162, 368 147, 402 147 
             L 622 147 
             C 656 147, 686 162, 702 192 
             L 950 192 
             C 962 192, 972 202, 972 214 
             L 972 384 
             C 972 396, 962 406, 950 406 
             L 585 406 
             L 512 444 
             L 439 406 
             L 74 406 
             C 62 406, 52 396, 52 384 
             L 52 214 
             C 52 202, 62 192, 74 192 Z" 
          fill="#1A0204" />

    <!-- Crimson Woodgrain Front Plaque -->
    <path d="M 80 198 
             L 324 198 
             C 340 170, 370 154, 404 154 
             L 620 154 
             C 654 154, 684 170, 700 198 
             L 944 198 
             C 954 198, 962 206, 962 216 
             L 962 378 
             C 962 388, 954 396, 944 396 
             L 580 396 
             L 512 432 
             L 444 396 
             L 80 396 
             C 70 396, 62 388, 62 378 
             L 62 216 
             C 62 206, 70 198, 80 198 Z" 
          fill="url(#crimsonWoodGrad)" />

    <!-- Woodgrain Grain Lines -->
    <g opacity="0.16" stroke="#000000" stroke-width="1.5">
      <line x1="70" y1="215" x2="950" y2="215" />
      <line x1="70" y1="235" x2="950" y2="235" />
      <line x1="70" y1="255" x2="950" y2="255" />
      <line x1="70" y1="275" x2="950" y2="275" />
      <line x1="70" y1="295" x2="950" y2="295" />
      <line x1="70" y1="315" x2="950" y2="315" />
      <line x1="70" y1="335" x2="950" y2="335" />
      <line x1="70" y1="355" x2="950" y2="355" />
      <line x1="70" y1="375" x2="950" y2="375" />
    </g>

    <!-- Top Metallic Edge Reflection Highlight -->
    <line x1="82" y1="200" x2="942" y2="200" stroke="#FFA3A3" stroke-width="2" opacity="0.6" />

    <!-- Horizontal Chrome Divider Bar -->
    <g filter="url(#textPopShadow)">
      <polygon points="90,328 934,328 920,344 104,344" fill="url(#chromeBevelTop)" stroke="#475569" stroke-width="1.5" />
      <polygon points="95,330 929,330 923,334 101,334" fill="#FFFFFF" opacity="0.9" />
    </g>

    <!-- 7. 3D CHISELED TYPOGRAPHY: DAMOH (3D RED) + DAILY (3D SILVER) -->
    <g transform="translate(512, 298)">
      
      <!-- DAMOH (3D RED) -->
      <!-- Red 3D Extrusion Shadows -->
      <text x="-15" y="7" font-family="'Arial Black', 'Impact', sans-serif" font-weight="900" font-size="112" fill="#240204" text-anchor="end" letter-spacing="3">DAMOH</text>
      <text x="-15" y="4" font-family="'Arial Black', 'Impact', sans-serif" font-weight="900" font-size="112" fill="#4D0308" text-anchor="end" letter-spacing="3">DAMOH</text>
      <text x="-15" y="2" font-family="'Arial Black', 'Impact', sans-serif" font-weight="900" font-size="112" fill="#7A0811" text-anchor="end" letter-spacing="3">DAMOH</text>
      
      <!-- Red 3D Front Face -->
      <text x="-15" y="0" font-family="'Arial Black', 'Impact', sans-serif" font-weight="900" font-size="112" fill="url(#redTextGrad)" stroke="#FFA3A3" stroke-width="1.8" text-anchor="end" letter-spacing="3">DAMOH</text>
      <!-- Red Top White Reflection -->
      <text x="-15" y="-1" font-family="'Arial Black', 'Impact', sans-serif" font-weight="900" font-size="112" fill="none" stroke="#FFFFFF" stroke-width="1" opacity="0.8" text-anchor="end" letter-spacing="3">DAMOH</text>


      <!-- DAILY (3D SILVER / WHITE) -->
      <!-- Silver 3D Extrusion Shadows -->
      <text x="15" y="7" font-family="'Arial Black', 'Impact', sans-serif" font-weight="900" font-size="112" fill="#1C0204" text-anchor="start" letter-spacing="3">DAILY</text>
      <text x="15" y="4" font-family="'Arial Black', 'Impact', sans-serif" font-weight="900" font-size="112" fill="#475569" text-anchor="start" letter-spacing="3">DAILY</text>
      <text x="15" y="2" font-family="'Arial Black', 'Impact', sans-serif" font-weight="900" font-size="112" fill="#64748B" text-anchor="start" letter-spacing="3">DAILY</text>
      
      <!-- Silver 3D Front Face -->
      <text x="15" y="0" font-family="'Arial Black', 'Impact', sans-serif" font-weight="900" font-size="112" fill="url(#silverTextGrad)" stroke="#FFFFFF" stroke-width="2" text-anchor="start" letter-spacing="3">DAILY</text>
      <!-- Silver Top White Reflection -->
      <text x="15" y="-1" font-family="'Arial Black', 'Impact', sans-serif" font-weight="900" font-size="112" fill="none" stroke="#FFFFFF" stroke-width="1.2" opacity="0.9" text-anchor="start" letter-spacing="3">DAILY</text>

    </g>

    <!-- ======================================================== -->
    <!-- 8. "NEWS NETWORK" SILVER BLOCK TEXT (LOWER RIBBON)       -->
    <!-- ======================================================== -->
    <g transform="translate(512, 400)" filter="url(#textPopShadow)">
      <!-- 3D Shadow -->
      <text x="0" y="4" font-family="'Arial Black', 'Impact', sans-serif" font-weight="900" font-size="54" fill="#1A0204" text-anchor="middle" letter-spacing="12">NEWS NETWORK</text>
      <!-- Silver Front Face -->
      <text x="0" y="0" font-family="'Arial Black', 'Impact', sans-serif" font-weight="900" font-size="54" fill="url(#silverTextGrad)" stroke="#FFFFFF" stroke-width="1.2" text-anchor="middle" letter-spacing="12">NEWS NETWORK</text>
    </g>

  </g>
</svg>
`;

/**
 * 1024x1024 High-Resolution Master Square App Icon & Favicon SVG
 * Centers the official Damoh Daily News core emblem:
 * - 3D Crimson & Chrome Arch/Shield Frame
 * - High-Contrast 3D Spherical Silver Globe with Latitude/Longitude & Continents
 * - Iconic 3D Crimson Red 'D' Monogram in Center
 * - Crimson Quill Feather with Silver Spine & Nib
 * - Satellite Dish with Red Indicator Light
 * Optimized for ultra-sharp clarity from 1024x1024 down to 16x16.
 */
export const officialMasterIconSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024">
  <defs>
    <!-- Multi-stop Chrome Bevel Gradients -->
    <linearGradient id="iconChromeOuter" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFFFFF" />
      <stop offset="18%" stop-color="#E2E8F0" />
      <stop offset="38%" stop-color="#94A3B8" />
      <stop offset="50%" stop-color="#475569" />
      <stop offset="68%" stop-color="#CBD5E1" />
      <stop offset="88%" stop-color="#F8FAFC" />
      <stop offset="100%" stop-color="#1E293B" />
    </linearGradient>

    <linearGradient id="iconChromeLinear" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#FFFFFF" />
      <stop offset="20%" stop-color="#CBD5E1" />
      <stop offset="50%" stop-color="#64748B" />
      <stop offset="80%" stop-color="#CBD5E1" />
      <stop offset="100%" stop-color="#1E293B" />
    </linearGradient>

    <!-- Rich Crimson Woodgrain Gradient -->
    <linearGradient id="iconCrimsonGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#800A10" />
      <stop offset="25%" stop-color="#A5101A" />
      <stop offset="50%" stop-color="#6E080E" />
      <stop offset="75%" stop-color="#50050A" />
      <stop offset="100%" stop-color="#240204" />
    </linearGradient>

    <!-- High-Contrast 3D Globe Shading -->
    <radialGradient id="iconGlobeSphere" cx="40%" cy="36%" r="62%">
      <stop offset="0%" stop-color="#FFFFFF" />
      <stop offset="25%" stop-color="#F1F5F9" />
      <stop offset="55%" stop-color="#CBD5E1" />
      <stop offset="80%" stop-color="#64748B" />
      <stop offset="96%" stop-color="#334155" />
      <stop offset="100%" stop-color="#0F172A" />
    </radialGradient>

    <!-- 3D Red 'D' Monogram Gradient -->
    <linearGradient id="iconRedDGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#FF4D5E" />
      <stop offset="25%" stop-color="#E6192A" />
      <stop offset="55%" stop-color="#B30F1D" />
      <stop offset="85%" stop-color="#7A0811" />
      <stop offset="100%" stop-color="#3D0206" />
    </linearGradient>

    <!-- Quill Feather Gradient -->
    <linearGradient id="iconQuillGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FF3849" />
      <stop offset="35%" stop-color="#D61324" />
      <stop offset="75%" stop-color="#7A0812" />
      <stop offset="100%" stop-color="#3D0206" />
    </linearGradient>

    <!-- Depth & Shadow Filters -->
    <filter id="masterIconShadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="16" stdDeviation="18" flood-color="#000000" flood-opacity="0.85" />
    </filter>

    <filter id="dShadow" x="-15%" y="-15%" width="130%" height="130%">
      <feDropShadow dx="0" dy="10" stdDeviation="8" flood-color="#000000" flood-opacity="0.9" />
    </filter>
  </defs>

  <g filter="url(#masterIconShadow)">
    <!-- ======================================================== -->
    <!-- 1. SQUIRCLE SHIELD BASE WITH MULTI-TIER CHROME BEVEL    -->
    <!-- ======================================================== -->
    <!-- Outer Heavy Chrome Shield -->
    <rect x="36" y="36" width="952" height="952" rx="220" fill="url(#iconChromeOuter)" stroke="#0F172A" stroke-width="6" />
    
    <!-- Dark Inner Recess Groove -->
    <rect x="58" y="58" width="908" height="908" rx="200" fill="#1C0204" />
    
    <!-- Crimson Woodgrain Base Plate -->
    <rect x="74" y="74" width="876" height="876" rx="186" fill="url(#iconCrimsonGrad)" stroke="#FFA3A3" stroke-width="3" stroke-opacity="0.5" />

    <!-- Subtle Woodgrain Lines -->
    <g opacity="0.14" stroke="#000000" stroke-width="3">
      <line x1="80" y1="180" x2="944" y2="180" />
      <line x1="80" y1="260" x2="944" y2="260" />
      <line x1="80" y1="340" x2="944" y2="340" />
      <line x1="80" y1="420" x2="944" y2="420" />
      <line x1="80" y1="500" x2="944" y2="500" />
      <line x1="80" y1="580" x2="944" y2="580" />
      <line x1="80" y1="660" x2="944" y2="660" />
      <line x1="80" y1="740" x2="944" y2="740" />
      <line x1="80" y1="820" x2="944" y2="820" />
    </g>

    <!-- Inner Chrome Arch Bevel Rim -->
    <circle cx="512" cy="512" r="380" fill="none" stroke="url(#iconChromeOuter)" stroke-width="26" />
    <circle cx="512" cy="512" r="355" fill="none" stroke="#1A0204" stroke-width="6" />

    <!-- ======================================================== -->
    <!-- 2. SPHERICAL SILVER GLOBE WITH CONTINENTS & COORDINATES  -->
    <!-- ======================================================== -->
    <g transform="translate(512, 512)">
      <!-- Globe Sphere Base -->
      <circle cx="0" cy="0" r="348" fill="url(#iconGlobeSphere)" />
      
      <!-- Coordinate Grid Lines -->
      <ellipse cx="0" cy="0" rx="348" ry="102" fill="none" stroke="#475569" stroke-width="4.5" opacity="0.65" />
      <ellipse cx="0" cy="-135" rx="320" ry="68" fill="none" stroke="#475569" stroke-width="3.5" opacity="0.55" />
      <ellipse cx="0" cy="135" rx="320" ry="68" fill="none" stroke="#475569" stroke-width="3.5" opacity="0.55" />
      
      <ellipse cx="0" cy="0" rx="112" ry="348" fill="none" stroke="#475569" stroke-width="4.5" opacity="0.65" />
      <ellipse cx="0" cy="0" rx="230" ry="348" fill="none" stroke="#475569" stroke-width="4" opacity="0.55" />
      <line x1="-348" y1="0" x2="348" y2="0" stroke="#475569" stroke-width="5" opacity="0.75" />
      <line x1="0" y1="-348" x2="0" y2="348" stroke="#475569" stroke-width="5" opacity="0.75" />

      <!-- World Continents (Embossed Silver-White) -->
      <!-- Eurasia & Asia -->
      <path d="M 24 -170 C 60 -195, 120 -180, 180 -130 C 235 -85, 210 -20, 155 20 C 115 45, 55 55, 30 95 C 15 115, -20 70, -10 35 C 0 -30, -55 -65, -30 -120 C -5 -150, -15 -160, 24 -170 Z" fill="#FFFFFF" opacity="0.85" />
      <!-- Africa / Middle East -->
      <path d="M -70 -45 C -30 -55, 5 -30, -10 30 C -20 80, -10 150, -45 200 C -80 225, -105 175, -95 100 C -105 40, -95 -20, -70 -45 Z" fill="#FFFFFF" opacity="0.85" />
      <!-- Americas -->
      <path d="M -280 -150 C -225 -135, -200 -75, -235 -25 C -270 15, -210 80, -225 150 C -250 200, -285 160, -275 100 C -260 50, -305 -10, -290 -105 Z" fill="#FFFFFF" opacity="0.8" />
      <!-- Australia & Pacific -->
      <path d="M 210 110 C 260 100, 280 150, 250 185 C 200 200, 185 150, 210 110 Z" fill="#FFFFFF" opacity="0.85" />
      
      <!-- Outer Specular Atmosphere Rim -->
      <circle cx="0" cy="0" r="348" fill="none" stroke="#FFFFFF" stroke-width="8" opacity="0.9" />
    </g>

    <!-- ======================================================== -->
    <!-- 3. SATELLITE DISH (TOP RIGHT AT 2 O'CLOCK)               -->
    <!-- ======================================================== -->
    <g transform="translate(735, 250) rotate(16)">
      <!-- Strut Mount -->
      <line x1="0" y1="60" x2="0" y2="110" stroke="#CBD5E1" stroke-width="11" />
      <circle cx="0" cy="110" r="11" fill="#334155" />
      <!-- Parabolic Dish -->
      <path d="M -68 35 C -52 -40, 52 -40, 68 35 C 40 45, -40 45, -68 35 Z" fill="url(#iconChromeOuter)" stroke="#0F172A" stroke-width="4" />
      <!-- Feed Horn & Red Signal Indicator -->
      <line x1="0" y1="10" x2="0" y2="-32" stroke="#FFFFFF" stroke-width="7" />
      <circle cx="0" cy="-32" r="10" fill="#EF4444" stroke="#FFFFFF" stroke-width="2.5" />
      <line x1="-42" y1="24" x2="0" y2="-32" stroke="#94A3B8" stroke-width="3" />
      <line x1="42" y1="24" x2="0" y2="-32" stroke="#94A3B8" stroke-width="3" />
    </g>

    <!-- ======================================================== -->
    <!-- 4. CRIMSON QUILL FEATHER PEN                             -->
    <!-- ======================================================== -->
    <g transform="translate(685, 310) rotate(-32)" filter="url(#dShadow)">
      <!-- Feather Body -->
      <path d="M 0 -170 C 48 -110, 68 30, 0 245 C -68 30, -48 -110, 0 -170 Z" fill="url(#iconQuillGrad)" stroke="#3D0206" stroke-width="5" />
      <!-- Feather Barb Textures -->
      <path d="M 0 -145 C 34 -85, 48 24, 0 195 C -48 24, -34 -85, 0 -145 Z" fill="none" stroke="#FFA3A3" stroke-width="3.5" opacity="0.65" />
      <!-- Central Silver Spine Shaft -->
      <line x1="0" y1="-180" x2="0" y2="290" stroke="#FFFFFF" stroke-width="7" />
      <!-- Chrome Metallic Pen Nib -->
      <path d="M -14 265 L 14 265 L 0 320 Z" fill="url(#iconChromeOuter)" stroke="#1E293B" stroke-width="2.5" />
      <line x1="0" y1="265" x2="0" y2="310" stroke="#0F172A" stroke-width="2" />
    </g>

    <!-- ======================================================== -->
    <!-- 5. 3D CRIMSON RED 'D' MONOGRAM (HERO CENTER)             -->
    <!-- ======================================================== -->
    <g transform="translate(512, 512)" filter="url(#dShadow)">
      <!-- Deep 3D Red Extrusion Layers for Tangible Chiseled Depth -->
      <path d="M -220 -160 L -25 -160 C 110 -160, 200 -85, 200 0 C 200 85, 110 160, -25 160 L -220 160 Z" fill="#140102" />
      <path d="M -216 -154 L -28 -154 C 104 -154, 192 -80, 192 0 C 192 80, 104 154, -28 154 L -216 154 Z" fill="#2E0306" />
      <path d="M -212 -148 L -30 -148 C 98 -148, 184 -75, 184 0 C 184 75, 98 148, -30 148 L -212 148 Z" fill="#4D0409" />
      <path d="M -208 -142 L -32 -142 C 92 -142, 176 -70, 176 0 C 176 70, 92 142, -32 142 L -208 142 Z" fill="#7A0811" />

      <!-- Front Crimson Red Face Plate -->
      <path d="M -204 -138 L -35 -138 C 88 -138, 170 -66, 170 0 C 170 66, 88 138, -35 138 L -204 138 Z" fill="url(#iconRedDGrad)" stroke="#FFA3A3" stroke-width="6" />
      
      <!-- Inner 'D' Cutout with 3D Depth -->
      <path d="M -145 -80 L -38 -80 C 42 -80, 100 -40, 100 0 C 100 40, 42 80, -38 80 L -145 80 Z" fill="#140102" stroke="#FFA3A3" stroke-width="5" />
      
      <!-- Upper Chrome Specular Arc Reflection -->
      <path d="M -204 -138 L 0 -138 C 100 -138, 170 -66, 170 0" fill="none" stroke="#FFFFFF" stroke-width="8" opacity="0.9" />
    </g>
  </g>
</svg>
`;

export const officialIconSvg = officialMasterIconSvg;

async function buildAllLogoAssets() {
  const publicDir = path.join(process.cwd(), 'public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  console.log('Generating Official Logo & Brand Assets...');

  // 1. Write Vector SVGs
  fs.writeFileSync(path.join(publicDir, 'logo.svg'), officialLogoSvg.trim());
  fs.writeFileSync(path.join(publicDir, 'icon.svg'), officialMasterIconSvg.trim());
  fs.writeFileSync(path.join(publicDir, 'icon-v2.svg'), officialMasterIconSvg.trim());
  console.log('Created public/logo.svg, public/icon.svg, and public/icon-v2.svg');

  const logoBuffer = Buffer.from(officialLogoSvg);
  const masterIconBuffer = Buffer.from(officialMasterIconSvg);

  // 2. Main Logo WebP (1024x512 with transparent background)
  await sharp(logoBuffer)
    .resize(1024, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .webp({ quality: 95, effort: 6 })
    .toFile(path.join(publicDir, 'logo.webp'));
  console.log('Created public/logo.webp');

  // 3. Medium / Mobile Logo WebP (512x256)
  await sharp(logoBuffer)
    .resize(512, 256, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .webp({ quality: 92, effort: 6 })
    .toFile(path.join(publicDir, 'logo-sm.webp'));
  console.log('Created public/logo-sm.webp');

  // 4. High-Res Logo PNG (1024x512)
  await sharp(logoBuffer)
    .resize(1024, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png({ quality: 100, compressionLevel: 9 })
    .toFile(path.join(publicDir, 'logo.png'));
  console.log('Created public/logo.png');

  // 5. 1024x1024 Master App Icon PNG
  const masterIcon1024Png = await sharp(masterIconBuffer)
    .resize(1024, 1024, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png({ quality: 100, compressionLevel: 9 })
    .toBuffer();
  fs.writeFileSync(path.join(publicDir, 'icon-1024.png'), masterIcon1024Png);
  fs.writeFileSync(path.join(publicDir, 'icon-1024-v2.png'), masterIcon1024Png);
  console.log('Created public/icon-1024.png and icon-1024-v2.png (1024x1024 Master)');

  // 6. 512x512 High-Resolution App Icon PNG
  const icon512Png = await sharp(masterIconBuffer)
    .resize(512, 512, { kernel: sharp.kernel.lanczos3 })
    .png({ quality: 100, compressionLevel: 9 })
    .toBuffer();
  fs.writeFileSync(path.join(publicDir, 'icon-512.png'), icon512Png);
  fs.writeFileSync(path.join(publicDir, 'icon-512-v2.png'), icon512Png);
  console.log('Created public/icon-512.png and icon-512-v2.png');

  // 7. 192x192 Android / PWA Icon PNG
  const icon192Png = await sharp(masterIconBuffer)
    .resize(192, 192, { kernel: sharp.kernel.lanczos3 })
    .png({ quality: 100, compressionLevel: 9 })
    .toBuffer();
  fs.writeFileSync(path.join(publicDir, 'icon-192.png'), icon192Png);
  fs.writeFileSync(path.join(publicDir, 'icon-192-v2.png'), icon192Png);
  console.log('Created public/icon-192.png and icon-192-v2.png');

  // 8. Maskable icons (with ~10% safe area margin)
  const maskable512Buffer = await sharp(masterIconBuffer)
    .resize(435, 435, { kernel: sharp.kernel.lanczos3 })
    .extend({
      top: 38,
      bottom: 39,
      left: 38,
      right: 39,
      background: { r: 28, g: 2, b: 4, alpha: 1 }
    })
    .png({ quality: 100, compressionLevel: 9 })
    .toBuffer();
  fs.writeFileSync(path.join(publicDir, 'icon-512-maskable.png'), maskable512Buffer);
  fs.writeFileSync(path.join(publicDir, 'icon-512-maskable-v2.png'), maskable512Buffer);

  const maskable192Buffer = await sharp(masterIconBuffer)
    .resize(163, 163, { kernel: sharp.kernel.lanczos3 })
    .extend({
      top: 14,
      bottom: 15,
      left: 14,
      right: 15,
      background: { r: 28, g: 2, b: 4, alpha: 1 }
    })
    .png({ quality: 100, compressionLevel: 9 })
    .toBuffer();
  fs.writeFileSync(path.join(publicDir, 'icon-192-maskable.png'), maskable192Buffer);
  fs.writeFileSync(path.join(publicDir, 'icon-192-maskable-v2.png'), maskable192Buffer);

  // 9. 180x180 Apple Touch Icon PNG
  const appleTouchPng = await sharp(masterIconBuffer)
    .resize(180, 180, { kernel: sharp.kernel.lanczos3 })
    .png({ quality: 100, compressionLevel: 9 })
    .toBuffer();
  fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), appleTouchPng);
  fs.writeFileSync(path.join(publicDir, 'apple-touch-icon-v2.png'), appleTouchPng);
  console.log('Created public/apple-touch-icon.png and apple-touch-icon-v2.png');

  // 10. Precision Lossless Favicons (48x48, 32x32, 16x16)
  const favicon48Png = await sharp(masterIconBuffer)
    .resize(48, 48, { kernel: sharp.kernel.lanczos3 })
    .png({ quality: 100, compressionLevel: 9 })
    .toBuffer();
  fs.writeFileSync(path.join(publicDir, 'favicon-48x48.png'), favicon48Png);
  fs.writeFileSync(path.join(publicDir, 'favicon-48x48-v2.png'), favicon48Png);
  fs.writeFileSync(path.join(publicDir, 'favicon.png'), favicon48Png);
  fs.writeFileSync(path.join(publicDir, 'favicon-v2.png'), favicon48Png);

  const favicon32Png = await sharp(masterIconBuffer)
    .resize(32, 32, { kernel: sharp.kernel.lanczos3 })
    .png({ quality: 100, compressionLevel: 9 })
    .toBuffer();
  fs.writeFileSync(path.join(publicDir, 'favicon-32x32.png'), favicon32Png);
  fs.writeFileSync(path.join(publicDir, 'favicon-32x32-v2.png'), favicon32Png);

  const favicon16Png = await sharp(masterIconBuffer)
    .resize(16, 16, { kernel: sharp.kernel.lanczos3 })
    .png({ quality: 100, compressionLevel: 9 })
    .toBuffer();
  fs.writeFileSync(path.join(publicDir, 'favicon-16x16.png'), favicon16Png);
  fs.writeFileSync(path.join(publicDir, 'favicon-16x16-v2.png'), favicon16Png);

  console.log('Created public lossless favicon PNGs (16x16, 32x32, 48x48 and -v2 variants)');

  // 11. Multi-Resolution favicon.ico containing 16x16, 32x32, 48x48
  try {
    const icoBuffer = await toIco([favicon16Png, favicon32Png, favicon48Png]);
    fs.writeFileSync(path.join(publicDir, 'favicon.ico'), icoBuffer);
    fs.writeFileSync(path.join(publicDir, 'favicon-v2.ico'), icoBuffer);
    console.log('Created high-quality multi-size public/favicon.ico and public/favicon-v2.ico with to-ico');
  } catch (icoErr) {
    console.error('Error generating favicon.ico with to-ico, falling back to convert:', icoErr);
    try {
      execSync('convert public/favicon-16x16.png public/favicon-32x32.png public/favicon-48x48.png public/favicon.ico', { stdio: 'inherit' });
      fs.copyFileSync(path.join(publicDir, 'favicon.ico'), path.join(publicDir, 'favicon-v2.ico'));
      console.log('Created public/favicon.ico and favicon-v2.ico via convert');
    } catch (e) {
      console.error('Failed to convert favicon.ico:', e);
    }
  }

  // 12. Copy all generated assets to dist folder if dist exists
  const distDir = path.join(process.cwd(), 'dist');
  if (fs.existsSync(distDir)) {
    const filesToCopy = [
      'logo.webp',
      'logo-sm.webp',
      'logo.png',
      'logo.svg',
      'icon.svg',
      'icon-v2.svg',
      'icon-1024.png',
      'icon-1024-v2.png',
      'icon-512.png',
      'icon-512-v2.png',
      'icon-512-maskable.png',
      'icon-512-maskable-v2.png',
      'icon-192.png',
      'icon-192-v2.png',
      'icon-192-maskable.png',
      'icon-192-maskable-v2.png',
      'apple-touch-icon.png',
      'apple-touch-icon-v2.png',
      'favicon-48x48.png',
      'favicon-48x48-v2.png',
      'favicon-32x32.png',
      'favicon-32x32-v2.png',
      'favicon-16x16.png',
      'favicon-16x16-v2.png',
      'favicon.png',
      'favicon-v2.png',
      'favicon.ico',
      'favicon-v2.ico'
    ];
    for (const f of filesToCopy) {
      const srcF = path.join(publicDir, f);
      const dstF = path.join(distDir, f);
      if (fs.existsSync(srcF)) {
        fs.copyFileSync(srcF, dstF);
      }
    }
  }

  console.log('Successfully generated all official branding & logo assets!');
  process.exit(0);
}

buildAllLogoAssets().catch(err => {
  console.error('Error generating assets:', err);
  process.exit(1);
});
