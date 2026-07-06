import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { taskApi } from '../api/taskApi';
import { eventApi } from '../api/eventApi';
import {
  Loader2, Plus, Search, Trash2, Pencil,
  CheckCircle2, ChevronRight, Calendar, AlertCircle, ArrowLeft
} from 'lucide-react';

// ── Badge Components ──────────────────────────────────────────────────────────
const PrioritasBadge = ({ prioritas }) => {
  const styles = {
    HIGH: 'bg-red-100 text-red-700 border border-red-200',
    MEDIUM: 'bg-yellow-100 text-yellow-700 border border-yellow-200',
    LOW: 'bg-green-100 text-green-700 border border-green-200',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide ${styles[prioritas] || styles.MEDIUM}`}>
      {prioritas}
    </span>
  );
};

const StatusBadge = ({ status }) => {
  const styles = {
    TODO: 'bg-slate-100 text-slate-600 border border-slate-200',
    IN_PROGRESS: 'bg-blue-100 text-blue-700 border border-blue-200',
    DONE: 'bg-green-100 text-green-700 border border-green-200',
    TERLAMBAT: 'bg-red-100 text-red-700 border border-red-200',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide ${styles[status] || styles.TODO}`}>
      {status?.replace('_', ' ')}
    </span>
  );
};

