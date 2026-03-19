'use client';
import type { GameState } from '@/game/types';

interface Props {
  state: GameState;
}

export default function HUD({ state }: Props) {
  const hero = state.hero;
  if (!hero) return null;
  const b = state.battle;

  return (
    <div style={{
      position: 'absolute', top: 0, left: 0, right: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '8px 16px',
      background: 'rgba(8,8,14,0.88)',
      borderBottom: '1px solid #1e1e2a',
      fontFamily: "'Courier New', monospace",
      flexWrap: 'wrap', gap: 10, zIndex: 10,
      pointerEvents: 'none',
    }}>
      {/* Avatar + name */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: '1.5rem' }}>{hero.icon}</span>
        <div>
          <div style={{ color: '#e8c96a', fontSize: '0.82rem', letterSpacing: 1 }}>HERÓI</div>
          <div style={{ color: '#444', fontSize: '0.68rem' }}>
            {hero.name} · Lv{hero.level}
          </div>
        </div>
      </div>

      {/* Bars */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5, minWidth: 170 }}>
        <Bar
          icon="❤"
          current={hero.hp} max={hero.maxHp}
          fill="linear-gradient(90deg,#7b2020,#e04040)"
        />
        <Bar
          icon="💧"
          current={hero.mp} max={hero.maxMp}
          fill="linear-gradient(90deg,#1a3a7a,#4080e0)"
        />
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: 10 }}>
        {[
          { v: hero.atk + (b.buffAtkT > 0 ? b.buffAtk : 0), l: 'ATK' },
          { v: hero.def, l: 'DEF' },
          { v: hero.gold, l: 'OURO' },
        ].map(({ v, l }) => (
          <div key={l} style={{ textAlign: 'center' }}>
            <div style={{ color: '#e8c96a', fontSize: '0.9rem' }}>{v}</div>
            <div style={{ color: '#444', fontSize: '0.6rem' }}>{l}</div>
          </div>
        ))}
      </div>

      {/* XP */}
      <div style={{ minWidth: 110 }}>
        <div style={{ color: '#555', fontSize: '0.62rem', marginBottom: 3 }}>
          {hero.exp}/{hero.expNext} XP
        </div>
        <div style={{ height: 5, background: '#1a1a22', borderRadius: 2, overflow: 'hidden' }}>
          <div style={{
            height: '100%',
            width: `${Math.min(100, hero.exp / hero.expNext * 100)}%`,
            background: 'linear-gradient(90deg,#4a3a00,#e8c96a)',
            borderRadius: 2,
            transition: 'width 0.4s',
          }} />
        </div>
      </div>

      {/* Buffs indicators */}
      {(b.buffAtkT > 0 || b.blessT > 0 || b.poisoned > 0 || b.frozen > 0) && (
        <div style={{ display: 'flex', gap: 6 }}>
          {b.buffAtkT > 0 && <Buff icon="⚡" label={`ATK+${b.buffAtk} (${b.buffAtkT}t)`} color="#e8c96a" />}
          {b.blessT > 0   && <Buff icon="✨" label={`Benção (${b.blessT}t)`} color="#40c870" />}
          {b.poisoned > 0 && <Buff icon="☠" label={`Venenado (${b.poisoned}t)`} color="#a0d040" />}
          {b.frozen > 0   && <Buff icon="❄" label={`Congelado (${b.frozen}t)`} color="#80c0ff" />}
        </div>
      )}

      {/* Level up toast */}
      {state.levelupTimer > 0 && (
        <div style={{
          position: 'absolute', top: '100%', left: '50%',
          transform: 'translateX(-50%)',
          marginTop: 8,
          background: '#12120a',
          border: '1px solid #e8c96a',
          padding: '6px 18px',
          color: '#e8c96a', fontSize: '0.82rem', letterSpacing: 3,
          whiteSpace: 'nowrap', pointerEvents: 'none',
          boxShadow: '0 0 20px rgba(232,201,106,0.3)',
        }}>
          ⬆ NÍVEL {hero.level}!
        </div>
      )}
    </div>
  );
}

function Bar({ icon, current, max, fill }: { icon: string; current: number; max: number; fill: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <span style={{ fontSize: '0.7rem', width: 16, textAlign: 'center' }}>{icon}</span>
      <div style={{ flex: 1, height: 7, background: '#1a1a22', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{
          height: '100%',
          width: `${Math.max(0, current / max * 100)}%`,
          background: fill,
          borderRadius: 3,
          transition: 'width 0.25s',
        }} />
      </div>
      <span style={{ color: '#444', fontSize: '0.62rem', minWidth: 62, textAlign: 'right' }}>
        {current}/{max}
      </span>
    </div>
  );
}

function Buff({ icon, label, color }: { icon: string; label: string; color: string }) {
  return (
    <div style={{
      background: '#1a1a22', border: `1px solid ${color}44`,
      padding: '2px 6px', fontSize: '0.62rem', color,
    }}>
      {icon} {label}
    </div>
  );
}