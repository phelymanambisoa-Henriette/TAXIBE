import axios from 'axios';

const API_URL = 'http://localhost:8000/api/localisation/';

export const getVilles = async () => {
  const res = await axios.get(`${API_URL}villes/`);
  return res.data;
};

export const getArrets = async (villeId) => {
  const res = await axios.get(`${API_URL}villes/${villeId}/arrets/`);
  return res.data;
};
