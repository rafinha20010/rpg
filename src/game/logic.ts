import {
  COLS, ROWS, CAM_COLS, CAM_ROWS,
  RAW_MAP, isWalkable, getDanger,
  ENEMY_TEMPLATES, CLASSES, T,
} from './constants';
import type { GameState, Hero, Enemy, BattleState } from './types';

let _enemyCounter = 0;
const rnd = (a: number, b: number) => Math.floor(Math.random() * (b - a + 1)) + a;
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

// ─── INITIAL STATE ──────────────────────────────────────────────────────────
export function makeInitialState(): GameState {
  return {
    hero: null,
    enemies: [],
    particles: [],
    floatingTexts: [],
    log: [],
    inBattle: false,
    battleEnemyId: null,
    battle: makeBattleState(),
    cam: { x: 0, y: 0 },
    walkAnim: 0,
    levelupTimer: 0,
    spawnTimer: 10000,
  };
}

function makeBattleState(): BattleState {
  return {
    frozen: 0, poisoned: 0, evading: false,
    shieldUp: false, buffAtk: 0, buffAtkT: 0,
    blessed: false, blessT: 0,
  };
}

// ─── HERO ────────────────────────────────────────────────────────────────────
export function createHero(cls: string): Hero {
  const C = CLASSES[cls];
  return {
    cls: cls as Hero['cls'],
    name: 'Herói',
    icon: C.icon,
    color: C.color,
    level: 1, exp: 0, expNext: 100,
    hp: C.hp, maxHp: C.hp,
    mp: C.mp, maxMp: C.mp,
    atk: C.atk, def: C.def,
    critChance: C.critChance,
    skills: C.skills,
    gold: 10,
    px: 5.5, py: 7.5,
    facing: 0, moving: false,
  };
}

// ─── ENEMIES ─────────────────────────────────────────────────────────────────
export function spawnAllEnemies(hero: Hero): Enemy[] {
  const result: Enemy[] = [];
  for (let attempt = 0; attempt < 400 && result.length < 20; attempt++) {
    const tx = rnd(2, COLS - 2);
    const ty = rnd(2, ROWS - 2);
    const danger = getDanger(tx, ty);
    if (!isWalkable(tx, ty) || danger === 0) continue;
    if (Math.hypot(tx - hero.px, ty - hero.py) < 4) continue;
    if (result.some(e => Math.hypot(e.tx - tx, e.ty - ty) < 1.5)) continue;
    const en = makeEnemy(tx + 0.5, ty + 0.5, danger, hero.level);
    if (en) result.push(en);
  }
  return result;
}

export function spawnOneEnemy(hero: Hero, enemies: Enemy[]): Enemy | null {
  for (let attempt = 0; attempt < 120; attempt++) {
    const tx = rnd(2, COLS - 2);
    const ty = rnd(2, ROWS - 2);
    const danger = getDanger(tx, ty);
    if (!isWalkable(tx, ty) || danger === 0) continue;
    if (Math.hypot(tx - hero.px, ty - hero.py) < 8) continue;
    if (enemies.some(e => !e.dead && Math.hypot(e.tx - tx, e.ty - ty) < 1.5)) continue;
    const maxDanger = Math.min(3, Math.ceil(hero.level / 3) + 1);
    const en = makeEnemy(tx + 0.5, ty + 0.5, Math.min(danger, maxDanger), hero.level);
    if (en) return en;
  }
  return null;
}

function makeEnemy(tx: number, ty: number, danger: number, heroLevel: number): Enemy | null {
  const pool = ENEMY_TEMPLATES.filter(e => e.danger <= danger);
  if (!pool.length) return null;
  const tmpl = pool[rnd(0, pool.length - 1)];
  const scale = 1 + (heroLevel - 1) * 0.08;
  return {
    id: ++_enemyCounter,
    tmpl, name: tmpl.name, icon: tmpl.icon, color: tmpl.color,
    tx, ty,
    hp: Math.floor(tmpl.hp * scale), maxHp: Math.floor(tmpl.hp * scale),
    atk: Math.floor(tmpl.atk * scale), def: tmpl.def,
    exp: tmpl.exp, gold: tmpl.gold, size: tmpl.size,
    anim: Math.random() * Math.PI * 2,
    aggro: false, moveTimer: rnd(0, 60),
    dead: false, deathAnim: 0,
  };
}

