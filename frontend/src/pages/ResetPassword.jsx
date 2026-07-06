import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { authApi } from '../api/authApi';
import { Loader2 } from 'lucide-react';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  
  const [newPassword, setNewPassword] = useState('');
  const [status, setStatus] = useState({ type: '', message: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ type: '', message: '' });
    setLoading(true);

    try {
      const response = await authApi.resetPassword({ token, newPassword });
      setStatus({ type: 'success', message: response.data.message });
      setNewPassword('');
    } catch (err) {
      setStatus({ type: 'error', message: err.response?.data?.message || 'Terjadi kesalahan.' });
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 max-w-md w-full text-center">
          <h2 className="text-xl font-bold text-slate-900 mb-2">Token Tidak Valid</h2>
          <p className="text-slate-500 mb-6 text-sm">Tautan reset password tidak valid atau tidak ditemukan.</p>
          <Link to="/login" className="text-indigo-600 hover:text-indigo-800 font-medium">Kembali ke Login</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 max-w-md w-full">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Buat Password Baru</h2>
        <p className="text-slate-500 mb-6 text-sm">
          Silakan masukkan password baru Anda.
        </p>

        {status.message && (
          <div className={`mb-6 p-4 rounded-md text-sm ${status.type === 'success' ? 'bg-green-50 border-l-4 border-green-500 text-green-700' : 'bg-red-50 border-l-4 border-red-500 text-red-700'}`}>
            {status.message}
          </div>
        )}

        {status.type !== 'success' ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Password Baru</label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                placeholder="Min. 8 karakter (huruf & angka)"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full min-h-[44px] bg-indigo-600 text-white font-medium py-3 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors disabled:opacity-70 flex justify-center items-center mt-2"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Simpan Password Baru'}
            </button>
          </form>
        ) : (
          <div className="mt-4">
            <Link to="/login" className="w-full min-h-[44px] flex justify-center items-center bg-indigo-600 text-white font-medium py-3 rounded-lg hover:bg-indigo-700 transition-colors">
              Menuju Halaman Login
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;
