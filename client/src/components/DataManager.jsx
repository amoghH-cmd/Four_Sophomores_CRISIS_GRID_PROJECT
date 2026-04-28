import React, { useState } from 'react';

export default function DataManager({
  requests, ngos, commsLog, smsLog,
  onDeleteRequests, onDeleteNGOs, onDeleteComms, onDeleteSMSLog,
  onReset, onResetAll,
}) {
  const [confirm, setConfirm] = useState(null);
  const [busy,    setBusy]    = useState(false);
  const [done,    setDone]    = useState({});

  const flash = (key) => {
    setDone(d => ({ ...d, [key]: true }));
    setTimeout(() => setDone(d => { const n = { ...d }; delete n[key]; return n; }), 2500);
  };

  const run = async (key, fn) => {
    setBusy(true);
    try { await fn(); flash(key); } catch (e) { /* ignore */ } finally { setBusy(false); setConfirm(null); }
  };

  const actions = [
    {
      key: 'requests',
      icon: '📥',
      label: 'Delete All Requests',
      desc: `${requests.length} SOS request${requests.length !== 1 ? 's' : ''} in system`,
      count: requests.length,
      color: '#ff8c00',
      fn: onDeleteRequests,
      warning: 'This will delete all SOS requests but keep NGOs and logs.',
    },
    {
      key: 'ngos',
      icon: '🏢',
      label: 'Delete All NGOs',
      desc: `${ngos.length} NGO${ngos.length !== 1 ? 's' : ''} registered`,
      count: ngos.length,
      color: '#ce93d8',
      fn: onDeleteNGOs,
      warning: 'This will remove all NGOs. You can re-import them via NGO Platform.',
    },
    {
      key: 'comms',
      icon: '📡',
      label: 'Clear Comms Log',
      desc: `${commsLog.length} comms entries`,
      count: commsLog.length,
      color: '#4fc3f7',
      fn: onDeleteComms,
      warning: 'This will clear the communications log.',
    },
    {
      key: 'sms',
      icon: '📱',
      label: 'Clear SMS Log',
      desc: `${smsLog.length} SMS events`,
      count: smsLog.length,
      color: '#00e676',
      fn: onDeleteSMSLog,
      warning: 'This will clear the SMS trigger history.',
    },
  ];

  return (
    <div style={s.wrap}>
      <div style={s.header}>
        <span style={s.headerDot} />
        DATA MANAGER
      </div>

      <div style={s.scroll}>
        <div style={s.sectionTitle}>⚙️ SELECTIVE DELETE</div>

        {actions.map(a => (
          <div key={a.key} style={s.actionCard}>
            <div style={s.actionLeft}>
              <span style={s.actionIcon}>{a.icon}</span>
              <div>
                <div style={s.actionLabel}>{a.label}</div>
                <div style={s.actionDesc}>{a.desc}</div>
              </div>
            </div>
            <button
              style={{
                ...s.deleteBtn,
                background: done[a.key] ? 'rgba(0,230,118,.15)' : `rgba(${a.color === '#ff8c00' ? '255,140,0' : a.color === '#ce93d8' ? '206,147,216' : a.color === '#4fc3f7' ? '79,195,247' : '0,230,118'},.1)`,
                borderColor: done[a.key] ? '#00e676' : a.color + '44',
                color: done[a.key] ? '#00e676' : a.color,
                opacity: busy ? 0.6 : 1,
              }}
              disabled={busy || a.count === 0}
              onClick={() => setConfirm({ ...a })}
            >
              {done[a.key] ? '✅ Done' : '🗑 Delete'}
            </button>
          </div>
        ))}

        <div style={s.divider} />
        <div style={s.sectionTitle}>🔄 FULL RESET</div>

        <div style={s.resetCard}>
          <div>
            <div style={s.resetLabel}>↺ Soft Reset</div>
            <div style={s.resetDesc}>Clears all requests, comms, SMS log. Re-seeds default 6 NGOs.</div>
          </div>
          <button style={{ ...s.softResetBtn, opacity: busy ? 0.6 : 1 }} disabled={busy} onClick={() => setConfirm({ key: 'reset', label: 'Soft Reset', warning: 'Clears requests/comms/SMS log and restores the default 6 NGOs.', fn: onReset, color: '#ff8c00' })}>
            ↺ RESET
          </button>
        </div>

        <div style={s.resetCard}>
          <div>
            <div style={{ ...s.resetLabel, color: '#ff4545' }}>☢️ Full Wipe</div>
            <div style={s.resetDesc}>Wipes ALL data including NGOs. Blank slate.</div>
          </div>
          <button style={{ ...s.hardResetBtn, opacity: busy ? 0.6 : 1 }} disabled={busy} onClick={() => setConfirm({ key: 'nuclear', label: 'Full Wipe', warning: '⚠️ This removes EVERYTHING — all requests, all NGOs, all logs. You will need to re-add NGOs manually.', fn: onResetAll, color: '#ff4545' })}>
            ☢️ WIPE ALL
          </button>
        </div>

        <div style={s.statsGrid}>
          <div style={s.stat}><div style={s.statNum}>{requests.length}</div><div style={s.statLabel}>Requests</div></div>
          <div style={s.stat}><div style={s.statNum}>{ngos.length}</div><div style={s.statLabel}>NGOs</div></div>
          <div style={s.stat}><div style={s.statNum}>{commsLog.length}</div><div style={s.statLabel}>Comms</div></div>
          <div style={s.stat}><div style={s.statNum}>{smsLog.length}</div><div style={s.statLabel}>SMS Logs</div></div>
        </div>
      </div>

      {/* Confirm Dialog */}
      {confirm && (
        <div style={s.overlay}>
          <div style={s.dialog}>
            <div style={{ ...s.dialogIcon, color: confirm.color }}>{confirm.icon || '⚠️'}</div>
            <div style={s.dialogTitle}>{confirm.label}</div>
            <div style={s.dialogText}>{confirm.warning}</div>
            <div style={s.dialogBtns}>
              <button
                style={{ ...s.dialogConfirm, borderColor: confirm.color + '66', color: confirm.color, background: confirm.color + '15' }}
                onClick={() => run(confirm.key, confirm.fn)}
                disabled={busy}
              >
                {busy ? '⏳ Working...' : '✓ Confirm'}
              </button>
              <button style={s.dialogCancel} onClick={() => setConfirm(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const s = {
  wrap: { display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden', minHeight: 0 },
  header: {
    padding: '10px 14px', borderBottom: '1px solid rgba(38,46,68,.6)',
    fontFamily: 'var(--font-mono)', fontSize: 10, color: '#6b7394', letterSpacing: 1.5,
    display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0,
  },
  headerDot: { width: 6, height: 6, borderRadius: '50%', background: '#ff4545', display: 'inline-block', animation: 'pulse 2s ease-in-out infinite' },
  scroll: { flex: 1, overflowY: 'auto', padding: '10px 12px' },
  sectionTitle: { fontFamily: 'var(--font-mono)', fontSize: 9, color: '#6b7394', letterSpacing: 1.5, marginBottom: 8, marginTop: 4 },
  actionCard: { display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', background: 'rgba(26,32,48,.5)', border: '1px solid rgba(38,46,68,.6)', borderRadius: 9, marginBottom: 6 },
  actionLeft: { display: 'flex', alignItems: 'center', gap: 10, flex: 1 },
  actionIcon: { fontSize: 20 },
  actionLabel: { fontSize: 12, fontWeight: 600, color: '#e8eaf0', marginBottom: 2 },
  actionDesc: { fontSize: 10, color: '#6b7394', fontFamily: 'var(--font-mono)' },
  deleteBtn: { padding: '6px 12px', border: '1px solid', borderRadius: 6, fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700, cursor: 'pointer', flexShrink: 0, transition: 'all .2s' },
  divider: { borderTop: '1px solid rgba(38,46,68,.4)', margin: '14px 0' },
  resetCard: { display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: 'rgba(26,32,48,.5)', border: '1px solid rgba(38,46,68,.6)', borderRadius: 9, marginBottom: 8 },
  resetLabel: { fontSize: 12, fontWeight: 700, color: '#e8eaf0', marginBottom: 2 },
  resetDesc: { fontSize: 10, color: '#6b7394' },
  softResetBtn: { padding: '7px 12px', background: 'rgba(255,140,0,.1)', border: '1px solid rgba(255,140,0,.3)', color: '#ff8c00', borderRadius: 6, fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700, cursor: 'pointer', flexShrink: 0 },
  hardResetBtn: { padding: '7px 12px', background: 'rgba(255,69,69,.1)',  border: '1px solid rgba(255,69,69,.3)',  color: '#ff4545', borderRadius: 6, fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700, cursor: 'pointer', flexShrink: 0 },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 6, marginTop: 16 },
  stat: { background: 'rgba(26,32,48,.5)', border: '1px solid rgba(38,46,68,.4)', borderRadius: 8, padding: '8px', textAlign: 'center' },
  statNum: { fontSize: 20, fontWeight: 700, color: '#4fc3f7', fontFamily: 'var(--font-mono)' },
  statLabel: { fontSize: 8, color: '#6b7394', letterSpacing: 1, marginTop: 2 },

  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 },
  dialog: { background: '#0d111a', border: '1px solid rgba(38,46,68,.8)', borderRadius: 14, padding: 28, maxWidth: 340, width: '90%', textAlign: 'center' },
  dialogIcon: { fontSize: 32, marginBottom: 10 },
  dialogTitle: { fontSize: 16, fontWeight: 700, color: '#e8eaf0', marginBottom: 10 },
  dialogText: { fontSize: 12, color: '#9aa0b8', lineHeight: 1.6, marginBottom: 20 },
  dialogBtns: { display: 'flex', gap: 10, justifyContent: 'center' },
  dialogConfirm: { padding: '9px 24px', border: '1px solid', borderRadius: 8, fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, cursor: 'pointer' },
  dialogCancel: { padding: '9px 24px', background: 'rgba(26,32,48,.5)', border: '1px solid rgba(38,46,68,.6)', color: '#9aa0b8', borderRadius: 8, fontFamily: 'var(--font-mono)', fontSize: 11, cursor: 'pointer' },
};
