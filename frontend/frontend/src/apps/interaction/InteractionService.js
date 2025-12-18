import axios from 'axios';
const API_URL = 'http://localhost:8000/api/interaction/';

export const getCommentaires = async () => {
  const res = await axios.get(`${API_URL}commentaires/`);
  return res.data;
};

export const addCommentaire = async (comment) => {
  const res = await axios.post(`${API_URL}commentaires/`, comment);
  return res.data;
};

export const addContribution = async (data) => {
  const res = await axios.post(`${API_URL}contributions/`, data);
  return res.data;
};

export const getHistorique = async (userId) => {
  const res = await axios.get(`${API_URL}historique/${userId}/`);
  return res.data;
};
