import { TILE, CAM_COLS, CAM_ROWS, COLS, ROWS, RAW_MAP, T, TILE_COLORS, TILE_DETAIL } from './constants';
import type { GameState } from './types';

interface Cam { x: number; y: number }

function worldToScreen(tx: number, ty: number, cam: Cam, cw: number, ch: number) {
  const scaleX = cw / (CAM_COLS * TILE);
  const scaleY = ch / (CAM_ROWS * TILE);
  const scale = Math.min(scaleX, scaleY);
  const ox = (cw - CAM_COLS * TILE * scale) / 2;
  const oy = (ch - CAM_ROWS * TILE * scale) / 2;
  const sx = (tx - cam.x) * TILE * scale + ox;
  const sy = (ty - cam.y) * TILE * scale + oy;
  return { sx, sy, scale };
}

export function renderGame(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  cw: number,
  ch: number,
) {
  const { hero, enemies, particles, floatingTexts, cam } = state;
  if (!hero) return;

  ctx.clearRect(0, 0, cw, ch);
  ctx.fillStyle = '#0a0a0f';
  ctx.fillRect(0, 0, cw, ch);

  drawMap(ctx, cam, cw, ch);
  drawEnemies(ctx, state, cw, ch);
  drawParticles(ctx, state, cw, ch);
  drawHero(ctx, state, cw, ch);
  drawFloatingTexts(ctx, state, cw, ch);
  drawZoneLabel(ctx, hero);
}

