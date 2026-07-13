import apiClient from './authApi';

export const taskApi = {
  // ── Event-level task routes ──────────────────────────────────────────────
  getTasks: (eventId, params = {}) =>
    apiClient.get(`/events/${eventId}/tasks`, { params }),
  createTask: (eventId, data) =>
    apiClient.post(`/events/${eventId}/tasks`, data),
  getDashboard: (eventId, params = {}) =>
    apiClient.get(`/events/${eventId}/dashboard`, { params }),

  // ── Individual task routes ───────────────────────────────────────────────
  getTaskDetail: (taskId) =>
    apiClient.get(`/tasks/${taskId}`),
  updateTask: (taskId, data) =>
    apiClient.patch(`/tasks/${taskId}`, data),
  deleteTask: (taskId) =>
    apiClient.delete(`/tasks/${taskId}`),
  updateTaskStatus: (taskId, status) =>
    apiClient.patch(`/tasks/${taskId}/status`, { status }),

  // ── Sub-task routes ──────────────────────────────────────────────────────
  createSubTask: (taskId, data) =>
    apiClient.post(`/tasks/${taskId}/subtasks`, data),
  updateSubTask: (subtaskId, data) =>
    apiClient.patch(`/subtasks/${subtaskId}`, data),
  deleteSubTask: (subtaskId) =>
    apiClient.delete(`/subtasks/${subtaskId}`),
  updateSubTaskStatus: (subtaskId, status) =>
    apiClient.patch(`/subtasks/${subtaskId}/status`, { status }),
};
