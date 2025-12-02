// src/services/interactionService.js - COMPLET (avec report + admin reports)
import api from './api';

const BASE = '/interaction';

export const interactionService = {
  // Commentaires
  getComments: async (params = {}) => {
    const res = await api.get(`${BASE}/commentaires/`, { params });
    return Array.isArray(res.data) ? res.data : res.data.results || [];
  },
  createComment: async ({ bus, text, rating = 5, contenu }) => {
    const payload = { contenu: text || contenu || '', note: parseInt(rating, 10) || 5 };
    if (bus) payload.busRef = parseInt(bus, 10);
    return api.post(`${BASE}/commentaires/`, payload);
  },
  updateComment: async (id, data) => {
    const payload = { contenu: data.text || data.contenu, note: parseInt(data.rating || data.note, 10) };
    return api.put(`${BASE}/commentaires/${id}/`, payload);
  },
  deleteComment: async (id) => api.delete(`${BASE}/commentaires/${id}/`),
  likeComment: async (id) => api.post(`${BASE}/commentaires/${id}/like/`),
  reportComment: async (id, reason = '') => api.post(`${BASE}/commentaires/${id}/report/`, { reason }),

  // Contributions
  getContributions: async (params = {}) => {
    const res = await api.get(`${BASE}/contributions/`, { params });
    return Array.isArray(res.data) ? res.data : res.data.results || [];
  },
  getMyContributions: async () => {
    try {
      const res = await api.get(`${BASE}/contributions/mes_contributions/`);
      return Array.isArray(res.data) ? res.data : res.data.results || [];
    } catch {
      const all = await interactionService.getContributions();
      return all;
    }
  },
  createContribution: async (payload) => {
    if (payload instanceof FormData) {
      const type = payload.get('type');
      const title = payload.get('title');
      const description = payload.get('description');
      const busLine = payload.get('busLine');
      const formData = new FormData();
      formData.append('type', type || 'autre');
      formData.append('description', title ? `${title}\n\n${description}` : (description || ''));
      if (busLine) formData.append('busRef', busLine);
      const files = payload.getAll('attachments');
      files.forEach((f) => formData.append('fichiers', f));
      return api.post(`${BASE}/contributions/`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
    }
    const simplePayload = { type: payload.type || 'autre', description: payload.description || '', busRef: payload.busRef || payload.busLine || null };
    return api.post(`${BASE}/contributions/`, simplePayload);
  },
  updateContribution: async (id, data) => api.put(`${BASE}/contributions/${id}/`, data),
  deleteContribution: async (id) => api.delete(`${BASE}/contributions/${id}/`),
  voteContribution: async (id, type) => api.post(`${BASE}/contributions/${id}/vote/`, { type }),

  // Admin contributions
  adminListContributions: async (params = {}) => {
    const res = await api.get(`${BASE}/contributions/`, { params });
    return Array.isArray(res.data) ? res.data : res.data.results || [];
  },
  approveContribution: async (id) => api.post(`${BASE}/contributions/${id}/approve/`),
  rejectContribution: async (id) => api.post(`${BASE}/contributions/${id}/reject/`),

  // Favoris
  getFavoris: async () => {
    const res = await api.get(`${BASE}/favoris/`);
    return Array.isArray(res.data) ? res.data : res.data.results || [];
  },
  toggleFavori: async (busRef) => api.post(`${BASE}/favoris/toggle/`, { busRef }),

  // Historique
  getHistorique: async (params = {}) => {
    const res = await api.get(`${BASE}/historiques/`, { params });
    return Array.isArray(res.data) ? res.data : res.data.results || [];
  },
  createHistorique: async ({ depart, arrivee }) => api.post(`${BASE}/historiques/`, { depart, arrivee }),
  deleteHistorique: async (id) => api.delete(`${BASE}/historiques/${id}/`),
  purgeHistorique: async (days = 30) => api.delete(`${BASE}/historiques/purge/`, { params: { days } }),

  // Admin reports (signalements)
  adminListReports: async (params = {}) => {
    const res = await api.get(`${BASE}/reports/`, { params });
    return Array.isArray(res.data) ? res.data : res.data.results || [];
  },
  dismissReport: async (id) => api.post(`${BASE}/reports/${id}/dismiss/`),
  removeReportComment: async (id) => api.post(`${BASE}/reports/${id}/remove_comment/`),
};

export default interactionService;