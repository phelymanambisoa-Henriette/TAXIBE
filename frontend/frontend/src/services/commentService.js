import api from './api';

export const commentService = {
  getComments: (busId) => api.get(`/interaction/commentaires/?bus=${busId}`),
  createComment: (data) => api.post('/interaction/commentaires/', data),
  likeComment: (id) => api.post(`/interaction/commentaires/${id}/like/`)
};

export default commentService;