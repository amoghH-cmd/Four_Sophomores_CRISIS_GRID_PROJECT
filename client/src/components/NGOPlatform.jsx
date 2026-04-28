import React, { useState } from 'react';

const RESOURCE_OPTIONS = ['medical', 'food', 'rescue'];
const AREA_COORDS = {
  'Koramangala': [12.9279, 77.6271], 'Indiranagar': [12.9784, 77.6408],
  'Whitefield': [12.9698, 77.7500], 'Jayanagar': [12.9277, 77.5937],
  'Hebbal': [13.0358, 77.5970], 'BTM Layout': [12.9166, 77.6101],
  'HSR Layout': [12.9082, 77.6476], 'Majestic': [12.9772, 77.5713],
  'Marathahalli': [12.9591, 77.6974], 'Rajajinagar': [12.9850, 77.5516],
  'Malleswaram': [13.0023, 77.5660],
};

const BLANK_NGO = { name: '', location: '', lat: '', lng: '', capacity: '', resources: [], phone: '', specialization: '', color: '#4fc3f7' };

const CSV_TEMPLATE = `name,lat,lng,capacity,resources,phone,specialization,color
RedRelief Org,12.9716,77.5946,50,"medical,food,rescue",+91-80-0001,Multi-disaster rapid response,#4fc3f7
HopeAid Foundation,12.9352,77.6245,80,"food,rescue",+91-80-0002,Flood relief & food distribution,#00e676`;