function drawMap(ctx: CanvasRenderingContext2D, cam: Cam, cw: number, ch: number) {
  const startCol = Math.max(0, Math.floor(cam.x));
  const endCol   = Math.min(COLS, Math.ceil(cam.x + CAM_COLS + 1));
  const startRow = Math.max(0, Math.floor(cam.y));
  const endRow   = Math.min(ROWS, Math.ceil(cam.y + CAM_ROWS + 1));

  for (let ty = startRow; ty < endRow; ty++) {
    for (let tx = startCol; tx < endCol; tx++) {
      const t = RAW_MAP[ty][tx];
      const { sx, sy, scale } = worldToScreen(tx, ty, cam, cw, ch);
      const s = TILE * scale;

      ctx.fillStyle = TILE_COLORS[t] ?? '#111';
      ctx.fillRect(sx, sy, s + 0.5, s + 0.5);

      // subtle corner detail
      const det = TILE_DETAIL[t];
      if (det) {
        ctx.fillStyle = det;
        ctx.fillRect(sx + s * 0.72, sy + s * 0.72, s * 0.22, s * 0.22);
      }

      // Decorations
      const seed = tx * 31 + ty * 17;
      ctx.font = `${Math.floor(s * 0.52)}px serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      if (t === T.GRASS) {
        if (seed % 11 === 0) { ctx.globalAlpha = 0.65; ctx.fillText('🌲', sx + s / 2, sy + s / 2); ctx.globalAlpha = 1; }
        else if (seed % 9 === 0) { ctx.globalAlpha = 0.45; ctx.fillText('🌿', sx + s / 2, sy + s / 2); ctx.globalAlpha = 1; }
      } else if (t === T.WATER) {
        if (seed % 8 === 0) { ctx.globalAlpha = 0.35; ctx.fillText('💧', sx + s / 2, sy + s / 2); ctx.globalAlpha = 1; }
      } else if (t === T.DUNGEON) {
        if (seed % 7 === 0) { ctx.globalAlpha = 0.35; ctx.fillText('💀', sx + s / 2, sy + s / 2); ctx.globalAlpha = 1; }
        else if (seed % 5 === 0) { ctx.globalAlpha = 0.25; ctx.fillText('🦴', sx + s / 2, sy + s / 2); ctx.globalAlpha = 1; }
      } else if (t === T.FLOOR) {
        if (seed % 14 === 0) { ctx.globalAlpha = 0.28; ctx.fillText('🏠', sx + s / 2, sy + s / 2); ctx.globalAlpha = 1; }
        else if (seed % 20 === 0) { ctx.globalAlpha = 0.2; ctx.fillText('⛺', sx + s / 2, sy + s / 2); ctx.globalAlpha = 1; }
      }
    }
  }
}

function drawHero(ctx: CanvasRenderingContext2D, state: GameState, cw: number, ch: number) {
  const hero = state.hero!;
  const { sx, sy, scale } = worldToScreen(hero.px, hero.py, state.cam, cw, ch);
  const s = TILE * scale;
  const bobY = hero.moving ? Math.sin(state.walkAnim * 8) * s * 0.08 : 0;

  // Shadow
  ctx.beginPath();
  ctx.ellipse(sx, sy + s * 0.12, s * 0.28, s * 0.1, 0, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  ctx.fill();

  // Glow ring
  const grd = ctx.createRadialGradient(sx, sy + bobY, 0, sx, sy + bobY, s * 0.5);
  grd.addColorStop(0, hero.color + '55');
  grd.addColorStop(1, 'transparent');
  ctx.fillStyle = grd;
  ctx.beginPath();
  ctx.ellipse(sx, sy + bobY, s * 0.5, s * 0.5, 0, 0, Math.PI * 2);
  ctx.fill();

  // Icon
  ctx.font = `${Math.floor(s * 0.72)}px serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(hero.icon, sx, sy + bobY - s * 0.02);

  // Name tag
  ctx.font = `bold ${Math.floor(s * 0.2)}px 'Courier New', monospace`;
  ctx.fillStyle = '#e8c96a';
  ctx.textBaseline = 'bottom';
  ctx.fillText('HERÓI', sx, sy + bobY - s * 0.44);
  ctx.textBaseline = 'middle';
}

function drawEnemies(ctx: CanvasRenderingContext2D, state: GameState, cw: number, ch: number) {
  for (const en of state.enemies) {
    const { sx, sy, scale } = worldToScreen(en.tx, en.ty, state.cam, cw, ch);
    const s = TILE * scale;
    const ss = (en.size / 32) * s;

    if (en.dead) ctx.globalAlpha = 1 - en.deathAnim;

    const bob = Math.sin(en.anim * 2) * s * 0.05;

    // Aggro glow
    if (en.aggro && !en.dead) {
      const grd = ctx.createRadialGradient(sx, sy, 0, sx, sy, s * 0.65);
      grd.addColorStop(0, en.color + '44');
      grd.addColorStop(1, 'transparent');
      ctx.fillStyle = grd;
      ctx.beginPath();
      ctx.ellipse(sx, sy, s * 0.65, s * 0.65, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Shadow
    ctx.beginPath();
    ctx.ellipse(sx, sy + ss * 0.12, ss * 0.28, ss * 0.08, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.fill();

    // Icon
    ctx.font = `${Math.floor(ss * 0.82)}px serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(en.icon, sx, sy + bob);

    // HP bar
    if (!en.dead) {
      const bw = ss * 1.1, bh = s * 0.09;
      const bx = sx - bw / 2, by = sy - ss * 0.56;
      ctx.fillStyle = '#1a1a22';
      ctx.fillRect(bx, by, bw, bh);
      const hpRatio = en.hp / en.maxHp;
      ctx.fillStyle = hpRatio > 0.5 ? '#20aa40' : hpRatio > 0.25 ? '#ddaa20' : '#dd3020';
      ctx.fillRect(bx, by, bw * hpRatio, bh);

      if (en.aggro) {
        ctx.font = `bold ${Math.floor(s * 0.18)}px 'Courier New', monospace`;
        ctx.fillStyle = '#e04040';
        ctx.textBaseline = 'bottom';
        ctx.fillText('!', sx, by);
        ctx.textBaseline = 'middle';
      }
    }
    ctx.globalAlpha = 1;
  }
}

function drawParticles(ctx: CanvasRenderingContext2D, state: GameState, cw: number, ch: number) {
  for (const p of state.particles) {
    const { sx, sy, scale } = worldToScreen(p.tx, p.ty, state.cam, cw, ch);
    ctx.globalAlpha = Math.max(0, p.life);
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(sx, sy, Math.max(1, p.size * scale * 0.04 * TILE), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawFloatingTexts(ctx: CanvasRenderingContext2D, state: GameState, cw: number, ch: number) {
  for (const f of state.floatingTexts) {
    const { sx, sy, scale } = worldToScreen(f.tx, f.ty, state.cam, cw, ch);
    const s = TILE * scale;
    ctx.globalAlpha = Math.max(0, f.life);
    ctx.font = `bold ${Math.floor(s * 0.3)}px 'Courier New', monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.strokeStyle = 'rgba(0,0,0,0.85)';
    ctx.lineWidth = 3;
    ctx.strokeText(f.text, sx, sy);
    ctx.fillStyle = f.color;
    ctx.fillText(f.text, sx, sy);
  }
  ctx.globalAlpha = 1;
  ctx.lineWidth = 1;
}

function drawZoneLabel(ctx: CanvasRenderingContext2D, hero: GameState['hero']) {
  if (!hero) return;
  const tile = RAW_MAP[Math.floor(hero.py)]?.[Math.floor(hero.px)];
  let label = '';
  if (tile === T.FLOOR)   label = '🏰 Cidade';
  else if (tile === T.DUNGEON) label = '💀 Masmorra';
  else if (tile === T.ROAD)    label = '🛤 Estrada';
  else if (tile === T.GRASS)   label = '🌲 Floresta';
  else if (tile === T.WATER)   label = '🌊 Rio';
  if (!label) return;
  ctx.font = `11px 'Courier New', monospace`;
  ctx.fillStyle = 'rgba(200,180,100,0.55)';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText(label, 10, 8);
}