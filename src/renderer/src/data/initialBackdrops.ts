import { BackdropPreset, GreenscreenPreset } from '../types/background';

// High-fidelity scalable backdrop artwork as self-contained SVG Data URIs
const PENTHOUSE_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1920 1080" width="1920" height="1080">
  <defs>
    <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="%230b111e"/>
      <stop offset="60%" stop-color="%231a2639"/>
      <stop offset="100%" stop-color="%232c2538"/>
    </linearGradient>
    <linearGradient id="floorGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="%23181615"/>
      <stop offset="100%" stop-color="%230d0b0a"/>
    </linearGradient>
    <radialGradient id="lampGlow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="%23f7d486" stop-opacity="0.85"/>
      <stop offset="40%" stop-color="%23f59e0b" stop-opacity="0.25"/>
      <stop offset="100%" stop-color="%23f59e0b" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="cityBokeh1" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="%23fef3c7" stop-opacity="0.6"/>
      <stop offset="60%" stop-color="%23f59e0b" stop-opacity="0.15"/>
      <stop offset="100%" stop-color="%23f59e0b" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="cityBokeh2" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="%2360a5fa" stop-opacity="0.5"/>
      <stop offset="70%" stop-color="%232563eb" stop-opacity="0.1"/>
      <stop offset="100%" stop-color="%231d4ed8" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="glassPillar" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="%231a1918"/>
      <stop offset="35%" stop-color="%232e2c2a"/>
      <stop offset="50%" stop-color="%23484542"/>
      <stop offset="65%" stop-color="%232e2c2a"/>
      <stop offset="100%" stop-color="%231a1918"/>
    </linearGradient>
  </defs>
  <!-- Sky / Distant Horizon -->
  <rect width="1920" height="1080" fill="url(%23skyGrad)"/>
  
  <!-- Distant City Skyline Silhouettes -->
  <rect x="120" y="520" width="85" height="320" fill="%23111827" opacity="0.8"/>
  <rect x="220" y="440" width="110" height="400" fill="%230f172a" opacity="0.85"/>
  <rect x="350" y="490" width="95" height="350" fill="%23131d33" opacity="0.75"/>
  <rect x="470" y="380" width="130" height="460" fill="%230d1527" opacity="0.9"/>
  <rect x="630" y="470" width="90" height="370" fill="%23111a2e" opacity="0.8"/>
  <rect x="1250" y="420" width="140" height="420" fill="%230f172a" opacity="0.9"/>
  <rect x="1410" y="500" width="100" height="340" fill="%23131d33" opacity="0.8"/>
  <rect x="1530" y="450" width="120" height="390" fill="%230d1527" opacity="0.85"/>
  <rect x="1670" y="530" width="110" height="310" fill="%23111827" opacity="0.75"/>

  <!-- Dreamy Night City Bokeh Orbs -->
  <circle cx="260" cy="530" r="45" fill="url(%23cityBokeh1)"/>
  <circle cx="390" cy="480" r="30" fill="url(%23cityBokeh2)"/>
  <circle cx="510" cy="430" r="55" fill="url(%23cityBokeh1)"/>
  <circle cx="700" cy="560" r="35" fill="url(%23cityBokeh2)"/>
  <circle cx="1300" cy="460" r="50" fill="url(%23cityBokeh1)"/>
  <circle cx="1450" cy="520" r="38" fill="url(%23cityBokeh2)"/>
  <circle cx="1600" cy="470" r="60" fill="url(%23cityBokeh1)"/>
  <circle cx="1720" cy="550" r="42" fill="url(%23cityBokeh2)"/>

  <!-- Luxury Dark Hardwood / Marble Floor -->
  <polygon points="0,820 1920,820 1920,1080 0,1080" fill="url(%23floorGrad)"/>
  <line x1="0" y1="820" x2="1920" y2="820" stroke="%23383533" stroke-width="2"/>

  <!-- Architectural Floor-to-Ceiling Glass Mullions -->
  <rect x="0" y="0" width="40" height="1080" fill="url(%23glassPillar)"/>
  <rect x="580" y="0" width="24" height="820" fill="url(%23glassPillar)"/>
  <rect x="1200" y="0" width="24" height="820" fill="url(%23glassPillar)"/>
  <rect x="1880" y="0" width="40" height="1080" fill="url(%23glassPillar)"/>

  <!-- Designer Arc Floor Lamp & Warm Lighting -->
  <path d="M 1750 980 C 1750 600, 1620 420, 1420 400" fill="none" stroke="%23d4af37" stroke-width="5" stroke-linecap="round"/>
  <circle cx="1420" cy="410" r="130" fill="url(%23lampGlow)"/>
  <ellipse cx="1420" cy="410" rx="35" ry="12" fill="%23fffbeb"/>
