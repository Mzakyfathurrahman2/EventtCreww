import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { eventApi } from '../api/eventApi';
import apiClient from '../api/authApi';
import { AuthContext } from '../context/AuthContext';
import { Loader2, ArrowLeft, Plus, Play, CheckCircle, AlertTriangle, Users, Settings, Megaphone, FileText, BarChart3, Menu, X, ClipboardCheck, LogOut, UserPlus, MessageSquare, Check, Handshake, Eye, EyeOff } from 'lucide-react';
import InviteModal from '../components/InviteModal';
import NotificationBell from '../components/NotificationBell';
import DashboardEvent from './DashboardEvent';
import toast from 'react-hot-toast';

const getDivisionBadgeColor = (name) => {
  if (!name) return 'bg-slate-50 text-slate-600 border border-slate-200';
  
  const lowerName = name.toLowerCase().trim();
  if (lowerName === 'acara') {
    return 'bg-yellow-50 text-yellow-700 border-yellow-200';
  }
  if (lowerName === 'perlengkapan') {
    return 'bg-orange-50 text-orange-700 border-orange-200';
  }
  if (lowerName === 'pubdok') {
    return 'bg-sky-50 text-sky-700 border-sky-200';
  }
  if (lowerName === 'konsumsi') {
    return 'bg-green-50 text-green-700 border-green-200';
  }
  if (lowerName === 'humas') {
    return 'bg-slate-100 text-slate-700 border-slate-200';
  }

  const colors = [
    'bg-indigo-50 text-indigo-700 border-indigo-200',
    'bg-emerald-50 text-emerald-700 border-emerald-200',
    'bg-sky-50 text-sky-700 border-sky-200',
    'bg-violet-50 text-violet-700 border-violet-200',
    'bg-amber-50 text-amber-700 border-amber-200',
    'bg-teal-50 text-teal-700 border-teal-200',
    'bg-rose-50 text-rose-700 border-rose-200',
    'bg-pink-50 text-pink-700 border-pink-200',
    'bg-orange-50 text-orange-700 border-orange-200',
    'bg-lime-50 text-lime-700 border-lime-200',
  ];
  // Simple hash to get consistent index
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % colors.length;
  return colors[index];
};

