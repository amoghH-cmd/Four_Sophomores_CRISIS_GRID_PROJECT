import React, { useEffect, useRef } from 'react';
import { formatTime } from '../utils/helpers';

const MSG_STYLES = {
  'to-user': { bg: 'rgba(79,195,247,.06)', border: 'rgba(79,195,247,.18)', color: '#4fc3f7', icon: '📱' },
  'to-ngo':  { bg: 'rgba(0,230,118,.06)',  border: 'rgba(0,230,118,.18)',  color: '#00e676', icon: '📡' },
  'system':  { bg: 'rgba(107,115,148,.06)', border: 'rgba(107,115,148,.18)', color: '#6b7394', icon: '⚙' },
};

export default function CommsLog({ messages }) {
  const bottomRef = useRef(null);
  const logRef = useRef(null);

  useEffect(() => {
    const el = logRef.current;
    if (!el) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
      return;
    }
    const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 100;
    if (isNearBottom) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  return (
    <div style={styles.wrap}>
      <div style={styles.header}>
        <span style={styles.headerDot} />
        COMMUNICATIONS LOG
        <span style={styles.cursor}>▋</span>
      </div>
      <div ref={logRef} style={styles.log}>
        {messages.length === 0 && (
          <div style={styles.empty}>
            <span style={{ opacity: .3 }}>⌁</span> Waiting for transmissions...
          </div>
        )}
        {[...messages].reverse().map((m, i) => {
          const s = MSG_STYLES[m.type] || MSG_STYLES.system;
          return (
            <div key={m.id} style={{
              ...styles.msg,
              background: s.bg,
              borderColor: s.border,
              animation: `slideUp .25s ease-out ${Math.min(i, 3) * 30}ms both`,
            }}>
              <span style={styles.icon}>{s.icon}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <span style={{ ...styles.time, color: s.color }}>{formatTime(m.ts)}</span>
                <span style={{ color: s.color, fontSize: 11, lineHeight: 1.4, wordBreak: 'break-word' }}>
                  {m.message}
                </span>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}

const styles = {
  wrap: {
    borderTop: '1px solid rgba(38,46,68,.6)',
    display: 'flex',
    flexDirection: 'column',
    height: 200,
    flexShrink: 0,
  },
  header: {
    padding: '10px 14px',
    borderBottom: '1px solid rgba(38,46,68,.6)',
    flexShrink: 0,
    fontFamily: "var(--font-mono)",
    fontSize: 10,
    color: '#6b7394',
    letterSpacing: 1.5,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  headerDot: {
    width: 6, height: 6, borderRadius: '50%',
    background: '#ffd600',
    animation: 'pulse 2s ease-in-out infinite',
    display: 'inline-block',
  },
  cursor: {
    marginLeft: 'auto',
    color: '#00e676',
    animation: 'blink 1s step-start infinite',
    fontSize: 12,
  },
  log: {
    flex: 1,
    overflowY: 'auto',
    padding: '6px 8px',
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    fontFamily: "var(--font-mono)",
  },
  empty: {
    textAlign: 'center',
    color: '#6b7394',
    fontSize: 11,
    padding: '20px 10px',
    fontFamily: "var(--font-mono)",
  },
  msg: {
    padding: '6px 8px',
    borderRadius: 6,
    border: '1px solid',
    display: 'flex',
    gap: 6,
    alignItems: 'flex-start',
  },
  icon: { fontSize: 10, flexShrink: 0, marginTop: 2 },
  time: {
    fontFamily: "var(--font-mono)",
    fontSize: 9,
    marginRight: 6,
    opacity: .7,
  },
};
