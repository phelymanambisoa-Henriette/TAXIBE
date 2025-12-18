import React, { useState } from 'react';
import axios from 'axios';

const LoginTest = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [result, setResult] = useState(null);

  const testLogin = async () => {
    console.log('🔐 Test login direct...');
    
    try {
      const response = await axios.post(
        'http://127.0.0.1:8000/api/auth/login/',
        {
          email: email,
          password: password
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log('✅ Succès:', response.data);
      setResult({
        success: true,
        data: response.data
      });
      
    } catch (error) {
      console.error('❌ Erreur:', error);
      console.error('📦 Response:', error.response);
      
      setResult({
        success: false,
        error: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
    }
  };

  return (
    <div style={{ padding: '40px', maxWidth: '600px', margin: '0 auto' }}>
      <h1>🧪 Test Login Direct</h1>
      
      <div style={{ marginBottom: '16px' }}>
        <label>Email:</label><br/>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="votre@email.com"
          style={{ width: '100%', padding: '8px', marginTop: '4px' }}
        />
      </div>

      <div style={{ marginBottom: '16px' }}>
        <label>Password:</label><br/>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          style={{ width: '100%', padding: '8px', marginTop: '4px' }}
        />
      </div>

      <button
        onClick={testLogin}
        style={{ 
          padding: '12px 24px', 
          background: '#aad3c2', 
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer'
        }}
      >
        Tester Login
      </button>

      {result && (
        <div style={{ 
          marginTop: '24px', 
          padding: '16px', 
          background: result.success ? '#dfd' : '#fee',
          borderRadius: '8px'
        }}>
          <h3>{result.success ? '✅ Succès' : '❌ Erreur'}</h3>
          <pre style={{ 
            background: '#f5f5f5', 
            padding: '12px', 
            borderRadius: '4px',
            overflow: 'auto'
          }}>
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}

      <div style={{ marginTop: '24px', padding: '16px', background: '#e3f2fd', borderRadius: '8px' }}>
        <h3>📋 Checklist:</h3>
        <ul>
          <li>Django tourne sur http://127.0.0.1:8000</li>
          <li>Utilisateur créé avec <code>python manage.py createsuperuser</code></li>
          <li>CORS activé dans Django</li>
          <li>Endpoint existe: <a href="http://127.0.0.1:8000/api/auth/login/" target="_blank">Tester</a></li>
        </ul>
      </div>
    </div>
  );
};

export default LoginTest;