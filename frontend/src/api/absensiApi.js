import apiClient from './authApi';

export const absensiApi = {
  getSesiByEvent: (eventId) => apiClient.get(`/events/${eventId}/sesi-absensi`),
  createSesi: (eventId, data) => apiClient.post(`/events/${eventId}/sesi-absensi`, data),
  getQrToken: (sesiId) => apiClient.get(`/sesi-absensi/${sesiId}/qr`),
  scanQr: (sesiId, qrToken) => apiClient.post(`/sesi-absensi/${sesiId}/scan`, { qr_token: qrToken }),
  getRekap: (sesiId) => apiClient.get(`/sesi-absensi/${sesiId}/rekap`),
  manualAbsen: (sesiId, userId) => apiClient.post(`/sesi-absensi/${sesiId}/manual-absen`, { user_id: userId }),
  selfAbsen: (sesiId) => apiClient.post(`/sesi-absensi/${sesiId}/self-absen`),
};
