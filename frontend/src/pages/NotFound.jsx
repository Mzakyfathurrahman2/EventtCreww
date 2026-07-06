import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-center p-4">
      <AlertCircle className="w-20 h-20 text-indigo-500 mb-6 animate-pulse" />
      <h1 className="text-4xl font-bold text-slate-900 mb-2">404 - Halaman Tidak Ditemukan</h1>
      <p className="text-slate-500 mb-8 max-w-md">
        Maaf, halaman yang Anda cari tidak ada atau telah dipindahkan.
      </p>
      <button 
        onClick={() => navigate(-1)} 
        className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 shadow-lg shadow-indigo-150 transition cursor-pointer"
      >
        Kembali ke Halaman Sebelumnya
      </button>
    </div>
  );
};

export default NotFound;