// ─── MOVEMENT ────────────────────────────────────────────────────────────────
const MOVE_SPEED = 0.08;
const HB = 0.28;

function canMove(x: number, y: number) {
  return isWalkable(Math.floor(x - HB), Math.floor(y - HB)) &&
         isWalkable(Math.floor(x + HB), Math.floor(y - HB)) &&
         isWalkable(Math.floor(x - HB), Math.floor(y + HB)) &&
         isWalkable(Math.floor(x + HB), Math.floor(y + HB));
}

export function tickMovement(
  state: GameState,
  keys: Set<string>,
  dt: number,
): { collidedEnemyId: number | null } {
  const hero = state.hero!;
  let dx = 0, dy = 0;
  if (keys.has('KeyW') || keys.has('ArrowUp')    || keys.has('dpad_up'))    dy = -1;
  if (keys.has('KeyS') || keys.has('ArrowDown')  || keys.has('dpad_down'))  dy =  1;
  if (keys.has('KeyA') || keys.has('ArrowLeft')  || keys.has('dpad_left'))  dx = -1;
  if (keys.has('KeyD') || keys.has('ArrowRight') || keys.has('dpad_right')) dx =  1;
  if (dx !== 0 && dy !== 0) { dx *= 0.707; dy *= 0.707; }

  const spd = MOVE_SPEED * (dt / 16);
  if (dx !== 0 || dy !== 0) {
    const nx = hero.px + dx * spd;
    const ny = hero.py + dy * spd;
    if (canMove(nx, hero.py)) hero.px = nx;
    if (canMove(hero.px, ny)) hero.py = ny;
    hero.moving = true;
    state.walkAnim += dt * 0.015;
    if (dx > 0) hero.facing = 3;
    else if (dx < 0) hero.facing = 2;
    else if (dy < 0) hero.facing = 1;
    else hero.facing = 0;
  } else {
    hero.moving = false;
  }

  // Camera smooth follow
  const targetX = hero.px - CAM_COLS / 2;
  const targetY = hero.py - CAM_ROWS / 2;
  state.cam.x += (targetX - state.cam.x) * 0.12;
  state.cam.y += (targetY - state.cam.y) * 0.12;
  state.cam.x = clamp(state.cam.x, 0, COLS - CAM_COLS);
  state.cam.y = clamp(state.cam.y, 0, ROWS - CAM_ROWS);

  // Check enemy collision
  for (const en of state.enemies) {
    if (!en.dead && Math.hypot(en.tx - hero.px, en.ty - hero.py) < 0.8) {
      return { collidedEnemyId: en.id };
    }
  }
  return { collidedEnemyId: null };
}

// ─── ENEMY AI ────────────────────────────────────────────────────────────────
export function tickEnemies(state: GameState, dt: number) {
  const hero = state.hero!;
  for (const en of state.enemies) {
    if (en.dead) {
      en.deathAnim = Math.min(1, en.deathAnim + 0.05 * (dt / 16));
      continue;
    }
    en.anim += dt * 0.003;
    en.moveTimer -= dt;
    if (en.moveTimer > 0) continue;
    en.moveTimer = rnd(40, 100);

    const dist = Math.hypot(en.tx - hero.px, en.ty - hero.py);
    if (dist < 6) en.aggro = true;
    if (dist > 10) en.aggro = false;

    const step = 0.5;
    let nx: number, ny: number;
    if (en.aggro) {
      const angle = Math.atan2(hero.py - en.ty, hero.px - en.tx);
      nx = en.tx + Math.cos(angle) * step;
      ny = en.ty + Math.sin(angle) * step;
    } else {
      const angle = Math.random() * Math.PI * 2;
      nx = en.tx + Math.cos(angle) * 0.4;
      ny = en.ty + Math.sin(angle) * 0.4;
    }
    if (isWalkable(Math.floor(nx), Math.floor(ny))) { en.tx = nx; en.ty = ny; }
  }
  // Prune fully faded dead enemies
  state.enemies = state.enemies.filter(e => !e.dead || e.deathAnim < 1);
}

