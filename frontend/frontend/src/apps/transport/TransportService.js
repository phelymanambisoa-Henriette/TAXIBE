import axios from 'axios';
const API_URL = 'http://localhost:8000/api/transport/';

export const getBuses = async () => {
  const res = await axios.get(`${API_URL}buses/`);
  return res.data;
};

export const getTrajetDetails = async (trajetId) => {
  const res = await axios.get(`${API_URL}trajets/${trajetId}/`);
  return res.data;
};
