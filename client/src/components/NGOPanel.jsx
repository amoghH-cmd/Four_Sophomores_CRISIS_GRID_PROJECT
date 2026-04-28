import React from 'react';

export default function NGOPanel({ ngos }) {
  return (
    <div style={styles.wrap}>
      <div style={styles.header}>
        <span style={styles.headerDot} />
        NGO NETWORK
        <span style={styles.count}>{ngos.length}</span>
      </div>
      <div style={styles.list}>
        {ngos.map((n, i) => {
          const avail = n.capacity - n.used;
          const pct = Math.round((avail / n.capacity) * 100);
          const barColor = pct > 60 ? '#00e676' : pct > 30 ? '#ff8c00' : '#ff3030';
          const statusColor = n.status === 'idle' ? '#00e676' : n.status === 'on-site' ? '#4fc3f7' : '#ff8c00';
          const statusLabel = n.status === 'idle' ? 'AVAILABLE' : n.status === 'on-site' ? 'ON SITE' : 'DEPLOYED';

          return (
            <div key={n.id} style={{ ...styles.card, animation: `slideUp .3s ease-out ${i * 60}ms both` }}>
              <div style={styles.nameRow}>
                <div style={{ ...styles.dot, background: statusColor, boxShadow: `0 0 6px ${statusColor}88` }} />
                <span style={styles.name}>{n.name}</span>
                <span style={{ ...styles.statusPill, color: statusColor, borderColor: statusColor + '33', background: statusColor + '10' }}>
                  {statusLabel}
                </span>
              </div>

              <div style={styles.resources}>
                {n.resources.map(r => (
                  <span key={r} style={styles.resBadge}>
                    {r === 'medical' ? '🏥' : r === 'food' ? '🍞' : '🚁'} {r}
                  </span>
                ))}
              </div>

              <div style={styles.capRow}>
                <div style={styles.capBar}>
                  <div style={{
                    ...styles.capFill,
                    width: `${pct}%`,
                    background: `linear-gradient(90deg, ${barColor}, ${barColor}cc)`,
                    boxShadow: `0 0 6px ${barColor}44`,
                  }} />
                </div>
                <span style={{ ...styles.capLabel, color: barColor }}>{avail}/{n.capacity}</span>
              </div>

              {n.used > 0 && (
                <div style={styles.serving}>
                  <span style={{ opacity: .5 }}>▸</span> Serving {n.used} people
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

const styles = {
  wrap: { display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' },
  header: {
    padding: '12px 14px',
    borderBottom: '1px solid rgba(38,46,68,.6)',
    flexShrink: 0,
    fontFamily: "var(--font-mono)",
    fontSize: 10,
    color: '#6b7394',
    letterSpacing: 1.5,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  headerDot: {
    width: 6, height: 6, borderRadius: '50%',
    background: '#00e676',
    animation: 'pulse 2s ease-in-out infinite',
    display: 'inline-block',
  },
  count: {
    marginLeft: 'auto',
    background: 'rgba(79,195,247,.12)',
    color: '#4fc3f7',
    padding: '2px 7px',
    borderRadius: 8,
    fontSize: 10,
    fontWeight: 700,
  },
  list: { flex: 1, overflowY: 'auto', padding: '6px 8px' },
  card: {
    background: 'rgba(26,32,48,.5)',
    border: '1px solid rgba(38,46,68,.6)',
    borderRadius: 10,
    padding: '10px 12px',
    marginBottom: 6,
    transition: 'border-color .2s',
  },
  nameRow: { display: 'flex', alignItems: 'center', gap: 7, marginBottom: 6 },
  dot: { width: 7, height: 7, borderRadius: '50%', flexShrink: 0 },
  name: { fontSize: 13, fontWeight: 600, flex: 1, color: '#e8eaf0' },
  statusPill: {
    fontFamily: "var(--font-mono)",
    fontSize: 8,
    fontWeight: 700,
    padding: '2px 7px',
    borderRadius: 4,
    border: '1px solid',
    letterSpacing: .5,
  },
  resources: { display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 8 },
  resBadge: {
    fontSize: 9,
    padding: '3px 8px',
    borderRadius: 5,
    border: '1px solid rgba(38,46,68,.6)',
    background: 'rgba(26,32,48,.3)',
    color: '#9aa0b8',
    fontFamily: "var(--font-mono)",
  },
  capRow: { display: 'flex', alignItems: 'center', gap: 8 },
  capBar: { flex: 1, height: 4, background: 'rgba(38,46,68,.4)', borderRadius: 3, overflow: 'hidden' },
  capFill: { height: '100%', borderRadius: 3, transition: 'width .6s ease-out' },
  capLabel: {
    fontFamily: "var(--font-mono)",
    fontSize: 10,
    minWidth: 38,
    textAlign: 'right',
    fontWeight: 600,
  },
  serving: {
    fontSize: 10,
    color: '#ff8c00',
    marginTop: 5,
    fontFamily: "var(--font-mono)",
  },
};