// ─── PARTICLES & FLOATS ──────────────────────────────────────────────────────
export function spawnParticles(state: GameState, tx: number, ty: number, color: string, count: number) {
  for (let i = 0; i < count; i++) {
    state.particles.push({
      tx, ty, color,
      vx: (Math.random() - 0.5) * 0.12,
      vy: (Math.random() - 0.5) * 0.12 - 0.04,
      life: 1, size: rnd(2, 5),
    });
  }
}

export function addFloat(state: GameState, text: string, tx: number, ty: number, color: string) {
  state.floatingTexts.push({ text, tx, ty: ty - 0.3, color, life: 1.0, vy: -0.02 });
}

export function tickEffects(state: GameState, dt: number) {
  const f = dt / 16;
  for (const p of state.particles) {
    p.tx += p.vx * f; p.ty += p.vy * f;
    p.vy += 0.003 * f; p.life -= 0.03 * f;
  }
  state.particles = state.particles.filter(p => p.life > 0);
  for (const ft of state.floatingTexts) {
    ft.ty += ft.vy * f; ft.life -= 0.025 * f;
  }
  state.floatingTexts = state.floatingTexts.filter(ft => ft.life > 0);
}

// ─── BATTLE ──────────────────────────────────────────────────────────────────
export function startBattle(state: GameState, enemyId: number) {
  state.inBattle = true;
  state.battleEnemyId = enemyId;
  state.battle = makeBattleState();
  const name = state.enemies.find(e => e.id === enemyId)?.name ?? 'Inimigo';
  state.log = [...state.log, { text: `⚔ ${name} apareceu!`, type: 'sys' }];
}

export function endBattle(state: GameState, won: boolean) {
  state.inBattle = false;
  state.battleEnemyId = null;
  state.battle = makeBattleState();
  if (!won) {
    const hero = state.hero!;
    hero.hp = Math.floor(hero.maxHp * 0.5);
    hero.mp = hero.maxMp;
    hero.gold = Math.max(0, hero.gold - 10);
    hero.px = 5.5; hero.py = 7.5;
    state.cam.x = 0; state.cam.y = 0;
    addFloat(state, 'DERROTA!', hero.px, hero.py, '#e04040');
    state.log = [...state.log.slice(-60), { text: '💀 Você foi derrotado! Voltou à cidade.', type: 'sys' }];
  }
}

