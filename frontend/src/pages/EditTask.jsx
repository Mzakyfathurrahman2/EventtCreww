import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { taskApi } from '../api/taskApi';
import { eventApi } from '../api/eventApi';
import { Loader2, ArrowLeft, Save, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const formatDateTimeLocal = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const pad = (num) => String(num).padStart(2, '0');
  const yyyy = date.getFullYear();
  const mm = pad(date.getMonth() + 1);
  const dd = pad(date.getDate());
  const hh = pad(date.getHours());
  const min = pad(date.getMinutes());
  return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
};

const EditTask = () => {
  const { taskId } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    judul_tugas: '',
    deskripsi: '',
    deadline: '',
    prioritas: 'MEDIUM',
    divisi_id: ''
  });

  const [divisiList, setDivisiList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchTaskAndDivisi = async () => {
      try {
        setLoading(true);
        // Get task detail
        const res = await taskApi.getTaskDetail(taskId);
        const task = res.data.data;
        
        setForm({
          judul_tugas: task.judul_tugas || '',
          deskripsi: task.deskripsi || '',
          deadline: formatDateTimeLocal(task.deadline),
          prioritas: task.prioritas || 'MEDIUM',
          divisi_id: task.divisi_id || ''
        });

        // Get divisions for the event
        const divisiRes = await eventApi.getDivisi(task.event_id);
        setDivisiList(divisiRes.data.data || []);
      } catch (err) {
        console.error('Gagal memuat tugas', err);
        setError('Gagal memuat detail tugas atau divisi.');
      } finally {
        setLoading(false);
      }
    };

    fetchTaskAndDivisi();
  }, [taskId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await taskApi.updateTask(taskId, form);
      toast.success('Tugas berhasil diperbarui!');
      navigate(-1); // Back to previous page (task detail or list)
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal memperbarui tugas.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-12">
      <div className="max-w-2xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-slate-500 hover:text-indigo-600 mb-6 transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Kembali
        </button>

        <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Ubah Detail Tugas</h2>

          {error && (
            <div className="bg-red-50 text-red-600 border border-red-200 rounded-xl px-4 py-3 text-sm mb-6 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" /> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Judul Tugas *</label>
              <input
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                placeholder="Cth: Persiapan dekorasi panggung"
                value={form.judul_tugas}
                onChange={e => setForm({ ...form, judul_tugas: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Deskripsi</label>
              <textarea
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition resize-none"
                rows={4}
                placeholder="Detail tugas (opsional)"
                value={form.deskripsi}
                onChange={e => setForm({ ...form, deskripsi: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Deadline *</label>
                <input
                  type="datetime-local"
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                  value={form.deadline}
                  onChange={e => setForm({ ...form, deadline: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Prioritas</label>
                <select
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
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
              <label className="block text-sm font-medium text-slate-700 mb-2">Divisi Penanggung Jawab *</label>
              <select
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
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

            <div className="flex gap-4 pt-4">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="flex-1 border border-slate-200 text-slate-700 rounded-xl py-3 text-sm font-medium hover:bg-slate-50 transition cursor-pointer text-center"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 bg-indigo-600 text-white rounded-xl py-3 text-sm font-semibold hover:bg-indigo-700 flex items-center justify-center gap-2 disabled:opacity-70 transition cursor-pointer"
              >
                {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                Simpan Perubahan
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditTask;
