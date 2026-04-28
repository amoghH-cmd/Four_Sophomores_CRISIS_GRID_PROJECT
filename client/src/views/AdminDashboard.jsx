import React, { useState, useCallback } from 'react';
import Header        from '../components/Header';
import StatsBar      from '../components/StatsBar';
import SOSForm       from '../components/SOSForm';
import RequestList   from '../components/RequestList';
import DisasterMap   from '../components/DisasterMap';
import NGOPlatform   from '../components/NGOPlatform';
import CommsLog      from '../components/CommsLog';
import RequestDetail from '../components/RequestDetail';
import SMSTrigger    from '../components/SMSTrigger';
import DataManager   from '../components/DataManager';
import { useDisasterStore } from '../hooks/useDisasterStore';

const PANELS = ['OPERATIONS', 'NGO PLATFORM', 'DATA MANAGER'];

export default function App() {
  const store = useDisasterStore();
  const {
    requests, ngos, commsLog, tracking, smsLog, connected, theme, toggleTheme,
    submitSOS, triggerSMS, resetAll, resetNuclear,
    deleteAllRequests, deleteAllNGOs, deleteAllComms, deleteAllSMSLog,
    addNGO, bulkAddNGOs, updateNGO, deleteNGO,
  } = store;

  const [selectedId,  setSelectedId]  = useState(null);
  const [loading,     setLoading]     = useState(false);
  const [showSplash,  setShowSplash]  = useState(true);
  const [rightPanel,  setRightPanel]  = useState('OPERATIONS'); // which right panel mode

  const selectedReq = requests.find(r => r.id === selectedId) || null;

  React.useEffect(() => {
    if (connected && showSplash) {
      const t = setTimeout(() => setShowSplash(false), 1200);
      return () => clearTimeout(t);
    }
  }, [connected, showSplash]);

  const handleSOS = useCallback(async (payload) => {
    setLoading(true);
    try { await submitSOS(payload); }
    catch (err) { alert('Error: ' + err.message); }
    finally { setLoading(false); }
  }, [submitSOS]);

  const handleSelectReq = useCallback((id) => {
    setSelectedId(prev => prev === id ? null : id);
  }, []);

  if (showSplash) return <SplashScreen connected={connected} />;

  return (
    <div style={styles.root}>
      <Header requests={requests} ngos={ngos} connected={connected} theme={theme} toggleTheme={toggleTheme} />
      <StatsBar requests={requests} ngos={ngos} />

      <div style={styles.main}>
        {/* LEFT PANEL — SOS + Requests */}
        <div style={styles.leftPanel}>
          <SOSForm onSubmit={handleSOS} loading={loading} />
          <RequestList
            requests={requests}
            tracking={tracking}
            selected={selectedId}
            onSelect={handleSelectReq}
          />
        </div>

        {/* MAP */}
        <DisasterMap
          requests={requests}
          ngos={ngos}
          tracking={tracking}
          onSelectRequest={handleSelectReq}
        />

        {/* RIGHT PANEL — tabbed */}
        <div style={styles.rightPanel}>
          {/* Panel switcher tabs */}
          <div style={styles.panelTabs}>
            {PANELS.map(p => (
              <button
                key={p}
                style={{ ...styles.panelTab, ...(rightPanel === p ? styles.panelTabActive : {}) }}
                onClick={() => setRightPanel(p)}
              >
                {p === 'OPERATIONS' ? '📡' : p === 'NGO PLATFORM' ? '🏢' : '⚙️'} {p}
              </button>
            ))}
          </div>

          {/* OPERATIONS: NGO Network + Comms + SMS Trigger */}
          {rightPanel === 'OPERATIONS' && (
            <>
              {/* NGO Network (compact) */}
              <div style={styles.ngoCompact}>
                <div style={styles.ngoCompactHeader}>
                  <span style={styles.ngoCompactDot} />
                  NGO NETWORK
                  <span style={styles.ngoCompactCount}>{ngos.length}</span>
                </div>
                <div style={styles.ngoCompactList}>
                  {ngos.map(n => {
                    const avail = n.capacity - n.used;
                    const pct = Math.round((avail / n.capacity) * 100);
                    const bc = pct > 60 ? '#00e676' : pct > 30 ? '#ff8c00' : '#ff3030';
                    const sc = n.status === 'idle' ? '#00e676' : n.status === 'on-site' ? '#4fc3f7' : '#ff8c00';
                    const sl = n.status === 'idle' ? 'AVAIL' : n.status === 'on-site' ? 'ON SITE' : 'BUSY';
                    return (
                      <div key={n.id} style={styles.ngoMini}>
                        <div style={{ ...styles.ngoMiniDot, background: sc, boxShadow: `0 0 5px ${sc}88` }} />
                        <span style={styles.ngoMiniName}>{n.name}</span>
                        <span style={{ ...styles.ngoMiniStatus, color: sc }}>{sl}</span>
                        <div style={styles.ngoMiniBar}>
                          <div style={{ ...styles.ngoMiniBarFill, width: `${pct}%`, background: bc }} />
                        </div>
                        <span style={{ ...styles.ngoMiniCap, color: bc }}>{avail}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
              <SMSTrigger smsLog={smsLog} onTrigger={triggerSMS} onClearLog={deleteAllSMSLog} />
              <CommsLog messages={commsLog} />
            </>
          )}

          {/* NGO PLATFORM tab */}
          {rightPanel === 'NGO PLATFORM' && (
            <NGOPlatform
              ngos={ngos}
              onAdd={addNGO}
              onBulkAdd={bulkAddNGOs}
              onUpdate={updateNGO}
              onDelete={deleteNGO}
            />
          )}

          {/* DATA MANAGER tab */}
          {rightPanel === 'DATA MANAGER' && (
            <DataManager
              requests={requests}
              ngos={ngos}
              commsLog={commsLog}
              smsLog={smsLog}
              onDeleteRequests={deleteAllRequests}
              onDeleteNGOs={deleteAllNGOs}
              onDeleteComms={deleteAllComms}
              onDeleteSMSLog={deleteAllSMSLog}
              onReset={resetAll}
              onResetAll={resetNuclear}
            />
          )}
        </div>
      </div>

      {selectedReq && (
        <RequestDetail
          req={selectedReq}
          tracking={tracking[selectedId]}
          onClose={() => setSelectedId(null)}
        />
      )}
    </div>
  );
}

function SplashScreen({ connected }) {
  return (
    <div style={styles.splash}>
      <div style={styles.splashContent}>
        <div style={styles.splashIcon}>
          <div style={styles.splashRing} />
          <span style={{ fontSize: 36, position: 'relative', zIndex: 1 }}>🚨</span>
        </div>
        <div style={styles.splashTitle}>CRISIS GRID</div>
        <div style={styles.splashSub}>DISASTER RESPONSE COMMAND</div>
        <div style={styles.splashLoader}><div style={styles.splashLoaderFill} /></div>
        <div style={styles.splashStatus}>
          {connected ? '● Connected — Initializing...' : '○ Connecting to command server...'}
        </div>
      </div>
    </div>
  );
}

const styles = {
  root: {
    display: 'flex', flexDirection: 'column', height: '100vh',
    overflow: 'hidden', fontFamily: "'DM Sans', -apple-system, sans-serif",
    background: '#0a0d12', color: '#e8eaf0',
  },
  main: {
    display: 'grid', gridTemplateColumns: '330px 1fr 320px',
    flex: 1, overflow: 'hidden',
  },
  leftPanel: {
    background: 'rgba(17,22,34,.5)', borderRight: '1px solid rgba(38,46,68,.6)',
    display: 'flex', flexDirection: 'column', overflow: 'hidden',
  },
  rightPanel: {
    background: 'rgba(17,22,34,.5)', borderLeft: '1px solid rgba(38,46,68,.6)',
    display: 'flex', flexDirection: 'column', overflow: 'hidden',
  },
  panelTabs: {
    display: 'flex', borderBottom: '1px solid rgba(38,46,68,.6)',
    flexShrink: 0, background: 'rgba(10,13,18,.4)',
  },
  panelTab: {
    flex: 1, padding: '8px 4px', fontSize: 8, border: 'none',
    background: 'transparent', color: '#6b7394', cursor: 'pointer',
    fontFamily: 'var(--font-mono)', letterSpacing: 0.5, borderBottom: '2px solid transparent',
    transition: 'all .2s',
  },
  panelTabActive: {
    color: '#e8eaf0', borderBottomColor: '#4fc3f7',
    background: 'rgba(79,195,247,.05)',
  },

  // Compact NGO list
  ngoCompact: { flexShrink: 0, borderBottom: '1px solid rgba(38,46,68,.6)', maxHeight: 200, display: 'flex', flexDirection: 'column' },
  ngoCompactHeader: {
    padding: '8px 14px', fontFamily: 'var(--font-mono)', fontSize: 10,
    color: '#6b7394', letterSpacing: 1.5, display: 'flex', alignItems: 'center', gap: 7, flexShrink: 0,
  },
  ngoCompactDot: { width: 6, height: 6, borderRadius: '50%', background: '#00e676', animation: 'pulse 2s ease-in-out infinite' },
  ngoCompactCount: { marginLeft: 'auto', background: 'rgba(79,195,247,.12)', color: '#4fc3f7', padding: '2px 6px', borderRadius: 6, fontSize: 10, fontWeight: 700 },
  ngoCompactList: { overflowY: 'auto', padding: '4px 10px 6px' },
  ngoMini: { display: 'flex', alignItems: 'center', gap: 6, padding: '4px 0', borderBottom: '1px solid rgba(38,46,68,.3)' },
  ngoMiniDot: { width: 6, height: 6, borderRadius: '50%', flexShrink: 0 },
  ngoMiniName: { fontSize: 11, color: '#e8eaf0', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  ngoMiniStatus: { fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: 0.5, flexShrink: 0 },
  ngoMiniBar: { width: 44, height: 3, background: 'rgba(38,46,68,.4)', borderRadius: 2, overflow: 'hidden', flexShrink: 0 },
  ngoMiniBarFill: { height: '100%', borderRadius: 2, transition: 'width .5s' },
  ngoMiniCap: { fontFamily: 'var(--font-mono)', fontSize: 9, minWidth: 20, textAlign: 'right', fontWeight: 600 },

  // Splash
  splash: { position: 'fixed', inset: 0, background: '#0a0d12', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 },
  splashContent: { textAlign: 'center' },
  splashIcon: { width: 80, height: 80, borderRadius: 20, background: 'rgba(255,69,69,.08)', border: '2px solid rgba(255,69,69,.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', position: 'relative' },
  splashRing: { position: 'absolute', inset: -6, border: '2px solid rgba(255,69,69,.15)', borderTop: '2px solid #ff4545', borderRadius: 24, animation: 'spin 1.5s linear infinite' },
  splashTitle: { fontFamily: 'var(--font-mono)', fontSize: 28, fontWeight: 700, color: '#ff4545', letterSpacing: 6, marginBottom: 6 },
  splashSub: { fontFamily: 'var(--font-mono)', fontSize: 11, color: '#6b7394', letterSpacing: 3, marginBottom: 30 },
  splashLoader: { width: 200, height: 3, background: 'rgba(38,46,68,.4)', borderRadius: 3, overflow: 'hidden', margin: '0 auto 16px' },
  splashLoaderFill: { width: '60%', height: '100%', background: 'linear-gradient(90deg, #ff4545, #ff8c00)', borderRadius: 3, animation: 'shimmer 1.5s infinite', backgroundSize: '200% 100%' },
  splashStatus: { fontFamily: 'var(--font-mono)', fontSize: 10, color: '#6b7394', letterSpacing: 1 },
};
