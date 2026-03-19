'use client';
import { useEffect, useRef } from 'react';
import type { GameState } from '@/game/types';

interface Props {
  state: GameState;
  onSkill: (idx: number) => void;
  onFlee: () => void;
}

const LOG_COLORS: Record<string, string> = {
  dmg:  '#e04040',
  heal: '#40c870',
  hit:  '#e08040',
  sys:  '#e8c96a',
  exp:  '#c0a040',
  '':   '#444',
};

export default function CombatPanel({ state, onSkill, onFlee }: Props) {
  const logRef = useRef<HTMLDivElement>(null);
  const hero = state.hero!;
  const enemy = state.enemies.find(e => e.id === state.battleEnemyId);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [state.log.length]);

  if (!state.inBattle || !enemy) return null;

  const hpRatio = Math.max(0, enemy.hp / enemy.maxHp);

  return (
    <div style={{
      position: 'absolute', right: 0, top: 0, bottom: 0, width: 220,
      background: 'rgba(8,8,14,0.95)',
      borderLeft: '1px solid #1e1e2a',
      display: 'flex', flexDirection: 'column',
      fontFamily: "'Courier New', monospace",
      zIndex: 10,
    }}>
      {/* Enemy */}
      <div style={{ padding: '14px', borderBottom: '1px solid #1e1e2a' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          color: '#e04040', fontSize: '0.85rem', letterSpacing: 1,
          marginBottom: 10,
        }}>
          <span style={{ fontSize: '1.5rem' }}>{enemy.icon}</span>
          <div>
            <div>{enemy.name}</div>
            <div style={{ color: '#444', fontSize: '0.65rem' }}>Lv {enemy.tmpl.danger}</div>
          </div>
        </div>
        <div style={{ height: 8, background: '#1a1a22', borderRadius: 3, overflow: 'hidden', marginBottom: 4 }}>
          <div style={{
            height: '100%',
            width: `${hpRatio * 100}%`,
            background: hpRatio > 0.5 ? 'linear-gradient(90deg,#1a5020,#20aa40)'
                      : hpRatio > 0.25 ? 'linear-gradient(90deg,#5a4a00,#ddaa20)'
                      : 'linear-gradient(90deg,#5a1010,#dd3020)',
            transition: 'width 0.35s',
          }} />
        </div>
        <div style={{ color: '#444', fontSize: '0.65rem', textAlign: 'right' }}>
          {Math.max(0, enemy.hp)} / {enemy.maxHp} HP
        </div>
      </div>

      {/* Log */}
      <div
        ref={logRef}
        style={{
          flex: 1, overflowY: 'auto', padding: '10px',
          display: 'flex', flexDirection: 'column', gap: 3,
        }}
      >
        {state.log.slice(-40).map((entry, i) => (
          <div key={i} style={{
            fontSize: '0.7rem', lineHeight: 1.5,
            color: LOG_COLORS[entry.type] ?? '#444',
          }}>
            {entry.text}
          </div>
        ))}
      </div>

      {/* Actions */}
      <div style={{
        padding: '10px',
        display: 'grid', gridTemplateColumns: '1fr 1fr',
        gap: 6,
        borderTop: '1px solid #1e1e2a',
      }}>
        {hero.skills.map((sk, i) => (
          <SkillBtn
            key={sk.name}
            label={sk.name}
            sub={sk.cost > 0 ? `${sk.cost}MP` : 'livre'}
            disabled={sk.cost > hero.mp}
            onClick={() => onSkill(i)}
          />
        ))}
        <SkillBtn label="Fugir" sub="50%" onClick={onFlee} />
      </div>
    </div>
  );
}

function SkillBtn({
  label, sub, disabled, onClick,
}: { label: string; sub: string; disabled?: boolean; onClick: () => void }) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      style={{
        background: '#12121a',
        border: '1px solid #2a2a3a',
        color: disabled ? '#2a2a3a' : '#aaa',
        fontFamily: "'Courier New', monospace",
        fontSize: '0.68rem',
        padding: '8px 4px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        letterSpacing: 0.5,
        transition: 'all 0.15s',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', gap: 2,
      }}
      onMouseEnter={e => {
        if (!disabled) {
          (e.currentTarget).style.borderColor = '#e8c96a';
          (e.currentTarget).style.color = '#e8c96a';
        }
      }}
      onMouseLeave={e => {
        (e.currentTarget).style.borderColor = '#2a2a3a';
        (e.currentTarget).style.color = disabled ? '#2a2a3a' : '#aaa';
      }}
    >
      {label}
      <span style={{ color: '#3a4a6a', fontSize: '0.6rem' }}>{sub}</span>
    </button>
  );
}