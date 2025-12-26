import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Log build info on application start
console.log(
  `%c[TeşvikSOR] Build: ${__BUILD_DATE__} ${__BUILD_TIME__} (${__BUILD_ID__})`,
  'color: #10b981; font-weight: bold; font-size: 12px;'
);
console.log(`%c[TeşvikSOR] Timestamp: ${__BUILD_TIMESTAMP__}`, 'color: #6b7280; font-size: 10px;');

createRoot(document.getElementById("root")!).render(<StrictMode>
    <App />
  </StrictMode>);