// ─── SKILL RESOLUTION ────────────────────────────────────────────────────────
export function resolveSkill(
  state: GameState,
  skillIdx: number,
): { enemyTurnCallback: (() => void) | null; heroDefeated: boolean } {
  const hero = state.hero!;
  const sk = hero.skills[skillIdx];

  if (!sk || hero.mp < sk.cost) {
    state.log = [...state.log, { text: '❌ MP insuficiente!', type: 'sys' }];
    return { enemyTurnCallback: null, heroDefeated: false };
  }

  const enemy = state.enemies.find(e => e.id === state.battleEnemyId);
  if (!enemy) return { enemyTurnCallback: null, heroDefeated: false };

  hero.mp -= sk.cost;

  const b = state.battle;
  if (b.buffAtkT > 0) b.buffAtkT--;
  if (b.blessT > 0) b.blessT--;

  const totalAtk = hero.atk
    + (b.buffAtkT > 0 ? b.buffAtk : 0)
    + (b.blessed && b.blessT > 0 ? 3 : 0);

  let skipEnemy = false;

  const addLog = (text: string, type: 'dmg' | 'heal' | 'hit' | 'sys' | 'exp' | '' = '') => {
    state.log = [...state.log.slice(-60), { text, type }];
  };

  if (['phys', 'magic', 'holy'].includes(sk.type)) {
    let dmg = Math.floor(totalAtk * sk.mult);
    dmg = Math.max(1, dmg - Math.floor(enemy.def * 0.4) + rnd(-2, 4));
    const crit = Math.random() < hero.critChance;
    if (crit) {
      dmg = Math.floor(dmg * 2);
      addLog(`⚡ CRÍTICO! ${sk.name} -${dmg} HP`, 'hit');
      addFloat(state, 'CRIT -' + dmg, enemy.tx, enemy.ty, '#ffe050');
    } else {
      addLog(`${sk.name}: -${dmg} HP`, 'dmg');
      addFloat(state, '-' + dmg, enemy.tx, enemy.ty, '#ff5040');
    }
    enemy.hp -= dmg;
    spawnParticles(state, enemy.tx, enemy.ty, '#ff5040', 8);

    // Double hit for Duplo
    if (sk.name === 'Duplo') {
      const d2 = Math.max(1, Math.floor(totalAtk * 0.7) - Math.floor(enemy.def * 0.3) + rnd(-1, 2));
      enemy.hp -= d2;
      addLog(`Segundo golpe: -${d2} HP`, 'dmg');
      addFloat(state, '-' + d2, enemy.tx, enemy.ty, '#ff8040');
    }

    if (enemy.hp <= 0) {
      resolveEnemyDeath(state, enemy);
      return { enemyTurnCallback: null, heroDefeated: false };
    }

  } else if (sk.type === 'heal') {
    const h = Math.floor(hero.maxHp * 0.36);
    hero.hp = Math.min(hero.maxHp, hero.hp + h);
    addLog(`Cura: +${h} HP`, 'heal');
    addFloat(state, '+' + h, hero.px, hero.py, '#40e870');
    spawnParticles(state, hero.px, hero.py, '#40e870', 6);

  } else if (sk.type === 'defend') {
    b.shieldUp = true;
    addLog('🛡 Escudo! DEF ×2 este turno', 'sys');

  } else if (sk.type === 'buff') {
    b.buffAtk = 5; b.buffAtkT = 3;
    addLog('💪 Grito! ATK+5 por 3 turnos', 'sys');

  } else if (sk.type === 'bless') {
    b.blessed = true; b.blessT = 2;
    addLog('✨ Benção! ATK+3, DEF+3 por 2 turnos', 'sys');

  } else if (sk.type === 'poison') {
    const dmg = Math.max(1, Math.floor(totalAtk * sk.mult) - Math.floor(enemy.def * 0.3) + rnd(-1, 2));
    enemy.hp -= dmg;
    b.poisoned = 4;
    addLog(`☠ Veneno! -${dmg} + envenenado/4tn`, 'dmg');
    addFloat(state, '-' + dmg, enemy.tx, enemy.ty, '#a0d040');
    spawnParticles(state, enemy.tx, enemy.ty, '#a0d040', 6);
    if (enemy.hp <= 0) {
      resolveEnemyDeath(state, enemy);
      return { enemyTurnCallback: null, heroDefeated: false };
    }

  } else if (sk.type === 'freeze') {
    const dmg = Math.max(1, Math.floor(totalAtk * sk.mult) - Math.floor(enemy.def * 0.3) + rnd(-1, 3));
    enemy.hp -= dmg;
    b.frozen = 2;
    skipEnemy = true;
    addLog(`❄ Congelado! -${dmg} + perde 2 turnos`, 'sys');
    addFloat(state, '-' + dmg, enemy.tx, enemy.ty, '#80c0ff');
    if (enemy.hp <= 0) {
      resolveEnemyDeath(state, enemy);
      return { enemyTurnCallback: null, heroDefeated: false };
    }

  } else if (sk.type === 'evade') {
    b.evading = true;
    addLog('💨 Evasão! Próximo ataque desviado', 'sys');
  }

  if (skipEnemy) return { enemyTurnCallback: null, heroDefeated: false };
  return { enemyTurnCallback: () => resolveEnemyTurn(state), heroDefeated: false };
}

