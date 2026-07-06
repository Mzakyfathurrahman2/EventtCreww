import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { absensiApi } from '../api/absensiApi';
import { eventApi } from '../api/eventApi';
import { ArrowLeft, Loader2, Search, CheckCircle2, XCircle, Clock, UserCheck } from 'lucide-react';
import toast from 'react-hot-toast';

const LEADERSHIP_ROLES = ['KETUA', 'SEKRETARIS', 'BENDAHARA'];

const RekapAbsensi = () => {
  const { sesiId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterDivisi, setFilterDivisi] = useState('');
  const [userRole, setUserRole] = useState('ANGGOTA');
  const [manualLoading, setManualLoading] = useState(null);

  const isLeadership = LEADERSHIP_ROLES.includes(userRole);

  const fetchRekap = async () => {
    try {
      const res = await absensiApi.getRekap(sesiId);
      setData(res.data.data);

      // Ambil role user dari event detail
      if (res.data.data?.sesi?.event_id) {
        try {
          const eventRes = await eventApi.getEventDetail(res.data.data.sesi.event_id);
          setUserRole(eventRes.data.userKeanggotaan?.role_event || 'ANGGOTA');
        } catch (e) {
          // Fallback: coba ambil dari sesi info
        }
      }
    } catch (error) {
      toast.error('Gagal memuat rekap absensi');
      navigate(-1);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRekap();
  }, [sesiId, navigate]);

  const handleManualAbsen = async (userId, nama) => {
    setManualLoading(userId);
    try {
      const res = await absensiApi.manualAbsen(sesiId, userId);
      toast.success(res.data.message || `${nama} berhasil diabsenkan`);
      // Refresh rekap data
      const rekapRes = await absensiApi.getRekap(sesiId);
      setData(rekapRes.data.data);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Gagal melakukan absen manual');
    } finally {
      setManualLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  const { sesi, rekap } = data;

  const filteredRekap = rekap.filter(r => {
    const matchSearch = r.nama.toLowerCase().includes(search.toLowerCase());
    const matchDivisi = filterDivisi ? r.divisi === filterDivisi : true;
    return matchSearch && matchDivisi;
  });

  const uniqueDivisi = [...new Set(rekap.map(r => r.divisi))];
  const isAktif = sesi.status === 'AKTIF';

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 mb-6 font-medium transition"
      >
        <ArrowLeft className="w-4 h-4" /> Kembali
      </button>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 mb-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Rekap Kehadiran: {sesi.nama_sesi}</h1>
            <p className="text-slate-500 text-sm">
              Status Sesi: 
              <span className={`ml-2 font-bold ${sesi.status === 'AKTIF' ? 'text-green-600' : 'text-slate-600'}`}>
                {sesi.status}
              </span>
            </p>
          </div>
          <div className="text-right text-sm text-slate-500">
            <p>Total: <span className="font-bold text-slate-900">{rekap.length} Orang</span></p>
            <p>Hadir: <span className="font-bold text-green-600">{rekap.filter(r => r.status === 'HADIR').length}</span></p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nama anggota..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 focus:bg-white transition"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <select
            className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
            value={filterDivisi}
            onChange={e => setFilterDivisi(e.target.value)}
          >
            <option value="">Semua Divisi</option>
            {uniqueDivisi.map(div => (
              <option key={div} value={div}>{div}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-slate-600 text-sm">
                <th className="p-4 font-semibold">Nama Anggota</th>
                <th className="p-4 font-semibold">Divisi</th>
                <th className="p-4 font-semibold">Role</th>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 font-semibold text-right">Waktu Scan</th>
                {isLeadership && isAktif && (
                  <th className="p-4 font-semibold text-center">Aksi</th>
                )}
              </tr>
            </thead>
            <tbody>
              {filteredRekap.map((r, idx) => (
                <tr key={idx} className="border-b border-slate-50 hover:bg-slate-50/50 transition">
                  <td className="p-4 font-medium text-slate-900">{r.nama}</td>
                  <td className="p-4 text-slate-500 text-sm">{r.divisi}</td>
                  <td className="p-4 text-slate-500 text-sm">{r.role}</td>
                  <td className="p-4">
                    {r.status === 'HADIR' && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-green-50 text-green-700 text-xs font-bold">
                        <CheckCircle2 className="w-3.5 h-3.5" /> HADIR
                      </span>
                    )}
                    {r.status === 'TIDAK_HADIR' && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-red-50 text-red-700 text-xs font-bold">
                        <XCircle className="w-3.5 h-3.5" /> ABSEN
                      </span>
                    )}
                    {r.status === 'BELUM_HADIR' && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 text-xs font-bold">
                        <Clock className="w-3.5 h-3.5" /> BELUM
                      </span>
                    )}
                  </td>
                  <td className="p-4 text-slate-500 text-sm text-right font-mono">
                    {r.waktu_scan ? new Date(r.waktu_scan).toLocaleTimeString('id-ID', { timeZone: 'Asia/Jakarta',  hour: '2-digit', minute: '2-digit', second:'2-digit' }) : '-'}
                  </td>
                  {isLeadership && isAktif && (
                    <td className="p-4 text-center">
                      {r.status !== 'HADIR' ? (
                        <button
                          onClick={() => handleManualAbsen(r.user_id, r.nama)}
                          disabled={manualLoading === r.user_id}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-bold hover:bg-emerald-100 transition disabled:opacity-50"
                        >
                          {manualLoading === r.user_id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <UserCheck className="w-3.5 h-3.5" />
                          )}
                          Absenkan
                        </button>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </td>
                  )}
                </tr>
              ))}
              {filteredRekap.length === 0 && (
                <tr>
                  <td colSpan={isLeadership && isAktif ? 6 : 5} className="p-8 text-center text-slate-500">
                    Tidak ada data yang cocok.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default RekapAbsensi;
