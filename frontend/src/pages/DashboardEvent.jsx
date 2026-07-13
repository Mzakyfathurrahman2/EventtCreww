import React, { useContext, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { taskApi } from '../api/taskApi';
import { usePolling } from '../hooks/usePolling';
import { AuthContext } from '../context/AuthContext';
import {
  Loader2, AlertCircle, Calendar, CheckCircle2,
  UserX, TrendingUp, Clock, Zap, BarChart2, PieChart, Filter
} from 'lucide-react';

// ── Priority Badge ────────────────────────────────────────────────────────────
const PrioritasBadge = ({ prioritas }) => {
  const styles = {
    HIGH: 'bg-red-100 text-red-700',
    MEDIUM: 'bg-yellow-100 text-yellow-700',
    LOW: 'bg-green-100 text-green-700',
  };
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${styles[prioritas] || styles.MEDIUM}`}>
      {prioritas}
    </span>
  );
};

// ── Summary Card ──────────────────────────────────────────────────────────────
const SummaryCard = ({ icon: Icon, label, value, iconBg, iconColor }) => (
  <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_25px_-5px_rgba(0,0,0,0.1)] transition-all flex items-center gap-4 relative overflow-hidden group">
    <div className={`p-3 rounded-xl shrink-0 ${iconBg} transition-transform duration-300 group-hover:scale-110 relative z-10`}>
      <Icon className={`w-6 h-6 ${iconColor}`} />
    </div>
    <div className="relative z-10">
      <p className="text-sm text-slate-500 font-medium">{label}</p>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
    </div>
    <div className={`absolute -right-6 -bottom-6 w-24 h-24 rounded-full ${iconBg} blur-2xl opacity-40 group-hover:opacity-60 transition-opacity`} />
  </div>
);

// ── Circular Progress Ring ────────────────────────────────────────────────────
const CircularProgress = ({ percent }) => {
  const radius = 15.9155;
  const circumference = 2 * Math.PI * radius;
  const strokeDasharray = `${(percent / 100) * circumference}, ${circumference}`;

  return (
    <div className="relative w-20 h-20">
      <svg viewBox="0 0 36 36" className="w-20 h-20 -rotate-90">
        <circle
          cx="18" cy="18" r={radius}
          fill="none"
          stroke="#e2e8f0"
          strokeWidth="3"
        />
        <circle
          cx="18" cy="18" r={radius}
          fill="none"
          stroke={percent === 100 ? '#22c55e' : '#4f46e5'}
          strokeWidth="3"
          strokeDasharray={strokeDasharray}
          strokeLinecap="round"
          className="transition-all duration-1000"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-sm font-bold text-slate-900">{percent}%</span>
        <span className="text-[9px] text-slate-400">selesai</span>
      </div>
    </div>
  );
};

// ── Custom Donut Chart (Distribusi Status Tugas) ──────────────────────────────
const CustomDonutChart = ({ summary = {} }) => {
  const { todo = 0, inProgress = 0, done = 0, terlambat = 0 } = summary;
  const total = todo + inProgress + done + terlambat;

  if (total === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-slate-400 h-[180px]">
        <p className="text-sm font-medium">Belum ada tugas yang dibuat</p>
      </div>
    );
  }

  const radius = 15.9155;
  const slices = [
    { label: 'Selesai (DONE)', value: done, color: '#22c55e' },
    { label: 'Progres (IN PROGRESS)', value: inProgress, color: '#3b82f6' },
    { label: 'Tertunda (TODO)', value: todo, color: '#94a3b8' },
    { label: 'Terlambat (OVERDUE)', value: terlambat, color: '#ef4444' }
  ].filter(s => s.value > 0);

  let accumulatedPercent = 0;
  const segments = slices.map(s => {
    const percent = (s.value / total) * 100;
    const offset = 100 - accumulatedPercent;
    accumulatedPercent += percent;
    return { ...s, percent, offset };
  });

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6 py-2">
      <div className="relative w-32 h-32 shrink-0">
        <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
          <circle cx="18" cy="18" r={radius} fill="none" stroke="#f8fafc" strokeWidth="4.5" />
          {segments.map((seg, idx) => (
            <circle
              key={idx}
              cx="18" cy="18" r={radius}
              fill="none"
              stroke={seg.color}
              strokeWidth="4.5"
              strokeDasharray={`${seg.percent} ${100 - seg.percent}`}
              strokeDashoffset={seg.offset}
              strokeLinecap="round"
              className="transition-all duration-700 ease-out hover:stroke-[5.5] cursor-pointer"
            >
              <title>{seg.label}: {seg.value} tugas ({seg.percent.toFixed(1)}%)</title>
            </circle>
          ))}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-black text-slate-900 leading-none">{total}</span>
          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-1">Tugas</span>
        </div>
      </div>

      <div className="flex-1 space-y-2 w-full">
        {slices.map((seg, idx) => {
          const pct = ((seg.value / total) * 100).toFixed(0);
          return (
            <div key={idx} className="flex items-center justify-between text-xs sm:text-sm">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: seg.color }} />
                <span className="text-slate-600 font-medium truncate max-w-[120px]">{seg.label}</span>
              </div>
              <span className="font-bold text-slate-900 shrink-0">{seg.value} ({pct}%)</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ── Divisi Leaderboard (Peringkat Kinerja Divisi) ──────────────────────────────
const DivisiLeaderboard = ({ data = [] }) => {
  const [sortBy, setSortBy] = useState('most_done'); // most_done, least_done, most_overdue

  if (data.length === 0) return <p className="text-sm text-slate-400 text-center py-10">Belum ada data tugas divisi.</p>;

  const sortedData = [...data].sort((a, b) => {
    if (sortBy === 'most_done') return b.done - a.done;
    if (sortBy === 'least_done') return a.done - b.done;
    if (sortBy === 'most_overdue') return b.terlambat - a.terlambat;
    return 0;
  });

  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-col gap-2 mb-3">
        <select
          className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:border-indigo-500 text-slate-600 bg-slate-50 w-full"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
        >
          <option value="most_done">Urutkan: Paling Banyak Selesai</option>
          <option value="least_done">Urutkan: Paling Sedikit Selesai</option>
          <option value="most_overdue">Urutkan: Paling Banyak Terlambat</option>
        </select>
        <div className="flex gap-3 text-[9px] font-semibold text-slate-500 justify-end">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500"></span>Selesai</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500"></span>Progres</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500"></span>Terlambat</span>
        </div>
      </div>

      <div className="space-y-3 max-h-[160px] overflow-y-auto pr-2 custom-scrollbar">
        {sortedData.map((d, idx) => (
          <div key={d.divisi_id || idx} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100 hover:border-indigo-200 transition-colors">
            <div className="flex items-center gap-3">
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                idx === 0 && sortBy === 'most_done' ? 'bg-amber-100 text-amber-700' :
                idx === 1 && sortBy === 'most_done' ? 'bg-slate-200 text-slate-700' :
                idx === 2 && sortBy === 'most_done' ? 'bg-orange-100 text-orange-800' :
                'bg-white text-slate-500 border border-slate-200'
              }`}>
                {idx + 1}
              </span>
              <div>
                <p className="font-bold text-slate-800 text-xs truncate max-w-[120px]">{d.nama_divisi}</p>
                <p className="text-[10px] text-slate-500">{d.progress}% Berhasil</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 text-[10px] font-semibold text-right shrink-0">
              <span className="bg-green-100 text-green-700 px-1.5 py-0.5 rounded flex items-center gap-1" title="Tugas Selesai">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>{d.done}
              </span>
              <span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded flex items-center gap-1" title="Sedang Dikerjakan">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>{d.inProgress}
              </span>
              <span className="bg-red-100 text-red-700 px-1.5 py-0.5 rounded flex items-center gap-1" title="Terlambat">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>{d.terlambat}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};