</svg>`;

const STUDIO_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1920 1080" width="1920" height="1080">
  <defs>
    <linearGradient id="wallGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="%231a1817"/>
      <stop offset="100%" stop-color="%23110f0e"/>
    </linearGradient>
    <linearGradient id="slatWood" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="%233e2723"/>
      <stop offset="50%" stop-color="%236d4c41"/>
      <stop offset="100%" stop-color="%233e2723"/>
    </linearGradient>
    <radialGradient id="warmSconce" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="%23ffedd5" stop-opacity="0.9"/>
      <stop offset="45%" stop-color="%23f97316" stop-opacity="0.22"/>
      <stop offset="100%" stop-color="%23f97316" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="shelfGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="%232c1c14"/>
      <stop offset="100%" stop-color="%23180f0b"/>
    </linearGradient>
  </defs>
  <!-- Minimalist Dark Studio Wall -->
  <rect width="1920" height="1080" fill="url(%23wallGrad)"/>

  <!-- Left Side: Acoustic Wooden Slat Wall Accent -->
  <g opacity="0.95">
    <rect x="60" y="0" width="22" height="1080" fill="url(%23slatWood)"/>
    <rect x="100" y="0" width="22" height="1080" fill="url(%23slatWood)"/>
    <rect x="140" y="0" width="22" height="1080" fill="url(%23slatWood)"/>
    <rect x="180" y="0" width="22" height="1080" fill="url(%23slatWood)"/>
    <rect x="220" y="0" width="22" height="1080" fill="url(%23slatWood)"/>
    <rect x="260" y="0" width="22" height="1080" fill="url(%23slatWood)"/>
    <rect x="300" y="0" width="22" height="1080" fill="url(%23slatWood)"/>
    <rect x="340" y="0" width="22" height="1080" fill="url(%23slatWood)"/>
    <rect x="380" y="0" width="22" height="1080" fill="url(%23slatWood)"/>
    <rect x="420" y="0" width="22" height="1080" fill="url(%23slatWood)"/>
    <rect x="460" y="0" width="22" height="1080" fill="url(%23slatWood)"/>
  </g>

  <!-- Dual Warm Linear Up/Down Wall Sconces -->
  <circle cx="850" cy="380" r="160" fill="url(%23warmSconce)"/>
  <rect x="840" y="340" width="20" height="80" rx="4" fill="%232a2624" stroke="%23d4af37" stroke-width="1.5"/>

  <!-- Right Floating Industrial Shelving with Decorative Geometry -->
  <rect x="1420" y="320" width="420" height="18" fill="url(%23shelfGrad)" rx="2"/>
  <rect x="1420" y="560" width="420" height="18" fill="url(%23shelfGrad)" rx="2"/>
  <rect x="1420" y="800" width="420" height="18" fill="url(%23shelfGrad)" rx="2"/>

  <!-- Decorative Studio Items: Sound Interface & Potted Monstera Plant -->
  <rect x="1480" y="270" width="80" height="50" rx="5" fill="%231e293b"/>
  <circle cx="1510" cy="295" r="8" fill="%23d4af37"/>
  <path d="M 1720 720 Q 1680 620 1620 630 Q 1660 690 1720 720" fill="%232e7d32" opacity="0.85"/>
  <path d="M 1730 710 Q 1750 590 1810 610 Q 1770 680 1730 710" fill="%23388e3c" opacity="0.85"/>
  <rect x="1700" y="720" width="55" height="80" rx="3" fill="%23d4af37" opacity="0.65"/>
</svg>`;

