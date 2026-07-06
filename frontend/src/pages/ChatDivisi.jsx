import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { chatApi } from '../api/chatApi';
import { eventApi } from '../api/eventApi';
import { ArrowLeft, Send, Trash2, Loader2, MessageSquare, Hash, Lock, Users, ChevronRight, Plus, X, AlertCircle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';

// Tentukan SOCKET_URL secara dinamis
const getSocketUrl = () => {
  if (typeof window !== 'undefined' && window.location.hostname) {
    const port = window.location.port;
    if (port && (port === '5173' || port === '5174' || port === '3000')) {
      return `${window.location.protocol}//${window.location.hostname}:3000`;
    }
    return window.location.origin;
  }
  return import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') : 'http://localhost:3000';
};

const SOCKET_URL = getSocketUrl();

const ChatDivisi = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [rooms, setRooms] = useState([]);
  const [activeRoom, setActiveRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [loadingChat, setLoadingChat] = useState(false);
  const [socket, setSocket] = useState(null);
  const [userRole, setUserRole] = useState('ANGGOTA');

  // Modal create room states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState('');

  const messagesEndRef = useRef(null);

  // Fetch daftar room chat
  const fetchRooms = async () => {
    try {
      setLoadingRooms(true);
      const res = await chatApi.getChatRooms(eventId);
      const roomsData = res.data.data || [];
      setRooms(roomsData);
      
      // If we don't have an active room yet, or the current active room is not in the new rooms list anymore
      if (roomsData.length > 0) {
        setActiveRoom(prev => {
          if (prev && roomsData.some(r => r.divisi_id === prev.divisi_id)) {
            return prev;
          }
          const umumRoom = roomsData.find(r => r.nama_divisi === 'Umum');
          return umumRoom || roomsData[0];
        });
      }
    } catch (error) {
      console.error('Gagal memuat daftar room chat', error);
      toast.error('Gagal memuat diskusi');
      navigate(`/events/${eventId}`);
    } finally {
      setLoadingRooms(false);
    }
  };

  // 1. Fetch Rooms & User Role
  useEffect(() => {
    const initData = async () => {
      try {
        // Fetch event to get user's role
        const eventRes = await eventApi.getEventDetail(eventId);
        setUserRole(eventRes.data.userKeanggotaan?.role_event || 'ANGGOTA');
      } catch (err) {
        console.error('Gagal memuat detail event', err);
      }
      await fetchRooms();
    };

    initData();
  }, [eventId, navigate]);

  // Mengupdate timestamp terakhir kali membaca chat
  useEffect(() => {
    if (user && eventId) {
      localStorage.setItem(`last_read_chat_${eventId}_${user.user_id}`, new Date().toISOString());
    }
  }, [eventId, user, messages]);

  // 2. Ambil histori chat saat active room berubah
  useEffect(() => {
    if (!activeRoom) return;

    const fetchHistory = async () => {
      try {
        setLoadingChat(true);
        const res = await chatApi.getHistory(activeRoom.divisi_id);
        setMessages(res.data.data || []);
      } catch (error) {
        console.error('Gagal memuat histori chat', error);
        toast.error('Gagal memuat histori chat');
      } finally {
        setLoadingChat(false);
      }
    };

    fetchHistory();
  }, [activeRoom]);

  // 3. Setup Socket.IO connection & room joining
  useEffect(() => {
    if (!activeRoom) return;

    const newSocket = io(SOCKET_URL, {
      withCredentials: true,
      auth: { token: localStorage.getItem('token') }
    });

    newSocket.on('connect', () => {
      newSocket.emit('join-divisi-chat', { divisi_id: activeRoom.divisi_id });
    });

    newSocket.on('new-message', (data) => {
      setMessages((prev) => {
        // Hindari duplikat
        if (prev.some(msg => msg.pesan_id === data.pesan_id)) return prev;
        return [...prev, data];
      });
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [activeRoom]);

  // 4. Auto-scroll ke bawah saat ada pesan baru
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 5. Kirim pesan
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !socket || !activeRoom) return;

    socket.emit('send-message', {
      divisi_id: activeRoom.divisi_id,
      isi_pesan: newMessage.trim(),
    });

    setNewMessage('');
  };

  // 6. Hapus pesan (FR-034 Soft Delete)
  const handleDelete = async (pesanId) => {
    if (!window.confirm('Yakin ingin menghapus pesan ini?')) return;
    try {
      await chatApi.deleteMessage(pesanId);
      setMessages((prev) => prev.filter(msg => msg.pesan_id !== pesanId));
      toast.success('Pesan dihapus');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Gagal menghapus pesan');
    }
  };

  // 7. Buat Room Chat Baru (Vendor/Client/dll.)
  const handleCreateRoom = async (e) => {
    e.preventDefault();
    if (!newRoomName.trim()) return;
    setCreateLoading(true);
    setCreateError('');
    try {
      await eventApi.createDivisi(eventId, { nama_divisi: newRoomName.trim() });
      toast.success('Room chat berhasil dibuat!');
      setNewRoomName('');
      setShowCreateModal(false);
      await fetchRooms();
    } catch (err) {
      setCreateError(err.response?.data?.message || 'Gagal membuat room chat.');
    } finally {
      setCreateLoading(false);
    }
  };

  // Helper untuk menentukan icon room
  const getRoomIcon = (name) => {
    const lower = name.toLowerCase();
    if (name === 'Umum' || lower === 'koordinasi utama') return <Users className="w-4 h-4 shrink-0" />;
    if (name === 'Koordinator & Inti') return <Lock className="w-4 h-4 shrink-0" />;
    if (lower === 'pengurus inti' || lower === 'klien' || lower.startsWith('vendor')) {
      return <Lock className="w-4 h-4 text-amber-500 shrink-0" />;
    }
    return <Hash className="w-4 h-4 shrink-0" />;
  };

  const isLeadership = ['KETUA', 'SEKRETARIS', 'BENDAHARA'].includes(userRole);

  if (loadingRooms) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-0 md:p-4">
      <div className="w-full max-w-6xl h-screen md:h-[90vh] bg-white rounded-none md:rounded-3xl shadow-2xl flex overflow-hidden border border-slate-200">
        
        {/* SIDEBAR SALURAN DISKUSI (Slack/Discord-like) */}
        <aside className="w-64 bg-indigo-950 text-indigo-100 flex flex-col shrink-0 border-r border-indigo-900">
          {/* Header Sidebar */}
          <div className="p-4 border-b border-indigo-900/60 flex items-center gap-3">
            <button 
              onClick={() => navigate(`/events/${eventId}`)} 
              className="hover:bg-indigo-900 p-1.5 rounded-lg transition text-indigo-300 hover:text-white"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="min-w-0">
              <h2 className="font-bold text-sm truncate uppercase tracking-wider text-indigo-200">Event Diskusi</h2>
              <p className="text-[10px] text-indigo-400 font-semibold truncate">Multi-channel Chat</p>
            </div>
          </div>

          {/* List Channels */}
          <div className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
            <div className="flex items-center justify-between px-3 mb-2">
              <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Saluran Obrolan</p>
              {isLeadership && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="p-1 hover:bg-indigo-900 text-indigo-300 hover:text-white rounded-md transition cursor-pointer"
                  title="Tambah Room Chat"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            
            {rooms.map((room) => {
              const isActive = activeRoom?.divisi_id === room.divisi_id;
              return (
                <button
                  key={room.divisi_id}
                  onClick={() => setActiveRoom(room)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                    isActive 
                      ? 'bg-indigo-600 text-white shadow-md' 
                      : 'text-indigo-300 hover:bg-indigo-900/50 hover:text-indigo-100'
                  }`}
                >
                  {getRoomIcon(room.nama_divisi)}
                  <span className="truncate flex-1 text-left">{room.nama_divisi}</span>
                  {isActive && <ChevronRight className="w-3.5 h-3.5 opacity-80" />}
                </button>
              );
            })}
          </div>

          {/* User Info Footer */}
          <div className="p-4 bg-indigo-900/30 border-t border-indigo-900/60 flex items-center gap-3">
            <div className="bg-indigo-600 text-white font-bold w-9 h-9 rounded-full flex items-center justify-center shrink-0">
              {user?.nama_lengkap?.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-bold text-xs truncate leading-tight text-white">{user?.nama_lengkap}</p>
              <p className="text-[10px] text-indigo-400 truncate mt-0.5">{user?.email}</p>
            </div>
          </div>
        </aside>

        {/* CHAT AREA */}
        <section className="flex-1 flex flex-col bg-slate-50">
          {/* Header Room */}
          {activeRoom ? (
            <div className="bg-white px-6 py-4 border-b border-slate-200 flex items-center justify-between shrink-0 shadow-sm z-10">
              <div className="flex items-center gap-2">
                <div className="bg-indigo-50 text-indigo-600 p-2 rounded-xl">
                  {getRoomIcon(activeRoom.nama_divisi)}
                </div>
                <div>
                  <h2 className="font-bold text-slate-800 leading-tight text-base">
                    {activeRoom.nama_divisi}
                  </h2>
                  <p className="text-slate-400 text-[10px] font-semibold mt-0.5">
                    {activeRoom.nama_divisi === 'Umum' ? 'Grup diskusi umum untuk semua panitia' : 
                     activeRoom.nama_divisi === 'Koordinator & Inti' ? 'Grup koordinasi pengurus & koordinator divisi' :
                     activeRoom.nama_divisi === 'Pengurus Inti' ? 'Diskusi khusus Ketua, Sekretaris, dan Bendahara' :
                     activeRoom.nama_divisi === 'Klien' ? 'Diskusi khusus klien dengan pengurus inti' :
                     activeRoom.nama_divisi === 'Koordinasi Utama' ? 'Forum obrolan/diskusi bersama antara Pengurus Inti, Klien, dan Vendor' :
                     activeRoom.nama_divisi.toLowerCase().startsWith('vendor') ? `Saluran komunikasi vendor: ${activeRoom.nama_divisi}` :
                     `Grup diskusi divisi ${activeRoom.nama_divisi}`}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8">
              <MessageSquare className="w-12 h-12 mb-3 opacity-30" />
              <p className="text-sm">Silakan pilih saluran diskusi terlebih dahulu.</p>
            </div>
          )}

          {/* Area Histori Pesan */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {loadingChat ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-2 opacity-50">
                <MessageSquare className="w-12 h-12" />
                <p className="text-sm">Belum ada pesan. Mulai obrolan pertama!</p>
              </div>
            ) : (
              messages.map((msg) => {
                const isMe = msg.pengirim.id === user?.user_id;
                const time = new Date(msg.dikirim_pada).toLocaleTimeString('id-ID', {
                  timeZone: 'Asia/Jakarta', 
                  hour: '2-digit', minute: '2-digit'
                });

                return (
                  <div key={msg.pesan_id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                    <div className="flex items-end gap-2 max-w-[80%] group">
                      {isMe && (
                        <button
                          onClick={() => handleDelete(msg.pesan_id)}
                          className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition mb-2 cursor-pointer"
                          title="Hapus Pesan"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}

                      <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                        {!isMe && (
                          <span className="text-[10px] text-slate-500 font-bold mb-1 ml-1">
                            {msg.pengirim.nama}
                          </span>
                        )}
                        
                        <div className={`px-4 py-2.5 rounded-2xl shadow-sm leading-relaxed text-sm ${
                          isMe 
                            ? 'bg-indigo-600 text-white rounded-br-none shadow-indigo-100' 
                            : 'bg-white text-slate-800 border border-slate-100 rounded-bl-none'
                        }`}>
                          <p className="whitespace-pre-wrap">{msg.isi_pesan}</p>
                        </div>
                        
                        <span className="text-[9px] text-slate-400 mt-1 px-1 font-semibold">{time}</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Form Input Pesan */}
          {activeRoom && (
            <div className="bg-white p-4 border-t border-slate-200 shrink-0">
              <form onSubmit={handleSendMessage} className="flex items-end gap-2 max-w-4xl mx-auto">
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage(e);
                    }
                  }}
                  placeholder={`Kirim pesan ke ${activeRoom.nama_divisi}...`}
                  className="flex-1 max-h-32 min-h-[44px] bg-slate-100 border-0 rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white transition resize-none"
                  rows="1"
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="bg-indigo-600 text-white p-3 rounded-full hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition shrink-0 shadow-md shadow-indigo-100 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          )}
        </section>

      </div>

      {/* CREATE ROOM CHAT MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-100">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div>
                <h3 className="font-bold text-slate-900 text-lg">Buat Saluran Baru</h3>
                <p className="text-xs text-slate-400 mt-0.5">Khusus Pengurus Inti & Vendor / Klien</p>
              </div>
              <button 
                onClick={() => { setShowCreateModal(false); setNewRoomName(''); setCreateError(''); }} 
                className="text-slate-400 hover:text-slate-600 transition p-1 hover:bg-slate-150 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRoom} className="p-6 space-y-4">
              {createError && (
                <div className="bg-red-50 text-red-600 border border-red-200 rounded-xl px-4 py-3 text-sm flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" /> {createError}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Nama Saluran *</label>
                <input
                  type="text"
                  required
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  placeholder="Contoh: Vendor Catering atau Vendor Sound"
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                />
                <p className="text-[10px] text-amber-600 mt-2 font-medium">
                  💡 Tips: Awali dengan kata "Vendor" (misal: Vendor Catering) agar otomatis dikategorikan sebagai room vendor yang privat untuk pengurus inti.
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button 
                  type="button" 
                  onClick={() => { setShowCreateModal(false); setNewRoomName(''); setCreateError(''); }}
                  className="flex-1 border border-slate-200 text-slate-700 rounded-xl py-2.5 text-sm font-medium hover:bg-slate-50 transition cursor-pointer text-center"
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  disabled={createLoading || !newRoomName.trim()}
                  className="flex-1 bg-indigo-600 text-white rounded-xl py-2.5 text-sm font-semibold hover:bg-indigo-700 flex items-center justify-center gap-2 disabled:opacity-70 transition cursor-pointer"
                >
                  {createLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Buat Room'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatDivisi;
