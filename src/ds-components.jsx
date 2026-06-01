// src/ds-components.jsx
// Design system components ported from design_handoff_wcup_yosou/shared.jsx.
// Ho* prefix avoids collision with lucide-react imports in App.jsx.

import React from 'react';

// ── Filled UI icons ──────────────────────────────────────────────────────────
// Paths are verbatim from shared.jsx (filled / shape-based, not thin outlines).
// name: trophy | flame | coin | chart | clock | calendar | plus | chevron |
//        chevdown | share | ball | bolt | lock | check | pin | home |
//        bell | cog | chat
export function HoIcon({ name, size = 20, className = '', style }) {
  const P = {
    trophy:   'M6 3h12v2h3v3a4 4 0 0 1-4 4 6 6 0 0 1-4 3.4V18h3v3H8v-3h3v-2.6A6 6 0 0 1 7 12a4 4 0 0 1-4-4V5h3V3Zm0 4H5v1a2 2 0 0 0 1 1.7V7Zm12 0v2.7A2 2 0 0 0 19 8V7h-1Z',
    flame:    'M13 2c.5 3-1.5 4.2-2.7 5.6C9 9 8 10.2 8 12a4 4 0 0 0 1.2 2.9C8.5 14.6 8 13.7 8 13c0-2 2-3 2.6-5 .8 1 1.4 1.6 2.2 2.6C14 12 15 13 15 15a5 5 0 1 1-10 0c0-3.2 2.2-5 3.7-6.8C10.2 6.4 12.7 4.7 13 2Z',
    coin:     'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm0 3.5c2.8 0 5 .9 5 2s-2.2 2-5 2-5-.9-5-2 2.2-2 5-2Zm5 5.2c0 1.1-2.2 2-5 2s-5-.9-5-2v3c0 1.1 2.2 2 5 2s5-.9 5-2v-3Z',
    chart:    'M4 13h4v7H4v-7Zm6-6h4v13h-4V7Zm6-4h4v17h-4V3Z',
    clock:    'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm1 5h-2v6l5 3 1-1.7-4-2.3V7Z',
    calendar: 'M7 2v2H5a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-2V2h-2v2H9V2H7ZM5 9h14v10H5V9Z',
    plus:     'M11 5h2v6h6v2h-6v6h-2v-6H5v-2h6V5Z',
    chevron:  'M8.5 5.5 15 12l-6.5 6.5L7 17l5-5-5-5 1.5-1.5Z',
    chevdown: 'M5.5 8.5 12 15l6.5-6.5L17 7l-5 5-5-5-1.5 1.5Z',
    share:    'M14 9V5l7 7-7 7v-4.1C9 11.8 6 13 3 18c0-7 5-9 11-9Z',
    ball:     'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm0 3 3 2.2-1.1 3.5h-3.8L9 7.2 12 5Zm-6.5 6 2.7-.2 1.2 3.6-2.2 1.8A8 8 0 0 1 5.5 11Zm13 0a8 8 0 0 1-1.7 5.2l-2.2-1.8 1.2-3.6 2.7.2ZM9.7 19.4l1.2-2.5h2.2l1.2 2.5a8 8 0 0 1-4.6 0Z',
    bolt:     'M13 2 4 14h6l-1 8 9-12h-6l1-8Z',
    lock:     'M12 2a4 4 0 0 0-4 4v3H6v13h12V9h-2V6a4 4 0 0 0-4-4Zm-2 7V6a2 2 0 1 1 4 0v3h-4Z',
    check:    'M9.5 17.5 4 12l1.7-1.7 3.8 3.8 8.8-8.8L20 7l-10.5 10.5Z',
    pin:      'M12 2a7 7 0 0 0-7 7c0 5 7 13 7 13s7-8 7-13a7 7 0 0 0-7-7Zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5Z',
    home:     'M12 3 2 11h3v9h6v-6h2v6h6v-9h3L12 3Z',
    bell:     'M12 2a6 6 0 0 0-6 6v3.8L4 15.2V17h16v-1.8L18 11.8V8a6 6 0 0 0-6-6Zm0 20a3 3 0 0 0 2.8-2H9.2A3 3 0 0 0 12 22Z',
    cog:      'M19.4 13a7.5 7.5 0 0 0 0-2l2-1.6-2-3.4-2.4 1a7.3 7.3 0 0 0-1.7-1l-.3-2.6H9l-.3 2.6a7.3 7.3 0 0 0-1.7 1l-2.4-1-2 3.4L2.6 11a7.5 7.5 0 0 0 0 2l-2 1.6 2 3.4 2.4-1c.5.4 1.1.8 1.7 1l.3 2.6h6l.3-2.6c.6-.2 1.2-.6 1.7-1l2.4 1 2-3.4-2-1.6ZM12 15.5a3.5 3.5 0 1 1 0-7 3.5 3.5 0 0 1 0 7Z',
    chat:     'M4 4h16a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H9l-4.5 4V5a1 1 0 0 1 1-1Zm3.5 5.5a1.2 1.2 0 1 0 0 2.4 1.2 1.2 0 0 0 0-2.4Zm4.5 0a1.2 1.2 0 1 0 0 2.4 1.2 1.2 0 0 0 0-2.4Zm4.5 0a1.2 1.2 0 1 0 0 2.4 1.2 1.2 0 0 0 0-2.4Z',
  };
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      style={style}
      aria-hidden="true"
    >
      <path d={P[name] || P.ball} />
    </svg>
  );
}

// ── Round avatar with initial ─────────────────────────────────────────────────
export function HoAvatar({ name, size = 36, bg = 'linear-gradient(135deg,#0d2a5e,#2a5bd0)', ring }) {
  return (
    <span
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: bg,
        fontSize: Math.round(size * 0.42),
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 900,
        color: '#fff',
        flexShrink: 0,
        boxShadow: ring ? `0 0 0 2.5px ${ring}` : '0 2px 6px rgba(0,0,0,.25)',
      }}
    >
      {name}
    </span>
  );
}

// ── Dark-screen sub-header ────────────────────────────────────────────────────
// back chevron (calls onBack) + title + optional sub-label + optional right node
export function HoScreenHeader({ title, sub, right, onBack }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '12px 20px',
        flexShrink: 0,
      }}
    >
      <button
        onClick={onBack}
        className="active:scale-90 transition-transform"
        style={{
          width: 34,
          height: 34,
          borderRadius: 11,
          background: 'rgba(255,255,255,.08)',
          border: 'none',
          cursor: 'pointer',
          color: '#fff',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <span style={{ display: 'inline-flex', transform: 'scaleX(-1)' }}>
          <HoIcon name="chevron" size={20} />
        </span>
      </button>
      <div style={{ minWidth: 0, flex: 1 }}>
        <p
          style={{
            color: '#fff',
            fontWeight: 900,
            fontSize: 17,
            lineHeight: 1.25,
            margin: 0,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {title}
        </p>
        {sub && (
          <p
            style={{
              fontSize: 11,
              fontWeight: 700,
              margin: '2px 0 0',
              color: '#8fa3c9',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {sub}
          </p>
        )}
      </div>
      {right}
    </div>
  );
}
