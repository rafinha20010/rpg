'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import ClassSelect from '@/components/ClassSelect';
import HUD from '@/components/HUD';
import CombatPanel from '@/components/CombatPanel';
import { useGame } from '@/hooks/useGame';

export default function GamePage() {
  const canvasRef    = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { pickClass, doSkill, doFleeFn, dpadPress, dpadRelease, canvasClick, getState } = useGame(canvasRef);

  const [started, setStarted] = useState(false);
  const [tick, setTick]       = useState(0);
  const forceRender = useCallback(() => setTick(n => n + 1), []);

  // Re-render HUD/Combat at ~15fps
  useEffect(() => {
    if (!started) return;
    const id = setInterval(forceRender, 66);
    return () => clearInterval(id);
  }, [started, forceRender]);

  // Resize canvas
  useEffect(() => {
    if (!started) return;
    const resize = () => {
      const canvas    = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;
      canvas.width  = container.clientWidth;
      canvas.height = container.clientHeight;
    };
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, [started]);

  const handlePickClass = useCallback((cls: string) => {
    pickClass(cls);
    setStarted(true);
    setTimeout(() => {
      const canvas    = canvasRef.current;
      const container = containerRef.current;
      if (canvas && container) {
        canvas.width  = container.clientWidth;
        canvas.height = container.clientHeight;
      }
    }, 0);
  }, [pickClass]);

  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    canvasClick(e.clientX - rect.left, e.clientY - rect.top, canvas.width, canvas.height);
  }, [canvasClick]);

  if (!started) return <ClassSelect onPick={handlePickClass} />;

  const state   = getState();
  const isMobile = typeof window !== 'undefined' && 'ontouchstart' in window;
  const PANEL_W  = 220; // width of combat panel

  return (
    <div style={{
      width: '100vw', height: '100vh',
      background: '#0a0a0f',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* ── HUD (topo, pointer-events: none) ── */}
      <HUD state={state} key={tick} />

      {/* ── Canvas container — fica À ESQUERDA do painel durante batalha ── */}
      <div
        ref={containerRef}
        style={{
          position: 'absolute',
          top:    48,
          left:   0,
          right:  state.inBattle ? PANEL_W : 0,
          bottom: 0,
          zIndex: 1,
        }}
      >
        <canvas
          ref={canvasRef}
          onClick={handleCanvasClick}
          style={{
            display: 'block',
            width:  '100%',
            height: '100%',
            imageRendering: 'pixelated',
            cursor: 'crosshair',
          }}
        />
      </div>

      {/* ── Combat panel — z-index alto, pointer-events ativos ── */}
      <div style={{
        position: 'absolute',
        top:    0,
        right:  0,
        bottom: 0,
        width:  PANEL_W,
        zIndex: 20,           // acima do canvas
        pointerEvents: state.inBattle ? 'auto' : 'none',
        visibility: state.inBattle ? 'visible' : 'hidden',
      }}>
        <CombatPanel
          state={state}
          onSkill={doSkill}
          onFlee={doFleeFn}
          key={'cp-' + tick}
        />
      </div>

      {/* ── D-pad mobile ── */}
      {isMobile && (
        <div style={{
          position: 'absolute', bottom: 20, left: 20,
          zIndex: 30,
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 48px)',
          gridTemplateRows:    'repeat(3, 48px)',
          gap: 3,
        }}>
          {([ ['', 'up', ''], ['left', '', 'right'], ['', 'down', ''] ] as string[][]).map((row, ri) =>
            row.map((dir, ci) =>
              dir ? (
                <button
                  key={dir}
                  onTouchStart={() => dpadPress(dir)}
                  onTouchEnd={() => dpadRelease(dir)}
                  style={{
                    background: 'rgba(255,255,255,0.08)',
                    border: '1px solid rgba(255,255,255,0.14)',
                    borderRadius: 8, color: '#888', fontSize: '1.1rem',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', userSelect: 'none', touchAction: 'none',
                  }}
                >
                  {dir === 'up' ? '▲' : dir === 'down' ? '▼' : dir === 'left' ? '◀' : '▶'}
                </button>
              ) : (
                <div key={`${ri}-${ci}`} />
              )
            )
          )}
        </div>
      )}

      {/* ── Dica de controles ── */}
      {!state.inBattle && (
        <div style={{
          position: 'absolute', bottom: 10, right: 10,
          color: '#252530', fontSize: '0.62rem', letterSpacing: 1,
          lineHeight: 1.8, fontFamily: "'Courier New', monospace",
          pointerEvents: 'none',
          zIndex: 5,
        }}>
          WASD / ↑↓←→ mover<br />
          ESPAÇO / 1-4 habilidades<br />
          Clique no inimigo para atacar
        </div>
      )}
    </div>
  );
}