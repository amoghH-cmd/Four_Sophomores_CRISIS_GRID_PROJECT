import React from 'react';
import { PRIORITY_COLORS, formatTime, formatEta } from '../utils/helpers';

export default function RequestDetail({ req, tracking, onClose }) {
  if (!req) return null;
  const pc = PRIORITY_COLORS[req.priority] || '#ffd600';
  const eta = req.eta;

  const rows = [
    ['Request ID',      req.id],
    ['Location',        req.loc],
    ['Coordinates',     `${req.lat.toFixed(4)}, ${req.lng.toFixed(4)}`],
    ['Type',            req.type.toUpperCase()],
    ['People',          `${req.people} people`],
    ['Priority',        <span style={{ color: pc, fontWeight: 700 }}>{req.priority}</span>],
    ['Priority Score',  `${req.score} pts`],
    ['Status',          req.status.toUpperCase()],
    ['ETA',             formatEta(eta)],
    ['Description',     req.description || '—'],
    ['Assigned NGOs',   req.assigned?.length
      ? req.assigned.map(a => `${a.name} (${a.assignedCount} ppl, ${a.dist}km)`).join('\n')
      : 'None'],
    ['Alloc Score',     req.assigned?.[0]?.allocScore ?? '—'],
    ['Duplicate?',      req.isDuplicate ? '⚠️ Possible duplicate' : 'No'],
    ['Nearby Requests', req.nearbyCount > 0 ? `${req.nearbyCount} within 1km` : 'None'],
    ['Received',        formatTime(req.ts)],
  ];

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={e => e.stopPropagation()}>
        {/* Priority accent */}
        <div style={{ height: 3, background: `linear-gradient(90deg, ${pc}, ${pc}44)`, borderRadius: '12px 12px 0 0', margin: '-20px -20px 0 -20px' }} />

        <div style={styles.titleRow}>
          <div style={styles.titleLeft}>
            <span style={{ fontSize: 16 }}>📋</span>
            <span style={styles.title}>REQUEST DETAIL</span>
          </div>
          <span style={{ ...styles.pBadge, color: pc, borderColor: pc + '44', background: pc + '14' }}>
            {req.priority}
          </span>
          <button style={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        <div style={styles.body}>
          {rows.map(([k, v], i) => (
            <div key={k} style={{
              ...styles.row,
              background: i % 2 === 0 ? 'rgba(26,32,48,.3)' : 'transparent',
            }}>
              <span style={styles.key}>{k}</span>
              <span style={styles.val}>{v}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: 'fixed', inset: 0,
    background: 'rgba(0,0,0,.7)',
    backdropFilter: 'blur(6px)',
    zIndex: 2000,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    animation: 'fadeIn .2s ease-out',
  },
  modal: {
    background: 'rgba(17,22,34,.95)',
    border: '1px solid rgba(38,46,68,.6)',
    borderRadius: 14,
    padding: 20,
    width: 460,
    maxHeight: '80vh',
    overflowY: 'auto',
    animation: 'modalIn .3s ease-out',
    boxShadow: '0 20px 60px rgba(0,0,0,.5)',
  },
  titleRow: {
    display: 'flex', alignItems: 'center', gap: 10,
    marginTop: 16, marginBottom: 16,
  },
  titleLeft: {
    display: 'flex', alignItems: 'center', gap: 8, flex: 1,
  },
  title: {
    fontFamily: "var(--font-mono)",
    fontSize: 13,
    fontWeight: 700,
    letterSpacing: 1,
  },
  pBadge: {
    fontFamily: "var(--font-mono)",
    fontSize: 9,
    fontWeight: 700,
    padding: '3px 9px',
    borderRadius: 5,
    border: '1px solid',
  },
  closeBtn: {
    background: 'rgba(26,32,48,.5)',
    border: '1px solid rgba(38,46,68,.6)',
    borderRadius: 6,
    color: '#6b7394',
    cursor: 'pointer',
    padding: '4px 10px',
    fontSize: 13,
    transition: 'all .2s',
  },
  body: { borderRadius: 8, overflow: 'hidden' },
  row: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
    fontSize: 12, padding: '8px 10px',
    borderBottom: '1px solid rgba(38,46,68,.3)',
  },
  key: { color: '#6b7394', flexShrink: 0, marginRight: 12, fontSize: 11 },
  val: {
    color: '#e8eaf0', fontWeight: 500, textAlign: 'right',
    whiteSpace: 'pre-wrap', maxWidth: 280,
    fontFamily: "var(--font-mono)", fontSize: 11,
  },
};
