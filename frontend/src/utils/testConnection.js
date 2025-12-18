// src/utils/testConnection.js

import api from '../services/api';

export const testBackendConnection = async () => {
  console.log('\n🧪 ===== TEST DE CONNEXION BACKEND =====\n');
  
  const tests = [
    { name: 'Bus', endpoint: '/transport/bus/' },
    { name: 'Arrêts', endpoint: '/transport/arrets/' },
    { name: 'Lignes', endpoint: '/transport/lignes/' },
  ];
  
  const results = [];
  
  for (const test of tests) {
    try {
      console.log(`🔍 Test ${test.name}...`);
      const response = await api.get(test.endpoint);
      
      const success = {
        name: test.name,
        status: '✅ OK',
        count: Array.isArray(response.data) ? response.data.length : 'N/A',
        statusCode: response.status,
      };
      
      console.log(`✅ ${test.name}: ${success.count} items`);
      results.push(success);
      
    } catch (error) {
      const failure = {
        name: test.name,
        status: '❌ ERREUR',
        error: error.message,
        code: error.code,
        statusCode: error.response?.status,
      };
      
      console.error(`❌ ${test.name}:`, error.message);
      results.push(failure);
    }
  }
  
  console.log('\n📊 RÉSULTATS:');
  console.table(results);
  console.log('\n========================================\n');
  
  return results;
};