import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { eventApi } from '../api/eventApi';
import { AuthContext } from '../context/AuthContext';
import { Plus, Calendar, MapPin, Users, Loader2, LogOut, UserPlus, X } from 'lucide-react';
import toast from 'react-hot-toast';

const EventList = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [joinCodeOrLink, setJoinCodeOrLink] = useState('');
  const [joining, setJoining] = useState(false);
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const isPanitia = user?.user_type === 'PANITIA';

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await eventApi.getEvents();
        setEvents(response.data.data);
      } catch (error) {
        console.error("Failed to fetch events", error);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const handleJoinEvent = async (e) => {
    e.preventDefault();
    if (!joinCodeOrLink.trim()) return;

    setJoining(true);
    try {
      let token = joinCodeOrLink.trim();
      if (token.includes('/invite/')) {
        const parts = token.split('/invite/');
        token = parts[parts.length - 1].split('/')[0].split('?')[0];
      }

      const response = await eventApi.joinEvent(token);
      toast.success(response.data.message || 'Permintaan bergabung berhasil dikirim!');
      setShowJoinModal(false);
      setJoinCodeOrLink('');
    } catch (error) {
      console.error("Failed to join event", error);
      toast.error(error.response?.data?.message || 'Gagal bergabung ke event. Pastikan kode join/link benar dan belum kedaluwarsa.');
    } finally {
      setJoining(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-12">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Event Saya</h1>
            <p className="text-slate-500">Ayo Kelola Semua Event mu bersama EventCrew</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowJoinModal(true)}
              className="bg-white text-indigo-600 border border-indigo-200 px-6 py-3 rounded-xl font-medium hover:bg-indigo-50 hover:border-indigo-300 transition-colors flex items-center gap-2 shadow-sm"
            >
              <UserPlus className="w-5 h-5" />
              Gabung Event
            </button>
            {isPanitia && (
              <Link
                to="/events/create"
                className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-indigo-700 transition-colors flex items-center gap-2 shadow-sm"
              >
                <Plus className="w-5 h-5" />
                Buat Event Baru
              </Link>
            )}
            <button
              onClick={handleLogout}
              className="bg-white text-red-600 border border-red-200 px-4 py-3 rounded-xl font-medium hover:bg-red-50 hover:border-red-300 transition-colors flex items-center gap-2 shadow-sm"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>

        {events.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-slate-100">
            <div className="bg-indigo-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-8 h-8 text-indigo-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Belum ada event</h3>
            <p className="text-slate-500 mb-6 max-w-md mx-auto">
              {isPanitia 
                ? "Anda belum membuat atau bergabung dengan event apapun. Mulai dengan membuat event pertama Anda." 
                : "Anda belum bergabung dengan event apapun. Silakan hubungi panitia untuk meminta kode bergabung atau link undangan."}
            </p>
            {isPanitia && (
              <Link
                to="/events/create"
                className="inline-flex bg-indigo-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-indigo-700 transition-colors items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Buat Event
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <div 
                key={event.event_id} 
                onClick={() => navigate(`/events/${event.event_id}`)}
                className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md hover:border-indigo-100 transition-all cursor-pointer group"
              >
                <div className="flex justify-between items-start mb-4">
                  <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                    event.status === 'PERSIAPAN' ? 'bg-amber-100 text-amber-700' :
                    event.status === 'AKTIF' ? 'bg-green-100 text-green-700' :
                    'bg-slate-100 text-slate-700'
                  }`}>
                    {event.status}
                  </span>
                  <span className="text-xs font-medium text-slate-400 bg-slate-50 px-2 py-1 rounded-md">
                    {event.jenis_event}
                  </span>
                </div>
                
                <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-indigo-600 transition-colors line-clamp-1">
                  {event.nama_event}
                </h3>
                
                <div className="space-y-2 mt-4">
                  <div className="flex items-center text-sm text-slate-500">
                    <Calendar className="w-4 h-4 mr-2 text-slate-400" />
                    {new Date(event.tanggal_pelaksanaan).toLocaleDateString('id-ID', { timeZone: 'Asia/Jakarta',  day: 'numeric', month: 'long', year: 'numeric' })}
                  </div>
                  {event.lokasi && (
                    <div className="flex items-center text-sm text-slate-500 line-clamp-1">
                      <MapPin className="w-4 h-4 mr-2 text-slate-400 shrink-0" />
                      {event.lokasi}
                    </div>
                  )}
                  <div className="flex items-center text-sm text-slate-500">
                    <Users className="w-4 h-4 mr-2 text-slate-400" />
                    {event._count?.keanggotaan ?? 0} Panitia Aktif
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {/* Modal Gabung Event */}
      {showJoinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden border border-slate-100">
            <div className="px-6 py-4 border-b flex justify-between items-center bg-slate-50">
              <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <UserPlus className="text-indigo-600 w-5 h-5" />
                Gabung Event
              </h3>
              <button 
                onClick={() => { setShowJoinModal(false); setJoinCodeOrLink(''); }} 
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleJoinEvent} className="p-6">
              <div className="space-y-4">
                <p className="text-sm text-slate-500">
                  Masukkan 6-karakter <strong>Kode Join</strong> atau <strong>Link Undangan</strong> lengkap yang diberikan oleh panitia inti event.
                </p>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Kode Join / Link Undangan</label>
                  <input
                    type="text"
                    required
                    value={joinCodeOrLink}
                    onChange={e => setJoinCodeOrLink(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm font-medium"
                    placeholder="Contoh: EC94AB atau https://..."
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => { setShowJoinModal(false); setJoinCodeOrLink(''); }}
                  className="px-5 py-2.5 bg-white border border-slate-300 text-slate-700 rounded-xl font-semibold hover:bg-slate-50 text-sm"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={joining}
                  className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 disabled:opacity-50 text-sm flex items-center gap-1.5"
                >
                  {joining ? 'Memproses...' : 'Gabung'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventList;