const CYBERPUNK_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1920 1080" width="1920" height="1080">
  <defs>
    <linearGradient id="cyberSky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="%2305050b"/>
      <stop offset="70%" stop-color="%230e0720"/>
      <stop offset="100%" stop-color="%231a0b38"/>
    </linearGradient>
    <radialGradient id="neonCyan" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="%2300f2fe" stop-opacity="0.8"/>
      <stop offset="60%" stop-color="%2300f2fe" stop-opacity="0.2"/>
      <stop offset="100%" stop-color="%2300f2fe" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="neonMagenta" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="%23ff007f" stop-opacity="0.85"/>
      <stop offset="55%" stop-color="%23a855f7" stop-opacity="0.2"/>
      <stop offset="100%" stop-color="%23ff007f" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <!-- Cyber Night Base -->
  <rect width="1920" height="1080" fill="url(%23cyberSky)"/>

  <!-- Futuristic High-Rise Grid Towers -->
  <rect x="80" y="400" width="160" height="680" fill="%23080714" stroke="%2300f2fe" stroke-width="1.5" stroke-opacity="0.4"/>
  <rect x="280" y="310" width="180" height="770" fill="%230c081e" stroke="%23ff007f" stroke-width="1.5" stroke-opacity="0.4"/>
  <rect x="1460" y="360" width="170" height="720" fill="%230c081e" stroke="%2300f2fe" stroke-width="1.5" stroke-opacity="0.4"/>
  <rect x="1670" y="440" width="190" height="640" fill="%23080714" stroke="%23ff007f" stroke-width="1.5" stroke-opacity="0.4"/>

  <!-- Neon Holographic Ambient Light Orbs -->
  <circle cx="370" cy="380" r="140" fill="url(%23neonMagenta)"/>
  <circle cx="1550" cy="420" r="150" fill="url(%23neonCyan)"/>
  <circle cx="960" cy="260" r="180" fill="url(%23neonMagenta)" opacity="0.6"/>

  <!-- Cyberpunk Perspective Grid Lines -->
  <line x1="0" y1="920" x2="1920" y2="920" stroke="%2300f2fe" stroke-width="1.5" opacity="0.6"/>
  <line x1="0" y1="960" x2="1920" y2="960" stroke="%2300f2fe" stroke-width="2" opacity="0.75"/>
  <line x1="0" y1="1020" x2="1920" y2="1020" stroke="%23ff007f" stroke-width="2.5" opacity="0.85"/>
