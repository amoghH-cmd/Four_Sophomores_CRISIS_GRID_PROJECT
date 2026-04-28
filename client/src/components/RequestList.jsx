import React from 'react';
import { PRIORITY_COLORS, TYPE_COLORS, STATUS_COLORS, formatEta } from '../utils/helpers';

export default function RequestList({ requests, tracking, selected, onSelect }) {
  const active = requests.filter(r => r.status !== 'completed');
  const completed = requests.filter(r => r.status === 'completed');

  return (
    <div style={styles.wrap}>
      <div style={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={styles.headerDot} />
          <span style={styles.label}>INCOMING REQUESTS</span>
        </div>
        <span style={styles.badge}>{active.length}</span>
      </div>
      <div style={styles.list}>
        {active.map((r, i) => (
          <RequestCard key={r.id} req={r} tracking={tracking[r.id]}
            selected={selected === r.id} onClick={() => onSelect(r.id)} idx={i} />
        ))}
        {completed.length > 0 && (
          <>
            <div style={styles.separator}>
              <span style={styles.sepLine} />
              <span>COMPLETED ({completed.length})</span>
              <span style={styles.sepLine} />
            </div>
            {completed.map(r => (
              <RequestCard key={r.id} req={r} tracking={null}
                selected={selected === r.id} onClick={() => onSelect(r.id)} dimmed />
            ))}
          </>
        )}
        {requests.length === 0 && (
          <div style={styles.empty}>
            <div style={{ fontSize: 28, marginBottom: 8, opacity: .3 }}>📡</div>
            No requests yet.<br/>Submit an SOS above.
          </div>
        )}
      </div>
    </div>
  );
}

function RequestCard({ req, tracking, selected, onClick, dimmed, idx = 0 }) {
  const pc = PRIORITY_COLORS[req.priority] || '#ffd600';
  const tc = TYPE_COLORS[req.type] || '#fff';
  const sc = STATUS_COLORS[req.status] || '#6b7394';
  const eta = req.eta;

  return (
    <div onClick={onClick} style={{
      ...styles.card,
      borderColor: selected ? '#4fc3f7' : 'rgba(38,46,68,.6)',
      opacity: dimmed ? 0.4 : 1,
      transform: selected ? 'translateX(3px)' : 'none',
      boxShadow: selected ? '0 0 16px rgba(79,195,247,.15)' : 'none',
      animation: `slideUp .3s ease-out ${idx * 50}ms both`,
    }}>
      <div style={{ position:'absolute', top:0, left:0, bottom:0, width:3, borderRadius:'3px 0 0 3px', background:pc, opacity: dimmed?.3:.8 }} />

      <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:6 }}>
        <span style={{ ...styles.pBadge, color:pc, borderColor:pc+'44', background:pc+'14' }}>{req.priority}</span>
        <span style={styles.reqId}>{req.id}</span>
        <div style={{ flex:1 }} />
        {req.isDuplicate && <span style={{ ...styles.flagBadge, color:'#ffd600', borderColor:'#ffd60033', background:'#ffd60010' }}>⚠ DUP</span>}
        {req.nearbyCount > 1 && <span style={{ ...styles.flagBadge, color:'#ff3030', borderColor:'#ff303033', background:'#ff303010' }}>🚨 URGENT ACTION NEEDED</span>}
      </div>

      <div style={styles.loc}>📍 {req.loc}</div>

      <div style={{ display:'flex', alignItems:'center', gap:6, flexWrap:'wrap', marginTop:5 }}>
        <span style={{ ...styles.typeBadge, color:tc, background:tc+'12', borderColor:tc+'25' }}>{req.type.toUpperCase()}</span>
        <span style={styles.meta}>👥 {req.people}</span>
        <span style={{ ...styles.statusBadge, color:sc }}>{req.status.toUpperCase()}</span>
      </div>

      {(req.status === 'assigned' || req.status === 'in-progress') && (
        <div style={{ marginTop:8 }}>
          {tracking && (
            <div style={styles.progressWrap}>
              <div style={{ ...styles.progressBar, width:`${(tracking.progress*100).toFixed(1)}%` }} />
            </div>
          )}
          <div style={styles.eta}>
            ETA: {formatEta(eta)}
            {req.assigned?.[0] && <span style={styles.ngoName}> · {req.assigned[0].name}</span>}
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  wrap: { display:'flex', flexDirection:'column', flex:1, overflow:'hidden' },
  header: { padding:'12px 14px', borderBottom:'1px solid rgba(38,46,68,.6)', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 },
  headerDot: { width:6, height:6, borderRadius:'50%', background:'#4fc3f7', animation:'pulse 2s ease-in-out infinite', display:'inline-block' },
  label: { fontFamily:"var(--font-mono)", fontSize:10, color:'#6b7394', letterSpacing:1.5 },
  badge: { background:'linear-gradient(135deg,#ff4545,#e02020)', color:'#fff', fontSize:10, padding:'3px 9px', borderRadius:10, fontFamily:"var(--font-mono)", fontWeight:700, boxShadow:'0 2px 8px rgba(255,69,69,.3)' },
  list: { flex:1, overflowY:'auto', padding:'6px 8px' },
  card: { position:'relative', background:'rgba(26,32,48,.5)', border:'1px solid rgba(38,46,68,.6)', borderRadius:10, padding:'11px 12px 11px 16px', marginBottom:6, cursor:'pointer', transition:'all .2s ease' },
  pBadge: { fontFamily:"var(--font-mono)", fontSize:9, fontWeight:700, padding:'2px 8px', borderRadius:4, border:'1px solid', letterSpacing:.5 },
  reqId: { fontFamily:"var(--font-mono)", fontSize:10, color:'#6b7394' },
  flagBadge: { fontFamily:"var(--font-mono)", fontSize:8, padding:'2px 6px', borderRadius:4, border:'1px solid', fontWeight:600 },
  loc: { fontSize:12, fontWeight:500, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' },
  typeBadge: { fontSize:9, padding:'2px 8px', borderRadius:4, fontWeight:600, border:'1px solid', letterSpacing:.5 },
  meta: { fontSize:10, color:'#9aa0b8', fontFamily:"var(--font-mono)" },
  statusBadge: { fontFamily:"var(--font-mono)", fontSize:9, marginLeft:'auto', fontWeight:600 },
  progressWrap: { height:3, background:'rgba(38,46,68,.5)', borderRadius:3, overflow:'hidden', marginBottom:5 },
  progressBar: { height:'100%', borderRadius:3, transition:'width .5s ease-out', background:'linear-gradient(90deg,#00e676,#69f0ae)' },
  eta: { fontSize:10, fontFamily:"var(--font-mono)", color:'#00e676', display:'flex', alignItems:'center' },
  ngoName: { color:'#6b7394', fontSize:9 },
  separator: { fontFamily:"var(--font-mono)", fontSize:9, color:'#6b7394', letterSpacing:1, padding:'10px 4px 6px', display:'flex', alignItems:'center', gap:8 },
  sepLine: { flex:1, height:1, background:'rgba(38,46,68,.5)' },
  empty: { textAlign:'center', color:'#6b7394', fontSize:12, padding:'40px 10px', lineHeight:1.8 },
};
