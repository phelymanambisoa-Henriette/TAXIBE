// src/services/userService.js
import api from './api';

const BASE = '/utilisateur/users';

const userService = {
  list: async (params = {}) => {
    const res = await api.get(BASE + '/', { params });
    return Array.isArray(res.data) ? res.data : res.data.results || [];
  },
  retrieve: async (id) => {
    const res = await api.get(`${BASE}/${id}/`);
    return res.data;
  },
  update: async (id, data) => {
    const res = await api.put(`${BASE}/${id}/`, data);
    return res.data;
  },
  partialUpdate: async (id, data) => {
    const res = await api.patch(`${BASE}/${id}/`, data);
    return res.data;
  },
  destroy: async (id) => {
    const res = await api.delete(`${BASE}/${id}/`);
    return res.data;
  },
  toggleActive: async (id) => {
    const res = await api.post(`${BASE}/${id}/toggle_active/`);
    return res.data;
  },
  toggleStaff: async (id) => {
    const res = await api.post(`${BASE}/${id}/toggle_staff/`);
    return res.data;
  },
  setRole: async (id, role) => {
    const res = await api.post(`${BASE}/${id}/set_role/`, { role });
    return res.data;
  },
  resetPassword: async (id) => {
    const res = await api.post(`${BASE}/${id}/reset_password/`);
    return res.data;
  },
  search: async (q) => {
    const res = await api.get(`${BASE}/search/`, { params: { q } });
    return Array.isArray(res.data) ? res.data : res.data.results || [];
  },
};

export default userService;