// ─── ENEMY TURN ───────────────────────────────────────────────────────────────
// Returns true if hero was defeated
export function resolveEnemyTurn(state: GameState): boolean {
  const hero = state.hero!;
  const enemy = state.enemies.find(e => e.id === state.battleEnemyId);
  if (!enemy || enemy.dead) return false;

  const b = state.battle;
  const addLog = (text: string, type: 'dmg' | 'heal' | 'hit' | 'sys' | 'exp' | '' = '') => {
    state.log = [...state.log.slice(-60), { text, type }];
  };

  // Poison tick
  if (b.poisoned > 0) {
    const pd = rnd(4, 9);
    enemy.hp -= pd;
    b.poisoned--;
    addLog(`☠ Veneno: -${pd} no ${enemy.name}`, 'dmg');
    addFloat(state, '-' + pd, enemy.tx, enemy.ty, '#a0d040');
    if (enemy.hp <= 0) {
      resolveEnemyDeath(state, enemy);
      return false;
    }
  }

  // Frozen skip
  if (b.frozen > 0) {
    b.frozen--;
    addLog(`❄ ${enemy.name} está congelado!`, 'sys');
    return false;
  }

  // Evade
  if (b.evading) {
    b.evading = false;
    addLog('💨 Herói esquivou!', 'sys');
    addFloat(state, 'ESQUIVA!', hero.px, hero.py, '#a060d0');
    return false;
  }

  const effDef = hero.def
    + (b.shieldUp ? hero.def : 0)
    + (b.blessed && b.blessT > 0 ? 3 : 0);
  b.shieldUp = false;

  const dmg = Math.max(0, enemy.atk - Math.floor(effDef * 0.6) + rnd(-2, 4));
  hero.hp = Math.max(0, hero.hp - dmg);
  addLog(`${enemy.name} ataca: -${dmg} HP`, 'hit');
  addFloat(state, '-' + dmg, hero.px, hero.py, '#e08040');
  spawnParticles(state, hero.px, hero.py, '#e08040', 5);

  if (hero.hp <= 0) {
    addLog('💀 Você foi derrotado!', 'sys');
    return true; // signal defeat
  }
  return false;
}

function resolveEnemyDeath(state: GameState, enemy: Enemy) {
  const hero = state.hero!;
  state.log = [...state.log.slice(-60), {
    text: `✓ ${enemy.name} derrotado! +${enemy.exp} XP +${enemy.gold} ouro`,
    type: 'exp',
  }];
  hero.exp += enemy.exp;
  hero.gold += enemy.gold;
  enemy.dead = true;
  enemy.deathAnim = 0;
  spawnParticles(state, enemy.tx, enemy.ty, enemy.color, 16);
  addFloat(state, '💀', enemy.tx, enemy.ty, '#ffffff');
  checkLevelUp(state);
  endBattle(state, true);
}

function checkLevelUp(state: GameState) {
  const hero = state.hero!;
  while (hero.exp >= hero.expNext) {
    hero.exp -= hero.expNext;
    hero.level++;
    hero.expNext = Math.floor(hero.expNext * 1.45);
    hero.maxHp = Math.floor(hero.maxHp * 1.12);
    hero.hp = hero.maxHp;
    hero.maxMp = Math.floor(hero.maxMp * 1.1);
    hero.mp = hero.maxMp;
    hero.atk += 2; hero.def += 1;
    state.levelupTimer = 2500;
    addFloat(state, `NÍVEL ${hero.level}!`, hero.px, hero.py - 1, '#e8c96a');
    spawnParticles(state, hero.px, hero.py, '#e8c96a', 20);
    state.log = [...state.log.slice(-60), {
      text: `⬆ NÍVEL ${hero.level}! HP e MP restaurados!`,
      type: 'exp',
    }];
  }
}

export function tryFlee(state: GameState): boolean {
  if (Math.random() < 0.5) {
    const enemy = state.enemies.find(e => e.id === state.battleEnemyId);
    state.log = [...state.log.slice(-60), { text: '🏃 Fugiu com sucesso!', type: 'sys' }];
    if (enemy) {
      const hero = state.hero!;
      const dx = Math.sign(hero.px - enemy.tx);
      const dy = Math.sign(hero.py - enemy.ty);
      hero.px = Math.max(1, Math.min(COLS - 2, hero.px + dx * 1.5));
      hero.py = Math.max(1, Math.min(ROWS - 2, hero.py + dy * 1.5));
    }
    endBattle(state, true);
    return true;
  } else {
    state.log = [...state.log.slice(-60), { text: '❌ Fuga falhou!', type: 'sys' }];
    return false;
  }
}

export function getZoneLabel(tx: number, ty: number): string {
  const t = RAW_MAP[ty]?.[tx];
  if (t === T.FLOOR)   return '🏰 Cidade';
  if (t === T.DUNGEON) return '💀 Masmorra';
  if (t === T.ROAD)    return '🛤 Estrada';
  if (t === T.GRASS)   return '🌲 Floresta';
  if (t === T.WATER)   return '🌊 Rio';
  return '';
}