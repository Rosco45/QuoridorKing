import type { ThemeId } from './game';

export interface ThemeConfig {
  id: ThemeId;
  name: string;
  badge: string;
  description: string;
  boardBgGradient: {
    start: string;
    end: string;
  };
  boardRimGradient: {
    start: string;
    mid: string;
    end: string;
  };
  cellDefault: string;
  cellBorder: string;
  cellValidMove: string;
  grooveColor: string;
  grooveIntersection: string;
  wallDefault: string;
  wallStroke: string;
  wallShadow: string;
  wallGlow: string;
  accentP1: string; // Bottom (Cyan)
  accentP2: string; // Top (Orange)
  accentP3: string; // Left (Emerald)
  accentP4: string; // Right (Purple)
}

export const THEMES: Record<ThemeId, ThemeConfig> = {
  wood: {
    id: 'wood',
    name: 'Bois Noble Classique',
    badge: '🪵 Bois',
    description: 'Biseaux effet noyer et buis traditionnel, teintes chaleureuses.',
    boardBgGradient: {
      start: '#1a1c23',
      end: '#0f1117',
    },
    boardRimGradient: {
      start: '#4a3b32',
      mid: '#2b211b',
      end: '#1a1410',
    },
    cellDefault: '#1e212b',
    cellBorder: 'rgba(100, 116, 139, 0.25)',
    cellValidMove: '#2d3a35',
    grooveColor: 'rgba(51, 65, 85, 0.4)',
    grooveIntersection: 'rgba(148, 163, 184, 0.45)',
    wallDefault: '#d97706',
    wallStroke: '#451a03',
    wallShadow: 'rgba(0, 0, 0, 0.6)',
    wallGlow: 'rgba(217, 119, 6, 0.3)',
    accentP1: '#38bdf8', // Cyan
    accentP2: '#f97316', // Orange
    accentP3: '#10b981', // Emerald
    accentP4: '#a855f7', // Purple
  },
  cyberpunk: {
    id: 'cyberpunk',
    name: 'Cyberpunk Néon',
    badge: '⚡ Néon',
    description: 'Esthétique futuriste, barrières laser holographiques et bloom lumineux.',
    boardBgGradient: {
      start: '#0c0f1d',
      end: '#05070f',
    },
    boardRimGradient: {
      start: '#06b6d4',
      mid: '#ec4899',
      end: '#3b82f6',
    },
    cellDefault: '#11162b',
    cellBorder: 'rgba(6, 182, 212, 0.3)',
    cellValidMove: '#162f3a',
    grooveColor: 'rgba(236, 72, 153, 0.25)',
    grooveIntersection: 'rgba(6, 182, 212, 0.7)',
    wallDefault: '#ec4899',
    wallStroke: '#f43f5e',
    wallShadow: 'rgba(236, 72, 153, 0.5)',
    wallGlow: 'rgba(236, 72, 153, 0.8)',
    accentP1: '#00f0ff', // Cyber Cyan
    accentP2: '#ff007f', // Cyber Pink
    accentP3: '#39ff14', // Neon Green
    accentP4: '#bf00ff', // Electric Violet
  },
  marble: {
    id: 'marble',
    name: 'Marbre Royal & Or',
    badge: '🏛️ Marbre',
    description: 'Marbre blanc doux, rainures brossées dorées et finitions royales.',
    boardBgGradient: {
      start: '#252836',
      end: '#191b24',
    },
    boardRimGradient: {
      start: '#fbbf24',
      mid: '#d97706',
      end: '#78350f',
    },
    cellDefault: '#2a2e3d',
    cellBorder: 'rgba(251, 191, 36, 0.2)',
    cellValidMove: '#273836',
    grooveColor: 'rgba(217, 119, 6, 0.3)',
    grooveIntersection: 'rgba(251, 191, 36, 0.6)',
    wallDefault: '#f59e0b',
    wallStroke: '#78350f',
    wallShadow: 'rgba(0, 0, 0, 0.7)',
    wallGlow: 'rgba(245, 158, 11, 0.4)',
    accentP1: '#60a5fa', // Soft Blue
    accentP2: '#fb923c', // Warm Amber
    accentP3: '#34d399', // Mint
    accentP4: '#c084fc', // Lilac
  },
};
