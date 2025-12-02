import React, { useState } from 'react';
import api from '../services/api';
import { transportService } from '../services/transportService';
import { authService } from '../services/authService';
import './TestBackend.css';

const TestBackend = () => {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const runTest = async (testName, testFunction) => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await testFunction();
      setResult({ 
        test: testName,
        success: true, 
        data: response.data 
      });
      console.log(`✅ ${testName}:`, response.data);
    } catch (err) {
      setError({
        test: testName,
        message: err.message,
        response: err.response?.data
      });
      console.error(`❌ ${testName}:`, err.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  };

  const tests = [
    {
      name: 'Connexion Backend',
      fn: () => api.get('/')
    },
    {
      name: 'Liste des Bus',
      fn: () => transportService.getAllBuses()
    },
    {
      name: 'Test Login',
      fn: () => authService.login('test@example.com', 'test123')
    }
  ];

  return (
    <div className="test-backend">
      <h1>🧪 Test Connexion Django Backend</h1>
      
      <div className="info-panel">
        <h3>📋 Configuration</h3>
        <p><strong>URL Backend:</strong> {process.env.REACT_APP_API_URL || 'http://localhost:8000/api'}</p>
        <p><strong>Authentification:</strong> JWT</p>
        <p><strong>CORS:</strong> Activé</p>
      </div>

      <div className="tests-container">
        <h3>🔬 Tests Disponibles</h3>
        <div className="tests-grid">
          {tests.map((test, index) => (
            <button
              key={index}
              onClick={() => runTest(test.name, test.fn)}
              disabled={loading}
              className="test-button"
            >
              {test.name}
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Test en cours...</p>
        </div>
      )}

      {error && (
        <div className="error-panel">
          <h3>❌ Erreur - {error.test}</h3>
          <p><strong>Message:</strong> {error.message}</p>
          {error.response && (
            <>
              <h4>Réponse du serveur:</h4>
              <pre>{JSON.stringify(error.response, null, 2)}</pre>
            </>
          )}
        </div>
      )}

      {result && (
        <div className="success-panel">
          <h3>✅ Succès - {result.test}</h3>
          <pre>{JSON.stringify(result.data, null, 2)}</pre>
        </div>
      )}

      <div className="checklist">
        <h3>📋 Checklist Backend Django</h3>
        <ul>
          <li>✅ Django est démarré ? <code>python manage.py runserver</code></li>
          <li>✅ CORS configuré ? <code>django-cors-headers</code> installé</li>
          <li>✅ JWT configuré ? <code>djangorestframework-simplejwt</code></li>
          <li>✅ Base de données migrée ? <code>python manage.py migrate</code></li>
          <li>✅ Utilisateur de test créé ? <code>python manage.py createsuperuser</code></li>
        </ul>
      </div>
    </div>
  );
};

export default TestBackend;