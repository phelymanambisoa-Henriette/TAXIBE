import { useEffect, useState } from 'react';
import api from '../services/api';

const useTransportData = () => {
  const [buses, setBuses] = useState([]);
  const [arrets, setArrets] = useState([]);
  const [trajets, setTrajets] = useState([]);
  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadStatic = async () => {
    setLoading(true);
    try {
      const [busRes, arretRes, trajetRes] = await Promise.all([
        api.get('/transport/bus-map/'),
        api.get('/localisation/arrets/'),
        api.get('/transport/trajets/'),
      ]);

      const busesData = busRes.data.results || busRes.data || [];
      const arretsData = arretRes.data.results || arretRes.data || [];
      const trajetsData = trajetRes.data.results || trajetRes.data || [];

      setBuses(Array.isArray(busesData) ? busesData : []);
      setArrets(Array.isArray(arretsData) ? arretsData : []);
      setTrajets(Array.isArray(trajetsData) ? trajetsData : []);
    } catch (err) {
      console.error('Erreur chargement données transport:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadPositions = async () => {
    try {
      const res = await api.get('/transport/positions/?recent=20');
      const data = res.data.results || res.data || [];
      setPositions(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Erreur positions bus:', err);
    }
  };

  useEffect(() => {
    loadStatic();
  }, []);

  useEffect(() => {
    // polling temps réel
    loadPositions(); // 1er appel
    const timer = setInterval(loadPositions, 8000);
    return () => clearInterval(timer);
  }, []);

  return { buses, arrets, trajets, positions, loading, reload: loadStatic };
};

export default useTransportData;