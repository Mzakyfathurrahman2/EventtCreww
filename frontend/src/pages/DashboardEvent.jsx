import React, { useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { taskApi } from '../api/taskApi';
import { usePolling } from '../hooks/usePolling';
import { AuthContext } from '../context/AuthContext';
import {
  Loader2, AlertCircle, Calendar, CheckCircle2,
  UserX, TrendingUp, Clock, Zap, BarChart2, PieChart
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
  <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center gap-4">
    <div className={`p-3 rounded-xl shrink-0 ${iconBg}`}>
      <Icon className={`w-6 h-6 ${iconColor}`} />
    </div>
    <div>
      <p className="text-sm text-slate-500 font-medium">{label}</p>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
    </div>
  </div>
);

// ── Divisi Progress Bar ───────────────────────────────────────────────────────
const DivisiProgressItem = ({ div, showAnggota }) => (
  <div className="mb-5 last:mb-0">
    <div className="flex justify-between text-sm mb-1">
      <span className="font-medium text-slate-700">{div.nama_divisi}</span>
      <div className="flex items-center gap-2">
        {div.terlambat > 0 && showAnggota && (
          <span className="text-xs font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
            {div.terlambat} terlambat
          </span>
        )}
        <span className="text-slate-500">{div.progress}%{showAnggota ? ` (${div.done}/${div.total})` : ''}</span>
      </div>
    </div>
    <div className="w-full bg-slate-100 rounded-full h-2.5">
      <div
        className={`h-2.5 rounded-full transition-all duration-1000 ${
          div.progress === 100 ? 'bg-green-500' :
          div.terlambat > 0 ? 'bg-red-500' :
          'bg-indigo-600'
        }`}
        style={{ width: `${div.progress}%` }}
      />
    </div>
    {showAnggota && (
      <p className="text-xs text-slate-400 mt-1">{div.anggota} anggota aktif</p>
    )}
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
            />
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

// ── Custom Bar Chart (Jumlah Tugas per Divisi) ───────────────────────────────
const CustomBarChart = ({ data = [] }) => {
  if (data.length === 0) return <p className="text-sm text-slate-400 text-center py-10 h-[180px] flex items-center justify-center">Belum ada data tugas divisi.</p>;

  const width = 500;
  const height = 180;
  const paddingX = 40;
  const paddingY = 20;

  const chartWidth = width - paddingX * 2;
  const chartHeight = height - paddingY * 2;

  const maxVal = Math.max(...data.map(d => d.total), 5);

  const barWidth = Math.min(30, (chartWidth / data.length) * 0.5);
  const gap = data.length > 1 ? (chartWidth - (barWidth * data.length)) / (data.length - 1) : chartWidth;

  const getX = (idx) => paddingX + idx * (barWidth + gap);
  const getY = (val) => paddingY + chartHeight - (val / maxVal) * chartHeight;

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full min-w-[300px] overflow-visible">
        {[0, Math.round(maxVal / 2), maxVal].map((val, idx) => {
          const y = getY(val);
          return (
            <g key={idx} className="opacity-10">
              <line x1={paddingX} y1={y} x2={width - paddingX} y2={y} stroke="#000" strokeWidth="1" />
              <text x={paddingX - 10} y={y + 4} textAnchor="end" className="text-[10px] font-bold fill-slate-700">{val}</text>
            </g>
          );
        })}

        {data.map((d, idx) => {
          const x = getX(idx);
          const y = getY(d.total);
          const barHeight = chartHeight - (y - paddingY);

          return (
            <g key={idx} className="group cursor-pointer">
              <rect
                x={x} y={y}
                width={barWidth} height={Math.max(barHeight, 2)}
                rx="4"
                fill="#4f46e5"
                className="transition-all duration-300 hover:fill-indigo-500 opacity-90 hover:opacity-100"
              />
              <text
                x={x + barWidth / 2} y={y - 5}
                textAnchor="middle"
                className="text-[9px] font-bold fill-indigo-700 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
              >
                {d.total}
              </text>
              <text
                x={x + barWidth / 2} y={height - 2}
                textAnchor="middle"
                className="text-[9px] font-medium fill-slate-400"
              >
                {d.nama_divisi}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

// ── Custom Grouped Bar Chart (Selesai vs Sedang Dikerjakan per Divisi) ────────
const CustomGroupedBarChart = ({ data = [] }) => {
  if (data.length === 0) return <p className="text-sm text-slate-400 text-center py-10 h-[180px] flex items-center justify-center">Belum ada data tugas divisi.</p>;

  const width = 500;
  const height = 180;
  const paddingX = 40;
  const paddingY = 20;

  const chartWidth = width - paddingX * 2;
  const chartHeight = height - paddingY * 2;

  // Max value calculation
  const maxVal = Math.max(...data.map(d => Math.max(d.done, d.inProgress)), 5);

  const groupWidth = Math.min(60, chartWidth / data.length);
  const barWidth = groupWidth * 0.35;
  const gap = data.length > 1 ? (chartWidth - (groupWidth * data.length)) / (data.length - 1) : chartWidth;

  const getX = (idx) => paddingX + idx * (groupWidth + gap);
  const getY = (val) => paddingY + chartHeight - (val / maxVal) * chartHeight;

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full min-w-[300px] overflow-visible">
        {/* Horizontal grid lines */}
        {[0, Math.round(maxVal / 2), maxVal].map((val, idx) => {
          const y = getY(val);
          return (
            <g key={idx} className="opacity-10">
              <line x1={paddingX} y1={y} x2={width - paddingX} y2={y} stroke="#000" strokeWidth="1" />
              <text x={paddingX - 10} y={y + 4} textAnchor="end" className="text-[10px] font-bold fill-slate-700">{val}</text>
            </g>
          );
        })}

        {/* Grouped Bars */}
        {data.map((d, idx) => {
          const groupX = getX(idx);
          const xDone = groupX + groupWidth * 0.1;
          const xProgress = groupX + groupWidth * 0.15 + barWidth;

          const yDone = getY(d.done);
          const yProgress = getY(d.inProgress);

          const hDone = chartHeight - (yDone - paddingY);
          const hProgress = chartHeight - (yProgress - paddingY);

          return (
            <g key={idx} className="group cursor-pointer">
              {/* Green Done Bar */}
              <rect
                x={xDone} y={yDone}
                width={barWidth} height={Math.max(hDone, 2)}
                rx="3"
                fill="#22c55e"
                className="transition-all duration-300 opacity-90 hover:opacity-100"
              />
              <text
                x={xDone + barWidth / 2} y={yDone - 5}
                textAnchor="middle"
                className="text-[8px] font-bold fill-green-700 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                {d.done}
              </text>

              {/* Blue In Progress Bar */}
              <rect
                x={xProgress} y={yProgress}
                width={barWidth} height={Math.max(hProgress, 2)}
                rx="3"
                fill="#3b82f6"
                className="transition-all duration-300 opacity-90 hover:opacity-100"
              />
              <text
                x={xProgress + barWidth / 2} y={yProgress - 5}
                textAnchor="middle"
                className="text-[8px] font-bold fill-blue-700 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                {d.inProgress}
              </text>

              {/* X Axis Label */}
              <text
                x={groupX + groupWidth / 2} y={height - 2}
                textAnchor="middle"
                className="text-[9px] font-medium fill-slate-400"
              >
                {d.nama_divisi}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

// ── Custom Line Chart (Progres Penyelesaian per Divisi) ────────────────────────
const CustomLineChart = ({ data = [] }) => {
  if (data.length === 0) return <p className="text-sm text-slate-400 text-center py-10 h-[180px] flex items-center justify-center">Belum ada data progres divisi.</p>;

  const width = 500;
  const height = 180;
  const paddingX = 40;
  const paddingY = 20;

  const chartWidth = width - paddingX * 2;
  const chartHeight = height - paddingY * 2;

  const getX = (idx) => paddingX + (idx * (data.length > 1 ? chartWidth / (data.length - 1) : chartWidth));
  const getY = (val) => paddingY + chartHeight - (val / 100) * chartHeight;

  let pathD = '';
  data.forEach((d, idx) => {
    const x = getX(idx);
    const y = getY(d.progress);
    if (idx === 0) {
      pathD = `M ${x} ${y}`;
    } else {
      pathD += ` L ${x} ${y}`;
    }
  });

  let areaD = '';
  if (data.length > 0) {
    areaD = `${pathD} L ${getX(data.length - 1)} ${paddingY + chartHeight} L ${getX(0)} ${paddingY + chartHeight} Z`;
  }

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full min-w-[300px] overflow-visible">
        <defs>
          <linearGradient id="lineChartGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.2"/>
            <stop offset="100%" stopColor="#4f46e5" stopOpacity="0"/>
          </linearGradient>
        </defs>

        {[0, 50, 100].map((grid, idx) => {
          const y = getY(grid);
          return (
            <g key={idx} className="opacity-10">
              <line x1={paddingX} y1={y} x2={width - paddingX} y2={y} stroke="#000" strokeWidth="1" strokeDasharray="3 3" />
              <text x={paddingX - 10} y={y + 4} textAnchor="end" className="text-[10px] font-bold fill-slate-700">{grid}%</text>
            </g>
          );
        })}

        {data.length > 1 && <path d={areaD} fill="url(#lineChartGrad)" />}

        {data.length > 1 && (
          <path
            d={pathD}
            fill="none"
            stroke="#4f46e5"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="drop-shadow-[0_2px_4px_rgba(79,70,229,0.2)]"
          />
        )}

        {data.map((d, idx) => {
          const x = getX(idx);
          const y = getY(d.progress);
          return (
            <g key={idx} className="group cursor-pointer">
              <circle
                cx={x} cy={y} r="4"
                fill="#4f46e5"
                stroke="#fff"
                strokeWidth="2"
                className="transition-all duration-300 group-hover:r-6"
              />
              <rect
                x={x - 40} y={y - 30} width="80" height="20" rx="5"
                fill="#1e293b"
                className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-lg"
              />
              <text
                x={x} y={y - 17}
                textAnchor="middle"
                className="text-[9px] font-bold fill-white opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200"
              >
                {d.progress}%
              </text>
              <text
                x={x} y={height - 2}
                textAnchor="middle"
                className="text-[9px] font-medium fill-slate-400"
              >
                {d.nama_divisi}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

// ── Main Dashboard Component ──────────────────────────────────────────────────
const DashboardEvent = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const userType = user?.user_type || 'PANITIA';

  // Polling setiap 5 detik sesuai FR-007
  const { data: dashboard, loading, error } = usePolling(taskApi.getDashboard, [id], 5000);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] gap-3">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
        <p className="text-sm text-slate-500">Memuat dashboard...</p>
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
      <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 rounded-2xl p-6 text-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold">{event?.nama_event || 'Dashboard Event'}</h2>
          <div className="flex items-center gap-3 mt-2">
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
              event?.status_event === 'AKTIF' ? 'bg-green-400/30 text-green-100' :
              event?.status_event === 'SELESAI' ? 'bg-white/20 text-white' :
              'bg-amber-400/30 text-amber-100'
            }`}>
              {event?.status_event}
            </span>
            <span className="flex items-center gap-1 text-indigo-200 text-xs">
              <Zap className="w-3 h-3" />
              Auto-refresh setiap 5 detik
            </span>
          </div>
        </div>
        {userType === 'PANITIA' && <CircularProgress percent={summary.overallProgress} />}
      </div>

      {/* Summary Cards */}
      {userType === 'PANITIA' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <SummaryCard
            icon={AlertCircle}
            label="Terlambat"
            value={summary.terlambat}
            iconBg="bg-red-50"
            iconColor="text-red-500"
          />
          <SummaryCard
            icon={UserX}
            label="Tidak Aktif"
            value={summary.tidakAktif}
            iconBg="bg-amber-50"
            iconColor="text-amber-500"
          />
          <SummaryCard
            icon={CheckCircle2}
            label="Tugas Selesai"
            value={`${summary.tugasSelesai}/${summary.totalTugas}`}
            iconBg="bg-green-50"
            iconColor="text-green-500"
          />
          <SummaryCard
            icon={TrendingUp}
            label="Total Divisi"
            value={summary.totalDivisi}
            iconBg="bg-indigo-50"
            iconColor="text-indigo-500"
          />
        </div>
      )}

      {/* ── VISUALISASI GRAFIK & STATISTIK (2x2 Grid) ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Pie/Donut Chart */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
              <PieChart className="w-4 h-4 text-indigo-500" />
              Distribusi Status Tugas (Seluruh Event)
            </h3>
            <CustomDonutChart summary={summary} />
          </div>
        </div>

        {/* Grouped Bar Chart (Selesai vs Sedang Dikerjakan) */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-green-500" />
              Tugas Selesai (🟢) vs Sedang Dikerjakan (🔵)
            </h3>
            <CustomGroupedBarChart data={divisiProgress} />
          </div>
        </div>

        {/* Bar Chart (Total Tugas) */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-indigo-500" />
              Jumlah Tugas per Divisi
            </h3>
            <CustomBarChart data={divisiProgress} />
          </div>
        </div>

        {/* Line Chart (Progres) */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-indigo-500" />
              Progres Proyek per Divisi (%)
            </h3>
            <CustomLineChart data={divisiProgress} />
          </div>
        </div>
      </div>

      {/* Main 2-column Grid */}
      <div className={(userType === 'PANITIA' || userType === 'VENDOR') ? "grid grid-cols-1 lg:grid-cols-2 gap-6" : "grid grid-cols-1 gap-6"}>
        {/* Progress per Divisi */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 mb-5 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-indigo-500" />
            Detail Progres Divisi
          </h3>
          {divisiProgress.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">Belum ada divisi dalam event ini.</p>
          ) : (
            divisiProgress.map((div, idx) => (
              <DivisiProgressItem 
                key={idx} 
                div={div} 
                showAnggota={userType === 'PANITIA'} 
              />
            ))
          )}
        </div>

        {/* Deadline Terdekat */}
        {(userType === 'PANITIA' || userType === 'VENDOR') && (
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 mb-5 flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-500" />
              Deadline Terdekat
            </h3>
            {upcomingDeadlines.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle2 className="w-10 h-10 text-green-200 mx-auto mb-2" />
                <p className="text-sm text-slate-400">Tidak ada deadline mendekat! 🎉</p>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingDeadlines.map(task => {
                  const daysLeft = Math.ceil((new Date(task.deadline) - new Date()) / (1000 * 60 * 60 * 24));
                  const isUrgent = daysLeft <= 3;
                  return (
                    <div
                      key={task.task_id}
                      className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer hover:shadow-sm transition group ${
                        isUrgent ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-slate-100 hover:border-indigo-200'
                      }`}
                      onClick={() => navigate(`/tasks/${task.task_id}`)}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-slate-900 text-sm truncate group-hover:text-indigo-700 transition">
                          {task.judul_tugas}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-slate-400">{task.divisi?.nama_divisi}</span>
                          <PrioritasBadge prioritas={task.prioritas} />
                        </div>
                      </div>
                      <div className="text-right shrink-0 ml-3">
                        <div className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-lg ${
                          isUrgent ? 'bg-red-100 text-red-700' : 'bg-amber-50 text-amber-700'
                        }`}>
                          <Calendar className="w-3 h-3" />
                          {daysLeft <= 0 ? 'Hari ini!' : `${daysLeft}h`}
                        </div>
                        <p className="text-xs text-slate-400 mt-1">
                          {new Date(task.deadline).toLocaleDateString('id-ID', { timeZone: 'Asia/Jakarta',  day: 'numeric', month: 'short' })}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardEvent;
