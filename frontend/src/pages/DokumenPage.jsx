import React, { useState, useEffect, useContext } from 'react';
import apiClient from '../api/authApi';
import { useParams } from 'react-router-dom';
import { Download, Trash2, Upload, FileText, Lock, Users, ArrowLeft, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { AuthContext } from '../context/AuthContext';

const DokumenPage = () => {
  const { eventId } = useParams();
  const { user } = useContext(AuthContext);
  const userType = user?.user_type || 'PANITIA';

  const getDefaultTab = () => {
    if (userType === 'KLIEN') return 'KLIEN';
    if (userType === 'VENDOR') return 'VENDOR';
    return 'UMUM';
  };

  const [documents, setDocuments] = useState([]);
  const [activeTab, setActiveTab] = useState(getDefaultTab());
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Peran dan Data Tambahan
  const [userRole, setUserRole] = useState('ANGGOTA');
  const [divisiList, setDivisiList] = useState([]);
  const [selectedDivisiId, setSelectedDivisiId] = useState('');

  // Mengambil dokumen event dengan filter tab
  const fetchDocuments = async () => {
    try {
      const res = await apiClient.get(`/events/${eventId}/documents`);
      setDocuments(res.data.data || []);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Gagal memuat dokumen');
    }
  };

  const fetchEventMeta = async () => {
    try {
      const res = await apiClient.get(`/events/${eventId}`);
      setUserRole(res.data.userKeanggotaan?.role_event || 'ANGGOTA');
      setDivisiList(res.data.data?.divisi || []);
    } catch (err) {
      console.error('Gagal memuat metadata event', err);
    }
  };

  useEffect(() => {
    fetchEventMeta();
    fetchDocuments();
    // eslint-disable-next-line
  }, [eventId]);

  // Mengupdate timestamp terakhir kali membaca dokumen
  useEffect(() => {
    const storedUser = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) : null;
    if (storedUser && eventId) {
      localStorage.setItem(`last_read_dokumen_${eventId}_${storedUser.user_id}`, new Date().toISOString());
    }
  }, [eventId, documents]);

  useEffect(() => {
    if (userType === 'KLIEN') {
      setActiveTab('KLIEN');
    } else if (userType === 'VENDOR') {
      setActiveTab('VENDOR');
    } else {
      setActiveTab('UMUM');
    }
  }, [userType]);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Pilih file terlebih dahulu');
      return;
    }
    
    // Cek ukuran max 10MB
    if (file.size > 10 * 1024 * 1024) {
      setError('Ukuran file maksimal 10MB');
      return;
    }

    // Jika tab divisi dan user adalah pengurus inti, wajib pilih divisi
    const isLeadership = ['KETUA', 'SEKRETARIS', 'BENDAHARA'].includes(userRole);
    if (activeTab === 'DIVISI' && isLeadership && !selectedDivisiId) {
      setError('Pilih divisi penanggung jawab dokumen ini');
      return;
    }

    setLoading(true);
    setError('');
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('kategori', activeTab);
    if (activeTab === 'DIVISI' && selectedDivisiId) {
      formData.append('divisi_id', selectedDivisiId);
    }
    
    try {
      await apiClient.post(`/events/${eventId}/documents`, formData, {
        headers: { 
          'Content-Type': 'multipart/form-data'
        }
      });
      setFile(null);
      setSelectedDivisiId('');
      toast.success('Dokumen berhasil diunggah!');
      fetchDocuments();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Gagal upload file');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (docId, fileName) => {
    try {
      const res = await apiClient.get(`/documents/${docId}/download`, {
        responseType: 'blob' // Penting untuk file binary
      });
      
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (err) {
      console.error('Gagal download', err);
      alert('Anda tidak berhak mengunduh dokumen ini');
    }
  };

  const handleDelete = async (docId) => {
    if (!window.confirm('Yakin ingin menghapus dokumen ini (Soft Delete)?')) return;
    
    try {
      await apiClient.delete(`/documents/${docId}`);
      toast.success('Dokumen berhasil dihapus!');
      fetchDocuments();
    } catch (err) {
      console.error('Gagal hapus', err);
      alert(err.response?.data?.message || 'Gagal menghapus dokumen');
    }
  };

  const filteredDocs = documents.filter(doc => doc.kategori === activeTab);
  const isLeadership = ['KETUA', 'SEKRETARIS', 'BENDAHARA'].includes(userRole);
  const canUploadCurrentTab = 
    (activeTab === 'UMUM' && userType === 'PANITIA') || 
    (activeTab === 'KEUANGAN' && isLeadership && userType === 'PANITIA') || 
    (activeTab === 'DIVISI' && (isLeadership || userRole === 'KOORDINATOR') && userType === 'PANITIA') ||
    (activeTab === 'KLIEN' && (isLeadership || userType === 'KLIEN')) ||
    (activeTab === 'VENDOR' && (isLeadership || userType === 'VENDOR'));

  return (
    <div className="max-w-6xl mx-auto mt-8 p-6 bg-white shadow-xl rounded-2xl border border-gray-100">
      <button 
        onClick={() => window.history.back()}
        className="flex items-center text-sm font-medium text-slate-500 hover:text-indigo-600 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4 mr-1" />
        Kembali ke Dashboard Event
      </button>

      <div className="flex justify-between items-center mb-8 border-b pb-4">
        <h2 className="text-3xl font-bold text-gray-800 tracking-tight">
          {userType === 'KLIEN' ? 'Dokumen Klien' : userType === 'VENDOR' ? 'Dokumen Vendor' : 'Manajemen Dokumen'}
        </h2>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-r shadow-sm flex items-center gap-2 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
          {error}
        </div>
      )}

      {/* Tabs Kategori (UMUM, KEUANGAN, DIVISI, KLIEN, VENDOR) */}
      {userType === 'PANITIA' && (
        <div className="flex flex-wrap space-x-1 mb-8 bg-gray-100 p-1 rounded-xl">
          <button
            className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'UMUM' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200'
            }`}
            onClick={() => { setActiveTab('UMUM'); setError(''); }}
          >
            <Users size={18} /> Dokumen Umum
          </button>
          {isLeadership && (
            <>
              <button
                className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer ${
                  activeTab === 'KEUANGAN' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200'
                }`}
                onClick={() => { setActiveTab('KEUANGAN'); setError(''); }}
              >
                <Lock size={18} /> Keuangan (RAHASIA)
              </button>
              <button
                className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer ${
                  activeTab === 'KLIEN' ? 'bg-white text-teal-600 shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200'
                }`}
                onClick={() => { setActiveTab('KLIEN'); setError(''); }}
              >
                <Users size={18} /> Dokumen Klien
              </button>
              <button
                className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer ${
                  activeTab === 'VENDOR' ? 'bg-white text-amber-600 shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200'
                }`}
                onClick={() => { setActiveTab('VENDOR'); setError(''); }}
              >
                <Users size={18} /> Dokumen Vendor
              </button>
            </>
          )}
          <button
            className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'DIVISI' ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200'
            }`}
            onClick={() => { setActiveTab('DIVISI'); setError(''); }}
          >
            <FileText size={18} /> Dokumen Divisi
          </button>
        </div>
      )}

      {/* Upload Area (Tergantung hak akses saat ini) */}
      {canUploadCurrentTab ? (
        <div className="mb-10 bg-indigo-50 border border-indigo-100 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-indigo-900 mb-4 flex items-center gap-2">
            <Upload size={20} className="text-indigo-600"/>
            Upload Dokumen ke Kategori {activeTab}
          </h3>
          <form onSubmit={handleUpload} className="flex flex-col sm:flex-row items-center gap-4">
            <input
              type="file"
              onChange={(e) => setFile(e.target.files[0])}
              className="w-full sm:flex-1 block text-sm text-gray-500
                file:mr-4 file:py-3 file:px-6
                file:rounded-full file:border-0
                file:text-sm file:font-semibold
                file:bg-indigo-600 file:text-white
                hover:file:bg-indigo-700 transition-all
                file:cursor-pointer bg-white border border-gray-300 rounded-full"
              accept=".pdf,.docx,.xlsx,.jpg,.png"
            />
            {activeTab === 'DIVISI' && isLeadership && (
              <select
                value={selectedDivisiId}
                onChange={(e) => setSelectedDivisiId(e.target.value)}
                required
                className="w-full sm:w-auto border border-gray-300 rounded-full px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700 bg-white"
              >
                <option value="">-- Pilih Divisi --</option>
                {divisiList.map(d => (
                  <option key={d.divisi_id} value={d.divisi_id}>{d.nama_divisi}</option>
                ))}
              </select>
            )}
            <button
              type="submit"
              disabled={!file || loading}
              className="w-full sm:w-auto px-8 py-3 bg-indigo-600 text-white rounded-full font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors shadow-md cursor-pointer"
            >
              {loading ? 'Uploading...' : 'Upload File'}
            </button>
          </form>
          <p className="text-xs text-indigo-400 mt-3 ml-2">Maksimal 10MB. Format: PDF, DOCX, XLSX, JPG, PNG.</p>
        </div>
      ) : (
        <div className="mb-10 bg-slate-50 border border-slate-200 rounded-xl p-6 text-center text-slate-500 text-sm">
          💡 Hanya Pengurus Inti & Koordinator Divisi yang memiliki akses untuk mengunggah file di kategori ini.
        </div>
      )}

      {/* List Dokumen */}
      <div>
        <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          <FileText className="text-gray-400" />
          Daftar File ({filteredDocs.length})
        </h3>
        {filteredDocs.length === 0 ? (
          <div className="text-center py-16 bg-gray-50 rounded-xl border border-dashed border-gray-300">
            <FileText className="mx-auto h-12 w-12 text-gray-300 mb-3" />
            <p className="text-gray-500 font-medium">Belum ada dokumen di kategori ini.</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {filteredDocs.map(doc => {
              const canDelete = isLeadership || user?.user_id === doc.diupload_oleh;
              return (
                <div key={doc.dokumen_id} className="group bg-white p-5 rounded-xl border border-gray-200 hover:border-indigo-300 hover:shadow-lg transition-all duration-300 flex justify-between items-center">
                  <div className="flex-1 min-w-0 pr-4">
                    <p className="text-sm font-bold text-gray-900 truncate mb-1" title={doc.nama_file}>
                      {doc.nama_file}
                    </p>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 items-center">
                      <span className="bg-gray-100 px-2 py-0.5 rounded text-gray-600">{(doc.ukuran_byte / 1024 / 1024).toFixed(2)} MB</span>
                      <span>Oleh: {doc.uploader?.nama_lengkap}</span>
                      <span>{new Date(doc.diupload_pada).toLocaleDateString('id-ID', { timeZone: 'Asia/Jakarta' })}</span>
                      {doc.divisi?.nama_divisi && (
                        <span className="bg-purple-50 border border-purple-100 text-purple-700 px-2 py-0.5 rounded font-semibold text-[9px]">
                          Divisi: {doc.divisi.nama_divisi}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex space-x-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleDownload(doc.dokumen_id, doc.nama_file)}
                      className="p-2.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors cursor-pointer"
                      title="Download"
                    >
                      <Download size={18} />
                    </button>
                    {canDelete && (
                      <button
                        onClick={() => handleDelete(doc.dokumen_id)}
                        className="p-2.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors cursor-pointer"
                        title="Hapus"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default DokumenPage;
