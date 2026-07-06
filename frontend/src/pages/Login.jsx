import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../api/authApi';
import { AuthContext } from '../context/AuthContext';
import { Zap, Loader2, Eye, EyeOff } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [userType, setUserType] = useState('PANITIA'); // 'PANITIA' | 'KLIEN' | 'VENDOR'
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authApi.login({ email, password, user_type: userType });
      login(response.data.token, response.data.data);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Terjadi kesalahan saat login.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50">
      {/* Left side - Branding */}
      <div className="md:w-1/2 bg-[#1E1B4B] text-white p-12 flex flex-col justify-center">
        <div className="mb-8 flex items-center gap-3">
          <div className="bg-indigo-500 p-2 rounded-xl">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">EventCrew</h1>
            <p className="text-sm text-indigo-300">Smart Committee Management</p>
          </div>
        </div>
        <h2 className="text-4xl md:text-5xl font-bold leading-tight mb-6">
          Kelola panitia event kampus <span className="text-indigo-400">lebih terstruktur.</span>
        </h2>
        <p className="text-indigo-200 text-lg max-w-md">
          Dari task management, koordinasi divisi, absensi QR, hingga laporan otomatis — semua dalam satu platform.
        </p>
      </div>

      {/* Right side - Form */}
      <div className="md:w-1/2 flex items-center justify-center p-8 md:p-12">
        <div className="w-full max-w-md">
          <h2 className="text-3xl font-bold text-slate-900 mb-2">Selamat datang kembali</h2>
          <p className="text-slate-500 mb-6">Masuk ke workspace event kamu</p>

          <div className="grid grid-cols-3 gap-2 mb-6 bg-slate-100 p-1.5 rounded-xl border border-slate-200/50">
            <button
              type="button"
              onClick={() => setUserType('PANITIA')}
              className={`py-2 px-3 text-xs font-bold rounded-lg transition-all ${
                userType === 'PANITIA'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Panitia
            </button>
            <button
              type="button"
              onClick={() => setUserType('KLIEN')}
              className={`py-2 px-3 text-xs font-bold rounded-lg transition-all ${
                userType === 'KLIEN'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Klien
            </button>
            <button
              type="button"
              onClick={() => setUserType('VENDOR')}
              className={`py-2 px-3 text-xs font-bold rounded-lg transition-all ${
                userType === 'VENDOR'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Vendor
            </button>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-md text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                placeholder={userType === 'PANITIA' ? 'email@kampus.ac.id' : 'email@perusahaan.com'}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 pr-11 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
            
            <div className="flex justify-start">
              <Link to="/forgot-password" className="text-sm text-indigo-600 hover:text-indigo-800 font-medium">
                Lupa password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full min-h-[44px] bg-indigo-600 text-white font-medium py-3 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors disabled:opacity-70 flex justify-center items-center"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Masuk'}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-slate-600">
            Belum punya akun?{' '}
            <Link to="/register" className="text-indigo-600 font-medium hover:text-indigo-800">
              Daftar sekarang
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
