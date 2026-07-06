import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { eventApi } from '../api/eventApi';
import { Loader2, ArrowLeft, CalendarDays } from 'lucide-react';

const CreateEvent = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Initial state / Load from localStorage for Auto-Save
  const [formData, setFormData] = useState(() => {
    const saved = localStorage.getItem('draft_event');
    return saved ? JSON.parse(saved) : {
      nama_event: '',
      deskripsi: '',
      jenis_event: 'SEMINAR',
      tanggal_pelaksanaan: '',
      lokasi: ''
    };
  });

  useEffect(() => {
    // Auto-save to localStorage on change
    localStorage.setItem('draft_event', JSON.stringify(formData));
  }, [formData]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await eventApi.createEvent(formData);
      localStorage.removeItem('draft_event'); // Clear draft on success
      navigate(`/events/${response.data.data.event_id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Terjadi kesalahan saat membuat event');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <button 
          onClick={() => navigate('/')}
          className="flex items-center text-sm font-medium text-slate-500 hover:text-indigo-600 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Kembali ke Daftar Event
        </button>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="bg-indigo-600 p-6 text-white flex items-center gap-4">
            <div className="bg-white/20 p-3 rounded-xl">
              <CalendarDays className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Buat Event Baru</h1>
              <p className="text-indigo-100 text-sm mt-1">Sistem akan otomatis mengatur Anda sebagai Ketua.</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6">
            {error && (
              <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-md text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Nama Event *</label>
              <input
                type="text"
                name="nama_event"
                required
                value={formData.nama_event}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                placeholder="Contoh: Seminar Nasional Teknologi 2026"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Jenis Event *</label>
              <select
                name="jenis_event"
                value={formData.jenis_event}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all bg-white"
              >
                <option value="SEMINAR">Seminar</option>
                <option value="FESTIVAL">Festival</option>
                <option value="WORKSHOP">Workshop</option>
                <option value="KONSER">Konser</option>
                <option value="LOMBA">Lomba</option>
              </select>
              <p className="text-xs text-slate-500 mt-2">
                Pilih jenis event yang tepat untuk rekomendasi Smart Template (Divisi & Tugas) yang akurat.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Tanggal Pelaksanaan *</label>
                <input
                  type="date"
                  name="tanggal_pelaksanaan"
                  required
                  value={formData.tanggal_pelaksanaan}
                  onChange={handleChange}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Lokasi Utama (Opsional)</label>
                <input
                  type="text"
                  name="lokasi"
                  value={formData.lokasi}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  placeholder="Aula Utama Gedung B"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Deskripsi Singkat (Opsional)</label>
              <textarea
                name="deskripsi"
                rows="3"
                value={formData.deskripsi}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none"
                placeholder="Ceritakan sedikit tentang tujuan event ini..."
              ></textarea>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  localStorage.removeItem('draft_event');
                  setFormData({ nama_event: '', deskripsi: '', jenis_event: 'SEMINAR', tanggal_pelaksanaan: '', lokasi: '' });
                }}
                className="px-6 py-3 mr-4 text-slate-600 font-medium hover:text-slate-800 transition-colors"
              >
                Reset Draft
              </button>
              <button
                type="submit"
                disabled={loading}
                className="min-w-[160px] min-h-[44px] bg-indigo-600 text-white font-medium px-8 py-3 rounded-xl hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all disabled:opacity-70 flex justify-center items-center shadow-md shadow-indigo-200"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Buat Event'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateEvent;
