import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { absensiApi } from '../api/absensiApi';
import { eventApi } from '../api/eventApi';
import { Loader2, Plus, Calendar, Clock, QrCode, ScanLine, FileText, ArrowLeft, UserCheck, Hand } from 'lucide-react';
import toast from 'react-hot-toast';

// Role yang memiliki hak akses penuh (buat sesi, QR, absen manual, rekap)
const LEADERSHIP_ROLES = ['KETUA', 'SEKRETARIS', 'BENDAHARA'];

const AbsensiPage = () => {
  const { id: eventId } = useParams();
  const navigate = useNavigate();

  const [sesiList, setSesiList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState('ANGGOTA');
  const [showCreate, setShowCreate] = useState(false);
  const [selfAbsenLoading, setSelfAbsenLoading] = useState(null);

  const isLeadership = LEADERSHIP_ROLES.includes(userRole);

  const fetchData = async () => {
    try {
      setLoading(true);
      const eventRes = await eventApi.getEventDetail(eventId);
      setUserRole(eventRes.data.userKeanggotaan?.role_event || 'ANGGOTA');

      const res = await absensiApi.getSesiByEvent(eventId);
      setSesiList(res.data.data);
    } catch (error) {
      console.error('Gagal fetch data absensi', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [eventId]);

  const [formData, setFormData] = useState({
    nama_sesi: '',
    jenis_sesi: 'RAPAT',
    waktu_mulai: '',
    waktu_selesai: ''
  });

  const handleCreate = async (e) => {
    e.preventDefault();
    if (new Date(formData.waktu_selesai) <= new Date(formData.waktu_mulai)) {
      return toast.error("Waktu selesai harus lebih besar dari waktu mulai");
    }
    try {
      await absensiApi.createSesi(eventId, formData);
      setShowCreate(false);
      fetchData();
      toast.success('Sesi absensi berhasil dibuat');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Gagal membuat sesi absensi');
    }
  };

  const handleSelfAbsen = async (sesiId) => {
    setSelfAbsenLoading(sesiId);
    try {
      const res = await absensiApi.selfAbsen(sesiId);
      toast.success(res.data.message || 'Absensi berhasil dicatat');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Gagal melakukan absensi');
    } finally {
      setSelfAbsenLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8">
      <button 
        onClick={() => navigate(`/events/${eventId}`)}
        className="flex items-center text-sm font-medium text-slate-500 hover:text-indigo-600 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4 mr-1" />
        Kembali ke Dashboard Event
      </button>

      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Absensi Event</h1>
          <p className="text-slate-500 text-sm mt-1">Kelola dan ikuti sesi kehadiran untuk event ini.</p>
        </div>
        {isLeadership && (
          <button
            onClick={() => setShowCreate(true)}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700 transition"
          >
            <Plus className="w-4 h-4" />
            Buat Sesi
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sesiList.map(sesi => {
          const isAktif = sesi.status === 'AKTIF';
          return (
            <div key={sesi.sesi_id} className="bg-white p-5 rounded-2xl border shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-bold text-lg text-slate-900">{sesi.nama_sesi}</h3>
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                    isAktif ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'
                  }`}>
                    {sesi.status}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-500 mb-2">
                  <Calendar className="w-4 h-4" />
                  <span>{new Date(sesi.waktu_mulai).toLocaleDateString('id-ID', { timeZone: 'Asia/Jakarta' })} ({sesi.jenis_sesi})</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-500 mb-4">
                  <Clock className="w-4 h-4" />
                  <span>
                    {new Date(sesi.waktu_mulai).toLocaleTimeString('id-ID', { timeZone: 'Asia/Jakarta',  hour: '2-digit', minute: '2-digit' })} - 
                    {new Date(sesi.waktu_selesai).toLocaleTimeString('id-ID', { timeZone: 'Asia/Jakarta',  hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-2 mt-4 pt-4 border-t border-slate-100">
                {isLeadership ? (
                  <>
                    {/* Baris 1: QR + Rekap */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => navigate(`/sesi-absensi/${sesi.sesi_id}/qr`)}
                        className="flex-1 bg-indigo-50 text-indigo-700 px-3 py-2 rounded-lg text-sm font-medium flex justify-center items-center gap-2 hover:bg-indigo-100 transition"
                      >
                        <QrCode className="w-4 h-4" /> Tampilkan QR
                      </button>
                      <button
                        onClick={() => navigate(`/sesi-absensi/${sesi.sesi_id}/rekap`)}
                        className="flex-1 bg-slate-50 text-slate-700 px-3 py-2 rounded-lg text-sm font-medium flex justify-center items-center gap-2 hover:bg-slate-100 transition"
                      >
                        <FileText className="w-4 h-4" /> Rekap
                      </button>
                    </div>
                    {/* Baris 2: Self Absen (hanya saat sesi aktif) */}
                    {isAktif && (
                      <button
                        onClick={() => handleSelfAbsen(sesi.sesi_id)}
                        disabled={selfAbsenLoading === sesi.sesi_id}
                        className="w-full bg-emerald-50 text-emerald-700 px-3 py-2 rounded-lg text-sm font-medium flex justify-center items-center gap-2 hover:bg-emerald-100 transition disabled:opacity-50"
                      >
                        {selfAbsenLoading === sesi.sesi_id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Hand className="w-4 h-4" />
                        )}
                        Absen Diri Sendiri
                      </button>
                    )}
                  </>
                ) : (
                  <>
                    {/* KOORDINATOR & ANGGOTA: Hanya bisa Scan QR */}
                    <button
                      onClick={() => navigate(`/sesi-absensi/${sesi.sesi_id}/scan`)}
                      disabled={!isAktif}
                      className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium flex justify-center items-center gap-2 transition ${
                        isAktif 
                          ? 'bg-indigo-600 text-white hover:bg-indigo-700' 
                          : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                      }`}
                    >
                      <ScanLine className="w-4 h-4" /> {isAktif ? 'Scan QR' : 'Sesi Ditutup'}
                    </button>
                    {/* Koordinator bisa lihat rekap (read-only) */}
                    {userRole === 'KOORDINATOR' && (
                      <button
                        onClick={() => navigate(`/sesi-absensi/${sesi.sesi_id}/rekap`)}
                        className="w-full bg-slate-50 text-slate-700 px-3 py-2 rounded-lg text-sm font-medium flex justify-center items-center gap-2 hover:bg-slate-100 transition"
                      >
                        <FileText className="w-4 h-4" /> Lihat Rekap
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          );
        })}

        {sesiList.length === 0 && (
          <div className="col-span-full py-12 text-center text-slate-500">
            Belum ada sesi absensi yang dibuat.
          </div>
        )}
      </div>

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Buat Sesi Absensi</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nama Sesi</label>
                <input
                  type="text" required
                  className="w-full p-2.5 border rounded-lg"
                  placeholder="Misal: Rapat Pleno 1"
                  value={formData.nama_sesi}
                  onChange={e => setFormData({ ...formData, nama_sesi: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Jenis Sesi</label>
                <select
                  className="w-full p-2.5 border rounded-lg"
                  value={formData.jenis_sesi}
                  onChange={e => setFormData({ ...formData, jenis_sesi: e.target.value })}
                >
                  <option value="RAPAT">Rapat</option>
                  <option value="HARI_H">Hari-H Event</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Waktu Mulai</label>
                  <input
                    type="datetime-local" required
                    className="w-full p-2.5 border rounded-lg"
                    value={formData.waktu_mulai}
                    onChange={e => setFormData({ ...formData, waktu_mulai: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Waktu Selesai</label>
                  <input
                    type="datetime-local" required
                    className="w-full p-2.5 border rounded-lg"
                    value={formData.waktu_selesai}
                    onChange={e => setFormData({ ...formData, waktu_selesai: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="flex-1 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg font-medium"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium"
                >
                  Simpan Sesi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AbsensiPage;
