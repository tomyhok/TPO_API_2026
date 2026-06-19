import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiRequest } from '../services/api';

const SeasonContext = createContext();

export function SeasonProvider({ children }) {
  const [seasons, setSeasons] = useState([]);
  const [selectedSeasonId, setSelectedSeasonId] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchSeasons = async () => {
    try {
      const data = await apiRequest('/api/seasons');
      setSeasons(data || []);
      
      // If no season is currently selected, select the active one
      if (data && data.length > 0 && !selectedSeasonId) {
        const active = data.find(s => s.IsActive);
        if (active) {
          setSelectedSeasonId(active.SeasonID);
        } else {
          setSelectedSeasonId(data[0].SeasonID);
        }
      }
    } catch (err) {
      console.error('Error fetching seasons:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSeasons();
  }, []);

  return (
    <SeasonContext.Provider value={{ seasons, selectedSeasonId, setSelectedSeasonId, fetchSeasons, loading }}>
      {children}
    </SeasonContext.Provider>
  );
}

export function useSeason() {
  return useContext(SeasonContext);
}
