import apiClient from './authApi';

export const chatApi = {
  // Mengambil histori pesan (50 terakhir)
  getHistory: (divisiId) => apiClient.get(`/divisi/${divisiId}/chat`),
  
  // Soft delete pesan (hanya pengirim atau koordinator)
  deleteMessage: (pesanId) => apiClient.delete(`/chat/${pesanId}`),

  // Mendapatkan daftar chat room per event
  getChatRooms: (eventId) => apiClient.get(`/events/${eventId}/chat-rooms`),
};
