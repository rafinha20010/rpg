'use client';
import { CLASSES } from '@/game/constants';

interface Props {
  onPick: (cls: string) => void;
}

const CLASS_IDS = ['warrior', 'mage', 'rogue', 'cleric'];

const ACCENTS: Record<string, string> = {
  warrior: '#e05040',
  mage:    '#5080dc',
  rogue:   '#a060d0',
  cleric:  '#40c870',
};

export default function ClassSelect({ onPick }: Props) {
  return (
    <div style={{
      width: '100vw', height: '100vh',
      background: '#0a0a0f',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      gap: 28, fontFamily: "'Courier New', monospace",
    }}>
      <div style={{ textAlign: 'center' }}>
        <h1 style={{
          fontSize: 'clamp(1.8rem, 5vw, 3rem)',
          color: '#e8c96a',
          letterSpacing: 6,
          textShadow: '0 0 30px rgba(232,201,106,0.35)',
          margin: 0,
        }}>⚔ RPG 2D</h1>
        <p style={{ color: '#444', letterSpacing: 4, fontSize: '0.8rem', marginTop: 8 }}>
          ESCOLHA SUA CLASSE
        </p>
      </div>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center', padding: '0 16px' }}>
        {CLASS_IDS.map(id => {
          const C = CLASSES[id];
          const accent = ACCENTS[id];
          return (
            <button
              key={id}
              onClick={() => onPick(id)}
              style={{
                width: 160, padding: '24px 16px',
                background: '#12121a',
                border: `1px solid #2a2a3a`,
                cursor: 'pointer', textAlign: 'center',
                fontFamily: 'inherit',
                transition: 'all 0.2s',
                position: 'relative', overflow: 'hidden',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.borderColor = accent;
                (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.borderColor = '#2a2a3a';
                (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
              }}
            >
              <div style={{ fontSize: '2.6rem', marginBottom: 10 }}>{C.icon}</div>
              <div style={{ color: accent, letterSpacing: 2, fontSize: '0.9rem', marginBottom: 8, fontWeight: 600 }}>
                {C.name.toUpperCase()}
              </div>
              <div style={{ color: '#555', fontSize: '0.72rem', lineHeight: 1.6 }}>
                {id === 'warrior' && 'Alto HP e defesa.\nDano físico brutal.'}
                {id === 'mage'    && 'Baixo HP.\nMagia devastadora.'}
                {id === 'rogue'   && 'Veloz e furtivo.\nCríticos frequentes.'}
                {id === 'cleric'  && 'Cura e suporte.\nDano sagrado.'}
              </div>
              <div style={{
                marginTop: 14, display: 'flex', flexDirection: 'column', gap: 4,
              }}>
                {[
                  { label: 'HP',  val: C.hp / 200 },
                  { label: 'MP',  val: C.mp / 140 },
                  { label: 'ATK', val: C.atk / 16 },
                  { label: 'DEF', val: C.def / 12 },
                ].map(({ label, val }) => (
                  <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ color: '#444', fontSize: '0.65rem', width: 26, textAlign: 'left' }}>{label}</span>
                    <div style={{ flex: 1, height: 4, background: '#1e1e28', borderRadius: 2, overflow: 'hidden' }}>
                      <div style={{ width: `${Math.min(100, val * 100)}%`, height: '100%', background: accent, borderRadius: 2 }} />
                    </div>
                  </div>
                ))}
              </div>
            </button>
          );
        })}
      </div>

      <p style={{ color: '#2a2a3a', fontSize: '0.72rem', letterSpacing: 2 }}>
        WASD / ↑↓←→ para mover · ESPAÇO para atacar
      </p>
    </div>
  );
}