// ── Horizontal HTML Bar Chart (Kinerja per Divisi) ──────────────────────────
const DivisiHorizontalBar = ({ div, showAnggota }) => (
  <div className="mb-6 last:mb-0">
    <div className="flex justify-between text-sm mb-1.5 items-end">
      <div>
        <span className="font-bold text-slate-700 block">{div.nama_divisi}</span>
        {showAnggota && <span className="text-xs text-slate-400">{div.anggota} anggota aktif</span>}
      </div>
      <div className="text-right flex flex-col items-end">
        <span className="font-bold text-slate-800">{div.progress}% Selesai</span>
        <span className="text-xs text-slate-500 font-medium">
          {div.done} dari {div.total} tugas
        </span>
      </div>
    </div>
    <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden flex shadow-inner">
      <div
        className="bg-green-500 h-full transition-all duration-1000"
        style={{ width: `${div.total > 0 ? (div.done/div.total)*100 : 0}%` }}
        title={`Selesai: ${div.done}`}
      />
      <div
        className="bg-blue-500 h-full transition-all duration-1000"
        style={{ width: `${div.total > 0 ? (div.inProgress/div.total)*100 : 0}%` }}
        title={`Sedang Dikerjakan: ${div.inProgress}`}
      />
      <div
        className="bg-red-500 h-full transition-all duration-1000"
        style={{ width: `${div.total > 0 ? (div.terlambat/div.total)*100 : 0}%` }}
        title={`Terlambat: ${div.terlambat}`}
      />
    </div>
    <div className="flex justify-between items-center mt-2">
      <div className="text-[10px] text-slate-400 font-medium">
        Total {div.total} Tugas
      </div>
      <div className="flex items-center gap-3 text-[10px] text-slate-500 font-medium">
        <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500" /> {div.done} Selesai</div>
        <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500" /> {div.inProgress} Diproses</div>
        {div.terlambat > 0 && <div className="flex items-center gap-1 text-red-500"><span className="w-2 h-2 rounded-full bg-red-500" /> {div.terlambat} Terlambat</div>}
      </div>
    </div>
  </div>
);

