import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { eventApi } from '../api/eventApi';
import { Calendar, MapPin, UserPlus, Loader2, CheckCircle, AlertCircle, ArrowRight, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';

const InviteJoinPage = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchInviteDetails = async () => {
      try {
        const res = await eventApi.getInviteDetails(token);
        setEvent(res.data.data);
      } catch (err) {
        console.error(err);
        setError(err.response?.data?.message || 'Undangan tidak valid atau sudah kedaluwarsa.');
      } finally {
        setLoading(false);
      }
    };

    fetchInviteDetails();
  }, [token]);

  const handleJoin = async () => {
    // Check if logged in
    const userToken = localStorage.getItem('token');
    if (!userToken) {
      toast.error('Silakan login terlebih dahulu untuk bergabung.');
      navigate(`/login?redirect=/invite/${token}`);
      return;
    }

    setJoining(true);
    try {
      const res = await eventApi.joinEvent(token);
      toast.success(res.data.message || 'Berhasil mengirim permintaan bergabung!');
      // Redirect to event list
      navigate('/');
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Gagal bergabung ke event.');
    } finally {
      setJoining(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-3">
        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
        <p className="text-slate-500 font-medium text-sm">Memuat detail undangan...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center shadow-lg border border-slate-100">
          <div className="bg-red-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">Undangan Tidak Valid</h3>
          <p className="text-slate-500 mb-6 text-sm">
            {error}
          </p>
          <button
            onClick={() => navigate('/')}
            className="w-full bg-slate-900 text-white py-3 rounded-xl font-semibold hover:bg-slate-800 transition-colors text-sm"
          >
            Kembali ke Beranda
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-tr from-slate-100 via-indigo-50/30 to-slate-100 p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-xl border border-slate-100 overflow-hidden">
        {/* Header / Banner */}
        <div className="bg-indigo-600 px-8 py-10 text-white relative overflow-hidden">
          <div className="absolute right-0 bottom-0 opacity-10 transform translate-x-12 translate-y-12">
            <Sparkles className="w-64 h-64" />
          </div>
          <div className="relative z-10">
            <span className="bg-indigo-500/50 text-indigo-100 text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wider">
              Undangan Bergabung Panitia
            </span>
            <h1 className="text-2xl md:text-3xl font-extrabold mt-4 tracking-tight leading-tight">
              {event.nama_event}
            </h1>
            <p className="text-indigo-200 text-sm mt-2 font-medium">
              Tipe Event: {event.jenis_event}
            </p>
          </div>
        </div>

        {/* Details & Actions */}
        <div className="p-8">
          <div className="space-y-5 mb-8">
            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-indigo-600 mt-0.5 shrink-0" />
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase">Waktu Pelaksanaan</h4>
                <p className="text-sm font-semibold text-slate-800 mt-0.5">
                  {new Date(event.tanggal_pelaksanaan).toLocaleDateString('id-ID', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    timeZone: 'Asia/Jakarta'
                  })}
                </p>
              </div>
            </div>

            {event.lokasi && (
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-rose-500 mt-0.5 shrink-0" />
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase">Tempat / Lokasi</h4>
                  <p className="text-sm font-semibold text-slate-800 mt-0.5">
                    {event.lokasi}
                  </p>
                </div>
              </div>
            )}

            {event.deskripsi && (
              <div className="border-t border-slate-100 pt-4">
                <h4 className="text-xs font-bold text-slate-400 uppercase mb-1">Deskripsi Event</h4>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {event.deskripsi}
                </p>
              </div>
            )}
          </div>

          <div className="bg-indigo-50/50 border border-indigo-100 rounded-2xl p-4 mb-8 text-center">
            <p className="text-xs text-slate-500 leading-normal">
              Dengan mengklik tombol bergabung di bawah, Anda akan mengajukan permintaan untuk bergabung ke tim kepanitiaan. Permintaan Anda perlu disetujui oleh panitia inti.
            </p>
          </div>

          <button
            onClick={handleJoin}
            disabled={joining}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-2xl font-bold transition-all shadow-md flex items-center justify-center gap-2 text-sm disabled:opacity-50"
          >
            {joining ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Memproses Permintaan...
              </>
            ) : (
              <>
                <UserPlus className="w-5 h-5" />
                Kirim Permintaan Bergabung
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default InviteJoinPage;