// ── User Settings Modal ──────────────────────────────────────────────────────
const UserSettingsModal = ({ isOpen, onClose, user, onSave }) => {
  const [formData, setFormData] = useState({
    nama_lengkap: user?.nama_lengkap || '',
    email: user?.email || '',
    password: '',
    nama_organisasi: user?.organisasi?.nama_organisasi || '',
    kampus: user?.organisasi?.kampus || '',
    vendor_type: user?.vendor_type || '',
    vendor_subtype: user?.vendor_subtype || '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        nama_lengkap: user.nama_lengkap || '',
        email: user.email || '',
        password: '',
        nama_organisasi: user.organisasi?.nama_organisasi || '',
        kampus: user.organisasi?.kampus || '',
        vendor_type: user.vendor_type || '',
        vendor_subtype: user.vendor_subtype || '',
      });
    }
  }, [user, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Prepare update payload
    const payload = {
      nama_lengkap: formData.nama_lengkap,
      email: formData.email,
      nama_organisasi: formData.nama_organisasi,
      kampus: formData.kampus,
    };
    if (formData.password.trim()) {
      payload.password = formData.password;
    }
    if (user?.user_type === 'VENDOR') {
      payload.vendor_type = formData.vendor_type;
      payload.vendor_subtype = formData.vendor_subtype;
    }

    try {
      const res = await apiClient.put('/auth/profile', payload);
      onSave(res.data.data);
      onClose();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Gagal memperbarui profil');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-xl font-bold text-slate-900 mb-2">Pengaturan Akun</h3>
        <p className="text-slate-500 text-sm mb-6">Perbaiki data profil akun Anda di bawah ini.</p>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm border-l-4 border-red-500">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Lengkap</label>
            <input
              type="text"
              required
              value={formData.nama_lengkap}
              onChange={(e) => setFormData({ ...formData, nama_lengkap: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Password Baru (Opsional)</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Kosongkan jika tidak ingin mengubah"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-3 py-2 pr-10 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 text-sm"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Organisasi / Perusahaan</label>
            <input
              type="text"
              required
              value={formData.nama_organisasi}
              onChange={(e) => setFormData({ ...formData, nama_organisasi: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Asal Organisasi / Universitas / Lokasi</label>
            <input
              type="text"
              required
              value={formData.kampus}
              onChange={(e) => setFormData({ ...formData, kampus: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 text-sm"
            />
          </div>

          {user?.user_type === 'VENDOR' && (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Tipe Vendor</label>
                <select
                  required
                  value={formData.vendor_type}
                  onChange={(e) => setFormData({ ...formData, vendor_type: e.target.value, vendor_subtype: '' })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-slate-800 text-sm"
                >
                  <option value="">-- Pilih Tipe --</option>
                  <option value="BARANG">Vendor Barang</option>
                  <option value="JASA">Vendor Jasa</option>
                </select>
              </div>

              {formData.vendor_type && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Kolaborasi Divisi</label>
                  <select
                    required
                    value={formData.vendor_subtype}
                    onChange={(e) => setFormData({ ...formData, vendor_subtype: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-slate-800 text-sm"
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

          <div className="flex gap-3 justify-end pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 text-sm"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm flex items-center gap-2"
            >
              Simpan Perubahan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const EventDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showCreateDivisi, setShowCreateDivisi] = useState(false);
  const [namaDivisi, setNamaDivisi] = useState('');
  const { user, setUser } = useContext(AuthContext);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const handleSaveProfile = (updatedUserData) => {
    setUser(updatedUserData);
    localStorage.setItem('user', JSON.stringify(updatedUserData));
    toast.success('Profil berhasil diperbarui');
  };

  const [unreadStatus, setUnreadStatus] = useState({
    chat: false,
    pengumuman: false,
    dokumen: false
  });

  // States for members management
  const [members, setMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [pendingMembers, setPendingMembers] = useState([]);

  const fetchPendingMembers = async () => {
    try {
      const res = await eventApi.getPendingMembers(id);
      setPendingMembers(res.data.data || []);
    } catch (err) {
      console.error("Gagal mengambil anggota pending", err);
    }
  };

  const handleApprovePending = async (memberId) => {
    try {
      await eventApi.approveMember(memberId);
      await fetchMembers();
      await fetchPendingMembers();
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal menyetujui anggota');
    }
  };

  const handleRejectPending = async (memberId) => {
    if (!window.confirm("Yakin ingin menolak permintaan ini?")) return;
    try {
      await eventApi.rejectMember(memberId);
      await fetchPendingMembers();
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal menolak anggota');
    }
  };

  const fetchMembers = async () => {
    try {
      setLoadingMembers(true);
      const res = await eventApi.getMembers(id);
      const rawMembers = res.data.data || [];
      const rolePriority = {
        'KETUA': 1,
        'SEKRETARIS': 2,
        'BENDAHARA': 3,
        'KOORDINATOR': 4,
        'ANGGOTA': 5
      };
      const sorted = [...rawMembers].sort((a, b) => {
        const priorityA = rolePriority[a.role_event] || 99;
        const priorityB = rolePriority[b.role_event] || 99;
        if (priorityA !== priorityB) {
          return priorityA - priorityB;
        }
        return (a.user?.nama_lengkap || '').localeCompare(b.user?.nama_lengkap || '');
      });
      setMembers(sorted);
    } catch (err) {
      console.error("Gagal mengambil anggota", err);
    } finally {
      setLoadingMembers(false);
    }
  };

  const handleUpdateMember = async (memberId, divisiId, roleEvent) => {
    try {
      await eventApi.assignDivisi(memberId, divisiId, roleEvent);
      await fetchEvent();
      await fetchMembers();
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal memperbarui anggota');
    }
  };

  const fetchEvent = async () => {
    try {
      const response = await eventApi.getEventDetail(id);
      const eventData = response.data.data;
      eventData.userKeanggotaan = response.data.userKeanggotaan;
      setEvent(eventData);
      checkUnreadStatus(eventData);
    } catch (error) {
      console.error("Gagal memuat detail", error);
      if (error.response?.status === 403 || error.response?.status === 404) {
        navigate('/');
      }
    } finally {
      setLoading(false);
    }
  };

  const checkUnreadStatus = async (currentEvent = event) => {
    if (!user || !id) return;
    
    // Gunakan tanggal bergabung anggota ke event ini sebagai fallback, jika belum pernah dibaca
    const fallbackTime = currentEvent
      ? new Date(currentEvent.userKeanggotaan?.bergabung_pada || currentEvent.dibuat_pada).getTime()
      : Date.now();

    try {
      // 1. Check Chat Rooms for new messages
      let hasNewChat = false;
      try {
        const chatRes = await apiClient.get(`/events/${id}/chat-rooms`);
        const rooms = chatRes.data.data || [];
        const latestChatTime = rooms.reduce((max, room) => {
          if (room.latestMessageTime) {
            const time = new Date(room.latestMessageTime).getTime();
            return time > max ? time : max;
          }
          return max;
        }, 0);

        if (latestChatTime > 0) {
          const lastReadChat = localStorage.getItem(`last_read_chat_${id}_${user.user_id}`);
          const compareTime = lastReadChat ? new Date(lastReadChat).getTime() : fallbackTime;
          if (latestChatTime > compareTime) {
            hasNewChat = true;
          }
        }
      } catch (err) {
        console.error("Gagal memeriksa unread chat", err);
      }

      // 2. Check Pengumuman for new announcements
      let hasNewPengumuman = false;
      try {
        const pengumumanRes = await apiClient.get(`/events/${id}/pengumuman`);
        const list = pengumumanRes.data.data || [];
        const latestPengumumanTime = list.reduce((max, p) => {
          const time = new Date(p.dibuat_pada).getTime();
          return time > max ? time : max;
        }, 0);

        if (latestPengumumanTime > 0) {
          const lastReadPengumuman = localStorage.getItem(`last_read_pengumuman_${id}_${user.user_id}`);
          const compareTime = lastReadPengumuman ? new Date(lastReadPengumuman).getTime() : fallbackTime;
          if (latestPengumumanTime > compareTime) {
            hasNewPengumuman = true;
          }
        }
      } catch (err) {
        console.error("Gagal memeriksa unread pengumuman", err);
      }

      // 3. Check Dokumen for new documents
      let hasNewDokumen = false;
      try {
        const docRes = await apiClient.get(`/events/${id}/documents`);
        const list = docRes.data.data || [];
        const latestDokumenTime = list.reduce((max, d) => {
          const time = new Date(d.diupload_pada).getTime();
          return time > max ? time : max;
        }, 0);

        if (latestDokumenTime > 0) {
          const lastReadDokumen = localStorage.getItem(`last_read_dokumen_${id}_${user.user_id}`);
          const compareTime = lastReadDokumen ? new Date(lastReadDokumen).getTime() : fallbackTime;
          if (latestDokumenTime > compareTime) {
            hasNewDokumen = true;
          }
        }
      } catch (err) {
        console.error("Gagal memeriksa unread dokumen", err);
      }

      setUnreadStatus({
        chat: hasNewChat,
        pengumuman: hasNewPengumuman,
        dokumen: hasNewDokumen
      });
    } catch (error) {
      console.error("Gagal memeriksa unread status", error);
    }
  };

  useEffect(() => {
    fetchEvent();
  }, [id]);

  useEffect(() => {
    if (user && id && event) {
      checkUnreadStatus(event);
      const interval = setInterval(() => checkUnreadStatus(event), 10000);
      return () => clearInterval(interval);
    }
  }, [id, user, event]);

  useEffect(() => {
    if (activeTab === 'members' || activeTab === 'partners') {
      fetchMembers();
      if (event && ['KETUA', 'SEKRETARIS', 'BENDAHARA'].includes(event.userKeanggotaan?.role_event)) {
        fetchPendingMembers();
      }
    }
  }, [activeTab, id, event]);

  const handleGenerateTemplate = async () => {
    if (!window.confirm("Gunakan Smart Template? Ini akan otomatis membuat divisi dan tugas.")) return;
    setGenerating(true);
    try {
      await eventApi.generateTemplate(id);
      await fetchEvent();
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal generate template');
    } finally {
      setGenerating(false);
    }
  };

  const handleCreateDivisi = async (e) => {
    e.preventDefault();
    if (!namaDivisi.trim()) return;
    try {
      await eventApi.createDivisi(id, { nama_divisi: namaDivisi });
      setShowCreateDivisi(false);
      setNamaDivisi('');
      fetchEvent();
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal buat divisi');
    }
  };

  const handleChangeStatus = async (newStatus, force = false) => {
    try {
      await eventApi.updateStatus(id, newStatus, force);
      await fetchEvent();
    } catch (err) {
      if (err.response?.data?.warning) {
        if (window.confirm(err.response.data.message)) {
          handleChangeStatus(newStatus, true);
        }
      } else {
        alert(err.response?.data?.message || 'Gagal ubah status');
      }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  if (!event) return null;

  const pendingPanitia = pendingMembers.filter(pm => pm.user?.user_type === 'PANITIA' || !pm.user?.user_type);
  const pendingPartners = pendingMembers.filter(pm => ['KLIEN', 'VENDOR'].includes(pm.user?.user_type));

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between bg-white p-4 border-b border-slate-200 sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/')} className="text-slate-500">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h2 className="font-bold text-lg text-slate-900 truncate max-w-[200px]">{event.nama_event}</h2>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setIsSettingsOpen(true)} className="text-slate-500 hover:text-indigo-600 transition-colors p-1" title="Pengaturan Akun">
            <Settings className="w-5 h-5" />
          </button>
          <NotificationBell />
          <button onClick={handleLogout} className="text-red-500 hover:text-red-600" title="Logout">
            <LogOut className="w-5 h-5" />
          </button>
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-slate-700 p-2">
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Sidebar Navigation */}
      <aside className={`
        fixed md:static inset-y-0 left-0 z-10 w-64 bg-white border-r border-slate-200 
        transform transition-transform duration-200 ease-in-out md:translate-x-0 flex flex-col p-4
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="hidden md:flex items-center text-sm font-medium text-slate-500 hover:text-indigo-600 mb-8 cursor-pointer" onClick={() => navigate('/')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Daftar Event
        </div>

        <div className="mb-6 px-2 hidden md:block">
          <h2 className="font-bold text-lg text-slate-900 line-clamp-2">{event.nama_event}</h2>
          <div className="flex flex-col gap-1 mt-2">
            <span className={`inline-block w-max px-2 py-1 text-[10px] font-bold rounded-full ${event.status_event === 'PERSIAPAN' ? 'bg-amber-100 text-amber-700' :
                event.status_event === 'AKTIF' ? 'bg-green-100 text-green-700' :
                  'bg-slate-100 text-slate-700'
              }`}>
              EVENT: {event.status_event}
            </span>
            {user?.user_type === 'PANITIA' && (
              <span className="inline-block w-max px-2 py-1 text-[10px] font-bold rounded-full bg-indigo-100 text-indigo-700">
                ROLE: {event.userKeanggotaan?.role_event || 'ANGGOTA'}
              </span>
            )}
          </div>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto">
          {[
            { id: 'overview', label: 'Overview', icon: Settings, isTab: true },
            ...((user?.user_type === 'KLIEN' || user?.user_type === 'VENDOR') ? [
              { id: 'partners', label: 'Klien & Vendor', icon: Handshake, isTab: true }
            ] : [
              ...(['KETUA', 'SEKRETARIS', 'BENDAHARA'].includes(event.userKeanggotaan?.role_event) ? [{ id: 'partners', label: 'Klien & Vendor', icon: Handshake, isTab: true }] : []),
              { id: 'divisi', label: 'Divisi & Tugas', icon: CheckCircle, isTab: true },
              ...(['KETUA', 'SEKRETARIS', 'BENDAHARA'].includes(event.userKeanggotaan?.role_event) ? [{ id: 'members', label: 'Anggota Tim', icon: Users, isTab: true }] : []),
              { id: 'absensi', label: 'Absensi', icon: ClipboardCheck, path: `/events/${id}/absensi` },
            ]),
            { id: 'chat', label: 'Chat Diskusi', icon: MessageSquare, path: `/events/${id}/chat` },
            ...((user?.user_type === 'KLIEN' || user?.user_type === 'VENDOR') ? [] : [
              { id: 'pengumuman', label: 'Pengumuman', icon: Megaphone, path: `/events/${id}/pengumuman` },
            ]),
            { id: 'dokumen', label: 'Dokumen', icon: FileText, path: `/events/${id}/documents` },
            ...((user?.user_type === 'KLIEN' || user?.user_type === 'VENDOR') ? [] : [
              ...(['KETUA', 'SEKRETARIS', 'BENDAHARA', 'KOORDINATOR', 'ANGGOTA'].includes(event.userKeanggotaan?.role_event) ? [{ id: 'laporan', label: 'Laporan & Evaluasi', icon: BarChart3, path: `/events/${id}/laporan` }] : []),
            ]),
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => {
                if (item.isTab) setActiveTab(item.id);
                else navigate(item.path);
                setIsMobileMenuOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-3 md:py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === item.id
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <item.icon className={`w-5 h-5 shrink-0 ${activeTab === item.id ? 'text-indigo-600' : 'text-slate-400'}`} />
                <span className="truncate">{item.label}</span>
              </div>
              {unreadStatus[item.id] && (
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse shrink-0 mr-1" />
              )}
            </button>
          ))}
        </nav>
      </aside>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-0 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-10 overflow-y-auto">
        {/* Header Actions */}
        <div className="flex flex-wrap justify-between items-center gap-4 mb-8 pb-4 border-b border-slate-200">
          <h1 className="text-2xl font-bold text-slate-900 capitalize">
            {activeTab.replace('-', ' ')}
          </h1>
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {['KETUA', 'SEKRETARIS', 'BENDAHARA'].includes(event.userKeanggotaan?.role_event) && event.status_event === 'PERSIAPAN' && (
              <button
                onClick={() => setShowInvite(true)}
                className="flex-1 md:flex-none bg-white border border-indigo-200 text-indigo-600 px-4 py-2 min-h-[44px] rounded-lg text-sm font-medium hover:bg-indigo-50 transition-colors flex items-center justify-center gap-2"
              >
                <UserPlus className="w-4 h-4" /> Tambahkan Anggota
              </button>
            )}
            {['KETUA', 'SEKRETARIS', 'BENDAHARA'].includes(event.userKeanggotaan?.role_event) && event.status_event === 'PERSIAPAN' && (
              <button
                onClick={() => handleChangeStatus('AKTIF')}
                className="flex-1 md:flex-none bg-indigo-600 text-white px-4 py-2 min-h-[44px] rounded-lg text-sm font-medium hover:bg-indigo-700 flex items-center justify-center gap-2"
              >
                <Play className="w-4 h-4" /> Mulai
              </button>
            )}
            {['KETUA', 'SEKRETARIS', 'BENDAHARA'].includes(event.userKeanggotaan?.role_event) && event.status_event === 'AKTIF' && (
              <>
                <button
                  onClick={() => handleChangeStatus('SELESAI')}
                  className="flex-1 md:flex-none bg-green-600 text-white px-4 py-2 min-h-[44px] rounded-lg text-sm font-medium hover:bg-green-700 flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" /> Selesai
                </button>
                <button
                  onClick={() => handleChangeStatus('PERSIAPAN')}
                  className="flex-1 md:flex-none bg-amber-600 text-white px-4 py-2 min-h-[44px] rounded-lg text-sm font-medium hover:bg-amber-700 flex items-center justify-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" /> Batalkan Mulai
                </button>
              </>
            )}
            {['KETUA', 'SEKRETARIS', 'BENDAHARA'].includes(event.userKeanggotaan?.role_event) && event.status_event === 'SELESAI' && (
              <button
                onClick={() => handleChangeStatus('AKTIF')}
                className="flex-1 md:flex-none bg-amber-600 text-white px-4 py-2 min-h-[44px] rounded-lg text-sm font-medium hover:bg-amber-700 flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" /> Batalkan Selesai
              </button>
            )}
            <button 
              onClick={() => setIsSettingsOpen(true)} 
              className="hidden md:flex items-center gap-1 text-slate-500 hover:bg-slate-100 hover:text-indigo-600 px-3 py-2 rounded-lg transition-colors font-medium text-sm cursor-pointer mr-2" 
              title="Pengaturan Akun"
            >
              <Settings className="w-4 h-4" /> Pengaturan Akun
            </button>
            <div className="hidden md:block">
              <NotificationBell />
            </div>
            <button onClick={handleLogout} className="hidden md:flex items-center gap-2 text-red-500 hover:bg-red-50 px-3 py-2 rounded-lg transition-colors font-medium text-sm ml-2" title="Logout">
              <LogOut className="w-4 h-4" /> Logout
            </button>
          </div>
        </div>

        {/* Tab Content: Overview */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {event.userKeanggotaan?.role_event === 'KETUA' && event.status_event === 'PERSIAPAN' && event.divisi.length === 0 && (
              <div className="bg-gradient-to-r from-indigo-50 to-blue-50 p-6 rounded-2xl border border-indigo-100 flex items-start gap-4">
                <div className="bg-indigo-600 p-2 rounded-xl shrink-0 mt-1">
                  <AlertTriangle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-indigo-900 mb-2">Smart Template Tersedia</h3>
                  <p className="text-indigo-800 text-sm mb-4">
                    Hemat waktu persiapan! Kami bisa otomatis membuat divisi standar dan daftar tugas wajib untuk event jenis <strong>{event.jenis_event}</strong>.
                  </p>
                  <button
                    onClick={handleGenerateTemplate}
                    disabled={generating}
                    className="bg-indigo-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors flex items-center gap-2 disabled:opacity-70"
                  >
                    {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                    Generate Divisi & Tugas
                  </button>
                </div>
              </div>
            )}
            
            <DashboardEvent />
          </div>
        )}

        {/* Tab Content: Divisi (Basic View for Leadership, Restricted Detail View for Coordinator & Member) */}
        {activeTab === 'divisi' && (() => {
          const isLeadership = ['KETUA', 'SEKRETARIS', 'BENDAHARA'].includes(event.userKeanggotaan?.role_event);
          
          if (isLeadership) {
            return (
              <div>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                  <h3 className="font-bold text-slate-900 text-lg">Divisi Terdaftar</h3>
                  <div className="flex flex-wrap gap-2">
                    {event.userKeanggotaan?.role_event === 'KETUA' && (
                      <button 
                        onClick={() => setShowCreateDivisi(true)}
                        className="bg-white border border-indigo-200 text-indigo-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-50 transition flex items-center gap-2"
                      >
                        <Plus className="w-4 h-4" /> Buat Divisi Manual
                      </button>
                    )}
                    <button 
                      onClick={() => navigate(`/events/${id}/tasks`)}
                      className="bg-indigo-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 transition flex items-center gap-2"
                    >
                      Manajemen Semua Tugas
                    </button>
                  </div>
                </div>
                
                {event.divisi.length === 0 ? (
                  <div className="text-center py-12 text-slate-500">
                    Belum ada divisi. Buat secara manual atau gunakan Smart Template di Overview.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {event.divisi.map(d => (
                      <div key={d.divisi_id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
                        <div>
                          <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold border ${getDivisionBadgeColor(d.nama_divisi)}`}>
                            {d.nama_divisi}
                          </span>
                          <div className="mt-4 flex gap-4 text-sm text-slate-500 mb-4">
                            <span>{d._count?.anggota || d._count?.keanggotaan || 0} Anggota</span>
                            <span>{d._count?.task || d._count?.tasks || 0} Tugas</span>
                          </div>
                        </div>
                        <button
                          onClick={() => navigate(`/events/${id}/chat`)}
                          className="w-full bg-indigo-50 text-indigo-700 py-2 rounded-lg text-sm font-medium hover:bg-indigo-100 transition-colors flex items-center justify-center gap-2 mt-auto border border-indigo-100"
                        >
                          Buka Chat Diskusi
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          }

          // Case: KOORDINATOR or ANGGOTA
          const myDivisiId = event.userKeanggotaan?.divisi_id;
          const myDivisi = event.divisi.find(d => d.divisi_id === myDivisiId);

          if (!myDivisiId || !myDivisi) {
            return (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-8 text-center max-w-lg mx-auto mt-8">
                <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-amber-900 mb-2">Belum Memiliki Divisi</h3>
                <p className="text-amber-800 text-sm">
                  Anda belum ditempatkan di divisi mana pun. Silakan hubungi Ketua, Sekretaris, atau Bendahara event untuk menugaskan Anda ke dalam divisi.
                </p>
              </div>
            );
          }

          return (
            <div className="space-y-6">
              {/* Header Divisi */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <span className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider border ${getDivisionBadgeColor(myDivisi.nama_divisi)}`}>
                    Divisi Anda
                  </span>
                  <h2 className="text-2xl font-bold text-slate-900 mt-2">{myDivisi.nama_divisi}</h2>
                  <p className="text-slate-500 text-sm mt-1">
                    Berikut adalah anggota tim dan daftar tugas untuk divisi Anda.
                  </p>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                  <button
                    onClick={() => navigate(`/events/${id}/chat`)}
                    className="flex-1 sm:flex-none bg-indigo-50 text-indigo-700 border border-indigo-100 px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-indigo-100 transition flex items-center justify-center gap-2"
                  >
                    <MessageSquare className="w-4 h-4" /> Buka Diskusi
                  </button>
                  <button
                    onClick={() => navigate(`/events/${id}/tasks`)}
                    className="flex-1 sm:flex-none bg-indigo-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition flex items-center justify-center gap-2"
                  >
                    Lihat Semua Tugas
                  </button>
                </div>
              </div>

              {/* Two Column Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Column 1: Anggota Divisi (5 cols) */}
                <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col">
                  <h3 className="font-bold text-slate-900 text-lg mb-4 flex items-center gap-2">
                    <Users className="w-5 h-5 text-indigo-500" />
                    Anggota Divisi ({myDivisi.keanggotaan?.length || 0})
                  </h3>
                  <div className="space-y-4 overflow-y-auto max-h-[400px] pr-2">
                    {/* Koordinator */}
                    {myDivisi.koordinator && (
                      <div className="flex items-center gap-3 p-3 bg-indigo-50/50 border border-indigo-100 rounded-xl">
                        <div className="bg-indigo-600 text-white font-bold w-10 h-10 rounded-full flex items-center justify-center shrink-0">
                          {myDivisi.koordinator.nama_lengkap.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-slate-900 text-sm truncate flex items-center gap-1.5">
                            {myDivisi.koordinator.nama_lengkap}
                            <span className="text-[9px] font-bold text-indigo-700 bg-indigo-100 border border-indigo-200 px-1.5 py-0.5 rounded-full uppercase">
                              Koordinator
                            </span>
                          </p>
                          <p className="text-slate-500 text-xs truncate">{myDivisi.koordinator.email}</p>
                        </div>
                      </div>
                    )}

                    {/* Members list */}
                    {myDivisi.keanggotaan
                      ?.filter(m => m.user?.user_id !== myDivisi.koordinator_id)
                      .map(m => (
                        <div key={m.keanggotaan_id} className="flex items-center gap-3 p-3 border border-slate-100 hover:border-slate-200 rounded-xl transition-all">
                          <div className="bg-slate-100 text-slate-700 font-semibold w-10 h-10 rounded-full flex items-center justify-center shrink-0">
                            {m.user?.nama_lengkap?.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-slate-900 text-sm truncate flex items-center gap-1.5">
                              {m.user?.nama_lengkap}
                              {m.user?.user_id === event.userKeanggotaan?.user_id && (
                                <span className="text-[9px] font-semibold text-indigo-600 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded">
                                  Anda
                                </span>
                              )}
                            </p>
                            <p className="text-slate-400 text-xs truncate">{m.user?.email}</p>
                          </div>
                        </div>
                      ))}

                    {(!myDivisi.koordinator && (!myDivisi.keanggotaan || myDivisi.keanggotaan.length === 0)) && (
                      <p className="text-sm text-slate-400 text-center py-8">Belum ada anggota di divisi ini.</p>
                    )}
                  </div>
                </div>

                {/* Column 2: Tugas Divisi (7 cols) */}
                <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col">
                  <h3 className="font-bold text-slate-900 text-lg mb-4 flex items-center gap-2">
                    <ClipboardCheck className="w-5 h-5 text-indigo-500" />
                    Daftar Tugas Divisi ({myDivisi.tasks?.length || 0})
                  </h3>
                  <div className="space-y-3 overflow-y-auto max-h-[400px] pr-2">
                    {myDivisi.tasks && myDivisi.tasks.length > 0 ? (
                      myDivisi.tasks.map(task => {
                        const isOverdue = task.status_tugas === 'TERLAMBAT';
                        return (
                          <div
                            key={task.task_id}
                            onClick={() => navigate(`/tasks/${task.task_id}`)}
                            className={`flex items-center justify-between p-3.5 border rounded-xl cursor-pointer hover:shadow-sm hover:border-indigo-200 transition-all ${
                              isOverdue ? 'bg-red-50/20 border-red-100' : 'bg-slate-50/30 border-slate-100'
                            }`}
                          >
                            <div className="min-w-0 flex-1">
                              <p className="font-bold text-slate-900 text-sm truncate hover:text-indigo-600 transition">
                                {task.judul_tugas}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  task.status_tugas === 'TODO' ? 'bg-slate-100 text-slate-600 border border-slate-200' :
                                  task.status_tugas === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700 border border-blue-200' :
                                  task.status_tugas === 'DONE' ? 'bg-green-100 text-green-700 border border-green-200' :
                                  'bg-red-100 text-red-700 border border-red-200'
                                }`}>
                                  {task.status_tugas.replace('_', ' ')}
                                </span>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  task.prioritas === 'HIGH' ? 'bg-red-100 text-red-700' :
                                  task.prioritas === 'MEDIUM' ? 'bg-yellow-100 text-yellow-700' :
                                  'bg-green-100 text-green-700'
                                }`}>
                                  {task.prioritas}
                                </span>
                              </div>
                            </div>
                            <div className="text-right shrink-0 ml-3 flex flex-col items-end">
                              <span className="text-[10px] font-medium text-slate-400">Deadline</span>
                              <span className={`text-xs font-bold ${isOverdue ? 'text-red-600' : 'text-slate-600'}`}>
                                {new Date(task.deadline).toLocaleDateString('id-ID', { timeZone: 'Asia/Jakarta', day: 'numeric', month: 'short' })}
                              </span>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-center py-12">
                        <CheckCircle className="w-10 h-10 text-slate-200 mx-auto mb-2" />
                        <p className="text-sm text-slate-400">Belum ada tugas untuk divisi ini.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Tab Content: Members */}
        {activeTab === 'members' && (
          <div>
            {/* Request Bergabung Section */}
            {['KETUA', 'SEKRETARIS', 'BENDAHARA'].includes(event.userKeanggotaan?.role_event) && pendingPanitia.length > 0 && (
              <div className="mb-8 bg-indigo-50/50 border border-indigo-100 rounded-2xl p-6">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h4 className="font-bold text-slate-900 text-base">Permintaan Bergabung ({pendingPanitia.length})</h4>
                    <p className="text-xs text-slate-500 mt-0.5">Calon panitia yang mendaftar via Kode Join atau Link Undangan.</p>
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100 overflow-hidden shadow-sm">
                  {pendingPanitia.map((pm) => (
                    <div key={pm.keanggotaan_id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="bg-indigo-100 text-indigo-700 font-bold w-9 h-9 rounded-full flex items-center justify-center shrink-0">
                          {pm.user?.nama_lengkap?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-sm">{pm.user?.nama_lengkap}</p>
                          <p className="text-slate-400 text-xs">{pm.user?.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleRejectPending(pm.keanggotaan_id)}
                          className="px-3 py-1.5 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors flex items-center gap-1"
                        >
                          <X className="w-3.5 h-3.5" /> Tolak
                        </button>
                        <button
                          onClick={() => handleApprovePending(pm.keanggotaan_id)}
                          className="px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors flex items-center gap-1"
                        >
                          <Check className="w-3.5 h-3.5" /> Setujui
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div>
                <h3 className="font-bold text-slate-900 text-lg">Anggota Terdaftar ({members.filter(m => m.user?.user_type === 'PANITIA' || !m.user?.user_type).length})</h3>
                <p className="text-sm text-slate-500 mt-1">Kelola tugas divisi dan peran panitia di event ini.</p>
              </div>
              <div className="flex gap-2">
                {['KETUA', 'SEKRETARIS', 'BENDAHARA'].includes(event.userKeanggotaan?.role_event) && event.status_event === 'PERSIAPAN' && (
                  <button onClick={() => setShowInvite(true)} className="text-sm text-white font-medium bg-indigo-600 px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center gap-2 transition-colors">
                    <UserPlus className="w-4 h-4" /> Tambah Anggota
                  </button>
                )}
                {['KETUA', 'SEKRETARIS', 'BENDAHARA'].includes(event.userKeanggotaan?.role_event) && (
                  <button onClick={() => navigate(`/events/${id}/pending-members`)} className="text-sm text-indigo-600 font-medium bg-indigo-50 px-4 py-2 rounded-lg hover:bg-indigo-100 transition-colors">
                    Lihat Request
                  </button>
                )}
              </div>
            </div>

            {loadingMembers ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
              </div>
            ) : members.filter(m => m.user?.user_type === 'PANITIA' || !m.user?.user_type).length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 text-slate-500">
                Belum ada anggota terdaftar.
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm animate-fadeIn">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 text-xs font-bold uppercase tracking-wider">
                        <th className="px-6 py-4">Nama & Email</th>
                        <th className="px-6 py-4">Divisi</th>
                        <th className="px-6 py-4">Peran (Role)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm text-slate-600">
                      {members.filter(m => m.user?.user_type === 'PANITIA' || !m.user?.user_type).map((m) => {
                        const isKetua = m.role_event === 'KETUA';
                        const isCurrentUser = m.user_id === event.userKeanggotaan?.user_id;
                        const isCurrentUserKetua = event.userKeanggotaan?.role_event === 'KETUA';
                        
                        const hasSekretaris = members.some(member => member.role_event === 'SEKRETARIS' && member.keanggotaan_id !== m.keanggotaan_id);
                        const hasBendahara = members.some(member => member.role_event === 'BENDAHARA' && member.keanggotaan_id !== m.keanggotaan_id);
                        const hasKoordinatorForThisDivisi = m.divisi_id
                          ? members.some(member => member.divisi_id === m.divisi_id && member.role_event === 'KOORDINATOR' && member.keanggotaan_id !== m.keanggotaan_id)
                          : false;

                        return (
                          <tr key={m.keanggotaan_id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="bg-indigo-100 text-indigo-700 font-bold w-10 h-10 rounded-full flex items-center justify-center shrink-0">
                                  {m.user?.nama_lengkap?.charAt(0).toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                  <p className="font-bold text-slate-900 truncate flex items-center gap-1.5">
                                    {m.user?.nama_lengkap} 
                                    {isCurrentUser && (
                                      <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded">
                                        Anda
                                      </span>
                                    )}
                                  </p>
                                  <p className="text-slate-400 text-xs truncate">{m.user?.email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              {['KETUA', 'SEKRETARIS', 'BENDAHARA'].includes(m.role_event) ? (
                                <span className="text-xs text-slate-400 font-medium">—</span>
                              ) : isCurrentUserKetua ? (
                                <select
                                  value={m.divisi_id || ''}
                                  onChange={(e) => handleUpdateMember(m.keanggotaan_id, e.target.value || null, m.role_event)}
                                  className={`focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full max-w-[200px] cursor-pointer rounded-full px-2.5 py-1.5 text-xs font-bold border ${
                                    m.divisi_id ? getDivisionBadgeColor(event.divisi?.find(d => d.divisi_id === m.divisi_id)?.nama_divisi) : 'bg-white border-slate-200 text-slate-600 rounded-lg text-sm'
                                  }`}
                                >
                                  <option value="">-- Tanpa Divisi --</option>
                                  {event.divisi?.map((d) => {
                                    const isDivisiTaken = m.role_event === 'KOORDINATOR' && members.some(member => member.divisi_id === d.divisi_id && member.role_event === 'KOORDINATOR' && member.keanggotaan_id !== m.keanggotaan_id);
                                    return (
                                      <option key={d.divisi_id} value={d.divisi_id} disabled={isDivisiTaken}>
                                        {d.nama_divisi}
                                      </option>
                                    );
                                  })}
                                </select>
                              ) : (
                                (() => {
                                  const divisionName = event.divisi?.find(d => d.divisi_id === m.divisi_id)?.nama_divisi;
                                  return m.divisi_id ? (
                                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${getDivisionBadgeColor(divisionName)}`}>
                                      {divisionName}
                                    </span>
                                  ) : (
                                    <span className="text-xs text-slate-400 font-medium">-- Tanpa Divisi --</span>
                                  );
                                })()
                              )}
                            </td>
                            <td className="px-6 py-4">
                              {isKetua ? (
                                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-100">
                                  Ketua Event
                                </span>
                              ) : isCurrentUserKetua ? (
                                <select
                                  value={m.role_event}
                                  onChange={(e) => handleUpdateMember(m.keanggotaan_id, m.divisi_id, e.target.value)}
                                  className={`focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full max-w-[200px] cursor-pointer ${
                                    m.role_event === 'SEKRETARIS' ? 'bg-blue-50 text-blue-700 border-blue-200 rounded-full px-2.5 py-1.5 text-xs font-bold border' :
                                    m.role_event === 'BENDAHARA' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 rounded-full px-2.5 py-1.5 text-xs font-bold border' :
                                    m.role_event === 'KOORDINATOR' ? 'bg-purple-50 text-purple-700 border-purple-200 rounded-full px-2.5 py-1.5 text-xs font-bold border' :
                                    'bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-sm text-slate-600'
                                  }`}
                                >
                                  <option value="ANGGOTA">Anggota</option>
                                  <option value="KOORDINATOR" disabled={hasKoordinatorForThisDivisi}>
                                    Ketua Divisi (Koordinator)
                                  </option>
                                  <option value="SEKRETARIS" disabled={hasSekretaris}>
                                    Sekretaris
                                  </option>
                                  <option value="BENDAHARA" disabled={hasBendahara}>
                                    Bendahara
                                  </option>
                                </select>
                              ) : (
                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${
                                  m.role_event === 'SEKRETARIS' ? 'bg-blue-50 text-blue-700 border-blue-150' :
                                  m.role_event === 'BENDAHARA' ? 'bg-emerald-50 text-emerald-700 border-emerald-150' :
                                  m.role_event === 'KOORDINATOR' ? 'bg-purple-50 text-purple-700 border-purple-150' :
                                  'bg-slate-100 text-slate-600 border-slate-200'
                                }`}>
                                  {m.role_event === 'KOORDINATOR' ? 'Ketua Divisi (Koordinator)' : m.role_event.charAt(0) + m.role_event.slice(1).toLowerCase()}
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'partners' && (
          <div className="space-y-6 animate-fadeIn">
            {/* Request Bergabung Mitra Section */}
            {['KETUA', 'SEKRETARIS', 'BENDAHARA'].includes(event.userKeanggotaan?.role_event) && pendingPartners.length > 0 && (
              <div className="mb-8 bg-indigo-50/50 border border-indigo-100 rounded-2xl p-6">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h4 className="font-bold text-slate-900 text-base">Permintaan Bergabung Mitra ({pendingPartners.length})</h4>
                    <p className="text-xs text-slate-500 mt-0.5">Calon klien atau vendor yang meminta bergabung.</p>
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100 overflow-hidden shadow-sm">
                  {pendingPartners.map((pm) => (
                    <div key={pm.keanggotaan_id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 font-bold ${
                          pm.user?.user_type === 'KLIEN' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                          {pm.user?.nama_lengkap?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-sm flex items-center gap-2">
                            {pm.user?.nama_lengkap}
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase ${
                              pm.user?.user_type === 'KLIEN' ? 'bg-emerald-50 text-emerald-600 border-emerald-150' : 'bg-amber-50 text-amber-600 border-amber-150'
                            }`}>
                              {pm.user?.user_type}
                            </span>
                          </p>
                          <p className="text-slate-400 text-xs">{pm.user?.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleRejectPending(pm.keanggotaan_id)}
                          className="px-3 py-1.5 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors flex items-center gap-1"
                        >
                          <X className="w-3.5 h-3.5" /> Tolak
                        </button>
                        <button
                          onClick={() => handleApprovePending(pm.keanggotaan_id)}
                          className="px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors flex items-center gap-1"
                        >
                          <Check className="w-3.5 h-3.5" /> Setujui
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div>
                <h3 className="font-bold text-slate-900 text-lg">Kemitraan (Klien & Vendor)</h3>
                <p className="text-sm text-slate-500 mt-1">
                  {user?.user_type === 'PANITIA' 
                    ? 'Kelola klien (owner) dan vendor pihak ketiga untuk event ini.'
                    : 'Daftar mitra (klien & vendor) yang tergabung dalam event ini.'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Column Left: Invite & Add Manual */}
              {user?.user_type === 'PANITIA' && (
                <div className="lg:col-span-5 space-y-6">
                  {/* Card 1: Bagikan Undangan */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                    <h4 className="font-bold text-slate-900 text-sm mb-2 flex items-center gap-2">
                      <UserPlus className="w-4 h-4 text-indigo-500" />
                      Undang via Kode / Link
                    </h4>
                    <p className="text-xs text-slate-500 mb-4">
                      Berikan kode atau link ini kepada klien dan vendor agar mereka bisa mengajukan bergabung.
                    </p>
                    
                    {event.join_code ? (
                      <div className="space-y-3">
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-150 flex items-center justify-between">
                          <div>
                            <span className="text-[10px] uppercase font-bold text-slate-400 block">Kode Join</span>
                            <span className="text-sm font-extrabold tracking-widest text-indigo-600">{event.join_code}</span>
                          </div>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(event.join_code);
                              toast.success("Kode join berhasil disalin!");
                            }}
                            className="text-xs font-bold text-indigo-600 hover:text-indigo-800"
                          >
                            Salin
                          </button>
                        </div>

                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-150 flex items-center justify-between">
                          <div className="min-w-0 flex-1 mr-2">
                            <span className="text-[10px] uppercase font-bold text-slate-400 block">Link Undangan</span>
                            <span className="text-xs text-slate-600 truncate block">
                              {`${window.location.origin}/invite/${event.invite_token}`}
                            </span>
                          </div>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(`${window.location.origin}/invite/${event.invite_token}`);
                              toast.success("Link undangan berhasil disalin!");
                            }}
                            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 shrink-0"
                          >
                            Salin
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={async () => {
                          try {
                            await eventApi.generateInvite(id);
                            await fetchEvent();
                          } catch (err) {
                            toast.error("Gagal membuat link undangan.");
                          }
                        }}
                        className="w-full bg-indigo-50 text-indigo-600 border border-indigo-150 py-2.5 rounded-xl text-xs font-bold hover:bg-indigo-100 transition-colors"
                      >
                        Buat Link & Kode Join
                      </button>
                    )}
                  </div>

                  {/* Card 2: Tambah Manual */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                    <h4 className="font-bold text-slate-900 text-sm mb-2 flex items-center gap-2">
                      <Plus className="w-4 h-4 text-indigo-500" />
                      Tambah Manual via Email
                    </h4>
                    <p className="text-xs text-slate-500 mb-4">
                      Masukkan email klien/vendor untuk langsung menambahkan mereka sebagai mitra aktif.
                    </p>
                    
                    <form onSubmit={async (e) => {
                      e.preventDefault();
                      const emailInput = e.target.elements.partnerEmail.value;
                      if (!emailInput.trim()) return;
                      try {
                        await apiClient.post(`/events/${id}/members/manual`, { email: emailInput });
                        e.target.reset();
                        await fetchMembers();
                      } catch (err) {
                        // Error handled by response interceptor
                      }
                    }} className="space-y-3">
                      <input
                        type="email"
                        name="partnerEmail"
                        required
                        placeholder="partner@company.com"
                        className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      />
                      <button
                        type="submit"
                        className="w-full bg-indigo-600 text-white py-2.5 rounded-xl text-xs font-bold hover:bg-indigo-700 transition-colors"
                      >
                        Tambahkan Mitra
                      </button>
                    </form>
                  </div>
                </div>
              )}

              {/* Column Right: Daftar Mitra */}
              <div className={user?.user_type === 'PANITIA' ? "lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col" : "lg:col-span-12 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col"}>
                <h3 className="font-bold text-slate-900 text-base mb-4">Mitra Terdaftar</h3>
                
                {(() => {
                  const partners = members.filter(m => ['KLIEN', 'VENDOR'].includes(m.user?.user_type));
                  
                  if (partners.length === 0) {
                    return (
                      <div className="text-center py-12 text-slate-400 text-sm">
                        Belum ada klien atau vendor yang terdaftar di event ini.
                      </div>
                    );
                  }
                  
                  return (
                    <div className="space-y-3 overflow-y-auto max-h-[500px] pr-1">
                      {partners.map(p => (
                        <div key={p.keanggotaan_id} className="flex items-center justify-between p-3.5 border border-slate-100 hover:border-slate-200 rounded-xl transition-all">
                          <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 font-bold ${
                              p.user?.user_type === 'KLIEN' 
                                ? 'bg-emerald-100 text-emerald-700' 
                                : 'bg-amber-100 text-amber-700'
                            }`}>
                              {p.user?.nama_lengkap?.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-slate-900 text-sm truncate flex items-center gap-2">
                                {p.user?.nama_lengkap}
                                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase ${
                                  p.user?.user_type === 'KLIEN'
                                    ? 'bg-emerald-50 text-emerald-600 border-emerald-150'
                                    : 'bg-amber-50 text-amber-600 border-amber-150'
                                }`}>
                                  {p.user?.user_type}
                                </span>
                              </p>
                              <p className="text-slate-400 text-xs truncate mt-0.5">{p.user?.email}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        )}
      </main>

      {showInvite && <InviteModal eventId={id} onMemberAdded={() => { fetchEvent(); fetchMembers(); }} onClose={() => setShowInvite(false)} />}
      
      {/* Create Divisi Modal */}
      {showCreateDivisi && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Buat Divisi Manual</h3>
            <form onSubmit={handleCreateDivisi}>
              <input
                type="text"
                placeholder="Nama Divisi (contoh: Acara, Humas, dll)"
                className="w-full p-2.5 border rounded-lg mb-4"
                value={namaDivisi}
                onChange={(e) => setNamaDivisi(e.target.value)}
                required
              />
              <div className="flex gap-2">
                <button type="button" onClick={() => setShowCreateDivisi(false)} className="flex-1 bg-slate-100 text-slate-700 py-2 rounded-lg text-sm font-medium hover:bg-slate-200">
                  Batal
                </button>
                <button type="submit" className="flex-1 bg-indigo-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-indigo-700">
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* User Settings Modal */}
      <UserSettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        user={user} 
        onSave={handleSaveProfile} 
      />
    </div>
  );
};

export default EventDetail;
