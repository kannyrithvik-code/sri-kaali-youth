import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import { useAuth } from './AuthContext';

const FestivalContext = createContext(null);

export const FestivalProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [festivals, setFestivals] = useState([]);
  const [selectedFestivalId, setSelectedFestivalId] = useState(() => {
    const saved = localStorage.getItem('selectedFestivalId');
    return saved ? Number(saved) : null;
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchFestivals = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/festivals');
      const data = res.data || [];
      setFestivals(data);

      if (data.length > 0) {
        // If current selected festival is invalid or null, pick active or first festival
        const currentValid = data.some((f) => f.festivalId === selectedFestivalId);
        if (!selectedFestivalId || !currentValid) {
          const activeFestival = data.find((f) => f.isActive) || data[0];
          const defaultId = activeFestival.festivalId;
          setSelectedFestivalId(defaultId);
          localStorage.setItem('selectedFestivalId', defaultId.toString());
        }
      }
    } catch (err) {
      console.error('Failed to fetch festivals:', err);
      setError('Could not load festivals from server.');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, selectedFestivalId]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchFestivals();
    }
  }, [isAuthenticated]);

  const handleSelectFestival = (festivalId) => {
    const id = Number(festivalId);
    setSelectedFestivalId(id);
    localStorage.setItem('selectedFestivalId', id.toString());
  };

  const selectedFestival = festivals.find((f) => f.festivalId === selectedFestivalId) || null;

  return (
    <FestivalContext.Provider
      value={{
        festivals,
        selectedFestivalId,
        selectedFestival,
        setSelectedFestivalId: handleSelectFestival,
        refreshFestivals: fetchFestivals,
        loading,
        error,
      }}
    >
      {children}
    </FestivalContext.Provider>
  );
};

export const useFestival = () => {
  const context = useContext(FestivalContext);
  if (!context) {
    throw new Error('useFestival must be used within a FestivalProvider');
  }
  return context;
};
