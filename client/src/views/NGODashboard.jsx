import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDisasterStore } from '../hooks/useDisasterStore';

export default function NGODashboard() {
  const navigate = useNavigate();
  const [ngoInfo, setNgoInfo] = useState(null);
  const [addStock, setAddStock] = useState(0);
  const [statusMsg, setStatusMsg] = useState('');

  const { ngos, requests, commsLog, theme, toggleTheme, acceptRequest, forwardRequest } = useDisasterStore();
  const etaRefs = useRef({});

  useEffect(() => {
    const saved = localStorage.getItem('ngoInfo');
    if (!saved) {
      navigate('/login');
    } else {
      setNgoInfo(JSON.parse(saved));
    }
  }, [navigate]);

  useEffect(() => {
    if (ngoInfo && ngos.length > 0) {
      const updated = ngos.find(n => n.id === ngoInfo.id);
      if (updated) setNgoInfo(updated);
    }
  }, [ngos, ngoInfo?.id]);

  const handleStockUp = async () => {
    if (addStock <= 0) return;
    try {
      const res = await fetch(`http://localhost:3001/api/ngos/${ngoInfo.id}/stock`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ addCapacity: addStock })
      });
      if (res.ok) {
        setStatusMsg(`Successfully added ${addStock} to capacity.`);
        setAddStock(0);
        setTimeout(() => setStatusMsg(''), 3000);
      }
    } catch (e) {
      setStatusMsg('Failed to update stock.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('ngoInfo');
    navigate('/login');
  };

  if (!ngoInfo) return null;

  const pendingRequests = requests.filter(r => 
    r.status === 'awaiting-approval' && r.assigned.some(a => a.id === ngoInfo.id)
  );
  
  const activeRequests = requests.filter(r => 
    r.status === 'in-progress' && r.assigned.some(a => a.id === ngoInfo.id)
  );

  const myComms = commsLog.filter(c => c.message.includes(ngoInfo.name) || c.message.includes("General"));

  const available = ngoInfo.capacity - ngoInfo.used;

  return (
    <div style={styles.wrap}>
      {/* Grid Background */}
      <div style={styles.gridBg} />
      
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <div style={styles.logoIcon}>
            <span style={{...styles.dot, background: ngoInfo.color, boxShadow: `0 0 10px ${ngoInfo.color}`}}></span>
          </div>
          <div>
            <span style={{...styles.title, color: ngoInfo.color}}>{ngoInfo.name.toUpperCase()}</span>
            <span style={styles.subTitle}> // COMMAND CENTER</span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button 
            onClick={toggleTheme}
            style={{
              fontFamily: "var(--font-mono)", fontSize: 16, padding: '4px 8px', borderRadius: 8,
              border: '1px solid rgba(255, 255, 255, 0.1)', background: 'rgba(255, 255, 255, 0.05)',
              color: '#e8eaf0', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}
            title="Toggle Light/Dark Mode"
            className="theme-ignore-invert"
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          <button style={styles.logoutBtn} onClick={handleLogout}>LOG OUT</button>
        </div>
      </div>

      <div style={styles.content}>
        <div style={styles.leftCol}>
          <div style={styles.card}>
            <div style={styles.cardTitle}>RESOURCE STOCK</div>
            <div style={styles.stats}>
              <div style={styles.statBox}>
                <div style={styles.statVal}>{ngoInfo.capacity}</div>
                <div style={styles.statLabel}>TOTAL CAPACITY</div>
              </div>
              <div style={styles.statBox}>
                <div style={styles.statVal}>{ngoInfo.used}</div>
                <div style={styles.statLabel}>CURRENTLY DEPLOYED</div>
              </div>
              <div style={{...styles.statBox, background: 'rgba(0, 230, 118, 0.05)', borderColor: 'rgba(0, 230, 118, 0.2)'}}>
                <div style={{...styles.statVal, color: '#00e676'}}>{available}</div>
                <div style={styles.statLabel}>AVAILABLE</div>
              </div>
            </div>
          </div>

          <div style={styles.card}>
            <div style={styles.cardTitle}>RESTOCK RESOURCES</div>
            <div style={{color: '#9aa0b8', fontSize: 12, marginBottom: 15, fontFamily: 'monospace', lineHeight: 1.5}}>
              Incoming shipment? Update your capacity here to make resources instantly available to the disaster grid.
            </div>
            <div style={{display: 'flex', gap: 10}}>
              <input 
                style={styles.input} 
                type="number" 
                min="1"
                placeholder="Amount to add..."
                value={addStock || ''} 
                onChange={e => setAddStock(Number(e.target.value))} 
              />
              <button style={styles.btn} onClick={handleStockUp}>STOCK UP</button>
            </div>
            {statusMsg && <div style={styles.status}>✅ {statusMsg}</div>}
          </div>

          <div style={{...styles.card, flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column'}}>
            <div style={styles.cardTitle}>COMMUNICATIONS LOG</div>
            <div style={styles.commsList}>
              {myComms.length === 0 ? (
                <div style={styles.empty}>No communications yet.</div>
              ) : myComms.map(c => (
                <div key={c.id} style={{
                  ...styles.commsItem,
                  borderLeftColor: c.type === 'error' ? '#ff4545' : ngoInfo.color
                }}>
                  <div style={{color: '#6b7394', fontSize: 10, marginBottom: 4}}>
                    {new Date(c.timestamp).toLocaleTimeString()}
                  </div>
                  <div style={{color: '#e8eaf0', fontSize: 12}}>{c.message}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={styles.rightCol}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20, flex: 1, overflowY: 'auto', paddingRight: 10 }}>
            {/* PENDING APPROVALS */}
            <div style={styles.card}>
              <div style={styles.cardTitle}>PENDING APPROVALS ({pendingRequests.length})</div>
              {pendingRequests.length === 0 ? (
                <div style={styles.emptyBox}>No pending requests.</div>
              ) : (
                <div style={styles.reqList}>
                  {pendingRequests.map(r => {
                    const assigned = r.assigned.find(a => a.id === ngoInfo.id);
                    return (
                      <div key={r.id} style={{...styles.reqItem, borderColor: '#ff8c00', background: 'rgba(255, 140, 0, 0.05)'}}>
                        <div style={styles.reqItemInner}>
                          <div style={styles.reqHeader}>
                            <span style={{
                              background: r.priority === 'CRITICAL' ? 'rgba(255,48,48,0.1)' : 'rgba(255,140,0,0.1)',
                              color: r.priority === 'CRITICAL' ? '#ff3030' : '#ff8c00',
                              padding: '2px 6px', borderRadius: 4, fontWeight: 'bold'
                            }}>{r.priority}</span>
                            <span style={{color: '#ff8c00', fontWeight: 700}}>AWAITING APPROVAL</span>
                          </div>
                          <div style={styles.reqLoc}>📍 {r.loc} ({r.people} people)</div>
                          <div style={styles.reqDesc}>{r.description}</div>
                          
                          <div style={{ marginTop: 15, display: 'flex', gap: 10, alignItems: 'center' }}>
                            <button 
                              onClick={async () => {
                                const val = window.prompt("Please enter ETA (in minutes):");
                                if (!val) return; // User cancelled or entered empty
                                
                                try {
                                  await acceptRequest(r.id, ngoInfo.id, val);
                                } catch (err) {
                                  alert("Failed to accept: " + err.message);
                                }
                              }}
                              style={{ flex: 1, padding: '8px 0', background: '#00e676', color: '#000', border: 'none', borderRadius: 6, fontWeight: 'bold', cursor: 'pointer' }}
                            >
                              ACCEPT
                            </button>
                            <button 
                              onClick={() => forwardRequest(r.id, ngoInfo.id)}
                              style={{ flex: 1, padding: '8px 0', background: 'rgba(255,69,69,0.1)', border: '1px solid #ff4545', color: '#ff4545', borderRadius: 6, fontWeight: 'bold', cursor: 'pointer' }}
                            >
                              FORWARD
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* ACTIVE DISPATCHES */}
            <div style={styles.card}>
              <div style={styles.cardTitle}>ACTIVE DISPATCHES ({activeRequests.length})</div>
              {activeRequests.length === 0 ? (
                <div style={styles.emptyBox}>
                  <div style={{fontSize: 40, marginBottom: 10, filter: 'grayscale(1)', opacity: 0.5}}>🚑</div>
                  No active deployments. Standby for dispatch.
                </div>
              ) : (
                <div style={styles.reqList}>
                  {activeRequests.map(r => {
                    const assigned = r.assigned.find(a => a.id === ngoInfo.id);
                    return (
                      <div key={r.id} style={styles.reqItem}>
                        <div style={styles.reqItemInner}>
                          <div style={styles.reqHeader}>
                            <span style={{
                              background: r.priority === 'CRITICAL' ? 'rgba(255,48,48,0.1)' : 'rgba(255,140,0,0.1)',
                              color: r.priority === 'CRITICAL' ? '#ff3030' : '#ff8c00',
                              padding: '2px 6px', borderRadius: 4, fontWeight: 'bold'
                            }}>{r.priority}</span>
                            <span style={{color: '#4fc3f7', fontWeight: 700}}>{r.id}</span>
                          </div>
                          <div style={styles.reqLoc}>📍 {r.loc}</div>
                          <div style={styles.reqDesc}>{r.description}</div>
                          <div style={styles.reqFooter}>
                            <span style={{color: '#00e676'}}>Deploying {assigned.assignedCount} units</span>
                            <span>•</span>
                            <span>ETA: {r.eta}m</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  wrap: { 
    height: '100vh', 
    display: 'flex', 
    flexDirection: 'column', 
    background: '#090b10', 
    color: '#e8eaf0', 
    fontFamily: 'var(--font-mono, monospace)',
    position: 'relative',
    overflow: 'hidden'
  },
  gridBg: {
    position: 'absolute', inset: 0, pointerEvents: 'none',
    backgroundImage: `
      linear-gradient(rgba(38, 46, 68, 0.1) 1px, transparent 1px),
      linear-gradient(90deg, rgba(38, 46, 68, 0.1) 1px, transparent 1px)
    `,
    backgroundSize: '30px 30px',
    backgroundPosition: 'center center',
    zIndex: 0,
  },
  header: { 
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '0 20px', height: 54,
    background: 'rgba(17,22,34,0.85)', 
    backdropFilter: 'blur(16px)',
    borderBottom: '1px solid rgba(38, 46, 68, 0.6)',
    zIndex: 10
  },
  headerLeft: { display: 'flex', alignItems: 'center', gap: 12 },
  logoIcon: {
    width: 32, height: 32, borderRadius: 8,
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  dot: { width: 8, height: 8, borderRadius: '50%' },
  title: { fontSize: 15, fontWeight: 700, letterSpacing: 2 },
  subTitle: { color: '#6b7394', fontSize: 10, letterSpacing: 1 },
  logoutBtn: { 
    background: 'rgba(255, 69, 69, 0.1)', 
    border: '1px solid rgba(255, 69, 69, 0.5)', 
    color: '#ff4545', 
    padding: '6px 12px', 
    borderRadius: 8, 
    cursor: 'pointer', 
    fontFamily: 'var(--font-mono, monospace)', 
    fontSize: 10, fontWeight: 700, letterSpacing: 1,
    transition: 'all 0.2s'
  },
  content: { 
    display: 'flex', gap: 20, padding: 24, flex: 1, 
    overflow: 'hidden', zIndex: 10, position: 'relative' 
  },
  leftCol: { display: 'flex', flexDirection: 'column', gap: 20, width: '40%' },
  rightCol: { display: 'flex', flexDirection: 'column', gap: 20, width: '60%', overflow: 'hidden' },
  card: { 
    background: 'rgba(17, 22, 34, 0.7)', 
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(38,46,68,0.6)', 
    borderRadius: 12, padding: 20, 
    display: 'flex', flexDirection: 'column',
    boxShadow: '0 8px 32px rgba(0,0,0,0.2)'
  },
  cardTitle: { fontSize: 11, fontWeight: 700, letterSpacing: 1.5, color: '#6b7394', marginBottom: 16 },
  stats: { display: 'flex', gap: 15 },
  statBox: { 
    flex: 1, background: 'rgba(26, 32, 48, 0.5)', 
    border: '1px solid rgba(38, 46, 68, 0.6)', 
    borderRadius: 8, padding: '16px 10px', textAlign: 'center',
    transition: 'transform 0.2s'
  },
  statVal: { fontSize: 28, fontWeight: 700, marginBottom: 4, fontFamily: 'var(--font-mono, monospace)' },
  statLabel: { fontSize: 9, color: '#9aa0b8', letterSpacing: 1 },
  input: { 
    flex: 1, background: 'rgba(26, 32, 48, 0.6)', 
    border: '1px solid rgba(38, 46, 68, 0.6)', 
    color: '#e8eaf0', padding: '10px 14px', borderRadius: 8, outline: 'none', 
    fontFamily: 'var(--font-mono, monospace)', fontSize: 13
  },
  btn: { 
    background: 'linear-gradient(135deg, #00e676, #00c853)', 
    boxShadow: '0 4px 15px rgba(0,230,118,0.2)',
    color: '#fff', border: 'none', padding: '0 20px', borderRadius: 8, 
    fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-mono, monospace)', 
    letterSpacing: 1, fontSize: 12
  },
  status: { marginTop: 12, color: '#00e676', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 },
  emptyBox: { 
    flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', 
    justifyContent: 'center', color: '#6b7394', fontStyle: 'italic',
    background: 'rgba(26,32,48,0.3)', borderRadius: 8, border: '1px dashed rgba(38,46,68,0.6)'
  },
  empty: { color: '#6b7394', fontStyle: 'italic', fontSize: 12 },
  reqList: { flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12, paddingRight: 4 },
  reqItem: { 
    background: 'linear-gradient(90deg, rgba(255, 69, 69, 0.1), transparent)', 
    borderRadius: 8, padding: 1,
  },
  reqItemInner: {
    background: 'rgba(26,32,48,0.8)',
    borderRadius: 7, padding: 16,
  },
  reqHeader: { display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 10 },
  reqLoc: { fontWeight: 700, fontSize: 15, marginBottom: 6, color: '#fff' },
  reqDesc: { color: '#9aa0b8', fontSize: 12, marginBottom: 12, lineHeight: 1.4 },
  reqFooter: { 
    fontSize: 11, color: '#6b7394', borderTop: '1px solid rgba(38,46,68,0.5)', 
    paddingTop: 10, display: 'flex', alignItems: 'center', gap: 10 
  },
  commsList: { flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 },
  commsItem: { 
    background: 'rgba(26,32,48,0.4)', borderLeft: '3px solid', 
    padding: '8px 12px', borderRadius: '0 6px 6px 0',
    fontFamily: 'var(--font-mono, monospace)'
  }
};
