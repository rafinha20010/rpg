export type ClassId = 'warrior' | 'mage' | 'rogue' | 'cleric';
export type SkillType = 'phys' | 'magic' | 'holy' | 'heal' | 'defend' | 'buff' | 'bless' | 'poison' | 'freeze' | 'evade';
export type TileType = 0 | 1 | 2 | 3 | 4 | 5; // wall, floor, grass, water, road, dungeon

export interface Skill {
  name: string;
  cost: number;
  mult: number;
  type: SkillType;
  desc: string;
}

export interface ClassDef {
  name: string;
  icon: string;
  color: string;
  hp: number;
  mp: number;
  atk: number;
  def: number;
  critChance: number;
  skills: Skill[];
}

export interface Hero {
  cls: ClassId;
  name: string;
  icon: string;
  color: string;
  level: number;
  exp: number;
  expNext: number;
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  atk: number;
  def: number;
  critChance: number;
  skills: Skill[];
  gold: number;
  px: number;
  py: number;
  facing: number;
  moving: boolean;
}

export interface EnemyTemplate {
  name: string;
  icon: string;
  color: string;
  hp: number;
  atk: number;
  def: number;
  exp: number;
  gold: number;
  size: number;
  danger: number;
}

export interface Enemy {
  id: number;
  tmpl: EnemyTemplate;
  name: string;
  icon: string;
  color: string;
  tx: number;
  ty: number;
  hp: number;
  maxHp: number;
  atk: number;
  def: number;
  exp: number;
  gold: number;
  size: number;
  anim: number;
  aggro: boolean;
  moveTimer: number;
  dead: boolean;
  deathAnim: number;
}

export interface Particle {
  tx: number;
  ty: number;
  color: string;
  vx: number;
  vy: number;
  life: number;
  size: number;
}

export interface FloatingText {
  text: string;
  tx: number;
  ty: number;
  color: string;
  life: number;
  vy: number;
}

export interface LogEntry {
  text: string;
  type: 'dmg' | 'heal' | 'hit' | 'sys' | 'exp' | '';
}

export interface BattleState {
  frozen: number;
  poisoned: number;
  evading: boolean;
  shieldUp: boolean;
  buffAtk: number;
  buffAtkT: number;
  blessed: boolean;
  blessT: number;
}

export interface GameState {
  hero: Hero | null;
  enemies: Enemy[];
  particles: Particle[];
  floatingTexts: FloatingText[];
  log: LogEntry[];
  inBattle: boolean;
  battleEnemyId: number | null;
  battle: BattleState;
  cam: { x: number; y: number };
  walkAnim: number;
  levelupTimer: number;
  spawnTimer: number;
}