import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './styles/index.css';
import App from './App.jsx';
import { SeasonProvider } from './contexts/SeasonContext';
import { CategoryProvider } from './contexts/CategoryContext';

import { RightPanelProvider } from './contexts/RightPanelContext';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <SeasonProvider>
        <CategoryProvider>
          <RightPanelProvider>
            <App />
          </RightPanelProvider>
        </CategoryProvider>
      </SeasonProvider>
    </BrowserRouter>
  </StrictMode>,
);
