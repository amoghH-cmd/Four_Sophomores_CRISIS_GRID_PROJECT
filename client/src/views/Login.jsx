import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDisasterStore } from '../hooks/useDisasterStore';

export default function Login() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useDisasterStore();
  const [tab, setTab] = useState('admin'); // 'admin' | 'ngo' | 'register'
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const [locStr, setLocStr] = useState('');
  const [cap, setCap] = useState('');
  const [resources, setResources] = useState('');

  const handleAdminLogin = () => {
    if (password === 'admin') {
      navigate('/admin');
    } else {
      setError('Admin password is "admin"');
    }
  };

  const handleNgoLogin = async () => {
    try {
      const res = await fetch('http://localhost:3001/api/ngos/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, password })
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem('ngoInfo', JSON.stringify(data.ngo));
        navigate('/ngo');
      } else {
        setError(data.message);
      }
    } catch (e) {
      setError('Connection error');
    }
  };

  const handleRegister = async () => {
    try {
      const res = await fetch('http://localhost:3001/api/ngos/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name, password,
          location: locStr,
          capacity: cap,
          resources: resources.split(',').map(s => s.trim())
        })
      });
      const data = await res.json();
      if (data.success) {
        setTab('ngo');
        setError('Registered successfully. Please login.');
      } else {
        setError('Registration failed');
      }
    } catch (e) {
      setError('Connection error');
    }
  };

  return (
    <div style={styles.wrap}>
      <div style={styles.card}>
        <div style={styles.header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={styles.dot}></span> CRISIS GRID LOGIN
          </div>
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
        </div>
        
        <div style={styles.tabs}>
          <button style={{...styles.tabBtn, opacity: tab==='admin'? 1:0.5}} onClick={() => setTab('admin')}>ADMIN</button>
          <button style={{...styles.tabBtn, opacity: tab==='ngo'? 1:0.5}} onClick={() => setTab('ngo')}>NGO LOGIN</button>
          <button style={{...styles.tabBtn, opacity: tab==='register'? 1:0.5}} onClick={() => setTab('register')}>REGISTER</button>
        </div>

        <div style={styles.body}>
          {error && <div style={styles.error}>{error}</div>}

          {tab === 'admin' && (
            <>
              <input style={styles.input} type="password" placeholder="Admin Password" value={password} onChange={e => {setPassword(e.target.value); setError('')}} />
              <button style={styles.btn} onClick={handleAdminLogin}>LOGIN AS ADMIN</button>
            </>
          )}

          {tab === 'ngo' && (
            <>
              <input style={styles.input} placeholder="NGO Name" value={name} onChange={e => {setName(e.target.value); setError('')}} />
              <input style={styles.input} type="password" placeholder="Password" value={password} onChange={e => {setPassword(e.target.value); setError('')}} />
              <button style={styles.btn} onClick={handleNgoLogin}>LOGIN AS NGO</button>
            </>
          )}

          {tab === 'register' && (
            <>
              <input style={styles.input} placeholder="NGO Name" value={name} onChange={e => {setName(e.target.value); setError('')}} />
              <input style={styles.input} type="password" placeholder="Password" value={password} onChange={e => {setPassword(e.target.value); setError('')}} />
              <input style={styles.input} placeholder="Location" value={locStr} onChange={e => {setLocStr(e.target.value); setError('')}} />
              <input style={styles.input} type="number" placeholder="Initial Capacity" value={cap} onChange={e => setCap(Number(e.target.value))} />
              <input style={styles.input} placeholder="Resources" value={resources} onChange={e => setResources(e.target.value)} />
              <button style={{...styles.btn, background: 'linear-gradient(135deg, #00e676, #00b25c)'}} onClick={handleRegister}>REGISTER NGO</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  wrap: { height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#090b10' },
  card: { background: 'rgba(17,22,34,0.8)', border: '1px solid rgba(38,46,68,0.8)', borderRadius: 12, width: 340, padding: 24, boxShadow: '0 10px 40px rgba(0,0,0,0.5)' },
  header: { color: '#e8eaf0', fontSize: 14, fontWeight: 700, letterSpacing: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, fontFamily: 'monospace' },
  dot: { width: 8, height: 8, background: '#ff4545', borderRadius: '50%', boxShadow: '0 0 10px #ff4545', animation: 'pulse 2s infinite' },
  tabs: { display: 'flex', gap: 10, marginBottom: 20 },
  tabBtn: { flex: 1, background: 'rgba(26,32,48,0.5)', border: '1px solid #262e44', color: '#9aa0b8', padding: '8px 0', fontSize: 10, borderRadius: 6, cursor: 'pointer', fontFamily: 'monospace', fontWeight: 'bold' },
  body: { display: 'flex', flexDirection: 'column', gap: 12 },
  input: { background: 'rgba(26,32,48,0.6)', border: '1px solid rgba(38,46,68,0.8)', color: '#fff', padding: '12px 14px', borderRadius: 8, outline: 'none', fontSize: 12, fontFamily: 'monospace' },
  btn: { background: 'linear-gradient(135deg, #ff4545, #d50000)', color: '#fff', border: 'none', padding: '14px', borderRadius: 8, fontWeight: 'bold', cursor: 'pointer', marginTop: 10, fontFamily: 'monospace', letterSpacing: 1.5 },
  error: { color: '#ff4545', fontSize: 11, textAlign: 'center', fontFamily: 'monospace', background: 'rgba(255,69,69,0.1)', padding: 8, borderRadius: 4 }
};
