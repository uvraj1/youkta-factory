import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import '@xyflow/react/dist/style.css';

// Fix for "ResizeObserver loop limit exceeded"
const resizeObserverLoopErr = /^[^(]*ResizeObserver loop limit exceeded/;
window.addEventListener('error', (e) => {
  if (resizeObserverLoopErr.test(e.message)) {
    e.stopImmediatePropagation();
  }
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
