'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  makeInitialState, createHero, spawnAllEnemies, spawnOneEnemy,
  tickMovement, tickEnemies, tickEffects,
  startBattle, resolveSkill, resolveEnemyTurn, tryFlee as doFlee, endBattle,
} from '@/game/logic';
import { renderGame } from '@/game/renderer';
import { CAM_COLS, CAM_ROWS, TILE } from '@/game/constants';
import type { GameState } from '@/game/types';

export function useGame(canvasRef: React.RefObject<HTMLCanvasElement | null>) {
  const stateRef  = useRef<GameState>(makeInitialState());
  const keysRef   = useRef<Set<string>>(new Set());
  const lastTsRef = useRef(0);
  const rafRef    = useRef<number>(0);
  const [, forceRender] = useState(0);
  const tick = useCallback(() => forceRender(n => n + 1), []);

  // ── Skill action (defined early so input handler can reference it) ─────────
  const doSkill = useCallback((idx: number) => {
    const s = stateRef.current;
    if (!s.inBattle || !s.hero) return;

    const { enemyTurnCallback } = resolveSkill(s, idx);
    tick();

    // Hero might have died from reflect / DoT — but that's not in our design
    // Main path: schedule enemy turn
    if (enemyTurnCallback) {
      setTimeout(() => {
        const defeated = resolveEnemyTurn(s);
        tick();
        if (defeated || s.hero!.hp <= 0) {
          setTimeout(() => { endBattle(s, false); tick(); }, 700);
        }
      }, 560);
    }
  }, [tick]);

  // ── Input ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    const onDown = (e: KeyboardEvent) => {
      keysRef.current.add(e.code);
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
        e.preventDefault();
      }
      const s = stateRef.current;
      if (s.inBattle) {
        if (e.code === 'Space' || e.code === 'Digit1') doSkill(0);
        if (e.code === 'Digit2') doSkill(1);
        if (e.code === 'Digit3') doSkill(2);
        if (e.code === 'Digit4') doSkill(3);
      }
    };
    const onUp = (e: KeyboardEvent) => keysRef.current.delete(e.code);
    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup',   onUp);
    return () => {
      window.removeEventListener('keydown', onDown);
      window.removeEventListener('keyup',   onUp);
    };
  }, [doSkill]);

  // ── Game loop ─────────────────────────────────────────────────────────────
  const loop = useCallback((ts: number) => {
    const dt = Math.min(50, ts - lastTsRef.current);
    lastTsRef.current = ts;
    const s = stateRef.current;

    if (s.hero) {
      if (!s.inBattle) {
        const { collidedEnemyId } = tickMovement(s, keysRef.current, dt);
        if (collidedEnemyId !== null) {
          startBattle(s, collidedEnemyId);
          tick();
        }
        tickEnemies(s, dt);
        s.spawnTimer -= dt;
        if (s.spawnTimer <= 0) {
          s.spawnTimer = 8000 + Math.random() * 8000;
          if (s.enemies.filter(e => !e.dead).length < 15) {
            const en = spawnOneEnemy(s.hero!, s.enemies);
            if (en) s.enemies.push(en);
          }
        }
      }
      tickEffects(s, dt);
      if (s.levelupTimer > 0) {
        s.levelupTimer -= dt;
        if (s.levelupTimer <= 0) tick();
      }
    }

    // Render
    const canvas = canvasRef.current;
    if (canvas && canvas.width > 0 && canvas.height > 0) {
      const ctx = canvas.getContext('2d');
      if (ctx) renderGame(ctx, s, canvas.width, canvas.height);
    }

    rafRef.current = requestAnimationFrame(loop);
  }, [canvasRef, tick]);

  useEffect(() => {
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [loop]);

  // ── Public API ────────────────────────────────────────────────────────────
  const pickClass = useCallback((cls: string) => {
    const s = stateRef.current;
    s.hero    = createHero(cls);
    s.enemies = spawnAllEnemies(s.hero);
    s.cam     = { x: 0, y: 0 };
    s.log     = [];
    tick();
  }, [tick]);

  const doFleeFn = useCallback(() => {
    const s = stateRef.current;
    const fled = doFlee(s);
    if (!fled) {
      // Fuga falhou — inimigo ataca
      setTimeout(() => {
        const defeated = resolveEnemyTurn(s);
        tick();
        if (defeated || s.hero!.hp <= 0) {
          setTimeout(() => { endBattle(s, false); tick(); }, 700);
        }
      }, 500);
    }
    tick();
  }, [tick]);

  const dpadPress   = useCallback((dir: string) => keysRef.current.add('dpad_' + dir), []);
  const dpadRelease = useCallback((dir: string) => keysRef.current.delete('dpad_' + dir), []);

  const canvasClick = useCallback((ex: number, ey: number, cw: number, ch: number) => {
    const s = stateRef.current;
    if (s.inBattle || !s.hero) return;
    const scaleX = cw / (CAM_COLS * TILE);
    const scaleY = ch / (CAM_ROWS * TILE);
    const scale  = Math.min(scaleX, scaleY);
    const ox = (cw - CAM_COLS * TILE * scale) / 2;
    const oy = (ch - CAM_ROWS * TILE * scale) / 2;
    const wtx = s.cam.x + (ex - ox) / (TILE * scale);
    const wty = s.cam.y + (ey - oy) / (TILE * scale);
    for (const en of s.enemies) {
      if (!en.dead && Math.hypot(en.tx - wtx, en.ty - wty) < 1) {
        startBattle(s, en.id);
        tick();
        return;
      }
    }
  }, [tick]);

  const getState = useCallback(() => stateRef.current, []);

  return { pickClass, doSkill, doFleeFn, dpadPress, dpadRelease, canvasClick, getState };
}