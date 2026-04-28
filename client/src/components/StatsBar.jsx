import React, { useEffect, useState, useRef } from 'react';

function AnimatedNumber({ value, duration = 600 }) {
  const [display, setDisplay] = useState(0);
  const prev = useRef(0);

  useEffect(() => {
    const start = prev.current;
    const diff = value - start;
    if (diff === 0) return;
    const startTime = performance.now();
    const animate = (now) => {
      const t = Math.min((now - startTime) / duration, 1);
      const ease = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(start + diff * ease));
      if (t < 1) requestAnimationFrame(animate);
      else prev.current = value;
    };
    requestAnimationFrame(animate);
  }, [value, duration]);

  return <span>{display}</span>;
}

export default function StatsBar({ requests, ngos }) {
  const completed = requests.filter(r => r.status === 'completed');
  const active = requests.filter(r => r.status !== 'completed');
  const totalPeople = requests.reduce((s, r) => s + r.people, 0);
  const helpedPeople = completed.reduce((s, r) => s + r.people, 0);
  const criticalCount = active.filter(r => r.priority === 'CRITICAL').length;

  const hotspots = active.filter(r => r.nearbyCount > 1).length;

  const totalCap = ngos.reduce((s, n) => s + n.capacity, 0);
  const usedCap = ngos.reduce((s, n) => s + n.used, 0);
  const capPct = totalCap > 0 ? Math.round((usedCap / totalCap) * 100) : 0;

  const stats = [
    { label: 'TOTAL REQUESTS', value: requests.length, icon: '📊', color: '#4fc3f7' },
    { label: 'PEOPLE AFFECTED', value: totalPeople, icon: '👥', color: '#ff8c00' },
    { label: 'PEOPLE HELPED', value: helpedPeople, icon: '✅', color: '#00e676' },
    { label: 'CRITICAL', value: criticalCount, icon: '🔴', color: criticalCount > 0 ? '#ff3030' : '#6b7394' },
    { label: 'HOTSPOTS', value: hotspots, icon: '🔥', color: hotspots > 0 ? '#ff8c00' : '#6b7394' },
    { label: 'NGO CAPACITY', value: capPct, icon: '⬡', color: capPct > 70 ? '#ff3030' : capPct > 40 ? '#ff8c00' : '#00e676', suffix: '%' },
  ];

  return (
    <div style={styles.bar}>
      {stats.map((s, i) => (
        <div key={s.label} style={{
          ...styles.stat,
          animation: `slideUp .3s ease-out ${i * 50}ms both`,
        }}>
          <span style={styles.statIcon}>{s.icon}</span>
          <div style={styles.statContent}>
            <span style={styles.statLabel}>{s.label}</span>
            <span style={{ ...styles.statValue, color: s.color }}>
              <AnimatedNumber value={s.value} />
              {s.suffix || ''}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

const styles = {
  bar: {
    display: 'flex',
    alignItems: 'center',
    gap: 2,
    padding: '6px 12px',
    background: 'rgba(17,22,34,.6)',
    borderBottom: '1px solid rgba(38,46,68,.4)',
    flexShrink: 0,
    overflowX: 'auto',
  },
  stat: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '6px 10px',
    borderRadius: 8,
    background: 'rgba(26,32,48,.3)',
    border: '1px solid rgba(38,46,68,.3)',
    minWidth: 120,
  },
  statIcon: { fontSize: 14, flexShrink: 0 },
  statContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: 1,
  },
  statLabel: {
    fontFamily: "var(--font-mono)",
    fontSize: 8,
    color: '#6b7394',
    letterSpacing: 1,
  },
  statValue: {
    fontFamily: "var(--font-mono)",
    fontSize: 16,
    fontWeight: 700,
    lineHeight: 1,
  },
};
