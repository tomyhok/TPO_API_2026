import React, { createContext, useContext, useState } from 'react';

const RightPanelContext = createContext();

export function RightPanelProvider({ children }) {
  const [panelContent, setPanelContent] = useState(null);
  const [isOpen, setIsOpen] = useState(false); // For mobile bottom sheet later

  const openPanel = (content) => {
    setPanelContent(content);
    setIsOpen(true);
  };

  const closePanel = () => {
    setIsOpen(false);
  };

  return (
    <RightPanelContext.Provider value={{ panelContent, openPanel, closePanel, isOpen }}>
      {children}
    </RightPanelContext.Provider>
  );
}

export function useRightPanel() {
  return useContext(RightPanelContext);
}
