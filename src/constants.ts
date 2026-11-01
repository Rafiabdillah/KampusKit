
import { AppTheme } from './types';

export const THEMES: AppTheme[] = [
  // --- MODERN & CLEAN ---
  {
    id: 'COSMIC',
    name: 'Apple Vision (Default)',
    colors: {
      primary: '0 113 227',     // Apple Blue
      secondary: '255 45 85',   // Apple Pink
      dark: '9 9 11',            // Zinc 950
      card: '28 28 30'          // Deep Gray
    }
  },
  {
    id: 'MINIMAL',
    name: 'Slate Minimal',
    colors: {
      primary: '148 163 184',   // Slate-400
      secondary: '226 232 240', // Slate-200
      dark: '15 23 42',         // Slate-900
      card: '30 41 59'          // Slate-800
    }
  },
  {
    id: 'OCEAN',
    name: 'Deep Ocean',
    colors: {
      primary: '6 182 212',     // Cyan-500
      secondary: '59 130 246',  // Blue-500
      dark: '8 51 68',          // Cyan-950
      card: '21 94 117'         // Cyan-800
    }
  },
  {
    id: 'NATURE',
    name: 'Forest Zen',
    colors: {
      primary: '16 185 129',    // Emerald-500
      secondary: '132 204 22',  // Lime-500
      dark: '2 44 34',          // Emerald-950
      card: '6 78 59'           // Emerald-900
    }
  },

  // --- VIBRANT & POP ---
  {
    id: 'BUBBLEGUM',
    name: 'Bubblegum',
    colors: {
      primary: '236 72 153',    // Pink-500
      secondary: '59 130 246',  // Blue-500
      dark: '30 27 75',         // Indigo-950
      card: '49 46 129'         // Indigo-900
    }
  },
  {
    id: 'KAWAII',
    name: 'Pastel Dream',
    colors: {
      primary: '244 114 182',   // Pink-400
      secondary: '167 139 250', // Violet-400
      dark: '76 29 149',        // Violet-950
      card: '91 33 182'         // Violet-900
    }
  },
  {
    id: 'SUNSET',
    name: 'Sunset Vibes',
    colors: {
      primary: '249 115 22',    // Orange-500
      secondary: '244 63 94',   // Rose-500
      dark: '67 20 7',          // Warm Brown
      card: '124 45 18'         // Orange-900
    }
  },
  {
    id: 'MATCHA',
    name: 'Matcha Latte',
    colors: {
      primary: '132 204 22',    // Lime-500
      secondary: '20 184 166',  // Teal-500
      dark: '20 83 45',         // Green-950
      card: '22 101 52'         // Green-900
    }
  },

  // --- DARK & EDGY ---
  {
    id: 'CYBERPUNK',
    name: 'Neon City',
    colors: {
      primary: '217 70 239',    // Fuchsia-500
      secondary: '34 211 238',  // Cyan-400
      dark: '10 10 10',         // Near Black
      card: '38 38 38'          // Neutral-800
    }
  },
  {
    id: 'DRACULA',
    name: 'Vampire Night',
    colors: {
      primary: '139 92 246',    // Violet-500
      secondary: '236 72 153',  // Pink-500
      dark: '17 24 39',         // Gray-900
      card: '31 41 55'          // Gray-800
    }
  },
  {
    id: 'RETRO',
    name: 'Matrix Retro',
    colors: {
      primary: '34 197 94',     // Green-500
      secondary: '234 179 8',   // Yellow-500
      dark: '12 10 9',          // Stone-950
      card: '28 25 23'          // Stone-900
    }
  },
  {
    id: 'MIDNIGHT',
    name: 'Midnight OLED',
    colors: {
      primary: '59 130 246',    // Blue-500
      secondary: '99 102 241',  // Indigo-500
      dark: '9 9 11',            // Zinc 950
      card: '23 23 23'          // Neutral-900
    }
  },

  // --- ELEGANT & WARM ---
  {
    id: 'ROYAL',
    name: 'Royal Gold',
    colors: {
      primary: '234 179 8',     // Yellow-500
      secondary: '220 38 38',   // Red-600
      dark: '26 6 6',           // Dark Red
      card: '69 10 10'          // Red-950
    }
  },
  {
    id: 'COFFEE',
    name: 'Coffee Shop',
    colors: {
      primary: '180 83 9',      // Amber-700
      secondary: '120 53 15',   // Amber-900
      dark: '28 25 23',         // Stone-900
      card: '68 64 60'          // Stone-700
    }
  }
];
