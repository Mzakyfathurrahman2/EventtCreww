import apiClient from './authApi'; // Reuse the configured axios instance

export const eventApi = {
  getEvents: () => apiClient.get('/events'),
  createEvent: (data) => apiClient.post('/events', data),
  getEventDetail: (id) => apiClient.get(`/events/${id}`),
  updateStatus: (id, status, force = false) => apiClient.patch(`/events/${id}/status?force=${force}`, { status }),
  generateTemplate: (id) => apiClient.post(`/events/${id}/generate-template`),
  generateInvite: (id) => apiClient.post(`/events/${id}/invite`),
  
  getDivisi: (eventId) => apiClient.get(`/events/${eventId}/divisi`),
  createDivisi: (eventId, data) => apiClient.post(`/events/${eventId}/divisi`, data),
  updateDivisi: (id, data) => apiClient.patch(`/divisi/${id}`, data),
  deleteDivisi: (id) => apiClient.delete(`/divisi/${id}`),

  joinEvent: (token) => apiClient.post(`/invites/${token}/join`),
  getInviteDetails: (token) => apiClient.get(`/invites/${token}`),
  
  getPendingMembers: (eventId) => apiClient.get(`/events/${eventId}/members/pending`),
  getMembers: (eventId) => apiClient.get(`/events/${eventId}/members`),
  approveMember: (id) => apiClient.patch(`/members/${id}/approve`),
  rejectMember: (id) => apiClient.patch(`/members/${id}/reject`),
  assignDivisi: (id, divisiId, roleEvent) => apiClient.patch(`/members/${id}/assign-divisi`, { divisi_id: divisiId, role_event: roleEvent }),
  addMemberManually: (eventId, email) => apiClient.post(`/events/${eventId}/members/manual`, { email }),
};
