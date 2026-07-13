import React, { useState, useEffect } from 'react';
import apiClient from '../api/authApi';
import { Bell, X, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const NotificationBell = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedNotif, setSelectedNotif] = useState(null); // Modal state
  const navigate = useNavigate();

  // Mengambil notifikasi dari API
  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const res = await apiClient.get('/notifications');
      
      setNotifications(res.data.data);
      setUnreadCount(res.data.unreadCount);
    } catch (error) {
      console.error('Gagal mengambil notifikasi', error);
    }
  };

  // Polling tiap 10 detik (FR-Notifikasi)
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000);
    return () => clearInterval(interval);
  }, []);

  // Menandai notif sudah dibaca saat diklik dan memunculkan modal popup
  const handleNotifClick = async (notif) => {
    try {
      const token = localStorage.getItem('token');
      if (!notif.is_read) {
        await apiClient.patch(`/notifications/${notif.notif_id}/read`);
        // Update state lokal supaya responsif
        setUnreadCount(prev => Math.max(0, prev - 1));
        setNotifications(prev => prev.map(n => n.notif_id === notif.notif_id ? { ...n, is_read: true } : n));
      }

      setIsOpen(false); // Tutup dropdown
      setSelectedNotif(notif); // Buka modal
    } catch (error) {
      console.error('Gagal menandai notif', error);
    }
  };

  const handleNavigate = () => {
    if (selectedNotif && selectedNotif.link_ref) {
      setIsOpen(false);
      setSelectedNotif(null);
      navigate(selectedNotif.link_ref);
    }
  };

  return (
    <>
      <div className="relative">
        <button 
          onClick={() => setIsOpen(!isOpen)} 
          className="relative p-2 text-gray-500 hover:text-gray-700 focus:outline-none"
        >
          <Bell className="w-6 h-6" />
          {unreadCount > 0 && (
            <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 bg-red-600 rounded-full transform translate-x-1/4 -translate-y-1/4">
              {unreadCount}
            </span>
          )}
        </button>

        {isOpen && (
          <div className="absolute right-0 w-80 mt-2 bg-white rounded-md shadow-lg overflow-hidden z-20 border border-gray-200">
            <div className="py-2 px-4 bg-gray-50 font-semibold text-gray-700 border-b">
              Notifikasi
            </div>
            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-4 text-center text-sm text-gray-500">
                  Tidak ada notifikasi
                </div>
              ) : (
                notifications.map(notif => (
                  <div 
                    key={notif.notif_id}
                    onClick={() => handleNotifClick(notif)}
                    className={`p-3 border-b cursor-pointer hover:bg-gray-50 transition-colors ${!notif.is_read ? 'bg-blue-50' : 'bg-white'}`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-medium text-sm text-gray-800">{notif.judul}</span>
                      {!notif.is_read && (
                        <span className="h-2 w-2 rounded-full bg-blue-600"></span>
                      )}
                    </div>
                    <p className="text-xs text-gray-600 line-clamp-2">{notif.isi}</p>
                    <span className="text-[10px] text-gray-400 block mt-2">
                      {new Date(notif.dibuat_pada).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* MODAL POPUP NOTIFIKASI */}
      {selectedNotif && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-100">
            {/* Header Modal */}
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-start bg-indigo-50/50">
              <div className="pr-4">
                <h3 className="font-bold text-slate-900 text-lg leading-tight">{selectedNotif.judul}</h3>
                <p className="text-xs text-slate-500 mt-1 font-medium">
                  {new Date(selectedNotif.dibuat_pada).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}
                </p>
              </div>
              <button 
                onClick={() => setSelectedNotif(null)} 
                className="text-slate-400 hover:text-red-500 transition p-1 hover:bg-slate-100 rounded-lg cursor-pointer shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body Modal */}
            <div className="p-6">
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 text-sm text-slate-700 leading-relaxed max-h-60 overflow-y-auto whitespace-pre-wrap">
                {selectedNotif.isi}
              </div>
            </div>

            {/* Footer Modal */}
            <div className="px-6 py-4 border-t border-slate-100 flex gap-3 bg-slate-50/50 justify-end">
              <button 
                onClick={() => setSelectedNotif(null)}
                className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-200 bg-slate-100 border border-slate-200 rounded-xl transition cursor-pointer"
              >
                Tutup
              </button>
              {selectedNotif.link_ref && (
                <button 
                  onClick={handleNavigate}
                  className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition flex items-center gap-2 cursor-pointer shadow-md shadow-indigo-100"
                >
                  Lihat Detail <ExternalLink className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default NotificationBell;
