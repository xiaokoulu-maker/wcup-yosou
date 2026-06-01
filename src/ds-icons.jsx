// ds-icons.jsx — redesign line icons (24×24, stroke=currentColor)
// Converted from design_handoff_wcup_redesign/icons.jsx to ES module
import React from 'react';

export function Icon({ name, size = 22, stroke = 1.8, style }) {
  const common = {
    width: size, height: size, viewBox: "0 0 24 24", fill: "none",
    stroke: "currentColor", strokeWidth: stroke, strokeLinecap: "round",
    strokeLinejoin: "round", style,
  };
  const P = {
    users: <g><path d="M16 19v-1.5a3.5 3.5 0 0 0-3.5-3.5h-5A3.5 3.5 0 0 0 4 17.5V19"/><circle cx="10" cy="8" r="3.2"/><path d="M20 19v-1.4a3.4 3.4 0 0 0-2.6-3.3"/><path d="M15.5 5.3a3.2 3.2 0 0 1 0 6"/></g>,
    trophy: <g><path d="M7 4h10v4a5 5 0 0 1-10 0V4Z"/><path d="M7 6H4.5a2.5 2.5 0 0 0 2.8 2.8"/><path d="M17 6h2.5a2.5 2.5 0 0 1-2.8 2.8"/><path d="M12 13v3"/><path d="M9 20h6"/><path d="M10 16h4l.6 4H9.4l.6-4Z"/></g>,
    sliders: <g><path d="M4 7h10"/><path d="M18 7h2"/><circle cx="16" cy="7" r="2"/><path d="M4 17h2"/><path d="M10 17h10"/><circle cx="8" cy="17" r="2"/></g>,
    bracket: <g><path d="M4 6h5v5"/><path d="M4 18h5v-5"/><path d="M9 11h4v2h-4"/><path d="M13 12h3"/><path d="M16 8v8"/><path d="M16 12h4"/></g>,
    check: <g><circle cx="12" cy="12" r="8.4"/><path d="M8.5 12.3l2.4 2.4 4.6-4.9"/></g>,
    grid: <g><rect x="4" y="4" width="7" height="7" rx="1.6"/><rect x="13" y="4" width="7" height="7" rx="1.6"/><rect x="4" y="13" width="7" height="7" rx="1.6"/><rect x="13" y="13" width="7" height="7" rx="1.6"/></g>,
    shield: <g><path d="M12 3.5l6.5 2.4v5c0 4-2.7 7.4-6.5 8.6C8.2 18.3 5.5 14.9 5.5 11V5.9L12 3.5Z"/><path d="M9.3 11.8l1.9 1.9 3.5-3.7"/></g>,
    arrowRight: <g><path d="M5 12h13"/><path d="M13 6l6 6-6 6"/></g>,
    chevron: <path d="M9 6l6 6-6 6"/>,
    link: <g><path d="M9.5 14.5l5-5"/><path d="M11 7.5l1.2-1.2a3.4 3.4 0 0 1 4.8 4.8L15.8 12"/><path d="M13 16.5l-1.2 1.2a3.4 3.4 0 0 1-4.8-4.8L8.2 12"/></g>,
    copy: <g><rect x="9" y="9" width="11" height="11" rx="2.2"/><path d="M5 15V6a2 2 0 0 1 2-2h8"/></g>,
    gear: <g><circle cx="12" cy="12" r="3"/><path d="M12 3.5v2M12 18.5v2M5.5 5.5l1.4 1.4M17.1 17.1l1.4 1.4M3.5 12h2M18.5 12h2M5.5 18.5l1.4-1.4M17.1 6.9l1.4-1.4"/></g>,
    send: <g><path d="M5 12L19 5l-4 14-3.5-5.5L5 12Z"/><path d="M11.5 13.5L19 5"/></g>,
    coffee: <g><path d="M5 9h11v4a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4V9Z"/><path d="M16 10h2.2a2 2 0 0 1 0 4H16"/><path d="M8 3.5c-.6.8-.6 1.4 0 2.2M11.5 3.5c-.6.8-.6 1.4 0 2.2"/><path d="M5 20h11"/></g>,
    mega: <g><path d="M5 10v4h3l8 4V6l-8 4H5Z"/><path d="M18.5 9.5a4 4 0 0 1 0 5"/></g>,
    bolt: <path d="M13 3L5 13h5l-1 8 8-10h-5l1-8Z"/>,
    plus: <g><path d="M12 5v14M5 12h14"/></g>,
    chat: <g><path d="M5 6.5A2.5 2.5 0 0 1 7.5 4h9A2.5 2.5 0 0 1 19 6.5v7A2.5 2.5 0 0 1 16.5 16H10l-4 3.5V16H7.5"/></g>,
    chatBig: <g><path d="M4 7.5A3.5 3.5 0 0 1 7.5 4h9A3.5 3.5 0 0 1 20 7.5v6A3.5 3.5 0 0 1 16.5 17H11l-5 4v-4H7.5"/></g>,
    back: <path d="M14 6l-6 6 6 6"/>,
    sparkle: <g><path d="M12 4l1.6 4.4L18 10l-4.4 1.6L12 16l-1.6-4.4L6 10l4.4-1.6L12 4Z"/></g>,
    lock: <g><rect x="5.5" y="10.5" width="13" height="9" rx="2"/><path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5"/></g>,
    list: <g><path d="M9 6h11M9 12h11M9 18h11"/><circle cx="4.5" cy="6" r="1.1"/><circle cx="4.5" cy="12" r="1.1"/><circle cx="4.5" cy="18" r="1.1"/></g>,
    flag: <g><path d="M6 21V4"/><path d="M6 4.5h11l-2 3 2 3H6"/></g>,
    bell: <g><path d="M6.5 16V11a5.5 5.5 0 0 1 11 0v5l1.5 2H5l1.5-2Z"/><path d="M10 19a2 2 0 0 0 4 0"/></g>,
    menu: <g><path d="M4 7h16M4 12h16M4 17h16"/></g>,
    calendar: <g><rect x="4" y="5.5" width="16" height="14" rx="2.4"/><path d="M4 9.5h16M8.5 3.5v4M15.5 3.5v4"/></g>,
    clock: <g><circle cx="12" cy="12" r="8.2"/><path d="M12 7.6V12l3 2"/></g>,
    coin: <g><circle cx="12" cy="12" r="8.2"/><path d="M9.4 9.4h3.4a1.8 1.8 0 0 1 0 3.6H9.4h3.6a1.8 1.8 0 0 1 0 3.6H9"/><path d="M11 7.5v9"/></g>,
    medal: <g><circle cx="12" cy="14.5" r="5"/><path d="M12 12.6l1 2 .2.03-1.2 1.1.3 2-1.3-1-1.3 1 .3-2-1.2-1.1.2-.03 1-2"/><path d="M9 9.5L7 4h3l1.8 3.2M15 9.5L17 4h-3l-1.8 3.2"/></g>,
    star: <path d="M12 4l2.3 5.2L20 9.9l-4.2 3.7L17 19.4 12 16.4 7 19.4l1.2-5.8L4 9.9l5.7-.7L12 4Z"/>,
    chart: <g><path d="M5 19V5"/><path d="M5 19h14"/><rect x="8" y="11" width="2.6" height="5" rx=".6"/><rect x="13" y="8" width="2.6" height="8" rx=".6"/></g>,
    ball: <g><circle cx="12" cy="12" r="8.2"/><path d="M12 8.2l3 2.2-1.1 3.5h-3.8L9 10.4 12 8.2Z"/><path d="M12 4v4.2M19 9.4l-4 1M16.9 16.5l-3-2.6M7.1 16.5l3-2.6M5 9.4l4 1"/></g>,
    share: <g><circle cx="6.5" cy="12" r="2.4"/><circle cx="17" cy="6.5" r="2.4"/><circle cx="17" cy="17.5" r="2.4"/><path d="M8.6 10.9l6.2-3.3M8.6 13.1l6.2 3.3"/></g>,
    xLogo: <g><path d="M5 5l14 14M19 5L5 19"/></g>,
    globe: <g><circle cx="12" cy="12" r="8.2"/><path d="M3.8 12h16.4M12 3.8c2.4 2.2 2.4 14.2 0 16.4-2.4-2.2-2.4-14.2 0-16.4Z"/></g>,
    person: <g><circle cx="12" cy="8.5" r="3.6"/><path d="M5.5 19.5a6.5 6.5 0 0 1 13 0"/></g>,
    edit: <g><path d="M14.5 5.5l4 4L9 19l-4.5 1 1-4.5L14.5 5.5Z"/><path d="M13 7l4 4"/></g>,
    flame: <g><path d="M12 3.5c.5 3-2.5 4-2.5 7a2.5 2.5 0 0 0 5 0c0-1-.4-1.7-.4-1.7.9.5 2.4 2 2.4 4.2a4.5 4.5 0 0 1-9 0c0-3.6 4-5.2 4.5-9.5Z"/></g>,
    crown: <g><path d="M4 17l-1-8 5 3.5L12 6l4 6.5L21 9l-1 8H4Z"/><path d="M4 19.5h16"/></g>,
    target: <g><circle cx="12" cy="12" r="8.2"/><circle cx="12" cy="12" r="4.4"/><circle cx="12" cy="12" r=".8" fill="currentColor" stroke="none"/></g>,
    shop: <g><path d="M5 9.5l1-4h12l1 4M4.5 9.5h15v9.5a1.5 1.5 0 0 1-1.5 1.5H6a1.5 1.5 0 0 1-1.5-1.5V9.5Z"/><path d="M9.5 13.5h5"/></g>,
    gift: <g><rect x="4.5" y="9.5" width="15" height="10.5" rx="1.6"/><path d="M3.5 9.5h17M12 9.5V20"/><path d="M12 9.5C9 9.5 8 4 12 6c4-2 3 3.5 0 3.5Z"/></g>,
    whistle: <g><path d="M11.5 9h8.5v3a4.5 4.5 0 0 1-9 0V9Z"/><circle cx="6.5" cy="11.5" r="3.5"/><path d="M11.5 10.5L15 8"/></g>,
    eye: <g><path d="M3 12s3.5-6 9-6 9 6 9 6-3.5 6-9 6-9-6-9-6Z"/><circle cx="12" cy="12" r="2.6"/></g>,
    refresh: <g><path d="M19 8a7 7 0 1 0 1.2 5"/><path d="M19 4v4h-4"/></g>,
    pitch: <g><rect x="4" y="4" width="16" height="16" rx="2"/><path d="M12 4v16M4 9h3v6H4M20 9h-3v6h3"/><circle cx="12" cy="12" r="2.4"/></g>,
    camera: <g><rect x="3.5" y="7" width="17" height="12" rx="2.4"/><circle cx="12" cy="13" r="3.2"/><path d="M8.5 7l1.2-2h4.6L15.5 7"/></g>,
  };
  return <svg {...common}>{P[name] || null}</svg>;
}

export default Icon;
