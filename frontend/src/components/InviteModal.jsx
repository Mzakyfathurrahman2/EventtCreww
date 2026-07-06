import React, { useState } from 'react';
import { eventApi } from '../api/eventApi';
import { Link2, Check, X, Loader2, Copy, UserPlus, AlertCircle, Mail } from 'lucide-react';

const InviteModal = ({ eventId, onMemberAdded, onClose }) => {
  const [activeTab, setActiveTab] = useState('link'); // 'link' | 'manual'
  const [inviteUrl, setInviteUrl] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [error, setError] = useState('');

  // Manual states
  const [email, setEmail] = useState('');
  const [manualLoading, setManualLoading] = useState(false);
  const [manualSuccess, setManualSuccess] = useState('');
  const [manualError, setManualError] = useState('');

  const generateLink = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await eventApi.generateInvite(eventId);
      setInviteUrl(response.data.data.inviteUrl);
      setJoinCode(response.data.data.joinCode);
      setCopied(false);
      setCopiedCode(false);
    } catch (err) {
      setError('Gagal membuat link undangan.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const copyCodeToClipboard = () => {
    navigator.clipboard.writeText(joinCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleAddManual = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setManualLoading(true);
    setManualError('');
    setManualSuccess('');
    try {
      await eventApi.addMemberManually(eventId, email);
      setManualSuccess(`Berhasil menambahkan ${email} ke panitia!`);
      setEmail('');
      if (onMemberAdded) {
        onMemberAdded(); // Trigger parent refresh
      }
    } catch (err) {
      setManualError(err.response?.data?.message || 'Gagal menambahkan anggota.');
    } finally {
      setManualLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-fadeIn">
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Undang Anggota</h3>
            <p className="text-xs text-slate-400 mt-0.5">Pilih metode untuk menambahkan panitia.</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors p-1.5 hover:bg-slate-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-100">
          <button
            onClick={() => setActiveTab('link')}
            className={`flex-1 py-3 text-sm font-medium border-b-2 text-center transition-all ${
              activeTab === 'link'
                ? 'border-indigo-600 text-indigo-600 bg-indigo-50/10'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Link2 className="w-4 h-4" />
              Tautan Undangan
            </div>
          </button>
          <button
            onClick={() => setActiveTab('manual')}
            className={`flex-1 py-3 text-sm font-medium border-b-2 text-center transition-all ${
              activeTab === 'manual'
                ? 'border-indigo-600 text-indigo-600 bg-indigo-50/10'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <UserPlus className="w-4 h-4" />
              Tambah Manual
            </div>
          </button>
        </div>
        
        {/* Tab Contents */}
        <div className="p-6">
          {activeTab === 'link' && (
            <div>
              <p className="text-slate-500 mb-6 text-sm leading-relaxed">
                Buat link undangan multi-use atau kode join yang dapat dibagikan ke calon panitia. Calon panitia harus mengirim request join, lalu disetujui panitia inti. Berlaku 12 jam.
              </p>

              {error && (
                <div className="bg-red-50 text-red-600 border border-red-100 rounded-xl px-4 py-3 text-sm mb-4 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" /> {error}
                </div>
              )}

              {!inviteUrl ? (
                <button
                  onClick={generateLink}
                  disabled={loading}
                  className="w-full bg-indigo-600 text-white min-h-[44px] rounded-xl flex items-center justify-center font-medium hover:bg-indigo-700 transition-all disabled:opacity-70 shadow-md shadow-indigo-100"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Generate Tautan & Kode Join'}
                </button>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5">Kode Join</label>
                    <div className="flex bg-slate-50 p-2 rounded-xl border border-slate-200 items-center justify-between">
                      <span className="font-mono font-bold text-lg text-indigo-600 px-3 tracking-widest">{joinCode}</span>
                      <button 
                        onClick={copyCodeToClipboard}
                        className="bg-white border border-slate-200 shadow-sm p-2 rounded-lg flex items-center text-slate-700 hover:text-indigo-600 transition-colors min-w-[44px] justify-center"
                      >
                        {copiedCode ? <Check className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5">Tautan Undangan</label>
                    <div className="flex bg-slate-50 p-2 rounded-xl border border-slate-200">
                      <input 
                        type="text" 
                        readOnly 
                        value={inviteUrl} 
                        className="bg-transparent flex-1 outline-none text-sm text-slate-700 px-2"
                      />
                      <button 
                        onClick={copyToClipboard}
                        className="bg-white border border-slate-200 shadow-sm p-2 rounded-lg flex items-center text-slate-700 hover:text-indigo-600 transition-colors min-w-[44px] justify-center"
                      >
                        {copied ? <Check className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                  
                  <button
                    onClick={generateLink}
                    disabled={loading}
                    className="w-full bg-indigo-50 text-indigo-700 min-h-[44px] rounded-xl flex items-center justify-center font-medium hover:bg-indigo-100 transition-all text-sm"
                  >
                    Generate Ulang (Revoke Link Lama)
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'manual' && (
            <div>
              <p className="text-slate-500 mb-6 text-sm leading-relaxed">
                Masukkan alamat email panitia yang sudah terdaftar di EventCrew untuk langsung menambahkannya secara aktif ke dalam kepanitiaan ini.
              </p>

              {manualError && (
                <div className="bg-red-50 text-red-600 border border-red-100 rounded-xl px-4 py-3 text-sm mb-4 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" /> {manualError}
                </div>
              )}

              {manualSuccess && (
                <div className="bg-green-50 text-green-600 border border-green-100 rounded-xl px-4 py-3 text-sm mb-4 flex items-center gap-2">
                  <Check className="w-4 h-4 shrink-0 text-green-500" /> {manualSuccess}
                </div>
              )}

              <form onSubmit={handleAddManual} className="space-y-4">
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@kampus.ac.id"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  />
                </div>

                <button
                  type="submit"
                  disabled={manualLoading || !email}
                  className="w-full bg-indigo-600 text-white min-h-[44px] rounded-xl flex items-center justify-center font-medium hover:bg-indigo-700 transition-all disabled:opacity-70 shadow-md shadow-indigo-100"
                >
                  {manualLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Tambah Anggota'}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InviteModal;
