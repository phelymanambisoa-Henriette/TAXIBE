import React, { useState, useEffect } from 'react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { mockBuses } from '../services/mockData/buses';

const Search = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);

  useEffect(() => {
    if (query.length > 1) {
      const filtered = mockBuses.filter(
        bus =>
          bus.name.toLowerCase().includes(query.toLowerCase()) ||
          bus.trajet.depart.toLowerCase().includes(query.toLowerCase()) ||
          bus.trajet.arrivee.toLowerCase().includes(query.toLowerCase())
      );
      setResults(filtered);
    } else {
      setResults([]);
    }
  }, [query]);

  return (
    <div>
      <h2>Recherche de bus</h2>
      <input
        type="text"
        placeholder="Chercher par arrêt ou trajet..."
        value={query}
        onChange={e => setQuery(e.target.value)}
        style={{ width: '100%', padding: '10px', borderRadius: '8px', marginBottom: '16px', border: '1px solid #ccc' }}
      />

      {results.length > 0 ? (
        results.map(bus => (
          <Card key={bus.id} title={bus.name} subtitle={`${bus.trajet.depart} → ${bus.trajet.arrivee}`}>
            <Button variant="primary" onClick={() => window.location.href = `/bus/${bus.id}`}>Voir détails</Button>
          </Card>
        ))
      ) : query.length > 1 ? (
        <p>Aucun bus trouvé pour "{query}"</p>
      ) : (
        <p>Commencez à taper pour rechercher un bus...</p>
      )}
    </div>
  );
};

export default Search;
