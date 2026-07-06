import React, { useState, useEffect } from 'react';
import apiClient from '../api/authApi';
import { eventApi } from '../api/eventApi';
import { useParams } from 'react-router-dom';
import { BarChart3, Download, Award, Target, CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react';

const LaporanPage = () => {
  const { eventId } = useParams();
  const [laporan, setLaporan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [generating, setGenerating] = useState(false);
  const [role, setRole] = useState('');

  const fetchLaporan = async () => {
    try {
      const res = await apiClient.get(`/events/${eventId}/laporan`);
      setLaporan(res.data.data);
    } catch (err) {
      if (err.response?.status === 404) {
        setLaporan(null); // Laporan belum ada
      } else {
        setError('Gagal memuat laporan');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchUserRole = async () => {
    try {
      const res = await eventApi.getEventDetail(eventId);
      setRole(res.data.userKeanggotaan?.role_event || 'ANGGOTA');
    } catch (err) {
      console.error('Gagal mengambil role user', err);
    }
  };

  useEffect(() => {
    fetchLaporan();
    fetchUserRole();
    // eslint-disable-next-line
  }, [eventId]);

  const handleGenerate = async () => {
    try {
      setGenerating(true);
      await apiClient.post(`/events/${eventId}/generate-laporan`);
      await fetchLaporan();
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal generate laporan');
    } finally {
      setGenerating(false);
    }
  };

  const handleExportPDF = async () => {
    try {
      const res = await apiClient.get(`/events/${eventId}/laporan/export-pdf`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Laporan_Evaluasi_Event.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (err) {
      alert('Gagal mendownload PDF');
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Memuat laporan...</div>;
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;

  return (
    <div className="max-w-6xl mx-auto mt-8 p-6 bg-gray-50 min-h-screen">
      <button 
        onClick={() => window.history.back()}
        className="flex items-center text-sm font-medium text-slate-500 hover:text-indigo-600 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4 mr-1" />
        Kembali ke Dashboard Event
      </button>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-800 tracking-tight flex items-center gap-3">
            <BarChart3 className="text-blue-600 w-8 h-8" />
            Laporan & Evaluasi Event
          </h2>
          <p className="text-gray-500 mt-1">Sistem Kalkulasi Performa Kepanitiaan (FR-019)</p>
        </div>
        
        <div className="flex gap-3">
          {['KETUA', 'SEKRETARIS', 'BENDAHARA', 'KOORDINATOR'].includes(role) && (
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="px-5 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition shadow disabled:opacity-70 flex items-center gap-2"
            >
              {generating ? 'Menghitung...' : 'Generate Ulang Laporan'}
            </button>
          )}
          {laporan && ['KETUA', 'SEKRETARIS', 'BENDAHARA'].includes(role) && (
            <button
              onClick={handleExportPDF}
              className="px-5 py-2.5 bg-red-500 text-white font-medium rounded-lg hover:bg-red-600 transition shadow flex items-center gap-2"
            >
              <Download size={18} /> Export PDF
            </button>
          )}
        </div>
      </div>

      {!laporan ? (
        <div className="bg-white p-12 rounded-2xl shadow-sm border border-gray-200 text-center">
          <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-800 mb-2">Laporan Belum Dibuat</h3>
          {['KETUA', 'SEKRETARIS', 'BENDAHARA', 'KOORDINATOR'].includes(role) ? (
            <>
              <p className="text-gray-500 mb-6">Klik tombol generate untuk menghitung performa kepanitiaan event ini.</p>
              <button
                onClick={handleGenerate}
                className="px-6 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition shadow-lg"
              >
                Generate Laporan Pertama
              </button>
            </>
          ) : (
            <p className="text-gray-500 mb-6">Laporan evaluasi belum digenerate oleh panitia inti atau koordinator.</p>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
              <div className="p-4 bg-blue-50 rounded-full text-blue-600"><Target size={24} /></div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Total Tugas</p>
                <p className="text-2xl font-bold text-gray-900">{laporan.total_tugas}</p>
              </div>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
              <div className="p-4 bg-emerald-50 rounded-full text-emerald-600"><CheckCircle2 size={24} /></div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Selesai</p>
                <p className="text-2xl font-bold text-gray-900">{laporan.tugas_selesai}</p>
              </div>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
              <div className="p-4 bg-orange-50 rounded-full text-orange-600"><AlertCircle size={24} /></div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Terlambat</p>
                <p className="text-2xl font-bold text-gray-900">{laporan.tugas_terlambat}</p>
              </div>
            </div>
            <div className="bg-gradient-to-br from-indigo-500 to-blue-600 p-6 rounded-2xl shadow-md text-white flex items-center gap-4">
              <div className="p-4 bg-white/20 rounded-full"><Award size={24} /></div>
              <div>
                <p className="text-sm font-medium opacity-80">Divisi Terbaik</p>
                <p className="text-xl font-bold truncate" title={laporan.ranking_divisi_terbaik}>
                  {laporan.ranking_divisi_terbaik || '-'}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Ranking Divisi */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-5 border-b bg-gray-50">
                <h3 className="text-lg font-bold text-gray-800">Ranking Performa Divisi</h3>
              </div>
              <div className="p-5">
                <div className="space-y-4">
                  {laporan.data_per_divisi.map((div, idx) => (
                    <div key={idx} className="relative bg-gray-50 rounded-xl p-4 border border-gray-100 flex items-center">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg mr-4 shadow-sm ${
                        idx === 0 ? 'bg-yellow-100 text-yellow-600' : 
                        idx === 1 ? 'bg-gray-200 text-gray-600' : 
                        idx === 2 ? 'bg-orange-100 text-orange-700' : 'bg-blue-50 text-blue-600'
                      }`}>
                        #{idx + 1}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-gray-800">{div.nama_divisi}</h4>
                        <div className="text-xs text-gray-500 mt-1 flex gap-3">
                          <span>Selesai: {div.tugas_selesai}/{div.total_tugas}</span>
                          <span className="text-red-500">Telat: {div.terlambat}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="block text-sm font-bold text-indigo-600">Skor: {div.skor.toFixed(2)}</span>
                        <span className="block text-[10px] text-gray-400">({div.persenSelesai.toFixed(0)}% Selesai)</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Rekap Absensi Sesi */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-5 border-b bg-gray-50">
                <h3 className="text-lg font-bold text-gray-800">Tingkat Kehadiran Per Sesi</h3>
              </div>
              <div className="p-5">
                <div className="space-y-5">
                  {laporan.data_kehadiran.map((sesi, idx) => (
                    <div key={idx}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-bold text-gray-700">{sesi.nama_sesi}</span>
                        <span className="font-medium text-gray-500">
                          {sesi.totalHadir}/{sesi.totalAnggota} ({sesi.tingkat_kehadiran.toFixed(1)}%)
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div 
                          className="bg-emerald-500 h-2.5 rounded-full" 
                          style={{ width: `${sesi.tingkat_kehadiran}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                  {laporan.data_kehadiran.length === 0 && (
                    <p className="text-sm text-gray-500 text-center py-4">Belum ada sesi absensi untuk event ini.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          <p className="text-xs text-gray-400 text-center mt-4">
            Laporan terakhir di-generate pada: {new Date(laporan.dibuat_pada).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}
          </p>
        </div>
      )}
    </div>
  );
};

export default LaporanPage;
