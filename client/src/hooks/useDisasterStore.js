import { useState, useEffect, useRef, useCallback } from 'react';

const API = 'http://localhost:3001/api';

export function useDisasterStore() {
  const [requests,  setRequests]  = useState([]);
  const [ngos,      setNgos]      = useState([]);
  const [commsLog,  setCommsLog]  = useState([]);
  const [tracking,  setTracking]  = useState({});
  const [smsLog,    setSmsLog]    = useState([]);
  const [connected, setConnected] = useState(false);
  const [theme,     setTheme]     = useState(() => localStorage.getItem('theme') || 'dark');
  const esRef    = useRef(null);
  const retryRef = useRef(0);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme(t => t === 'dark' ? 'light' : 'dark');
  }, []);

  useEffect(() => {
    let cancelled = false;
    let timer = null;

    function connect() {
      if (cancelled) return;
      const es = new EventSource(`${API}/events`);
      esRef.current = es;

      es.addEventListener('init', e => {
        const d = JSON.parse(e.data);
        setRequests(d.requests  || []);
        setNgos(d.ngos          || []);
        setCommsLog(d.commsLog  || []);
        setSmsLog(d.smsLog      || []);
        setConnected(true);
        retryRef.current = 0;
      });

      es.addEventListener('newRequest', e => {
        const r = JSON.parse(e.data);
        setRequests(prev => [r, ...prev.filter(x => x.id !== r.id)]);
      });

      es.addEventListener('requestUpdate', e => {
        const r = JSON.parse(e.data);
        if (!r) return;
        setRequests(prev => prev.map(x => x.id === r.id ? r : x));
      });

      es.addEventListener('ngoUpdate', e => {
        setNgos(JSON.parse(e.data));
      });

      es.addEventListener('comms', e => {
        const m = JSON.parse(e.data);
        setCommsLog(prev => [m, ...prev].slice(0, 100));
      });

      es.addEventListener('commsCleared', () => {
        setCommsLog([]);
      });

      es.addEventListener('tracking', e => {
        const t = JSON.parse(e.data);
        setTracking(prev => ({ ...prev, [t.reqId]: t }));
      });

      es.addEventListener('smsLog', e => {
        const m = JSON.parse(e.data);
        setSmsLog(prev => [m, ...prev].slice(0, 200));
      });

      es.addEventListener('smsLogCleared', () => {
        setSmsLog([]);
      });

      es.onerror = () => {
        setConnected(false);
        es.close();
        const delay = Math.min(1000 * Math.pow(2, retryRef.current), 15000);
        retryRef.current++;
        timer = setTimeout(connect, delay);
      };
    }

    connect();

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      if (esRef.current) esRef.current.close();
    };
  }, []);

  // ── API Calls ─────────────────────────────────────────────────────────
  const submitSOS = useCallback(async (payload) => {
    const res = await fetch(`${API}/sos`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  }, []);

  const triggerSMS = useCallback(async (smsPayload) => {
    const res = await fetch(`${API}/sms-trigger`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(smsPayload),
    });
    return res.text(); // returns TwiML
  }, []);

  const resetAll = useCallback(async () => {
    await fetch(`${API}/reset`, { method: 'POST' });
    setTracking({});
  }, []);

  const resetNuclear = useCallback(async () => {
    await fetch(`${API}/reset/all`, { method: 'POST' });
    setTracking({});
  }, []);

  const deleteAllRequests = useCallback(async () => {
    const res = await fetch(`${API}/requests`, { method: 'DELETE' });
    return res.json();
  }, []);

  const deleteAllNGOs = useCallback(async () => {
    const res = await fetch(`${API}/ngos`, { method: 'DELETE' });
    return res.json();
  }, []);

  const deleteAllComms = useCallback(async () => {
    const res = await fetch(`${API}/comms`, { method: 'DELETE' });
    return res.json();
  }, []);

  const deleteAllSMSLog = useCallback(async () => {
    const res = await fetch(`${API}/sms-log`, { method: 'DELETE' });
    return res.json();
  }, []);

  const addNGO = useCallback(async (ngo) => {
    const res = await fetch(`${API}/ngos`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(ngo),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  }, []);

  const bulkAddNGOs = useCallback(async (list) => {
    const res = await fetch(`${API}/ngos/bulk`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(list),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  }, []);

  const updateNGO = useCallback(async (id, data) => {
    const res = await fetch(`${API}/ngos/${id}`, {
      method:  'PUT',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(data),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  }, []);

  const deleteNGO = useCallback(async (id) => {
    const res = await fetch(`${API}/ngos/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  }, []);

  const acceptRequest = useCallback(async (reqId, ngoId, eta) => {
    const res = await fetch(`${API}/requests/${reqId}/accept`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ ngoId, eta }),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  }, []);

  const forwardRequest = useCallback(async (reqId, ngoId) => {
    const res = await fetch(`${API}/requests/${reqId}/forward`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ ngoId }),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  }, []);

  return {
    requests, ngos, commsLog, tracking, smsLog, connected, theme, toggleTheme,
    submitSOS, triggerSMS, resetAll, resetNuclear,
    deleteAllRequests, deleteAllNGOs, deleteAllComms, deleteAllSMSLog,
    addNGO, bulkAddNGOs, updateNGO, deleteNGO,
    acceptRequest, forwardRequest,
  };
}
