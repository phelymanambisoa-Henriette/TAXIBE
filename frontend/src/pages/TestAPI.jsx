// src/pages/TestAPI.jsx

import React, { useState } from 'react';
import busService from '../services/busService';
import localisationService from '../services/localisationService';

const TestAPI = () => {
  const [results, setResults] = useState({});
  const [loading, setLoading] = useState(false);

  const testEndpoint = async (name, apiCall) => {
    try {
      setLoading(true);
      console.log(`🧪 Test ${name}...`);
      const data = await apiCall();
      console.log(`✅ ${name} OK:`, data);
      setResults(prev => ({
        ...prev,
        [name]: { status: 'OK', count: Array.isArray(data) ? data.length : 'N/A', data }
      }));
    } catch (error) {
      console.error(`❌ ${name} Erreur:`, error);
      setResults(prev => ({
        ...prev,
        [name]: { status: 'ERREUR', error: error.message }
      }));
    } finally {
      setLoading(false);
    }
  };

  const runAllTests = async () => {
    setResults({});
    await testEndpoint('Bus', busService.getAllBus);
    await testEndpoint('Arrêts', localisationService.getAllArrets);
    await testEndpoint('Lignes', localisationService.getAllLignes);
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>🧪 Test API Backend</h1>
      
      <button 
        onClick={runAllTests} 
        disabled={loading}
        style={{
          padding: '10px 20px',
          fontSize: '16px',
          cursor: loading ? 'not-allowed' : 'pointer',
          background: loading ? '#ccc' : '#3498db',
          color: 'white',
          border: 'none',
          borderRadius: '5px'
        }}
      >
        {loading ? '⏳ Test en cours...' : '🚀 Lancer les tests'}
      </button>

      <div style={{ marginTop: '20px' }}>
        {Object.entries(results).map(([name, result]) => (
          <div 
            key={name}
            style={{
              padding: '10px',
              margin: '10px 0',
              background: result.status === 'OK' ? '#d4edda' : '#f8d7da',
              border: `1px solid ${result.status === 'OK' ? '#c3e6cb' : '#f5c6cb'}`,
              borderRadius: '5px'
            }}
          >
            <strong>{name}:</strong> {result.status}
            {result.count && ` (${result.count} items)`}
            {result.error && ` - ${result.error}`}
          </div>
        ))}
      </div>

      <div style={{ marginTop: '20px', background: '#f8f9fa', padding: '15px', borderRadius: '5px' }}>
        <h3>ℹ️ Informations</h3>
        <p><strong>API URL:</strong> {process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000/api'}</p>
        <p><strong>Environment:</strong> {process.env.NODE_ENV}</p>
      </div>

      <div style={{ marginTop: '20px' }}>
        <h3>📋 Résultats détaillés</h3>
        <pre style={{ 
          background: '#1e1e1e', 
          color: '#d4d4d4', 
          padding: '15px', 
          borderRadius: '5px',
          overflow: 'auto',
          maxHeight: '400px'
        }}>
          {JSON.stringify(results, null, 2)}
        </pre>
      </div>
    </div>
  );
};

export default TestAPI;