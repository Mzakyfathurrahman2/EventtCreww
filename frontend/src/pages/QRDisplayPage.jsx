import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { io } from 'socket.io-client';
import { absensiApi } from '../api/absensiApi';
import { Loader2, ArrowLeft, Users, CheckCircle2 } from 'lucide-react';

// Tentukan SOCKET_URL secara dinamis berdasarkan hostname dan port agar bisa diakses lewat jaringan lokal maupun tunnel publik (ngrok/localtunnel)
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

const QRDisplayPage = () => {
  const { sesiId } = useParams();
  const navigate = useNavigate();

  const [sesi, setSesi] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hadirList, setHadirList] = useState([]);
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const fetchQr = async () => {
      try {
        const res = await absensiApi.getQrToken(sesiId);
        setSesi(res.data.data);
      } catch (error) {
        console.error('Gagal memuat QR', error);
        alert('Gagal memuat QR');
        navigate(-1);
      } finally {
        setLoading(false);
      }
    };
    fetchQr();
  }, [sesiId, navigate]);

  useEffect(() => {
    if (!sesi) return;

    // Timer countdown
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const end = new Date(sesi.waktu_selesai).getTime();
      const distance = end - now;

      if (distance < 0) {
        clearInterval(timer);
        setTimeLeft('Sesi Ditutup');
      } else {
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);
        setTimeLeft(`${hours}j ${minutes}m ${seconds}d`);
      }
    }, 1000);

    // Socket connection
    const socket = io(SOCKET_URL, {
      withCredentials: true,
      auth: {
        token: localStorage.getItem('token')
      }
    });

    socket.on('connect', () => {
      socket.emit('join-sesi-absensi', { sesi_id: sesiId });
    });

    socket.on('anggota-hadir', (data) => {
      setHadirList(prev => {
        // Prevent duplicate in UI
        if (prev.find(p => p.user_id === data.user_id)) return prev;
        return [data, ...prev];
      });
    });

    socket.on('sesi-ditutup', () => {
      setTimeLeft('Sesi Ditutup (Cron)');
      setSesi(s => ({ ...s, status: 'TUTUP' }));
    });

    return () => {
      clearInterval(timer);
      socket.disconnect();
    };
  }, [sesi, sesiId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-900">
        <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col md:flex-row text-white">
      {/* Kiri: Tampilan QR */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 relative">
        <button
          onClick={() => navigate(-1)}
          className="absolute top-8 left-8 text-slate-400 hover:text-white flex items-center gap-2"
        >
          <ArrowLeft className="w-5 h-5" /> Kembali
        </button>

        <h1 className="text-3xl font-bold mb-2 text-center">{sesi.nama_sesi}</h1>
        <p className="text-slate-400 mb-8 text-center text-lg">Sisa Waktu: <span className="font-mono font-bold text-amber-400">{timeLeft}</span></p>

        {sesi.status === 'AKTIF' ? (
          <div className="bg-white p-6 rounded-3xl shadow-2xl">
            <QRCodeSVG value={sesi.qr_token} size={350} />
          </div>
        ) : (
          <div className="bg-slate-800 p-12 rounded-3xl border border-slate-700 flex flex-col items-center">
            <CheckCircle2 className="w-20 h-20 text-green-500 mb-4" />
            <h2 className="text-2xl font-bold">Sesi Telah Selesai</h2>
          </div>
        )}
        
        <p className="mt-8 text-slate-500 text-sm">Scan menggunakan aplikasi EventCrew (Menu Scan QR)</p>
      </div>

      {/* Kanan: Realtime Feed */}
      <div className="w-full md:w-96 bg-slate-800 border-l border-slate-700 flex flex-col">
        <div className="p-6 border-b border-slate-700 flex justify-between items-center">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-400" />
            Kehadiran Real-time
          </h3>
          <span className="bg-indigo-500/20 text-indigo-300 px-3 py-1 rounded-full text-sm font-bold">
            {hadirList.length} Hadir
          </span>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {hadirList.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-2">
              <Users className="w-12 h-12 opacity-20" />
              <p>Belum ada yang scan QR</p>
            </div>
          ) : (
            hadirList.map((hadir, idx) => (
              <div key={idx} className="bg-slate-700/50 border border-slate-600 p-4 rounded-xl flex items-center justify-between animate-fade-in-down">
                <div>
                  <p className="font-semibold">{hadir.nama}</p>
                  <p className="text-xs text-slate-400">Baru saja</p>
                </div>
                <CheckCircle2 className="w-5 h-5 text-green-400" />
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default QRDisplayPage;
