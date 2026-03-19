import type { ClassDef, EnemyTemplate, TileType } from './types';

export const TILE = 32;
export const COLS = 30;
export const ROWS = 22;
export const CAM_COLS = 18;
export const CAM_ROWS = 14;

// Tile type constants
export const T = { WALL: 0, FLOOR: 1, GRASS: 2, WATER: 3, ROAD: 4, DUNGEON: 5 } as const;

export const TILE_COLORS: Record<number, string> = {
  [T.WALL]:    '#0e0b10',
  [T.FLOOR]:   '#1e1c14',
  [T.GRASS]:   '#131c11',
  [T.WATER]:   '#0a1218',
  [T.ROAD]:    '#26221a',
  [T.DUNGEON]: '#14101a',
};

export const TILE_DETAIL: Record<number, string> = {
  [T.WALL]:    '#1e1424',
  [T.FLOOR]:   '#2a2820',
  [T.GRASS]:   '#1c2c18',
  [T.WATER]:   '#121c26',
  [T.ROAD]:    '#302c22',
  [T.DUNGEON]: '#201828',
};

export const RAW_MAP: TileType[][] = [
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,2,2,2,2,2,2,2,2,2,2,2,0,0,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,0],
  [0,2,1,1,1,1,1,1,1,1,2,2,0,0,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,0],
  [0,2,1,1,1,1,1,1,1,1,2,2,0,0,2,2,2,3,3,3,3,3,2,2,2,2,2,2,2,0],
  [0,2,1,1,1,1,1,1,1,1,2,2,2,2,2,2,2,3,3,3,3,3,2,2,2,2,2,2,2,0],
  [0,2,1,1,1,1,1,1,1,1,2,2,2,2,2,2,2,3,3,3,3,3,2,2,2,2,2,2,2,0],
  [0,2,1,1,1,1,1,1,1,1,2,2,4,4,4,4,4,4,4,4,4,2,2,2,2,2,2,2,2,0],
  [0,2,1,1,1,1,1,1,1,1,1,1,1,1,4,4,4,4,4,4,4,2,2,2,2,2,2,2,2,0],
  [0,2,2,1,1,1,1,1,1,1,1,1,1,1,4,2,2,2,2,2,4,2,2,5,5,5,5,5,2,0],
  [0,2,2,2,2,2,2,2,2,4,4,4,4,4,4,2,2,2,2,2,4,4,4,5,5,5,5,5,2,0],
  [0,2,2,2,2,2,2,2,2,4,2,2,2,2,2,2,2,2,2,2,2,2,4,5,5,5,5,5,2,0],
  [0,2,2,2,2,2,2,2,2,4,2,2,2,2,2,2,2,2,2,2,2,2,4,5,5,5,5,5,2,0],
  [0,0,0,2,2,2,2,2,2,4,2,2,2,2,2,2,2,2,2,2,2,2,4,5,5,5,5,5,2,0],
  [0,0,0,2,2,2,2,2,2,4,2,2,0,0,0,0,2,2,2,2,2,2,4,5,5,5,5,5,2,0],
  [0,0,0,2,2,2,2,2,2,4,2,2,0,0,0,0,2,2,2,2,2,2,4,4,4,4,5,5,2,0],
  [0,0,0,2,2,2,2,2,2,4,4,4,4,4,4,4,4,4,4,4,4,4,4,2,2,4,5,5,2,0],
  [0,0,0,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,4,5,5,2,0],
  [0,0,0,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,4,4,4,2,0],
  [0,0,0,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,0],
  [0,0,0,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,0],
  [0,0,0,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
];

export const BLOCKED = new Set([T.WALL, T.WATER]);

export function isWalkable(tx: number, ty: number): boolean {
  if (tx < 0 || ty < 0 || tx >= COLS || ty >= ROWS) return false;
  return !BLOCKED.has(RAW_MAP[ty][tx]);
}

export function getDanger(tx: number, ty: number): number {
  const t = RAW_MAP[ty]?.[tx];
  if (t === T.DUNGEON) return 3;
  if (t === T.GRASS && (tx > 18 || ty > 12)) return 2;
  if (t === T.GRASS) return 1;
  if (t === T.ROAD && tx > 12) return 2;
  return 0;
}