</svg>`;

const CAFE_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1920 1080" width="1920" height="1080">
  <defs>
    <linearGradient id="cafeGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="%231f130e"/>
      <stop offset="60%" stop-color="%232b1a13"/>
      <stop offset="100%" stop-color="%23170e0a"/>
    </linearGradient>
    <radialGradient id="fairyLight" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="%23fff7ed" stop-opacity="0.95"/>
      <stop offset="40%" stop-color="%23fbbf24" stop-opacity="0.5"/>
      <stop offset="80%" stop-color="%23d97706" stop-opacity="0.15"/>
      <stop offset="100%" stop-color="%23d97706" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <!-- Warm Lo-Fi Cafe Interior -->
  <rect width="1920" height="1080" fill="url(%23cafeGrad)"/>

  <!-- Brick Wall Texture Lines (Subtle) -->
  <g stroke="%233d251b" stroke-width="1.5" opacity="0.45">
    <line x1="0" y1="180" x2="1920" y2="180"/>
    <line x1="0" y1="260" x2="1920" y2="260"/>
    <line x1="0" y1="340" x2="1920" y2="340"/>
    <line x1="0" y1="420" x2="1920" y2="420"/>
    <line x1="0" y1="500" x2="1920" y2="500"/>
    <line x1="0" y1="580" x2="1920" y2="580"/>
  </g>

  <!-- Hanging Lo-Fi Fairy Light Garlands -->
  <path d="M 0 120 Q 300 240 600 130 Q 900 260 1200 140 Q 1550 250 1920 120" fill="none" stroke="%2357382b" stroke-width="2.5"/>

  <!-- Glowing Fairy Light Bulbs & Bokeh -->
  <circle cx="150" cy="180" r="28" fill="url(%23fairyLight)"/>
  <circle cx="300" cy="235" r="32" fill="url(%23fairyLight)"/>
  <circle cx="450" cy="185" r="28" fill="url(%23fairyLight)"/>
  <circle cx="600" cy="135" r="30" fill="url(%23fairyLight)"/>
  <circle cx="750" cy="205" r="32" fill="url(%23fairyLight)"/>
  <circle cx="900" cy="255" r="35" fill="url(%23fairyLight)"/>
  <circle cx="1050" cy="195" r="28" fill="url(%23fairyLight)"/>
  <circle cx="1200" cy="145" r="30" fill="url(%23fairyLight)"/>
  <circle cx="1380" cy="210" r="34" fill="url(%23fairyLight)"/>
  <circle cx="1550" cy="245" r="36" fill="url(%23fairyLight)"/>
  <circle cx="1740" cy="180" r="30" fill="url(%23fairyLight)"/>
</svg>`;

export const BACKDROP_PRESETS: BackdropPreset[] = [
  {
    id: 'penthouse',
    name: 'Luxury Penthouse',
    category: 'Architecture',
    description: 'High-rise glass walls with soft evening city bokeh lights and designer warm lighting.',
    imageUrl: PENTHOUSE_SVG,
    previewGradient: 'linear-gradient(135deg, #1a2639 0%, #2c2538 50%, #f59e0b 100%)',
  },
  {
    id: 'studio',
    name: 'Modern Acoustic Studio',
    category: 'Creator Studio',
    description: 'Minimalist walnut acoustic slat wall with dual warm architectural sconce lighting.',
    imageUrl: STUDIO_SVG,
    previewGradient: 'linear-gradient(135deg, #3e2723 0%, #1a1817 50%, #d4af37 100%)',
  },
  {
    id: 'cyberpunk',
    name: 'Cyberpunk Neon',
    category: 'Gaming & VTubing',
    description: 'Futuristic night skyline illuminated by neon cyan and electric magenta holographic glows.',
    imageUrl: CYBERPUNK_SVG,
    previewGradient: 'linear-gradient(135deg, #00f2fe 0%, #0e0720 50%, #ff007f 100%)',
  },
  {
    id: 'cafe',
    name: 'Cozy Evening Cafe',
    category: 'Cozy & Lo-Fi',
    description: 'Warm espresso brick interior with ambient glowing fairy lights and gentle bokeh.',
    imageUrl: CAFE_SVG,
    previewGradient: 'linear-gradient(135deg, #2b1a13 0%, #57382b 50%, #fbbf24 100%)',
  },
];

export const GREENSCREEN_PRESETS: GreenscreenPreset[] = [
  {
    id: 'emerald',
    name: 'Emerald Chroma Green',
    hex: '#00FF00',
    description: 'Industry-standard high-saturation green for OBS Studio, Zoom, and Discord chroma key filters.',
  },
  {
    id: 'cobalt',
    name: 'Cobalt Chroma Blue',
    hex: '#0000FF',
    description: 'Classic broadcast studio blue keying for streamers wearing green clothing or jewelry.',
  },
  {
    id: 'magenta',
    name: 'Magenta Screen',
    hex: '#FF00FF',
    description: 'High-contrast studio magenta key for specialized lighting and avatar composites.',
  },
];
