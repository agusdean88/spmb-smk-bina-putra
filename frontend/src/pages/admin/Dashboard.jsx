import { useState, useEffect } from 'react';
import api from '../../store/useAuthStore';
import { Users, FileCheck, Clock, Award, Loader2, TrendingUp, CalendarDays, UserCheck, ChevronRight, CheckCircle2, XCircle, Search } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

// --- Components ---

const StatCard = ({ title, value, icon: Icon, trend, trendValue, color, delay }) => {
  const colorMap = {
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    purple: 'bg-purple-50 text-purple-600 border-purple-100',
    cyan: 'bg-cyan-50 text-cyan-600 border-cyan-100',
  };

  return (
    <div 
      className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-soft hover:shadow-premium transition-all duration-500 hover:-translate-y-1 animate-fade-in-up group flex flex-col"
      style={{ animationDelay: delay }}
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-2xl ${colorMap[color]} transition-transform duration-500 group-hover:scale-110`}>
          <Icon className="w-6 h-6" />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${trend === 'up' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
            <TrendingUp className={`w-3 h-3 ${trend === 'down' ? 'rotate-180' : ''}`} />
            {trendValue}
          </div>
        )}
      </div>
      <div>
        <h3 className="text-3xl font-black text-slate-900 tracking-tight mb-1">{value}</h3>
        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">{title}</p>
      </div>
    </div>
  );
};

// --- Constants ---

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalPendaftar: 0,
    verified: 0,
    pending: 0,
    lulus: 0,
    laporDiri: 0,
    jurusanData: [],
    recentRegistrations: [],
    registrationData: []
  });
  const [loading, setLoading] = useState(true);
  const [downloadingLaporan, setDownloadingLaporan] = useState(false);
  const [downloadingBuku, setDownloadingBuku] = useState(false);

  const handleUnduhLaporan = async () => {
    setDownloadingLaporan(true);
    try {
      const response = await api.get('/admin/laporan/export-pdf', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'Laporan_Penerimaan_SPMB_2026.pdf');
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (error) {
      console.error('Download error:', error);
      alert('Gagal mengunduh laporan PDF');
    } finally {
      setDownloadingLaporan(false);
    }
  };

  const handleUnduhBukuPendaftaran = async () => {
    setDownloadingBuku(true);
    try {
      const response = await api.get('/admin/export', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'DATA_PENDAFTAR_SPMB_2026.xlsx');
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (error) {
      console.error('Download error:', error);
      alert('Gagal mengunduh Buku Pendaftaran (Excel)');
    } finally {
      setDownloadingBuku(false);
    }
  };

  useEffect(() => {
    const fetchStats = async (isInitial = false) => {
      try {
        if (isInitial) setLoading(true);
        const res = await api.get('/admin/dashboard');
        setStats(res.data);
      } catch (error) {
        console.error('Failed to fetch stats', error);
      } finally {
        if (isInitial) setLoading(false);
      }
    };

    // Fetch awal dengan loading indicator
    fetchStats(true);

    // Polling data setiap 30 detik secara background (tanpa loading penuh)
    const intervalId = setInterval(() => {
      fetchStats(false);
    }, 30000);

    // Cleanup interval saat komponen di-unmount
    return () => clearInterval(intervalId);
  }, []);

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-600/10 border-t-blue-600 rounded-full animate-spin" />
          <p className="text-slate-400 font-bold text-xs uppercase tracking-[0.2em] animate-pulse">Memuat Dashboard...</p>
        </div>
      </div>
    );
  }

  const today = new Date().toLocaleDateString('id-ID', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  });

  const pieData = [
    { name: 'Pending', value: stats.pending || 1 },
    { name: 'Verified', value: stats.verified || 1 },
    { name: 'Lulus', value: stats.lulus || 1 }
  ];

  const getStatusBadge = (status) => {
    switch (status) {
      case 'LULUS': return <span className="px-3 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-black rounded-full uppercase tracking-widest border border-emerald-100 flex items-center gap-1 w-max"><CheckCircle2 size={12}/> Lulus</span>;
      case 'TIDAK LULUS': return <span className="px-3 py-1 bg-rose-50 text-rose-600 text-[10px] font-black rounded-full uppercase tracking-widest border border-rose-100 flex items-center gap-1 w-max"><XCircle size={12}/> Ditolak</span>;
      case 'VERIFIED': return <span className="px-3 py-1 bg-blue-50 text-blue-600 text-[10px] font-black rounded-full uppercase tracking-widest border border-blue-100 flex items-center gap-1 w-max"><FileCheck size={12}/> Verified</span>;
      default: return <span className="px-3 py-1 bg-amber-50 text-amber-600 text-[10px] font-black rounded-full uppercase tracking-widest border border-amber-100 flex items-center gap-1 w-max"><Clock size={12}/> Pending</span>;
    }
  };

  return (
    <div className="space-y-8 pb-10">
      
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div>
          <h2 className="text-3xl lg:text-4xl font-black text-slate-900 tracking-tight mb-2">Overview Ringkasan</h2>
          <div className="flex items-center space-x-2 text-slate-500 text-sm font-bold">
            <CalendarDays className="w-4 h-4" />
            <span>{today}</span>
          </div>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={handleUnduhLaporan}
            disabled={downloadingLaporan}
            className="flex items-center gap-2 px-6 py-3 bg-white text-slate-700 font-bold rounded-2xl border border-slate-200 shadow-sm hover:bg-slate-50 transition-colors text-sm disabled:opacity-50"
          >
            {downloadingLaporan && <Loader2 className="w-4 h-4 animate-spin" />}
            Unduh Laporan
          </button>
          <button 
            onClick={handleUnduhBukuPendaftaran}
            disabled={downloadingBuku}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-bold rounded-2xl shadow-lg shadow-blue-200 hover:bg-blue-700 transition-colors text-sm disabled:opacity-50"
          >
            {downloadingBuku && <Loader2 className="w-4 h-4 animate-spin" />}
            Buku Pendaftaran
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
        <StatCard title="Pendaftar" value={stats.totalPendaftar} icon={Users} color="blue" trend="up" trendValue="+12%" delay="0s" />
        <StatCard title="Pending" value={stats.pending} icon={Clock} color="amber" delay="0.1s" />
        <StatCard title="Terverifikasi" value={stats.verified} icon={FileCheck} color="emerald" trend="up" trendValue="+5%" delay="0.2s" />
        <StatCard title="Lulus" value={stats.lulus} icon={Award} color="purple" delay="0.3s" />
        <StatCard title="Lapor Diri" value={stats.laporDiri} icon={UserCheck} color="cyan" delay="0.4s" />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Line Chart */}
        <div className="lg:col-span-2 bg-white rounded-[2rem] p-8 border border-slate-100 shadow-soft">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h3 className="text-xl font-black text-slate-900">Tren Pendaftaran</h3>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">7 Hari Terakhir</p>
            </div>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.registrationData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorPendaftar" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8', fontWeight: 'bold' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8', fontWeight: 'bold' }} />
                <RechartsTooltip 
                  contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)', fontWeight: 'bold' }}
                />
                <Area type="monotone" dataKey="pendaftar" stroke="#3b82f6" strokeWidth={4} fillOpacity={1} fill="url(#colorPendaftar)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart */}
        <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-soft flex flex-col">
          <div>
            <h3 className="text-xl font-black text-slate-900">Proporsi Status</h3>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Distribusi pendaftar</p>
          </div>
          <div className="flex-1 min-h-[250px] relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  <Cell fill="#f59e0b" /> {/* Pending Amber */}
                  <Cell fill="#3b82f6" /> {/* Verified Blue */}
                  <Cell fill="#10b981" /> {/* Lulus Emerald */}
                </Pie>
                <RechartsTooltip contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', fontWeight: 'bold' }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none flex-col">
              <span className="text-3xl font-black text-slate-900">{stats.totalPendaftar}</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total</span>
            </div>
          </div>
          <div className="flex justify-center gap-4 mt-2">
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-amber-500"></div><span className="text-xs font-bold text-slate-600">Pending</span></div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-blue-500"></div><span className="text-xs font-bold text-slate-600">Verified</span></div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-emerald-500"></div><span className="text-xs font-bold text-slate-600">Lulus</span></div>
          </div>
        </div>
      </div>

      {/* Bottom Section: Bar Chart & Recent Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Jurusan Bar Chart */}
        <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-soft">
          <div className="mb-8">
            <h3 className="text-xl font-black text-slate-900">Minat Jurusan</h3>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Berdasarkan pilihan 1</p>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.jurusanData} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8', fontWeight: 'bold' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8', fontWeight: 'bold' }} />
                <RechartsTooltip cursor={{fill: '#f8fafc'}} contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', fontWeight: 'bold' }} />
                <Bar dataKey="pendaftar" fill="#818cf8" radius={[6, 6, 0, 0]}>
                  {(stats.jurusanData || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Registrations Table */}
        <div className="lg:col-span-2 bg-white rounded-[2rem] border border-slate-100 shadow-soft overflow-hidden flex flex-col">
          <div className="p-8 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-xl font-black text-slate-900">Pendaftar Terbaru</h3>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Data masuk hari ini</p>
            </div>
            <button className="text-sm font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1">
              Lihat Semua <ChevronRight size={16} />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <th className="p-4 pl-8 border-b border-slate-100">Nama Lengkap</th>
                  <th className="p-4 border-b border-slate-100">Jurusan</th>
                  <th className="p-4 border-b border-slate-100">Status</th>
                  <th className="p-4 pr-8 border-b border-slate-100 text-right">Waktu</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {(stats.recentRegistrations || []).length > 0 ? (
                  stats.recentRegistrations.map((item, idx) => (
                    <tr key={item.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors group">
                      <td className="p-4 pl-8">
                        <p className="font-bold text-slate-900">{item.name}</p>
                        <p className="text-[10px] font-bold text-slate-400 font-mono mt-0.5">{item.nisn}</p>
                      </td>
                      <td className="p-4 font-bold text-slate-600">{item.jurusan}</td>
                      <td className="p-4">{getStatusBadge(item.status)}</td>
                      <td className="p-4 pr-8 text-right font-medium text-slate-400 text-xs">
                        {item.date}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="p-8 text-center text-slate-400 font-bold">Belum ada data pendaftar.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

    </div>
  );
};

export default AdminDashboard;
