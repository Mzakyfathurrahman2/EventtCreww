import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { taskApi } from '../api/taskApi';
import { eventApi } from '../api/eventApi';
import {
  Loader2, ArrowLeft, Plus, Trash2, Pencil, CheckCircle2,
  Calendar, User, AlertCircle, Clock
} from 'lucide-react';

// ── Badge Helpers ─────────────────────────────────────────────────────────────
const PrioritasBadge = ({ prioritas }) => {
  const styles = {
    HIGH: 'bg-red-100 text-red-700 border border-red-200',
    MEDIUM: 'bg-yellow-100 text-yellow-700 border border-yellow-200',
    LOW: 'bg-green-100 text-green-700 border border-green-200',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${styles[prioritas] || styles.MEDIUM}`}>
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
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${styles[status] || styles.TODO}`}>
      {status?.replace('_', ' ')}
    </span>
  );
};

// ── Create SubTask Modal ──────────────────────────────────────────────────────
const CreateSubTaskModal = ({ taskId, taskDivisiId, members = [], onCreated, onClose }) => {
  const [form, setForm] = useState({ judul_subtask: '', deskripsi: '', assignee_id: '', deadline: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const filteredMembers = members.filter(m => 
    m.divisi_id === taskDivisiId && 
    !['KETUA', 'SEKRETARIS', 'BENDAHARA'].includes(m.role_event)
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await taskApi.createSubTask(taskId, form);
      onCreated();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal membuat sub-tugas.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6">
        <h2 className="text-xl font-bold text-slate-900 mb-5">Tambah Sub-Tugas</h2>
        {error && (
          <div className="bg-red-50 text-red-600 border border-red-200 rounded-xl px-4 py-3 text-sm mb-4 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" /> {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Judul Sub-Tugas *</label>
            <input
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Cth: Desain poster event"
              value={form.judul_subtask}
              onChange={e => setForm({ ...form, judul_subtask: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Deskripsi</label>
            <textarea
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              rows={2}
              placeholder="Detail (opsional)"
              value={form.deskripsi}
              onChange={e => setForm({ ...form, deskripsi: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Assignee</label>
              <select
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={form.assignee_id}
                onChange={e => setForm({ ...form, assignee_id: e.target.value })}
              >
                <option value="">Pilih Anggota...</option>
                {filteredMembers.map(m => (
                  <option key={m.user_id} value={m.user_id}>{m.user?.nama_lengkap || m.user_id}</option>
                ))}
              </select>
            </div>
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
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 border border-slate-200 text-slate-700 rounded-xl py-2.5 text-sm font-medium hover:bg-slate-50 transition">
              Batal
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 bg-indigo-600 text-white rounded-xl py-2.5 text-sm font-semibold hover:bg-indigo-700 flex items-center justify-center gap-2 disabled:opacity-70 transition">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Tambah
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ── SubTask Row ───────────────────────────────────────────────────────────────
const SubTaskRow = ({ subtask, currentUserId, userRole, onStatusChange, onDelete }) => {
  const [updating, setUpdating] = useState(false);
  const isAssignee = subtask.assignee_id === currentUserId;

  const statusConfig = {
    TODO: { icon: <div className="w-5 h-5 rounded-full border-2 border-slate-300" />, color: 'text-slate-500' },
    IN_PROGRESS: { icon: <Clock className="w-5 h-5 text-blue-500" />, color: 'text-blue-600' },
    DONE: { icon: <CheckCircle2 className="w-5 h-5 text-green-500" />, color: 'text-green-600' },
    TERLAMBAT: { icon: <AlertCircle className="w-5 h-5 text-red-500" />, color: 'text-red-600' },
  };

  const getNextStatus = (current) => {
    const transitions = { TODO: 'IN_PROGRESS', IN_PROGRESS: 'DONE', TERLAMBAT: 'IN_PROGRESS' };
    return transitions[current] || null;
  };

  const nextStatus = getNextStatus(subtask.status);
  const config = statusConfig[subtask.status] || statusConfig.TODO;

  const handleStatusChange = async () => {
    if (!nextStatus) return;
    setUpdating(true);
    try {
      await taskApi.updateSubTaskStatus(subtask.subtask_id, nextStatus);
      onStatusChange();
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal mengubah status.');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className={`flex items-start gap-3 p-4 rounded-xl border transition group ${
      subtask.status === 'TERLAMBAT' ? 'border-red-200 bg-red-50/40' :
      subtask.status === 'DONE' ? 'border-green-100 bg-green-50/20' :
      'border-slate-100 bg-white hover:border-slate-200'
    }`}>
      {/* Status Icon */}
      <div className="mt-0.5 shrink-0">{config.icon}</div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className={`font-medium text-sm ${subtask.status === 'DONE' ? 'line-through text-slate-400' : 'text-slate-900'}`}>
          {subtask.judul_subtask}
        </p>
        {subtask.deskripsi && <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{subtask.deskripsi}</p>}
        <div className="flex items-center gap-3 mt-2 flex-wrap">
          {subtask.assignee && (
            <span className="flex items-center gap-1 text-xs text-slate-500">
              <User className="w-3 h-3" />
              {subtask.assignee.nama_lengkap}
            </span>
          )}
          <span className="flex items-center gap-1 text-xs text-slate-400">
            <Calendar className="w-3 h-3" />
            {new Date(subtask.deadline).toLocaleDateString('id-ID', { timeZone: 'Asia/Jakarta',  day: 'numeric', month: 'short' })}
          </span>
          <StatusBadge status={subtask.status} />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Anggota bisa ubah status jika assignee */}
        {isAssignee && nextStatus && (
          <button
            onClick={handleStatusChange}
            disabled={updating}
            className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition ${
              nextStatus === 'DONE'
                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
            } disabled:opacity-50`}
          >
            {updating ? <Loader2 className="w-3 h-3 animate-spin" /> : `→ ${nextStatus.replace('_', ' ')}`}
          </button>
        )}
        {/* Koordinator/Ketua/Sekretaris/Bendahara bisa hapus */}
        {['KETUA', 'SEKRETARIS', 'BENDAHARA', 'KOORDINATOR'].includes(userRole) && (
          <button
            onClick={() => onDelete(subtask.subtask_id)}
            className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition opacity-0 group-hover:opacity-100"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};

// ── Main Page ──────────────────────────────────────────────────────────────────
const TaskDetailPage = () => {
  const { taskId } = useParams();
  const navigate = useNavigate();

  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCreateSub, setShowCreateSub] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  
  // Dynamic states
  const [userRole, setUserRole] = useState('ANGGOTA');
  const [currentUserId, setCurrentUserId] = useState(null);
  const [eventMembers, setEventMembers] = useState([]);

  const fetchTaskAndMeta = async () => {
    try {
      setLoading(true);
      const res = await taskApi.getTaskDetail(taskId);
      const taskData = res.data.data;
      setTask(taskData);
      
      setUserRole(res.data.userKeanggotaan?.role_event || 'ANGGOTA');
      setCurrentUserId(res.data.currentUserId);

      // Fetch event members for assignment dropdown
      const membersRes = await eventApi.getMembers(taskData.event_id);
      setEventMembers(membersRes.data.data || []);
      
    } catch (err) {
      console.error('Gagal fetch task', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTaskAndMeta(); }, [taskId]);

  const handleTaskStatusDone = async () => {
    setUpdatingStatus(true);
    try {
      await taskApi.updateTaskStatus(taskId, 'DONE');
      fetchTaskAndMeta();
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal mengubah status tugas.');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleDeleteSubtask = async (subtaskId) => {
    if (!window.confirm('Hapus sub-tugas ini?')) return;
    try {
      await taskApi.deleteSubTask(subtaskId);
      fetchTaskAndMeta();
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal menghapus sub-tugas.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  if (!task) {
    return (
      <div className="min-h-screen p-10">
        <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl">Tugas tidak ditemukan.</div>
      </div>
    );
  }

  const isOverdue = new Date(task.deadline) < new Date() && task.status_tugas !== 'DONE';

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Back */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-slate-500 hover:text-indigo-600 mb-6 transition"
        >
          <ArrowLeft className="w-4 h-4" /> Kembali
        </button>

        {/* Task Header */}
        <div className={`bg-white rounded-2xl shadow-sm border p-6 mb-6 ${isOverdue ? 'border-red-200' : 'border-slate-100'}`}>
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2 flex-wrap">
              <StatusBadge status={task.status_tugas} />
              <PrioritasBadge prioritas={task.prioritas} />
              {task.divisi && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
                  {task.divisi.nama_divisi}
                </span>
              )}
            </div>
            {['KETUA', 'SEKRETARIS', 'BENDAHARA'].includes(userRole) && (
              <button
                onClick={() => navigate(`/tasks/${taskId}/edit`)}
                className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition"
              >
                <Pencil className="w-4 h-4" />
              </button>
            )}
          </div>

          <h1 className="text-2xl font-bold text-slate-900 mb-2">{task.judul_tugas}</h1>

          {task.deskripsi && (
            <p className="text-slate-600 text-sm mb-4">{task.deskripsi}</p>
          )}

          <div className="flex flex-wrap gap-4 text-sm text-slate-500 mb-5">
            <span className={`flex items-center gap-1.5 ${isOverdue ? 'text-red-500 font-medium' : ''}`}>
              <Calendar className="w-4 h-4" />
              Deadline: {new Date(task.deadline).toLocaleDateString('id-ID', { timeZone: 'Asia/Jakarta', 
                weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
              })}
              {isOverdue && ' ⚠️'}
            </span>
            {task.pembuat && (
              <span className="flex items-center gap-1.5">
                <User className="w-4 h-4" />
                Dibuat oleh: {task.pembuat.nama_lengkap}
              </span>
            )}
          </div>

          {/* Progress Bar */}
          <div>
            <div className="flex justify-between text-sm mb-1.5">
              <span className="font-medium text-slate-700">Progress Sub-tugas</span>
              <span className="text-slate-500">{task.subtaskDone}/{task.subtaskCount} — {task.progress}%</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2.5">
              <div
                className={`h-2.5 rounded-full transition-all duration-1000 ${
                  task.progress === 100 ? 'bg-green-500' : isOverdue ? 'bg-red-400' : 'bg-indigo-600'
                }`}
                style={{ width: `${task.progress}%` }}
              />
            </div>
          </div>

          {/* Koordinator/Ketua/Sekretaris/Bendahara: Tandai DONE */}
          {['KETUA', 'SEKRETARIS', 'BENDAHARA', 'KOORDINATOR'].includes(userRole) && task.status_tugas !== 'DONE' && (
            <div className="mt-4 flex flex-col gap-2">
              <button
                onClick={handleTaskStatusDone}
                disabled={updatingStatus || task.progress < 100}
                className="self-start bg-green-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-green-700 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition"
                title={task.progress < 100 ? 'Selesaikan semua sub-tugas terlebih dahulu' : ''}
              >
                {updatingStatus ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                Tandai Tugas DONE
              </button>
              {task.progress < 100 && (
                <p className="text-xs text-amber-600 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  Semua sub-tugas harus DONE terlebih dahulu.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Sub-Tasks Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-slate-900 text-lg">
              Sub-tugas <span className="text-slate-400 font-normal text-base">({task.subtasks?.length || 0})</span>
            </h2>
            {(['KETUA', 'SEKRETARIS', 'BENDAHARA'].includes(userRole) || (userRole === 'KOORDINATOR' && eventMembers.find(m => m.user_id === currentUserId)?.divisi_id === task.divisi_id)) && (
              <button
                onClick={() => setShowCreateSub(true)}
                className="bg-indigo-50 text-indigo-600 border border-indigo-200 px-4 py-2 rounded-xl text-sm font-medium hover:bg-indigo-100 flex items-center gap-1.5 transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Tambah Sub-tugas
              </button>
            )}
          </div>

          {!task.subtasks || task.subtasks.length === 0 ? (
            <div className="text-center py-10">
              <CheckCircle2 className="w-10 h-10 text-slate-200 mx-auto mb-2" />
              <p className="text-slate-400 text-sm">Belum ada sub-tugas. Tambahkan untuk membagi pekerjaan.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {task.subtasks.map(sub => (
                <SubTaskRow
                  key={sub.subtask_id}
                  subtask={sub}
                  currentUserId={currentUserId}
                  userRole={userRole}
                  onStatusChange={fetchTaskAndMeta}
                  onDelete={handleDeleteSubtask}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {showCreateSub && (
        <CreateSubTaskModal
          taskId={taskId}
          taskDivisiId={task.divisi_id}
          members={eventMembers}
          onCreated={fetchTaskAndMeta}
          onClose={() => setShowCreateSub(false)}
        />
      )}
    </div>
  );
};

export default TaskDetailPage;
