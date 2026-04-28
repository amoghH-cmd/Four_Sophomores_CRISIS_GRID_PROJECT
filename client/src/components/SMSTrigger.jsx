import React, { useState } from 'react';

export default function SMSTrigger({ smsLog, onClearLog }) {
  const [tab,    setTab]    = useState('log'); // 'log' | 'info'

  return (
    <div style={s.wrap}>
      <div style={s.header}>
        <span style={s.headerDot} />
        SMS LOG
        <div style={s.tabs}>
          {['log', 'info'].map(t => (
            <button key={t} style={{ ...s.tab, ...(tab === t ? s.tabActive : {}) }} onClick={() => setTab(t)}>
              {t === 'log' ? '📋' : 'ℹ️'} {t.toUpperCase()}
            </button>
          ))}
        </div>
      </div>



      {tab === 'log' && (
        <div style={s.body}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ color: '#6b7394', fontSize: 10, fontFamily: 'monospace' }}>{smsLog.length} ENTRIES</span>
            <button style={s.clearBtn} onClick={onClearLog}>🗑 Clear</button>
          </div>
          <div style={s.logScroll}>
            {smsLog.length === 0 && (
              <div style={{ color: '#6b7394', fontSize: 11, textAlign: 'center', padding: 20 }}>No SMS events yet</div>
            )}
            {smsLog.map(entry => (
              <div key={entry.id} style={{ ...s.logEntry, borderLeftColor: entry.status === 'processed' ? '#00e676' : entry.status === 'error' ? '#ff4545' : '#ff8c00' }}>
                <div style={s.logTop}>
                  <span style={{ ...s.logStatus, color: entry.status === 'processed' ? '#00e676' : entry.status === 'error' ? '#ff4545' : '#ff8c00' }}>
                    {entry.status === 'processed' ? '✅' : entry.status === 'error' ? '❌' : '⚠️'} {entry.status.toUpperCase()}
                  </span>
                  {entry.reqId && <span style={s.logReqId}>{entry.reqId}</span>}
                  <span style={s.logTs}>{new Date(entry.ts).toLocaleTimeString()}</span>
                </div>
                <div style={s.logFrom}>From: {entry.from}</div>
                <div style={s.logMsg}>{entry.rawBody}</div>
                {entry.error && <div style={{ color: '#ff4545', fontSize: 9, marginTop: 2 }}>Error: {entry.error}</div>}
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'info' && (
        <div style={{ ...s.body, overflowY: 'auto' }}>
          <div style={s.infoSection}>
            <div style={s.infoTitle}>🔌 Twilio Webhook Setup</div>
            <div style={s.infoText}>Set your Twilio phone number's incoming SMS webhook to:</div>
            <div style={s.codeBlock}>POST http://your-server:3001/api/sms-trigger</div>
          </div>
          <div style={s.infoSection}>
            <div style={s.infoTitle}>📝 SMS Format</div>
            <div style={s.codeBlock}>SOS [location] [type] [number] [description]</div>
            <div style={s.infoText}>type must be one of: <b style={{color:'#4fc3f7'}}>medical</b> · <b style={{color:'#00e676'}}>food</b> · <b style={{color:'#ff8c00'}}>rescue</b></div>
          </div>
          <div style={s.infoSection}>
            <div style={s.infoTitle}>📱 Example SMS</div>
            <div style={s.codeBlock}>SOS Koramangala medical 10{'\n'}injured people trapped urgent</div>
          </div>
          <div style={s.infoSection}>
            <div style={s.infoTitle}>🤖 Auto Response</div>
            <div style={s.infoText}>Sender receives confirmation with Request ID, priority, and estimated response time.</div>
          </div>
          <div style={s.infoSection}>
            <div style={s.infoTitle}>🔗 Test via curl</div>
            <div style={s.codeBlock}>curl -X POST http://localhost:3001/api/sms-trigger \{'\n'}  -H "Content-Type: application/json" \{'\n'}  -d '{`{"body":"SOS Hebbal rescue 20 flood","from":"+919876543210"}`}'</div>
          </div>
        </div>
      )}
    </div>
  );
}

const s = {
  wrap: { display: 'flex', flexDirection: 'column', borderBottom: '1px solid rgba(38,46,68,.6)', flexShrink: 0 },
  header: {
    padding: '10px 14px 0',
    fontFamily: 'var(--font-mono)',
    fontSize: 10,
    color: '#6b7394',
    letterSpacing: 1.5,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  headerDot: {
    width: 6, height: 6, borderRadius: '50%',
    background: '#4fc3f7', display: 'inline-block',
    animation: 'pulse 2s ease-in-out infinite',
  },
  tabs: { marginLeft: 'auto', display: 'flex', gap: 4 },
  tab: {
    padding: '4px 8px', fontSize: 9, border: '1px solid rgba(38,46,68,.6)',
    background: 'transparent', color: '#6b7394', borderRadius: 5, cursor: 'pointer',
    fontFamily: 'var(--font-mono)', letterSpacing: 0.5,
  },
  tabActive: {
    background: 'rgba(79,195,247,.12)', color: '#4fc3f7', borderColor: 'rgba(79,195,247,.3)',
  },
  body: { padding: '10px 14px 12px' },
  examplesRow: { display: 'flex', gap: 5, marginBottom: 10, flexWrap: 'wrap' },
  exBtn: {
    padding: '4px 9px', fontSize: 9, background: 'rgba(26,32,48,.5)',
    border: '1px solid rgba(38,46,68,.6)', borderRadius: 5, color: '#9aa0b8', cursor: 'pointer',
    fontFamily: 'var(--font-mono)',
  },
  field: { marginBottom: 8 },
  label: { fontFamily: 'var(--font-mono)', fontSize: 10, color: '#6b7394', marginBottom: 4 },
  input: {
    width: '100%', padding: '8px 10px',
    background: 'rgba(26,32,48,.6)', border: '1px solid rgba(38,46,68,.6)',
    borderRadius: 7, color: '#e8eaf0', fontSize: 12, outline: 'none',
  },
  hint: { fontSize: 9, color: '#6b7394', marginTop: 3, fontFamily: 'var(--font-mono)' },
  sendBtn: {
    width: '100%', padding: '10px', background: 'linear-gradient(135deg,#4fc3f7,#0288d1)',
    border: 'none', borderRadius: 8, color: '#fff',
    fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, letterSpacing: 1.5, cursor: 'pointer',
  },
  statusBox: {
    marginTop: 10, padding: '8px 10px', borderRadius: 7,
    border: '1px solid', fontSize: 10,
  },
  logScroll: { maxHeight: 200, overflowY: 'auto' },
  logEntry: {
    borderLeft: '3px solid', paddingLeft: 8, marginBottom: 8,
    paddingBottom: 6, borderBottom: '1px solid rgba(38,46,68,.3)',
  },
  logTop: { display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 },
  logStatus: { fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 700 },
  logReqId: { fontFamily: 'var(--font-mono)', fontSize: 9, color: '#4fc3f7', background: 'rgba(79,195,247,.1)', padding: '1px 5px', borderRadius: 3 },
  logTs: { fontSize: 9, color: '#6b7394', marginLeft: 'auto' },
  logFrom: { fontSize: 9, color: '#6b7394', fontFamily: 'monospace' },
  logMsg: { fontSize: 10, color: '#9aa0b8', marginTop: 2, wordBreak: 'break-all' },
  clearBtn: {
    padding: '3px 8px', fontSize: 9, background: 'rgba(255,69,69,.1)',
    border: '1px solid rgba(255,69,69,.2)', color: '#ff4545', borderRadius: 4, cursor: 'pointer',
    fontFamily: 'var(--font-mono)',
  },
  infoSection: { marginBottom: 14 },
  infoTitle: { color: '#4fc3f7', fontSize: 11, fontWeight: 700, marginBottom: 4 },
  infoText: { color: '#9aa0b8', fontSize: 11, lineHeight: 1.5 },
  codeBlock: {
    background: 'rgba(26,32,48,.8)', border: '1px solid rgba(38,46,68,.6)',
    borderRadius: 6, padding: '8px 10px', fontFamily: 'monospace', fontSize: 10,
    color: '#00e676', marginTop: 4, whiteSpace: 'pre-wrap', wordBreak: 'break-all',
  },
};
