import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { eventApi } from '../api/eventApi';
import { Loader2, ArrowLeft, Check, X, User } from 'lucide-react';

const PendingMembers = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  const fetchPending = async () => {
    try {
      const response = await eventApi.getPendingMembers(id);
      const mappedData = response.data.data.map(member => ({
        ...member,
        id: member.keanggotaan_id
      }));
      setMembers(mappedData);
    } catch (error) {
      console.error("Gagal memuat daftar pending", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();
  }, [id]);

  const handleApprove = async (memberId) => {
    setProcessingId(memberId);
    try {
      await eventApi.approveMember(memberId);
      setMembers(members.filter(m => m.id !== memberId));
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal menyetujui anggota');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (memberId) => {
    if (!window.confirm("Yakin ingin menolak permintaan ini?")) return;
    setProcessingId(memberId);
    try {
      await eventApi.rejectMember(memberId);
      setMembers(members.filter(m => m.id !== memberId));
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal menolak anggota');
    } finally {
      setProcessingId(null);
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
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <button 
          onClick={() => navigate(`/events/${id}`)}
          className="flex items-center text-sm font-medium text-slate-500 hover:text-indigo-600 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Kembali ke Detail Event
        </button>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-indigo-50">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Request Bergabung</h2>
              <p className="text-slate-600 text-sm mt-1">Calon panitia yang mendaftar via link undangan.</p>
            </div>
            <div className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-sm font-bold">
              {members.length} Antrean
            </div>
          </div>

          {members.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              <User className="w-12 h-12 mx-auto text-slate-300 mb-4" />
              <p>Belum ada permintaan bergabung yang baru.</p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {members.map((member) => (
                <li key={member.id} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="bg-indigo-100 w-10 h-10 rounded-full flex items-center justify-center shrink-0">
                      <span className="text-indigo-700 font-bold">
                        {member.user.nama_lengkap.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">{member.user.nama_lengkap}</p>
                      <p className="text-sm text-slate-500">{member.user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleReject(member.id)}
                      disabled={processingId === member.id}
                      className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors flex items-center disabled:opacity-70"
                    >
                      <X className="w-4 h-4 mr-1" /> Tolak
                    </button>
                    <button
                      onClick={() => handleApprove(member.id)}
                      disabled={processingId === member.id}
                      className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors flex items-center disabled:opacity-70"
                    >
                      {processingId === member.id ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Check className="w-4 h-4 mr-1" />}
                      Setujui
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default PendingMembers;
