import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { sendMessage } from './utils/index.ts'

ReactDOM.createRoot(document.getElementById('root')!).render(<App />)

let loaded = false;
window.addEventListener('load', () => {
  if (loaded) { return; }
	loaded = true;
  // window.addEventListener('message', (e) => {
  //   sendMessage({ type: 'res' });
  // });

  sendMessage({ type: 'onload', dom: 11 });
});