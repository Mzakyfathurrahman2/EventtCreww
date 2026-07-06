import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { authApi } from '../api/authApi';
import { Loader2, ArrowLeft } from 'lucide-react';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState({ type: '', message: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ type: '', message: '' });
    setLoading(true);

    try {
      const response = await authApi.forgotPassword({ email });
      setStatus({ type: 'success', message: response.data.message });
      setEmail('');
    } catch (err) {
      setStatus({ type: 'error', message: err.response?.data?.message || 'Terjadi kesalahan.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 max-w-md w-full">
        <div className="mb-6">
          <Link to="/login" className="inline-flex items-center text-sm text-slate-500 hover:text-indigo-600 transition-colors">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Kembali ke Login
          </Link>
        </div>
        
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Lupa Password?</h2>
        <p className="text-slate-500 mb-6 text-sm">
          Masukkan email yang terdaftar. Kami akan mengirimkan tautan untuk mengatur ulang password Anda.
        </p>

        {status.message && (
          <div className={`mb-6 p-4 rounded-md text-sm ${status.type === 'success' ? 'bg-green-50 border-l-4 border-green-500 text-green-700' : 'bg-red-50 border-l-4 border-red-500 text-red-700'}`}>
            {status.message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              placeholder="email@kampus.ac.id"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full min-h-[44px] bg-indigo-600 text-white font-medium py-3 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors disabled:opacity-70 flex justify-center items-center mt-2"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Kirim Link Reset'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ForgotPassword;
