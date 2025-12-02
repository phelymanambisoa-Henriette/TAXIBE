import React, { useState } from 'react';
import api from '../services/api';

const ApiProbe = () => {
  const [out, setOut] = useState('');

  const run = async () => {
    setOut('...');
    try {
      const buses = await api.get('/transport/bus/');
      const arrets = await api.get('/localisation/arrets/');

      let me = null;
      try {
        me = await api.get('/utilisateur/me/'); // nécessite login
      } catch (e) {
        me = { data: { detail: 'Non connecté ou endpoint indisponible' } };
      }

      setOut(JSON.stringify({
        baseURL: process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000/api',
        busesCount: Array.isArray(buses.data) ? buses.data.length : (buses.data?.results?.length || 0),
        firstBus: Array.isArray(buses.data) ? buses.data[0] : buses.data?.results?.[0],
        arretsCount: Array.isArray(arrets.data) ? arrets.data.length : (arrets.data?.results?.length || 0),
        me: me.data,
      }, null, 2));
    } catch (err) {
      setOut('ERROR:\n' + (err.response?.status + ' ' + err.response?.data ? JSON.stringify(err.response.data) : err.message));
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <h1>🧪 API Probe</h1>
      <p>Teste /transport/bus/, /localisation/arrets/ et /utilisateur/me/</p>
      <button onClick={run} style={{ padding: '10px 16px' }}>Tester</button>
      <pre style={{ marginTop: 16, background: '#f6f6f6', padding: 12, borderRadius: 8 }}>{out}</pre>
    </div>
  );
};

export default ApiProbe;