export default function NGOPlatform({ ngos, onAdd, onBulkAdd, onUpdate, onDelete }) {
  const [tab,       setTab]    = useState('list'); // 'list' | 'add' | 'bulk'
  const [form,      setForm]   = useState(BLANK_NGO);
  const [editId,    setEditId] = useState(null);
  const [csvText,   setCsvText] = useState('');
  const [csvResult, setCsvResult] = useState(null);
  const [busy,      setBusy]   = useState(false);
  const [msg,       setMsg]    = useState(null);
  const [confirm,   setConfirm] = useState(null); // {id, name}

  const setF = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const fillLocation = (loc) => {
    const coords = AREA_COORDS[loc];
    if (coords) setForm(f => ({ ...f, location: loc, lat: coords[0], lng: coords[1] }));
    else setF('location', loc);
  };

  const toggleResource = (r) => {
    setForm(f => ({
      ...f,
      resources: f.resources.includes(r) ? f.resources.filter(x => x !== r) : [...f.resources, r],
    }));
  };

  const handleSubmit = async () => {
    if (!form.name || !form.capacity || !form.resources.length) {
      setMsg({ ok: false, text: 'Name, capacity, and at least one resource are required.' });
      return;
    }
    setBusy(true);
    setMsg(null);
    try {
      if (editId) {
        await onUpdate(editId, { ...form, lat: parseFloat(form.lat) || 12.9716, lng: parseFloat(form.lng) || 77.5946 });
        setMsg({ ok: true, text: `NGO "${form.name}" updated.` });
      } else {
        await onAdd({ ...form, lat: parseFloat(form.lat) || 12.9716, lng: parseFloat(form.lng) || 77.5946 });
        setMsg({ ok: true, text: `NGO "${form.name}" added to network.` });
      }
      setForm(BLANK_NGO);
      setEditId(null);
      setTab('list');
    } catch (err) {
      setMsg({ ok: false, text: err.message });
    } finally {
      setBusy(false);
    }
  };

  const startEdit = (ngo) => {
    setForm({
      name: ngo.name, location: '', lat: ngo.lat, lng: ngo.lng,
      capacity: ngo.capacity, resources: [...ngo.resources],
      phone: ngo.phone || '', specialization: ngo.specialization || '', color: ngo.color || '#4fc3f7',
    });
    setEditId(ngo.id);
    setTab('add');
  };

  const handleDelete = async (id, name) => {
    setBusy(true);
    try {
      await onDelete(id);
      setMsg({ ok: true, text: `"${name}" removed.` });
      setConfirm(null);
    } catch (err) {
      setMsg({ ok: false, text: err.message });
    } finally {
      setBusy(false);
    }
  };

  const parseCSV = (text) => {
    const lines = text.trim().split('\n').filter(Boolean);
    if (lines.length < 2) return [];
    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
    return lines.slice(1).map(line => {
      // Handle quoted fields with commas
      const fields = [];
      let cur = '', inQ = false;
      for (const ch of line) {
        if (ch === '"') { inQ = !inQ; }
        else if (ch === ',' && !inQ) { fields.push(cur.trim()); cur = ''; }
        else cur += ch;
      }
      fields.push(cur.trim());
      const obj = {};
      headers.forEach((h, i) => { obj[h] = fields[i] || ''; });
      return obj;
    });
  };

  const handleBulkImport = async () => {
    if (!csvText.trim()) { setMsg({ ok: false, text: 'Paste CSV data first.' }); return; }
    const rows = parseCSV(csvText);
    if (!rows.length) { setMsg({ ok: false, text: 'No valid rows found.' }); return; }

    const list = rows.map(r => ({
      name:           r.name || '',
      lat:            parseFloat(r.lat) || 12.9716,
      lng:            parseFloat(r.lng) || 77.5946,
      capacity:       parseInt(r.capacity) || 50,
      resources:      (r.resources || 'medical').split(',').map(x => x.trim()),
      phone:          r.phone || '',
      specialization: r.specialization || '',
      color:          r.color || '',
    })).filter(n => n.name);

    if (!list.length) { setMsg({ ok: false, text: 'No NGOs with valid names found.' }); return; }

    setBusy(true);
    setMsg(null);
    try {
      const result = await onBulkAdd(list);
      setCsvResult(result);
      setMsg({ ok: true, text: `Successfully imported ${result.added} NGOs.` });
      setCsvText('');
    } catch (err) {
      setMsg({ ok: false, text: err.message });
    } finally {
      setBusy(false);
    }
  };

  const statusColor = s => s === 'idle' ? '#00e676' : s === 'on-site' ? '#4fc3f7' : '#ff8c00';
  const statusLabel = s => s === 'idle' ? 'AVAILABLE' : s === 'on-site' ? 'ON SITE' : 'DEPLOYED';

  return (
    <div style={st.wrap}>
      <div style={st.header}>
        <span style={st.headerDot} />
        NGO PLATFORM
        <span style={st.count}>{ngos.length}</span>
        <div style={st.tabs}>
          {[['list','📋 REGISTRY'],['add', editId ? '✏️ EDIT' : '➕ ADD'],['bulk','📥 IMPORT']].map(([t,l]) => (
            <button key={t} style={{ ...st.tab, ...(tab === t ? st.tabActive : {}) }} onClick={() => { setTab(t); if (t !== 'add') { setEditId(null); setForm(BLANK_NGO); } }}>
              {l}
            </button>
          ))}
        </div>
      </div>

      {msg && (
        <div style={{ ...st.msg, borderColor: msg.ok ? '#00e676' : '#ff4545', color: msg.ok ? '#00e676' : '#ff4545' }}>
          {msg.ok ? '✅' : '❌'} {msg.text}
        </div>
      )}

      {/* CONFIRM DELETE */}
      {confirm && (
        <div style={st.confirmBox}>
          <div style={st.confirmText}>Delete <b style={{color:'#ff4545'}}>{confirm.name}</b>?</div>
          <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
            <button style={st.confirmYes} onClick={() => handleDelete(confirm.id, confirm.name)}>Delete</button>
            <button style={st.confirmNo}  onClick={() => setConfirm(null)}>Cancel</button>
          </div>
        </div>
      )}

      {tab === 'list' && (
        <div style={st.scroll}>
          {ngos.length === 0 && <div style={st.empty}>No NGOs in network. Add one or import from CSV.</div>}
          {ngos.map((n, i) => {
            const avail = n.capacity - n.used;
            const pct = Math.round((avail / n.capacity) * 100);
            const bc = pct > 60 ? '#00e676' : pct > 30 ? '#ff8c00' : '#ff3030';
            const sc = statusColor(n.status);
            return (
              <div key={n.id} style={{ ...st.card, animationDelay: `${i * 40}ms` }}>
                <div style={st.cardTop}>
                  <div style={{ ...st.dot, background: sc, boxShadow: `0 0 6px ${sc}88` }} />
                  <span style={st.cardName}>{n.name}</span>
                  <span style={{ ...st.pill, color: sc, borderColor: sc + '33', background: sc + '10' }}>{statusLabel(n.status)}</span>
                  <button style={st.editBtn} onClick={() => startEdit(n)}>✏️</button>
                  <button style={st.delBtn}  onClick={() => setConfirm({ id: n.id, name: n.name })}>🗑</button>
                </div>
                <div style={st.cardRes}>
                  {n.resources.map(r => (
                    <span key={r} style={st.resBadge}>
                      {r === 'medical' ? '🏥' : r === 'food' ? '🍞' : '🚁'} {r}
                    </span>
                  ))}
                </div>
                <div style={st.capRow}>
                  <div style={st.capBar}>
                    <div style={{ ...st.capFill, width: `${pct}%`, background: bc, boxShadow: `0 0 5px ${bc}44` }} />
                  </div>
                  <span style={{ ...st.capNum, color: bc }}>{avail}/{n.capacity}</span>
                </div>
                {n.specialization && <div style={st.spec}>{n.specialization}</div>}
                {n.phone && <div style={st.phone}>📞 {n.phone}</div>}
              </div>
            );
          })}
        </div>
      )}

      {tab === 'add' && (
        <div style={st.scroll}>
          <div style={st.formGrid}>
            <div style={st.field}>
              <div style={st.label}>NGO Name *</div>
              <input style={st.input} value={form.name} onChange={e => setF('name', e.target.value)} placeholder="NGO Name" />
            </div>
            <div style={st.field}>
              <div style={st.label}>Phone</div>
              <input style={st.input} value={form.phone} onChange={e => setF('phone', e.target.value)} placeholder="Phone" />
            </div>

            <div style={st.field}>
              <div style={st.label}>Latitude</div>
              <input style={st.input} value={form.lat} onChange={e => setF('lat', e.target.value)} placeholder="12.9716" />
            </div>
            <div style={st.field}>
              <div style={st.label}>Longitude</div>
              <input style={st.input} value={form.lng} onChange={e => setF('lng', e.target.value)} placeholder="77.5946" />
            </div>
            <div style={st.field}>
              <div style={st.label}>Capacity *</div>
              <input style={st.input} type="number" min={1} value={form.capacity} onChange={e => setF('capacity', e.target.value)} placeholder="Capacity" />
            </div>
            <div style={st.field}>
              <div style={st.label}>Color</div>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <input type="color" value={form.color} onChange={e => setF('color', e.target.value)} style={{ width: 40, height: 32, border: 'none', background: 'none', cursor: 'pointer' }} />
                <span style={{ color: '#9aa0b8', fontSize: 11, fontFamily: 'monospace' }}>{form.color}</span>
              </div>
            </div>
            <div style={{ gridColumn: '1/-1', ...st.field }}>
              <div style={st.label}>🏷 Resources * (select all that apply)</div>
              <div style={{ display: 'flex', gap: 8 }}>
                {RESOURCE_OPTIONS.map(r => (
                  <button key={r} style={{ ...st.resToggle, ...(form.resources.includes(r) ? st.resToggleActive : {}) }} onClick={() => toggleResource(r)}>
                    {r === 'medical' ? '🏥' : r === 'food' ? '🍞' : '🚁'} {r}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ gridColumn: '1/-1', ...st.field }}>
              <div style={st.label}>📝 Specialization</div>
              <input style={st.input} value={form.specialization} onChange={e => setF('specialization', e.target.value)} placeholder="e.g. Emergency medical & trauma care" />
            </div>
          </div>

          <button style={{ ...st.submitBtn, opacity: busy ? 0.6 : 1 }} onClick={handleSubmit} disabled={busy}>
            {busy ? '⏳ Saving...' : editId ? '✏️ UPDATE NGO' : '➕ ADD NGO TO NETWORK'}
          </button>
          {editId && (
            <button style={st.cancelBtn} onClick={() => { setEditId(null); setForm(BLANK_NGO); setTab('list'); }}>
              Cancel Edit
            </button>
          )}
        </div>
      )}

      {tab === 'bulk' && (
        <div style={st.scroll}>
          <div style={st.field}>
            <div style={st.label}>📋 CSV Format</div>
            <div style={st.codeHint}>name,lat,lng,capacity,resources,phone,specialization,color</div>
          </div>
          <button style={st.templateBtn} onClick={() => setCsvText(CSV_TEMPLATE)}>📄 Load Template</button>
          <div style={st.field}>
            <div style={st.label}>📥 Paste CSV Data</div>
            <textarea
              style={{ ...st.input, height: 120, resize: 'vertical', fontFamily: 'monospace', fontSize: 11 }}
              value={csvText}
              onChange={e => { setCsvText(e.target.value); setCsvResult(null); }}
              placeholder={CSV_TEMPLATE}
            />
          </div>
          <button style={{ ...st.submitBtn, opacity: busy ? 0.6 : 1 }} onClick={handleBulkImport} disabled={busy}>
            {busy ? '⏳ Importing...' : '📥 IMPORT NGOs FROM CSV'}
          </button>
          {csvResult && (
            <div style={st.csvResult}>
              <div style={{ color: '#00e676', fontWeight: 700 }}>✅ Imported {csvResult.added} NGOs</div>
              {csvResult.ngos.map(n => (
                <div key={n.id} style={{ color: '#9aa0b8', fontSize: 10, marginTop: 3 }}>• {n.name} (cap: {n.capacity})</div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const st = {
  wrap: { display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden', minHeight: 0 },
  header: {
    padding: '10px 14px 0', borderBottom: '1px solid rgba(38,46,68,.6)',
    fontFamily: 'var(--font-mono)', fontSize: 10, color: '#6b7394', letterSpacing: 1.5,
    display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0,
  },
  headerDot: { width: 6, height: 6, borderRadius: '50%', background: '#00e676', display: 'inline-block', animation: 'pulse 2s ease-in-out infinite' },
  count: { background: 'rgba(79,195,247,.12)', color: '#4fc3f7', padding: '2px 7px', borderRadius: 8, fontSize: 10, fontWeight: 700 },
  tabs: { marginLeft: 'auto', display: 'flex', gap: 4 },
  tab: { padding: '4px 7px', fontSize: 9, border: '1px solid rgba(38,46,68,.6)', background: 'transparent', color: '#6b7394', borderRadius: 5, cursor: 'pointer', fontFamily: 'var(--font-mono)', marginBottom: 8 },
  tabActive: { background: 'rgba(0,230,118,.1)', color: '#00e676', borderColor: 'rgba(0,230,118,.3)' },
  msg: { margin: '6px 14px', padding: '6px 10px', borderRadius: 6, border: '1px solid', fontSize: 11, fontFamily: 'var(--font-mono)', flexShrink: 0 },
  confirmBox: { margin: '6px 14px', padding: '10px', borderRadius: 8, border: '1px solid rgba(255,69,69,.3)', background: 'rgba(255,69,69,.06)', flexShrink: 0 },
  confirmText: { color: '#e8eaf0', fontSize: 12 },
  confirmYes: { padding: '5px 14px', background: 'rgba(255,69,69,.2)', border: '1px solid rgba(255,69,69,.4)', color: '#ff4545', borderRadius: 5, cursor: 'pointer', fontSize: 11, fontFamily: 'var(--font-mono)' },
  confirmNo:  { padding: '5px 14px', background: 'rgba(26,32,48,.5)', border: '1px solid rgba(38,46,68,.6)', color: '#9aa0b8', borderRadius: 5, cursor: 'pointer', fontSize: 11, fontFamily: 'var(--font-mono)' },
  scroll: { flex: 1, overflowY: 'auto', padding: '8px 10px' },
  empty: { color: '#6b7394', fontSize: 11, textAlign: 'center', padding: 20 },
  card: {
    background: 'rgba(26,32,48,.5)', border: '1px solid rgba(38,46,68,.6)', borderRadius: 10,
    padding: '10px 12px', marginBottom: 6, animation: 'slideUp .3s ease-out both',
  },
  cardTop: { display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 },
  dot: { width: 7, height: 7, borderRadius: '50%', flexShrink: 0 },
  cardName: { fontSize: 13, fontWeight: 600, flex: 1, color: '#e8eaf0' },
  pill: { fontFamily: 'var(--font-mono)', fontSize: 8, fontWeight: 700, padding: '2px 7px', borderRadius: 4, border: '1px solid', letterSpacing: .5 },
  editBtn: { padding: '3px 7px', fontSize: 10, background: 'rgba(79,195,247,.1)', border: '1px solid rgba(79,195,247,.2)', color: '#4fc3f7', borderRadius: 4, cursor: 'pointer' },
  delBtn:  { padding: '3px 7px', fontSize: 10, background: 'rgba(255,69,69,.1)',  border: '1px solid rgba(255,69,69,.2)',  color: '#ff4545', borderRadius: 4, cursor: 'pointer' },
  cardRes: { display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 7 },
  resBadge: { fontSize: 9, padding: '3px 8px', borderRadius: 5, border: '1px solid rgba(38,46,68,.6)', background: 'rgba(26,32,48,.3)', color: '#9aa0b8', fontFamily: 'var(--font-mono)' },
  capRow: { display: 'flex', alignItems: 'center', gap: 8 },
  capBar: { flex: 1, height: 4, background: 'rgba(38,46,68,.4)', borderRadius: 3, overflow: 'hidden' },
  capFill: { height: '100%', borderRadius: 3, transition: 'width .6s ease-out' },
  capNum: { fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 600, minWidth: 38, textAlign: 'right' },
  spec: { fontSize: 9, color: '#6b7394', marginTop: 4 },
  phone: { fontSize: 9, color: '#6b7394', marginTop: 2 },

  formGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 },
  field: { marginBottom: 8 },
  label: { fontFamily: 'var(--font-mono)', fontSize: 10, color: '#6b7394', marginBottom: 4 },
  input: { width: '100%', padding: '8px 10px', background: 'rgba(26,32,48,.6)', border: '1px solid rgba(38,46,68,.6)', borderRadius: 7, color: '#e8eaf0', fontSize: 12, outline: 'none' },
  areaButtons: { display: 'flex', flexWrap: 'wrap', gap: 5 },
  areaBtn: { padding: '4px 9px', fontSize: 9, background: 'rgba(26,32,48,.5)', border: '1px solid rgba(38,46,68,.6)', color: '#9aa0b8', borderRadius: 5, cursor: 'pointer', fontFamily: 'var(--font-mono)' },
  areaBtnActive: { background: 'rgba(0,230,118,.1)', borderColor: '#00e676', color: '#00e676' },
  resToggle: { padding: '7px 14px', fontSize: 11, background: 'rgba(26,32,48,.5)', border: '1px solid rgba(38,46,68,.6)', color: '#6b7394', borderRadius: 7, cursor: 'pointer' },
  resToggleActive: { background: 'rgba(0,230,118,.1)', borderColor: '#00e676', color: '#00e676' },
  submitBtn: {
    width: '100%', padding: '11px', background: 'linear-gradient(135deg,#00e676,#00c853)',
    border: 'none', borderRadius: 8, color: '#0a0d12', fontFamily: 'var(--font-mono)',
    fontSize: 11, fontWeight: 700, letterSpacing: 1.5, cursor: 'pointer', marginBottom: 6,
  },
  cancelBtn: {
    width: '100%', padding: '8px', background: 'rgba(26,32,48,.5)',
    border: '1px solid rgba(38,46,68,.6)', borderRadius: 8, color: '#6b7394',
    fontFamily: 'var(--font-mono)', fontSize: 10, cursor: 'pointer',
  },
  codeHint: { fontFamily: 'monospace', fontSize: 10, color: '#4fc3f7', background: 'rgba(26,32,48,.8)', border: '1px solid rgba(38,46,68,.6)', borderRadius: 5, padding: '5px 8px', marginBottom: 4 },
  templateBtn: {
    marginBottom: 8, padding: '6px 12px', fontSize: 10, background: 'rgba(79,195,247,.1)',
    border: '1px solid rgba(79,195,247,.25)', color: '#4fc3f7', borderRadius: 6, cursor: 'pointer', fontFamily: 'var(--font-mono)',
  },
  csvResult: { marginTop: 10, padding: '10px', background: 'rgba(0,230,118,.06)', border: '1px solid rgba(0,230,118,.2)', borderRadius: 7, fontSize: 11 },
};
