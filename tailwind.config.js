// === Color cheatsheet ===
// 背景: bg-navy-base (基本) / bg-navy-hero (ヒーロー)
// CTA: bg-hinomaru text-white shadow-cta-red
// バッジ祝福: bg-gold shadow-cta-gold
// データカード: bg-white shadow-data-card rounded-card
// 文字: text-text-on-navy (ネイビー上) / text-text-on-white (白上)

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // --- Navy (侍ブルー基調) ---
        "navy-hero":      "#061533",
        "navy-base":      "#0a1f4c",
        "navy-700":       "#0d2a5e",
        "navy-elevated":  "#11337a",
        "navy-elevated-2":"#11367a",

        // --- Cards ---
        "card-mist": "#F0F4FA",

        // --- Accent: 日の丸赤 ---
        "hinomaru": {
          DEFAULT: "#E60033",
          hover:   "#cc002e",
          active:  "#b30028",
          light:   "#ff5a7a",
          light2:  "#ff6a86",
        },

        // --- Accent: Gold (celebration) ---
        "gold": {
          DEFAULT: "#F4B400",
          light:   "#ffce4a",
        },

        // --- Text on Navy ---
        "text-on-navy": {
          DEFAULT: "#FFFFFF",
          dim:     "#C9D6EC",
          weak:    "#8fa3c9",
          weakest: "#5e74a0",
        },

        // --- Text on White Card ---
        "text-on-white": {
          DEFAULT: "#0a1f4c",
          gray:    "#5B6B85",
        },

        // --- Success ---
        "success": {
          DEFAULT: "#0e8a46",
          light:   "#34d27e",
        },

        // --- Position colors ---
        "pos-fw": "#E60033",
        "pos-mf": "#F4B400",
        "pos-df": "#2a5bd0",

        // --- Social ---
        "line-green": "#06C755",
        "x-black":    "#111111",
      },
      fontFamily: {
        sans: ['"Noto Sans JP"', "system-ui", "-apple-system", "sans-serif"],
      },
      borderRadius: {
        "card":    "1rem",     // 16px
        "card-lg": "1.5rem",   // 24px
        "sheet":   "1.75rem",  // 28px
      },
      boxShadow: {
        "data-card": "0 10px 26px rgba(4,12,33,.30)",
        "cta-red":   "0 10px 26px rgba(230,0,51,.42)",
        "cta-gold":  "0 10px 26px rgba(244,180,0,.40)",
        "hero":      "0 18px 50px rgba(0,0,0,.45)",
      },
      fontSize: {
        "display-sm": ["30px", { lineHeight: "1.1", fontWeight: "900" }],
        "display":    ["38px", { lineHeight: "1.1", fontWeight: "900" }],
        "display-lg": ["46px", { lineHeight: "1.1", fontWeight: "900" }],
        "title-sm":   ["19px", { lineHeight: "1.3", fontWeight: "800" }],
        "title":      ["22px", { lineHeight: "1.3", fontWeight: "800" }],
        "title-lg":   ["24px", { lineHeight: "1.3", fontWeight: "800" }],
      },
      keyframes: {
        "wc-sheet": {
          "0%":   { transform: "translateY(20px)", opacity: "0" },
          "100%": { transform: "translateY(0)",    opacity: "1" },
        },
        "wc-pop": {
          "0%":   { transform: "scale(0.95)", opacity: "0" },
          "100%": { transform: "scale(1)",    opacity: "1" },
        },
        "wc-pop-big": {
          "0%":   { transform: "scale(0.8)",    opacity: "0" },
          "60%":  { transform: "scale(1.05)",   opacity: "1" },
          "100%": { transform: "scale(1)" },
        },
        "wc-rise": {
          "0%":   { transform: "translateY(12px)", opacity: "0" },
          "100%": { transform: "translateY(0)",    opacity: "1" },
        },
        "wc-fall": {
          "0%":   { transform: "translateY(-20px) rotate(0deg)",   opacity: "1" },
          "100%": { transform: "translateY(900px) rotate(720deg)", opacity: "0" },
        },
        "wc-glow": {
          "0%, 100%": { opacity: "0.6" },
          "50%":      { opacity: "1" },
        },
        "wc-spin": {
          "0%":   { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
      },
      animation: {
        "wc-sheet":   "wc-sheet 0.34s ease-out",
        "wc-pop":     "wc-pop 0.2s ease-out",
        "wc-pop-big": "wc-pop-big 0.4s ease-out",
        "wc-rise":    "wc-rise 0.5s ease-out",
        "wc-fall":    "wc-fall 3.5s linear infinite",
        "wc-glow":    "wc-glow 2s ease-in-out infinite",
        "wc-spin":    "wc-spin 1s linear infinite",
      },
    },
  },
  plugins: [],
}
