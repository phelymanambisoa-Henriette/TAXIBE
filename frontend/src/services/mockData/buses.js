export const mockBuses = [
  {
    id: 1,
    name: 'Bus 101',
    trajet: {
      depart: 'A',
      arrivee: 'B',
      arrets_aller: ['A', 'C', 'D', 'R', 'F', 'B'],
      arrets_retour: ['B', 'F', 'T', 'D', 'C', 'A']
    },
    ville: 'Antananarivo',
  },
  {
    id: 2,
    name: 'Bus 202',
    trajet: {
      depart: 'C',
      arrivee: 'D',
      arrets_aller: ['C', 'E', 'F', 'D'],
      arrets_retour: ['D', 'F', 'E', 'C']
    },
    ville: 'Antananarivo',
  }
];