// ── Create Task Modal ─────────────────────────────────────────────────────────
const CreateTaskModal = ({ eventId, divisiList, onCreated, onClose }) => {
  const [form, setForm] = useState({ judul_tugas: '', deskripsi: '', deadline: '', divisi_id: '', prioritas: 'MEDIUM' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await taskApi.createTask(eventId, form);
      onCreated();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal membuat tugas.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 animate-fade-in">
        <h2 className="text-xl font-bold text-slate-900 mb-5">Buat Tugas Baru</h2>
        {error && (
          <div className="bg-red-50 text-red-600 border border-red-200 rounded-xl px-4 py-3 text-sm mb-4 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" /> {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Judul Tugas *</label>
            <input
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
              placeholder="Cth: Persiapan dekorasi panggung"
              value={form.judul_tugas}
              onChange={e => setForm({ ...form, judul_tugas: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Deskripsi</label>
            <textarea
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition resize-none"
              rows={3}
              placeholder="Detail tugas (opsional)"
              value={form.deskripsi}
              onChange={e => setForm({ ...form, deskripsi: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Deadline *</label>
              <input
                type="datetime-local"
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={form.deadline}
                onChange={e => setForm({ ...form, deadline: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Prioritas</label>
              <select
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={form.prioritas}
                onChange={e => setForm({ ...form, prioritas: e.target.value })}
              >
                <option value="HIGH">🔴 HIGH</option>
                <option value="MEDIUM">🟡 MEDIUM</option>
                <option value="LOW">🟢 LOW</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Divisi *</label>
            <select
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={form.divisi_id}
              onChange={e => setForm({ ...form, divisi_id: e.target.value })}
              required
            >
              <option value="">Pilih Divisi...</option>
              {divisiList.map(d => (
                <option key={d.divisi_id} value={d.divisi_id}>{d.nama_divisi}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 border border-slate-200 text-slate-700 rounded-xl py-2.5 text-sm font-medium hover:bg-slate-50 transition">
              Batal
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 bg-indigo-600 text-white rounded-xl py-2.5 text-sm font-semibold hover:bg-indigo-700 flex items-center justify-center gap-2 disabled:opacity-70 transition">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Buat Tugas
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ── Main Page ──────────────────────────────────────────────────────────────────
const TaskListPage = () => {
  const { id: eventId } = useParams();
  const navigate = useNavigate();

  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPrioritas, setFilterPrioritas] = useState('');
  const [filterDivisi, setFilterDivisi] = useState('');

  // Added states for dynamic data
  const [userRole, setUserRole] = useState('ANGGOTA');
  const [divisiList, setDivisiList] = useState([]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      // Fetch event detail to get role and divisi
      const eventRes = await eventApi.getEventDetail(eventId);
      setUserRole(eventRes.data.userKeanggotaan?.role_event || 'ANGGOTA');
      setDivisiList(eventRes.data.data.divisi || []);

      // Fetch tasks
      const params = {};
      if (filterStatus) params.status = filterStatus;
      if (filterPrioritas) params.prioritas = filterPrioritas;
      if (filterDivisi) params.divisi_id = filterDivisi;
      const res = await taskApi.getTasks(eventId, params);
      setTasks(res.data.data || []);
    } catch (err) {
      console.error('Gagal fetch data', err);
    } finally {
      setLoading(false);
    }
  }, [eventId, filterStatus, filterPrioritas, filterDivisi]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleDelete = async (taskId) => {
    if (!window.confirm('Hapus tugas ini? Semua sub-tugas akan ikut terhapus.')) return;
    try {
      await taskApi.deleteTask(taskId);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal menghapus tugas.');
    }
  };

  const filteredTasks = tasks.filter(t =>
    t.judul_tugas?.toLowerCase().includes(search.toLowerCase())
  );

  const hasFilters = filterStatus || filterPrioritas || filterDivisi;

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-10">
      <button 
        onClick={() => navigate(`/events/${eventId}`)}
        className="flex items-center text-sm font-medium text-slate-500 hover:text-indigo-600 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4 mr-1" />
        Kembali ke Dashboard Event
      </button>

      {/* Header */}
      <div className="flex flex-wrap justify-between items-start gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Manajemen Tugas</h1>
          <p className="text-sm text-slate-500 mt-1">{filteredTasks.length} tugas ditemukan</p>
        </div>
        {['KETUA', 'SEKRETARIS', 'BENDAHARA'].includes(userRole) && (
          <button
            className="bg-indigo-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-indigo-700 flex items-center gap-2 transition shadow-sm"
            onClick={() => setShowCreate(true)}
          >
            <Plus className="w-4 h-4" />
            Buat Tugas
          </button>
        )}
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 mb-6 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Cari tugas..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select
          className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-600"
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
        >
          <option value="">Semua Status</option>
          <option value="TODO">TODO</option>
          <option value="IN_PROGRESS">IN PROGRESS</option>
          <option value="DONE">DONE</option>
          <option value="TERLAMBAT">TERLAMBAT</option>
        </select>
        <select
          className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-600"
          value={filterPrioritas}
          onChange={e => setFilterPrioritas(e.target.value)}
        >
          <option value="">Semua Prioritas</option>
          <option value="HIGH">HIGH</option>
          <option value="MEDIUM">MEDIUM</option>
          <option value="LOW">LOW</option>
        </select>
        {['KETUA', 'SEKRETARIS', 'BENDAHARA'].includes(userRole) && divisiList.length > 0 && (
          <select
            className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-600"
            value={filterDivisi}
            onChange={e => setFilterDivisi(e.target.value)}
          >
            <option value="">Semua Divisi</option>
            {divisiList.map(d => <option key={d.divisi_id} value={d.divisi_id}>{d.nama_divisi}</option>)}
          </select>
        )}
        {hasFilters && (
          <button
            className="text-sm text-indigo-600 font-medium hover:underline"
            onClick={() => { setFilterStatus(''); setFilterPrioritas(''); setFilterDivisi(''); }}
          >
            Reset
          </button>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="text-center py-20">
          <CheckCircle2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">Belum ada tugas</p>
          <p className="text-slate-400 text-sm mt-1">
            {['KETUA', 'SEKRETARIS', 'BENDAHARA'].includes(userRole) ? 'Klik "Buat Tugas" untuk memulai.' : 'Tidak ada tugas yang perlu dikerjakan saat ini.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredTasks.map(task => {
            const isOverdue = task.status_tugas === 'TERLAMBAT';
            return (
              <div
                key={task.task_id}
                className={`bg-white rounded-2xl border shadow-sm hover:shadow-md transition-all cursor-pointer group ${
                  isOverdue ? 'border-red-200 bg-red-50/30' : 'border-slate-100 hover:border-indigo-200'
                }`}
                onClick={() => navigate(`/tasks/${task.task_id}`)}
              >
                <div className="p-5">
                  {/* Badges */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <StatusBadge status={task.status_tugas} />
                      <PrioritasBadge prioritas={task.prioritas} />
                    </div>
                    {['KETUA', 'SEKRETARIS', 'BENDAHARA'].includes(userRole) && (
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                          onClick={e => { e.stopPropagation(); navigate(`/tasks/${task.task_id}/edit`); }}
                          title="Edit"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                          onClick={e => { e.stopPropagation(); handleDelete(task.task_id); }}
                          title="Hapus"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Title */}
                  <h3 className="font-bold text-slate-900 mb-1 line-clamp-2 group-hover:text-indigo-700 transition">
                    {task.judul_tugas}
                  </h3>
                  <p className="text-xs text-slate-500 mb-3">{task.divisi?.nama_divisi}</p>

                  {/* Progress */}
                  {task.subtaskCount > 0 && (
                    <div className="mb-3">
                      <div className="w-full bg-slate-100 rounded-full h-1.5 mb-1">
                        <div
                          className={`h-1.5 rounded-full transition-all duration-700 ${
                            task.progress === 100 ? 'bg-green-500' : isOverdue ? 'bg-red-400' : 'bg-indigo-500'
                          }`}
                          style={{ width: `${task.progress}%` }}
                        />
                      </div>
                      <p className="text-xs text-slate-400">{task.subtaskDone}/{task.subtaskCount} sub-tugas</p>
                    </div>
                  )}

                  {/* Deadline */}
                  <div className={`flex items-center gap-1.5 text-xs ${isOverdue ? 'text-red-500' : 'text-slate-400'}`}>
                    <Calendar className="w-3.5 h-3.5" />
                    {new Date(task.deadline).toLocaleDateString('id-ID', { timeZone: 'Asia/Jakarta',  day: 'numeric', month: 'short', year: 'numeric' })}
                    <ChevronRight className="w-3.5 h-3.5 ml-auto text-slate-300 group-hover:text-indigo-400 transition" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showCreate && (
        <CreateTaskModal
          eventId={eventId}
          divisiList={divisiList}
          onCreated={fetchData}
          onClose={() => setShowCreate(false)}
        />
      )}
    </div>
  );
};

export default TaskListPage;
