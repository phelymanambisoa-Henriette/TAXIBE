import React from 'react';
import Card from '../components/ui/Card';
import MapView from '../components/map/MapView';

const Home = () => {
  const buses = [
    { id: 1, name: 'Bus 101', quartier: 'Ankadifotsy', distance: '250 m' },
    { id: 2, name: 'Bus 202', quartier: 'Analakely', distance: '400 m' },
  ];

  return (
    <div>
      <h2>Buses proches de votre position</h2>
      <MapView />
      <div className="bus-list">
        {buses.map(bus => (
          <Card key={bus.id} title={bus.name} subtitle={`${bus.quartier} • ${bus.distance}`} />
        ))}
      </div>
    </div>
  );
};

export default Home;
