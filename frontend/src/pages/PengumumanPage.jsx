import React, { useState, useEffect } from 'react';
import apiClient from '../api/authApi';
import { useParams } from 'react-router-dom';
import { Megaphone, Plus, Edit2, Trash2, X, Send, ArrowLeft, Calendar, MapPin } from 'lucide-react';
import { io } from 'socket.io-client';

const getSocketUrl = () => {
  if (import.meta.env.VITE_SOCKET_URL) return import.meta.env.VITE_SOCKET_URL;
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL.replace('/api', '');
  
  if (typeof window !== 'undefined' && window.location.hostname) {
    const port = window.location.port;
    if (port && (port === '5173' || port === '5174' || port === '3000')) {
      return `${window.location.protocol}//${window.location.hostname}:3000`;
    }
    return window.location.origin;
  }
  return 'http://localhost:3000';
};
const SOCKET_URL = getSocketUrl();

const PengumumanPage = () => {
  const { eventId } = useParams();
  const [pengumumans, setPengumumans] = useState([]);
  const [divisiList, setDivisiList] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ id: null, judul: '', isi: '', divisi_id: '', tanggal_waktu: '', tempat: '' });
  const [loading, setLoading] = useState(false);

  const formatDatetimeLocal = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const tzOffset = date.getTimezoneOffset() * 60000;
    const localISOTime = (new Date(date.getTime() - tzOffset)).toISOString().slice(0, 16);
    return localISOTime;
  };
  const [userRole, setUserRole] = useState('ANGGOTA');
  const [userDivisiId, setUserDivisiId] = useState(null);

  const fetchPengumuman = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await apiClient.get(`/events/${eventId}/pengumuman`);
      setPengumumans(res.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchInitData = async () => {
    try {
      const token = localStorage.getItem('token');
      const eventRes = await apiClient.get(`/events/${eventId}`);
      setUserRole(eventRes.data.userKeanggotaan.role_event);
      setUserDivisiId(eventRes.data.userKeanggotaan.divisi_id);

      // Ambil daftar divisi untuk pilihan KETUA
      if (eventRes.data.userKeanggotaan.role_event === 'KETUA') {
        const divRes = await apiClient.get(`/events/${eventId}/divisi`);
        setDivisiList(divRes.data.data);
      }
    } catch (err) {
      console.error('Gagal mengambil data inisialisasi', err);
    }
  };

  useEffect(() => {
    fetchInitData();
    fetchPengumuman();

    const newSocket = io(SOCKET_URL, {
      withCredentials: true,
      auth: { token: localStorage.getItem('token') }
    });

    newSocket.on('new-pengumuman', (payload) => {
      if (payload.event_id === eventId) {
        setPengumumans(prev => {
          if(prev.find(p => p.pengumuman_id === payload.data.pengumuman_id)) return prev;
          return [payload.data, ...prev];
        });
      }
    });

    return () => {
      newSocket.disconnect();
    };
    // eslint-disable-next-line
  }, [eventId]);

  // Mengupdate timestamp terakhir kali membaca pengumuman
  useEffect(() => {
    const storedUser = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) : null;
    if (storedUser && eventId) {
      localStorage.setItem(`last_read_pengumuman_${eventId}_${storedUser.user_id}`, new Date().toISOString());
    }
  }, [eventId, pengumumans]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (formData.id) {
        // Edit
        await apiClient.patch(`/pengumuman/${formData.id}`, {
          judul: formData.judul,
          isi: formData.isi,
          tanggal_waktu: formData.tanggal_waktu || null,
          tempat: formData.tempat || null
        });
      } else {
        // Create
        await apiClient.post(`/events/${eventId}/pengumuman`, {
          judul: formData.judul,
          isi: formData.isi,
          divisi_id: formData.divisi_id || null,
          tanggal_waktu: formData.tanggal_waktu || null,
          tempat: formData.tempat || null
        });
      }
      setShowModal(false);
      fetchPengumuman();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Yakin hapus pengumuman ini?')) return;
    try {
      const token = localStorage.getItem('token');
      await apiClient.delete(`/pengumuman/${id}`);
      fetchPengumuman();
    } catch (err) {
      console.error(err);
      alert('Gagal menghapus pengumuman');
    }
  };

  const openModalForCreate = () => {
    setFormData({ id: null, judul: '', isi: '', divisi_id: '', tanggal_waktu: '', tempat: '' });
    setShowModal(true);
  };

  const openModalForEdit = (p) => {
    setFormData({ 
      id: p.pengumuman_id, 
      judul: p.judul, 
      isi: p.isi, 
      divisi_id: p.divisi_id || '',
      tanggal_waktu: p.tanggal_waktu ? formatDatetimeLocal(p.tanggal_waktu) : '',
      tempat: p.tempat || ''
    });
    setShowModal(true);
  };

  const currentUser = JSON.parse(localStorage.getItem('user'));

  return (
    <div className="max-w-4xl mx-auto mt-8 p-6 bg-white shadow-xl rounded-2xl border border-gray-100">
      <button 
        onClick={() => window.history.back()}
        className="flex items-center text-sm font-medium text-slate-500 hover:text-indigo-600 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4 mr-1" />
        Kembali ke Dashboard Event
      </button>

      <div className="flex justify-between items-center mb-8 border-b pb-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-800 tracking-tight flex items-center gap-3">
            <Megaphone className="text-orange-500 w-8 h-8" />
            Papan Pengumuman
          </h2>
          <p className="text-gray-500 mt-1">Pusat informasi dan broadcast event</p>
        </div>
        {['KETUA', 'SEKRETARIS', 'BENDAHARA', 'KOORDINATOR'].includes(userRole) && (
          <button
            onClick={openModalForCreate}
            className="flex items-center gap-2 px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-full font-medium transition-colors shadow-md"
          >
            <Plus size={20} /> Buat Pengumuman
          </button>
        )}
      </div>

      <div className="space-y-6">
        {pengumumans.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-300">
            <Megaphone className="mx-auto h-12 w-12 text-gray-300 mb-3" />
            <p className="text-gray-500 font-medium">Belum ada pengumuman saat ini.</p>
          </div>
        ) : (
          pengumumans.map(p => (
            <div key={p.pengumuman_id} className="relative bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
              {/* Badge Tujuan */}
              <div className="absolute top-6 right-6">
                <span className={`px-3 py-1 text-xs font-bold rounded-full ${
                  p.divisi_id ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                }`}>
                  {p.divisi_id ? `Divisi: ${p.divisi?.nama_divisi}` : 'Broadcast Umum'}
                </span>
              </div>
              
              <h3 className="text-xl font-bold text-gray-900 mb-2 pr-24">{p.judul}</h3>
              <div className="text-sm text-gray-500 mb-4 flex items-center gap-2">
                <span className="font-medium text-gray-700">{p.pembuat?.nama_lengkap}</span>
                <span>•</span>
                <span>{new Date(p.dibuat_pada).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}</span>
              </div>
              
              {(p.tanggal_waktu || p.tempat) && (
                <div className="flex flex-wrap gap-4 text-xs font-semibold text-slate-600 bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 mb-4 max-w-fit">
                  {p.tanggal_waktu && (
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-indigo-600 shrink-0" />
                      <span>
                        {new Date(p.tanggal_waktu).toLocaleString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          timeZone: 'Asia/Jakarta'
                        })} WIB
                      </span>
                    </div>
                  )}
                  {p.tanggal_waktu && p.tempat && <span className="text-slate-300">|</span>}
                  {p.tempat && (
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-rose-500 shrink-0" />
                      <span className="truncate max-w-[200px]" title={p.tempat}>{p.tempat}</span>
                    </div>
                  )}
                </div>
              )}

              <div className="text-gray-700 whitespace-pre-line mb-6 bg-gray-50 p-4 rounded-lg">
                {p.isi}
              </div>

              {/* Action Buttons if creator */}
              {p.dibuat_oleh === currentUser?.user_id && (
                <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-gray-100">
                  <button
                    onClick={() => openModalForEdit(p)}
                    className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    <Edit2 size={16} /> Edit
                  </button>
                  <button
                    onClick={() => handleDelete(p.pengumuman_id)}
                    className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                  >
                    <Trash2 size={16} /> Hapus
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Modal Buat/Edit */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50">
              <h3 className="text-xl font-bold text-gray-800">
                {formData.id ? 'Edit Pengumuman' : 'Buat Pengumuman Baru'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Judul Pengumuman</label>
                  <input
                    type="text"
                    required
                    value={formData.judul}
                    onChange={e => setFormData({ ...formData, judul: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    placeholder="Contoh: Rapat Koordinasi Akbar"
                  />
                </div>
                
                {/* Target Audience hanya untuk KETUA/SEKRETARIS/BENDAHARA saat membuat baru */}
                {!formData.id && ['KETUA', 'SEKRETARIS', 'BENDAHARA'].includes(userRole) && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tujuan / Penerima</label>
                    <select
                      value={formData.divisi_id}
                      onChange={e => setFormData({ ...formData, divisi_id: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    >
                      <option value="">-- Broadcast ke Semua Anggota (Umum) --</option>
                      {divisiList.map(d => (
                        <option key={d.divisi_id} value={d.divisi_id}>
                          Hanya Divisi: {d.nama_divisi}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal & Waktu Kegiatan (Opsional)</label>
                    <input
                      type="datetime-local"
                      value={formData.tanggal_waktu}
                      onChange={e => setFormData({ ...formData, tanggal_waktu: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tempat / Lokasi (Opsional)</label>
                    <input
                      type="text"
                      value={formData.tempat}
                      onChange={e => setFormData({ ...formData, tempat: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm"
                      placeholder="Contoh: Aula / Zoom Link"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Isi Pengumuman</label>
                  <textarea
                    required
                    rows={5}
                    value={formData.isi}
                    onChange={e => setFormData({ ...formData, isi: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    placeholder="Tuliskan isi pengumuman secara detail di sini..."
                  />
                </div>
              </div>

              <div className="mt-8 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-6 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 px-6 py-2.5 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700 disabled:opacity-50"
                >
                  <Send size={18} />
                  {loading ? 'Menyimpan...' : (formData.id ? 'Simpan Perubahan' : 'Kirim Pengumuman')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PengumumanPage;
