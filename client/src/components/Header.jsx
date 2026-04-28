import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function Header({ requests, ngos, connected, theme, toggleTheme }) {
  const navigate = useNavigate();
  const active   = requests.filter(r => r.status !== 'completed').length;
  const inProg   = requests.filter(r => r.status === 'in-progress').length;
  const critical = requests.filter(r => r.priority === 'CRITICAL' && r.status !== 'completed').length;
  const freeNgos = ngos.filter(n => n.status === 'idle').length;

  return (
    <header style={styles.header}>
      {/* Gradient accent line */}
      <div style={styles.accentLine} />

      <div style={styles.inner}>
        <div style={styles.logoSection}>
          <div style={styles.logoIcon}>
            <div style={{
              ...styles.dot,
              background: connected ? '#00e676' : '#ff3030',
              boxShadow: connected
                ? '0 0 8px rgba(0,230,118,.6)'
                : '0 0 8px rgba(255,48,48,.6)',
            }} />
          </div>
          <div>
            <span style={styles.logoText}>CRISIS GRID</span>
            <span style={styles.sub}>// DISASTER RESPONSE COMMAND</span>
          </div>
        </div>

        <div style={styles.stats}>
          <StatPill label="ACTIVE" value={active} color={active > 0 ? '#ff8c00' : '#6b7394'} icon="◉" />
          <StatPill label="CRITICAL" value={critical} color={critical > 0 ? '#ff3030' : '#6b7394'} icon="▲" />
          <StatPill label="IN PROGRESS" value={inProg} color={inProg > 0 ? '#00e676' : '#6b7394'} icon="◈" />
          <StatPill label="FREE NGOs" value={freeNgos} color="#4fc3f7" icon="⬡" />
          <div style={{
            ...styles.livePill,
            color: connected ? '#00e676' : '#ff3030',
            borderColor: connected ? 'rgba(0,230,118,.25)' : 'rgba(255,48,48,.25)',
            background: connected ? 'rgba(0,230,118,.06)' : 'rgba(255,48,48,.06)',
          }}>
            <div style={{
              width: 6, height: 6, borderRadius: '50%',
              background: connected ? '#00e676' : '#ff3030',
              animation: 'pulse 1.5s ease-in-out infinite',
            }} />
            {connected ? 'LIVE' : 'OFFLINE'}
          </div>
          <button 
            onClick={toggleTheme}
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 16,
              padding: '4px 8px',
              borderRadius: 8,
              border: '1px solid rgba(255, 255, 255, 0.1)',
              background: 'rgba(255, 255, 255, 0.05)',
              color: '#e8eaf0',
              cursor: 'pointer',
              marginLeft: 8,
              transition: 'all 0.2s ease',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}
            title="Toggle Light/Dark Mode"
            className="theme-ignore-invert"
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          <button 
            onClick={() => navigate('/login')}
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 10,
              fontWeight: 700,
              padding: '6px 12px',
              borderRadius: 8,
              border: '1px solid rgba(255, 69, 69, 0.5)',
              background: 'rgba(255, 69, 69, 0.1)',
              color: '#ff4545',
              cursor: 'pointer',
              marginLeft: 8,
              letterSpacing: 1,
              transition: 'all 0.2s ease'
            }}
            onMouseOver={e => e.currentTarget.style.background = 'rgba(255, 69, 69, 0.2)'}
            onMouseOut={e => e.currentTarget.style.background = 'rgba(255, 69, 69, 0.1)'}
          >
            LOG OUT
          </button>
        </div>
      </div>
    </header>
  );
}

function StatPill({ label, value, color, icon }) {
  return (
    <div style={styles.pill}>
      <span style={{ color: '#6b7394', fontSize: 9, letterSpacing: 0.5 }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <span style={{ color, fontSize: 10, opacity: .6 }}>{icon}</span>
        <span style={{
          color,
          fontWeight: 700,
          fontSize: 15,
          fontFamily: "var(--font-mono)",
          lineHeight: 1,
        }}>{value}</span>
      </div>
    </div>
  );
}

const styles = {
  header: {
    position: 'relative',
    flexShrink: 0,
    zIndex: 1000,
  },
  accentLine: {
    height: 2,
    background: 'linear-gradient(90deg, #ff4545, #ff8c00, #ffd600, #00e676, #4fc3f7, #ff4545)',
    backgroundSize: '200% 100%',
    animation: 'shimmer 4s linear infinite',
  },
  inner: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 20px',
    height: 54,
    background: 'rgba(17, 22, 34, .85)',
    backdropFilter: 'blur(16px)',
    borderBottom: '1px solid rgba(38, 46, 68, .6)',
  },
  logoSection: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  logoIcon: {
    width: 32, height: 32, borderRadius: 8,
    background: 'rgba(255, 69, 69, .1)',
    border: '1px solid rgba(255, 69, 69, .25)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  dot: {
    width: 8, height: 8, borderRadius: '50%',
    animation: 'pulse 1.5s ease-in-out infinite',
  },
  logoText: {
    fontFamily: "var(--font-mono)",
    fontSize: 15,
    fontWeight: 700,
    color: '#ff4545',
    letterSpacing: 2.5,
  },
  sub: {
    color: '#6b7394',
    fontSize: 10,
    letterSpacing: 1,
    marginLeft: 8,
    fontFamily: "var(--font-mono)",
  },
  stats: {
    display: 'flex',
    gap: 8,
    alignItems: 'center',
  },
  pill: {
    fontFamily: "var(--font-mono)",
    fontSize: 11,
    padding: '6px 12px',
    borderRadius: 8,
    border: '1px solid rgba(38, 46, 68, .6)',
    background: 'rgba(26, 32, 48, .5)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 2,
    minWidth: 64,
    transition: 'border-color .2s, background .2s',
  },
  livePill: {
    fontFamily: "var(--font-mono)",
    fontSize: 10,
    fontWeight: 700,
    padding: '6px 12px',
    borderRadius: 8,
    border: '1px solid',
    letterSpacing: 1,
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },
};
