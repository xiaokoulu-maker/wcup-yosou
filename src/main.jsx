import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './tailwind.css'   // Tailwind utilities（既存スタイルより先に読む）
import './styles.css'     // 既存スタイル（後勝ち = 優先）

ReactDOM.createRoot(document.getElementById('root')).render(<App />)
