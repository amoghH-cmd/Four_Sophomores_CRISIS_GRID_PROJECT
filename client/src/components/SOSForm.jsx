import React, { useState, useRef } from 'react';



export default function SOSForm({ onSubmit, loading }) {
  const [form, setForm] = useState({
    loc: '', type: 'medical', people: '',
    description: '',
  });
  const [flash, setFlash] = useState(false);
  const btnRef = useRef(null);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.loc.trim()) return;
    await onSubmit(form);
    setFlash(true);
    setTimeout(() => setFlash(false), 800);
  };



  return (
    <div style={styles.wrap}>
      <div style={styles.sectionLabel}>
        <span style={styles.labelDot} />
        SIMULATE SMS INPUT
      </div>


      <form onSubmit={handleSubmit} style={styles.form}>
        <Field label="Location">
          <input
            id="sos-location"
            style={styles.input}
            value={form.loc}
            onChange={e => set('loc', e.target.value)}
            placeholder="Location"
          />
        </Field>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <Field label="Type of Need">
            <select
              id="sos-type"
              style={styles.input}
              value={form.type}
              onChange={e => set('type', e.target.value)}
            >
              <option value="medical">🏥 Medical</option>
              <option value="food">🍞 Food</option>
              <option value="rescue">🚁 Rescue</option>
            </select>
          </Field>
          <Field label="No. of People">
            <input
              id="sos-people"
              style={styles.input}
              type="number"
              min={1}
              max={500}
              value={form.people}
              onChange={e => set('people', e.target.value)}
            />
          </Field>
        </div>

        <Field label="Description">
          <textarea
            id="sos-description"
            style={{ ...styles.input, height: 58, resize: 'none' }}
            value={form.description}
            onChange={e => set('description', e.target.value)}
            placeholder="Description"
          />
        </Field>

        <button
          ref={btnRef}
          id="sos-submit"
          type="submit"
          style={{
            ...styles.submitBtn,
            opacity: loading ? 0.6 : 1,
            boxShadow: flash
              ? '0 0 30px rgba(0,230,118,.5), inset 0 0 30px rgba(0,230,118,.15)'
              : '0 4px 20px rgba(255, 69, 69, .3)',
            background: flash
              ? 'linear-gradient(135deg, #00e676, #00c853)'
              : 'linear-gradient(135deg, #ff4545 0%, #e02020 100%)',
          }}
          disabled={loading}
        >
          {loading ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ display: 'inline-block', width: 14, height: 14, border: '2px solid rgba(255,255,255,.3)', borderTop: '2px solid #fff', borderRadius: '50%', animation: 'spin .8s linear infinite' }} />
              TRANSMITTING...
            </span>
          ) : flash ? (
            '✅ SOS TRANSMITTED'
          ) : (
            '⚡ SEND SOS REQUEST'
          )}
        </button>
      </form>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={styles.fieldLabel}>{label}</div>
      {children}
    </div>
  );
}

const styles = {
  wrap: {
    padding: '14px 14px 10px',
    borderBottom: '1px solid rgba(38, 46, 68, .6)',
    animation: 'fadeIn .4s ease-out',
  },
  sectionLabel: {
    fontFamily: "var(--font-mono)",
    fontSize: 10,
    color: '#6b7394',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 12,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  labelDot: {
    width: 6, height: 6, borderRadius: '50%',
    background: '#ff4545',
    animation: 'pulse 2s ease-in-out infinite',
    display: 'inline-block',
  },
  presets: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr',
    gap: 6,
    marginBottom: 14,
  },
  presetBtn: {
    padding: '8px 6px',
    fontSize: 10,
    background: 'rgba(26, 32, 48, .5)',
    border: '1px solid rgba(38, 46, 68, .6)',
    borderRadius: 8,
    color: '#9aa0b8',
    cursor: 'pointer',
    fontFamily: "'DM Sans',sans-serif",
    transition: 'all .2s ease',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 4,
  },
  presetLabel: {
    fontSize: 9,
    letterSpacing: 0.3,
    opacity: .8,
  },
  form: {},
  fieldLabel: {
    fontFamily: "var(--font-mono)",
    fontSize: 10,
    color: '#6b7394',
    letterSpacing: 0.5,
    marginBottom: 5,
  },
  input: {
    width: '100%',
    padding: '9px 12px',
    background: 'rgba(26, 32, 48, .6)',
    border: '1px solid rgba(38, 46, 68, .6)',
    borderRadius: 8,
    color: '#e8eaf0',
    fontFamily: "'DM Sans',sans-serif",
    fontSize: 13,
    outline: 'none',
    transition: 'border-color .2s, box-shadow .2s',
  },
  submitBtn: {
    width: '100%',
    padding: '12px 16px',
    marginTop: 6,
    background: 'linear-gradient(135deg, #ff4545 0%, #e02020 100%)',
    border: 'none',
    borderRadius: 10,
    color: '#fff',
    fontFamily: "var(--font-mono)",
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: 1.5,
    cursor: 'pointer',
    transition: 'all .25s ease',
    position: 'relative',
    overflow: 'hidden',
    boxShadow: '0 4px 20px rgba(255, 69, 69, .3)',
  },
};
