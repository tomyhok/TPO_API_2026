import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import App from './App.jsx';
import { SeasonProvider } from './contexts/SeasonContext';

import { RightPanelProvider } from './contexts/RightPanelContext';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <SeasonProvider>
        <RightPanelProvider>
          <App />
        </RightPanelProvider>
      </SeasonProvider>
    </BrowserRouter>
  </StrictMode>,
);
