import axios from 'axios';
const API_URL = 'http://localhost:8000/api/auth/';

export const registerUser = async (userData) => {
  const res = await axios.post(`${API_URL}register/`, userData);
  return res.data;
};

export const loginUser = async (email, password) => {
  const res = await axios.post(`${API_URL}login/`, { email, password });
  return res.data;
};

export const getUserMe = async (token) => {
  const res = await axios.get(`${API_URL}me/`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

export const logoutUser = () => {
  // Optionnel : côté client uniquement
  localStorage.removeItem('token');
};