// ── Main Dashboard Component ──────────────────────────────────────────────────
const DashboardEvent = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const userType = user?.user_type || 'PANITIA';

  const [prioritasFilter, setPrioritasFilter] = useState('');

  // Polling setiap 5 detik sesuai FR-007, sekarang dengan prioritasFilter
  const { data: dashboard, loading, error } = usePolling(
    (eventId) => taskApi.getDashboard(eventId, { prioritas: prioritasFilter }), 
    [id, prioritasFilter], 
    5000
  );

  if (loading && !dashboard) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] gap-3">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
        <p className="text-sm text-slate-500">Memuat dashboard Sistem Informasi Manajemen...</p>
      </div>
    );
  }

  if (error || !dashboard) {
    return (
      <div className="bg-red-50 text-red-600 border border-red-200 px-4 py-3 rounded-xl flex items-center gap-2 text-sm">
        <AlertCircle className="w-4 h-4 shrink-0" />
        Gagal memuat data dashboard. Mencoba lagi setiap 5 detik...
      </div>
    );
  }

  const { event, divisiProgress, summary, upcomingDeadlines } = dashboard;

  return (
    <div className="space-y-6">
      {/* Dashboard Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 rounded-2xl p-6 text-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-md">
        <div>
          <h2 className="text-2xl font-bold">{event?.nama_event || 'Dashboard Event'}</h2>
          <p className="text-indigo-200 text-sm mt-1 mb-3">Sistem Informasi Manajemen Event</p>
          
          {event?.tanggal_pelaksanaan && (
            <div className="flex items-center gap-2 mb-3 text-indigo-100 text-sm font-medium bg-black/10 w-fit px-3 py-1.5 rounded-lg border border-white/10 shadow-sm">
              <Calendar className="w-4 h-4 text-indigo-300" />
              Hari H: {new Date(event.tanggal_pelaksanaan).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </div>
          )}

          <div className="flex items-center gap-3">
            <span className={`text-xs font-bold px-3 py-1 rounded-full ${
              event?.status_event === 'AKTIF' ? 'bg-green-400/30 text-green-100 border border-green-400/50' :
              event?.status_event === 'SELESAI' ? 'bg-white/20 text-white' :
              'bg-amber-400/30 text-amber-100'
            }`}>
              {event?.status_event}
            </span>
            <span className="flex items-center gap-1.5 text-indigo-200 text-xs font-medium bg-black/10 px-3 py-1 rounded-full">
              <Zap className="w-3 h-3 text-yellow-300" />
              Auto-refresh: Aktif (5s)
            </span>
          </div>
        </div>
        {userType === 'PANITIA' && <CircularProgress percent={summary.overallProgress} />}
      </div>

      {/* Filter Prioritas untuk MIS */}
      <div className="bg-white/80 backdrop-blur-md p-4 rounded-2xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.05)] border border-slate-100 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2 text-sm font-bold text-slate-700 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
          <Filter className="w-4 h-4 text-indigo-500" />
          Filter Grafik:
        </div>
        <div className="flex gap-2 flex-wrap">
          {['', 'HIGH', 'MEDIUM', 'LOW'].map(p => (
            <button
              key={p}
              onClick={() => setPrioritasFilter(p)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                prioritasFilter === p 
                ? 'bg-indigo-600 text-white shadow-md' 
                : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
              }`}
            >
              {p === '' ? 'SEMUA PRIORITAS' : p}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      {userType === 'PANITIA' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <SummaryCard
            icon={AlertCircle}
            label={`Terlambat ${prioritasFilter ? '('+prioritasFilter+')' : ''}`}
            value={summary.terlambat}
            iconBg="bg-red-50"
            iconColor="text-red-500"
          />
          <SummaryCard
            icon={UserX}
            label="Anggota Pasif"
            value={summary.tidakAktif}
            iconBg="bg-amber-50"
            iconColor="text-amber-500"
          />
          <SummaryCard
            icon={CheckCircle2}
            label={`Tugas Selesai ${prioritasFilter ? '('+prioritasFilter+')' : ''}`}
            value={`${summary.tugasSelesai}/${summary.totalTugas}`}
            iconBg="bg-green-50"
            iconColor="text-green-500"
          />
          <SummaryCard
            icon={TrendingUp}
            label="Total Divisi Aktif"
            value={summary.totalDivisi}
            iconBg="bg-indigo-50"
            iconColor="text-indigo-500"
          />
        </div>
      )}

      {/* ── VISUALISASI GRAFIK MIS ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Kolom Kiri: Charts (2 dari 3 kolom) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Horizontal Bar Chart (Kinerja per Divisi) - Menggantikan Line Chart & Bar Chart lama */}
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border-t-[3px] border-t-indigo-500 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 blur-3xl opacity-50 pointer-events-none" />
            <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2 relative z-10">
              <BarChart2 className="w-5 h-5 text-indigo-500" />
              Kinerja & Progres per Divisi 
              {prioritasFilter && <PrioritasBadge prioritas={prioritasFilter} />}
            </h3>
            <div className="relative z-10">
              {divisiProgress.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-8">Belum ada divisi yang memenuhi kriteria.</p>
              ) : (
                divisiProgress.map((div, idx) => (
                  <DivisiHorizontalBar 
                    key={idx} 
                    div={div} 
                    showAnggota={userType === 'PANITIA'} 
                  />
                ))
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Pie/Donut Chart */}
            <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]">
              <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
                <PieChart className="w-4 h-4 text-indigo-500" />
                Distribusi Status Tugas
              </h3>
              <CustomDonutChart summary={summary} />
            </div>

            {/* Divisi Leaderboard */}
            <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border-t-[3px] border-t-green-500 flex flex-col relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-green-50 blur-3xl opacity-50 pointer-events-none" />
              <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2 shrink-0 relative z-10">
                <BarChart2 className="w-4 h-4 text-green-500" />
                Peringkat Kinerja Divisi
              </h3>
              <div className="relative z-10 h-full">
                <DivisiLeaderboard data={divisiProgress} />
              </div>
            </div>
          </div>
        </div>

        {/* Kolom Kanan: Deadline (1 dari 3 kolom) */}
        <div className="lg:col-span-1 space-y-6">
          {(userType === 'PANITIA' || userType === 'VENDOR') && (
            <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border-t-[3px] border-t-amber-500 h-full relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-50 blur-3xl opacity-50 pointer-events-none" />
              <h3 className="text-lg font-bold text-slate-900 mb-5 flex items-center gap-2 relative z-10">
                <Clock className="w-5 h-5 text-amber-500" />
                Deadline Terdekat
              </h3>
              <div className="relative z-10">
              {upcomingDeadlines.length === 0 ? (
                <div className="text-center py-10">
                  <CheckCircle2 className="w-12 h-12 text-green-200 mx-auto mb-3" />
                  <p className="text-sm font-medium text-slate-600">Semua aman terkendali! 🎉</p>
                  <p className="text-xs text-slate-400 mt-1">Tidak ada tugas mendesak.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {upcomingDeadlines.map(task => {
                    const daysLeft = Math.ceil((new Date(task.deadline) - new Date()) / (1000 * 60 * 60 * 24));
                    const isUrgent = daysLeft <= 3;
                    return (
                      <div
                        key={task.task_id}
                        className={`flex flex-col p-3.5 rounded-xl border cursor-pointer hover:shadow-md transition group ${
                          isUrgent ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-slate-100 hover:border-indigo-200'
                        }`}
                        onClick={() => navigate(`/tasks/${task.task_id}`)}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <p className="font-bold text-slate-900 text-sm line-clamp-2 group-hover:text-indigo-700 transition">
                            {task.judul_tugas}
                          </p>
                          <div className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-md whitespace-nowrap ml-2 ${
                            isUrgent ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                          }`}>
                            <Calendar className="w-3 h-3" />
                            {daysLeft <= 0 ? 'Hari ini!' : `${daysLeft}h`}
                          </div>
                        </div>
                        <div className="flex items-center justify-between mt-auto">
                          <span className="text-xs font-medium text-slate-500 bg-white px-2 py-1 rounded-md border border-slate-200 shadow-sm">
                            {task.divisi?.nama_divisi}
                          </span>
                          <PrioritasBadge prioritas={task.prioritas} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardEvent;