export const CLASSES: Record<string, ClassDef> = {
  warrior: {
    name: 'Guerreiro', icon: '🛡️', color: '#e05040',
    hp: 160, mp: 40, atk: 14, def: 10, critChance: 0.08,
    skills: [
      { name: 'Golpe',   cost: 0,  mult: 1.1, type: 'phys',   desc: 'Ataque básico' },
      { name: 'Fúria',   cost: 12, mult: 1.9, type: 'phys',   desc: 'ATK ×1.9' },
      { name: 'Escudo',  cost: 8,  mult: 0,   type: 'defend', desc: 'DEF ×2 por 1 turno' },
      { name: 'Grito',   cost: 10, mult: 0,   type: 'buff',   desc: 'ATK+5 / 3 turnos' },
    ],
  },
  mage: {
    name: 'Mago', icon: '🔮', color: '#5080dc',
    hp: 80, mp: 130, atk: 8, def: 3, critChance: 0.15,
    skills: [
      { name: 'Varinha',  cost: 0,  mult: 0.9, type: 'magic',  desc: 'Ataque arcano' },
      { name: 'Fireball', cost: 14, mult: 2.4, type: 'magic',  desc: 'Explosão de fogo' },
      { name: 'Raio',     cost: 10, mult: 1.8, type: 'magic',  desc: 'Raio elétrico' },
      { name: 'Congelar', cost: 16, mult: 1.2, type: 'freeze', desc: 'Congela / 2 turnos' },
    ],
  },
  rogue: {
    name: 'Ladino', icon: '🗡️', color: '#a060d0',
    hp: 100, mp: 70, atk: 12, def: 5, critChance: 0.28,
    skills: [
      { name: 'Facada', cost: 0,  mult: 1.0, type: 'phys',   desc: 'Ataque rápido' },
      { name: 'Duplo',  cost: 8,  mult: 1.6, type: 'phys',   desc: 'Dois ataques' },
      { name: 'Veneno', cost: 10, mult: 0.7, type: 'poison', desc: 'Envenena / 4 turnos' },
      { name: 'Evasão', cost: 12, mult: 0,   type: 'evade',  desc: 'Esquiva próx. ataque' },
    ],
  },
  cleric: {
    name: 'Clérigo', icon: '✨', color: '#40c870',
    hp: 115, mp: 100, atk: 9, def: 7, critChance: 0.10,
    skills: [
      { name: 'Luz',     cost: 0,  mult: 1.0, type: 'holy',  desc: 'Dano sagrado' },
      { name: 'Cura',    cost: 14, mult: 0,   type: 'heal',  desc: 'Restaura 36% HP' },
      { name: 'Benção',  cost: 10, mult: 0,   type: 'bless', desc: 'Buff ATK+DEF' },
      { name: 'Punição', cost: 20, mult: 2.8, type: 'holy',  desc: 'Dano sagrado ×2.8' },
    ],
  },
};

export const ENEMY_TEMPLATES: EnemyTemplate[] = [
  { name: 'Rato',      icon: '🐀', color: '#885030', hp: 20,  atk: 4,  def: 1,  exp: 12,  gold: 2,  size: 18, danger: 1 },
  { name: 'Goblin',    icon: '👺', color: '#508030', hp: 45,  atk: 8,  def: 2,  exp: 28,  gold: 5,  size: 22, danger: 1 },
  { name: 'Lobo',      icon: '🐺', color: '#607080', hp: 60,  atk: 11, def: 3,  exp: 40,  gold: 7,  size: 24, danger: 1 },
  { name: 'Ogro',      icon: '👹', color: '#806040', hp: 100, atk: 16, def: 6,  exp: 75,  gold: 14, size: 28, danger: 2 },
  { name: 'Espectro',  icon: '👻', color: '#8090b0', hp: 75,  atk: 14, def: 2,  exp: 65,  gold: 10, size: 22, danger: 2 },
  { name: 'Esqueleto', icon: '💀', color: '#b0a890', hp: 90,  atk: 13, def: 7,  exp: 70,  gold: 12, size: 24, danger: 2 },
  { name: 'Lich',      icon: '🧟', color: '#6040a0', hp: 160, atk: 20, def: 8,  exp: 140, gold: 28, size: 28, danger: 3 },
  { name: 'Demônio',   icon: '😈', color: '#a03020', hp: 140, atk: 22, def: 10, exp: 120, gold: 24, size: 28, danger: 3 },
];