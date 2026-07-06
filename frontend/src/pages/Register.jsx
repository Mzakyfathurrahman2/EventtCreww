import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../api/authApi';
import { AuthContext } from '../context/AuthContext';
import { Zap, Loader2, Eye, EyeOff } from 'lucide-react';

const Register = () => {
  const [formData, setFormData] = useState({
    nama_lengkap: '',
    email: '',
    password: '',
    nama_organisasi: '',
    kampus: '',
    vendor_type: '',
    vendor_subtype: '',
  });
  const [userType, setUserType] = useState('PANITIA'); // 'PANITIA' | 'KLIEN' | 'VENDOR'
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const getOrgLabel = () => {
    if (userType === 'KLIEN') return 'Nama Perusahaan / Organisasi Klien';
    if (userType === 'VENDOR') return 'Nama Perusahaan / Vendor';
    return 'Nama Organisasi / BEM / UKM';
  };

  const getOrgPlaceholder = () => {
    if (userType === 'KLIEN') return 'PT Mulia Jaya / Personal';
    if (userType === 'VENDOR') return 'Catering Berkah / Sound System Utama';
    return 'BEM Fakultas Fasilkom';
  };

  const getCampusLabel = () => {
    if (userType === 'KLIEN') return 'Lokasi / Alamat Klien';
    if (userType === 'VENDOR') return 'Kota Operasional / Alamat Vendor';
    return 'Asal Kampus / Organisasi';
  };

  const getCampusPlaceholder = () => {
    if (userType === 'KLIEN') return 'Sleman, Yogyakarta';
    if (userType === 'VENDOR') return 'Yogyakarta';
    return 'Universitas Digital';
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const payload = {
        ...formData,
        user_type: userType
      };
      if (userType !== 'VENDOR') {
        delete payload.vendor_type;
        delete payload.vendor_subtype;
      } else {
        if (!payload.vendor_type) {
          setError('Tipe vendor harus dipilih');
          setLoading(false);
          return;
        }
        if (!payload.vendor_subtype) {
          setError('Sub-tipe vendor harus dipilih');
          setLoading(false);
          return;
        }
      }

      const response = await authApi.register(payload);
      login(response.data.token, response.data.data);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Terjadi kesalahan saat pendaftaran.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50">
      {/* Left side - Branding */}
      <div className="md:w-1/2 bg-[#1E1B4B] text-white p-12 flex flex-col justify-center hidden md:flex">
        <div className="mb-8 flex items-center gap-3">
          <div className="bg-indigo-500 p-2 rounded-xl">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">EventCrew</h1>
            <p className="text-sm text-indigo-300">Smart Committee Management</p>
          </div>
        </div>
        <h2 className="text-4xl lg:text-5xl font-bold leading-tight mb-6">
          Bangun tim hebat untuk <span className="text-indigo-400">event pertamamu.</span>
        </h2>
      </div>

      {/* Right side - Form */}
      <div className="md:w-1/2 flex items-center justify-center p-6 md:p-12 overflow-y-auto">
        <div className="w-full max-w-md py-8">
          {/* Mobile Header Logo */}
          <div className="md:hidden mb-8 flex items-center justify-center gap-3">
            <div className="bg-indigo-600 p-2 rounded-xl">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">EventCrew</h1>
          </div>

           <h2 className="text-3xl font-bold text-slate-900 mb-2">Buat Akun Baru</h2>
          <p className="text-slate-500 mb-6">Mulai mengelola panitia event dengan mudah.</p>

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

          <form onSubmit={handleRegister} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nama Lengkap</label>
              <input
                type="text"
                name="nama_lengkap"
                required
                value={formData.nama_lengkap}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                placeholder="Budi Santoso"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <input
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                placeholder="budi@kampus.ac.id"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full px-4 py-3 pr-11 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  placeholder="Min. 8 karakter (huruf & angka)"
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
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{getOrgLabel()}</label>
              <input
                type="text"
                name="nama_organisasi"
                required
                value={formData.nama_organisasi}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                placeholder={getOrgPlaceholder()}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{getCampusLabel()}</label>
              <input
                type="text"
                name="kampus"
                required
                value={formData.kampus}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                placeholder={getCampusPlaceholder()}
              />
            </div>

            {userType === 'VENDOR' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Tipe Vendor</label>
                  <select
                    name="vendor_type"
                    required
                    value={formData.vendor_type || ''}
                    onChange={(e) => {
                      setFormData({
                        ...formData,
                        vendor_type: e.target.value,
                        vendor_subtype: '' // reset subtype
                      });
                    }}
                    className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all bg-white text-slate-700"
                  >
                    <option value="">-- Pilih Tipe Vendor --</option>
                    <option value="BARANG">Vendor Barang</option>
                    <option value="JASA">Vendor Jasa</option>
                  </select>
                </div>

                {formData.vendor_type && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Kolaborasi Divisi</label>
                    <select
                      name="vendor_subtype"
                      required
                      value={formData.vendor_subtype || ''}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all bg-white text-slate-700"
                    >
                      <option value="">-- Pilih Divisi Kolaborasi --</option>
                      {formData.vendor_type === 'BARANG' ? (
                        <>
                          <option value="KONSUMSI">Konsumsi</option>
                          <option value="PERLENGKAPAN">Perlengkapan</option>
                          <option value="PUBDOK">Pubdok</option>
                        </>
                      ) : (
                        <>
                          <option value="PERLENGKAPAN">Perlengkapan</option>
                          <option value="PUBDOK">Pubdok</option>
                          <option value="ACARA">Acara</option>
                          <option value="HUMAS">Humas</option>
                        </>
                      )}
                    </select>
                  </div>
                )}
              </>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full min-h-[44px] mt-4 bg-indigo-600 text-white font-medium py-3 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors disabled:opacity-70 flex justify-center items-center"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Daftar Sekarang'}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-slate-600">
            Sudah punya akun?{' '}
            <Link to="/login" className="text-indigo-600 font-medium hover:text-indigo-800">
              Masuk
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
