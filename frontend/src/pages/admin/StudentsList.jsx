import React, { useState, useEffect, useMemo, useCallback } from 'react';
import api from '../../store/useAuthStore';
import { Search, Eye, Loader2, Filter, FileSpreadsheet, Users, ShieldCheck, CheckCircle, Upload, ChevronLeft, ChevronRight, Star } from 'lucide-react';
import StudentDetailModal from './StudentDetailModal';

const StudentsList = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [laporDiriFilter, setLaporDiriFilter] = useState('');
  const [exporting, setExporting] = useState(false);
  const [stats, setStats] = useState({ totalPendaftar: 0, verified: 0, lulus: 0 });

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const fetchStats = async () => {
    try {
      const res = await api.get('/admin/dashboard');
      setStats({
        totalPendaftar: res.data.totalPendaftar || 0,
        verified: res.data.verified || 0,
        lulus: res.data.lulus || 0
      });
    } catch (error) {
      console.error('Failed to fetch dashboard stats', error);
    }
  };

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/students', {
        params: { page, limit: 10, search, status: statusFilter, lapor_diri: laporDiriFilter }
      });
      setStudents(res.data.data);
      setTotalPages(res.data.totalPages);
      setTotal(res.data.total);
    } catch (error) {
      console.error('Failed to fetch students', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [page, search, statusFilter, laporDiriFilter]);

  useEffect(() => {
    fetchStats();
  }, []);

  const handleExport = async () => {
    setExporting(true);
    try {
      const response = await api.get('/admin/export', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'DATA_PENDAFTAR_SPMB_2026.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed', error);
      alert('Gagal mendownload data.');
    } finally {
      setExporting(false);
    }
  };

  const getStatusBadge = useCallback((status) => {
    const styles = {
      'LULUS': 'bg-emerald-50 text-emerald-700 border-emerald-100',
      'VERIFIED': 'bg-blue-50 text-blue-700 border-blue-100',
      'TIDAK LULUS': 'bg-rose-50 text-rose-700 border-rose-100',
      'PENDING': 'bg-amber-50 text-amber-700 border-amber-100',
    };
    return styles[status] || styles['PENDING'];
  }, []);

  const quickStats = useMemo(() => [
    { label: 'Total Pendaftar', value: stats.totalPendaftar, icon: Users, color: 'blue' },
    { label: 'Terverifikasi', value: stats.verified, icon: ShieldCheck, color: 'indigo' },
    { label: 'Siswa Lulus', value: stats.lulus, icon: CheckCircle, color: 'emerald' },
  ], [stats.totalPendaftar, stats.verified, stats.lulus]);

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <Users className="w-8 h-8 text-indigo-600" />
            Data Pendaftar
          </h1>
          <p className="text-slate-500 font-medium mt-1">
            Manajemen data calon siswa baru Tahun Pelajaran 2026/2027
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <button 
            onClick={handleExport}
            disabled={exporting}
            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold transition-all shadow-lg shadow-indigo-100 active:scale-95 disabled:opacity-70 text-sm"
          >
            {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileSpreadsheet className="w-4 h-4" />}
            Export Excel
          </button>
          <div className="w-[1px] h-8 bg-slate-200 mx-2 hidden sm:block" />
          <button 
            className="flex items-center gap-2 px-6 py-3 bg-white border-2 border-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-50 transition-all shadow-sm active:scale-95 text-sm"
            onClick={() => alert('Fitur impor tersedia melalui panel khusus')}
          >
            <Upload className="w-4 h-4" />
            Import Data
          </button>
        </div>
      </div>

      {/* Quick Stats Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {quickStats.map((stat, i) => {
          const Icon = stat.icon;
          const colorMap = {
            blue: 'bg-blue-50 text-blue-600 border-blue-100',
            indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100',
            emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
          };
          return (
            <div 
              key={i} 
              className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-soft hover:shadow-premium transition-all duration-500 hover:-translate-y-1 group flex items-center gap-5"
            >
              <div className={`w-14 h-14 rounded-2xl ${colorMap[stat.color]} flex items-center justify-center transition-transform duration-500 group-hover:scale-110`}>
                <Icon size={26} />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{stat.label}</p>
                <p className="text-3xl font-black text-slate-900 tracking-tight">{stat.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Advanced Filters */}
      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-soft p-5 flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-4.5 top-1/2 transform -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Cari berdasarkan nama lengkap atau NISN..." 
            value={searchInput}
            onChange={(e) => { setSearchInput(e.target.value); setPage(1); }}
            className="w-full pl-11 pr-4 py-3 bg-slate-50/50 hover:bg-slate-50 focus:bg-white border-2 border-slate-100 hover:border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-2xl text-sm font-semibold transition-all outline-none text-slate-800 placeholder:text-slate-400 shadow-inner-sm"
          />
        </div>
        
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Status Filter */}
          <div className="flex items-center gap-2 bg-slate-50/50 hover:bg-slate-50 border-2 border-slate-100 rounded-2xl px-4 py-2 transition-all">
            <Filter size={14} className="text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="pr-6 py-1 font-bold text-xs text-slate-700 bg-transparent outline-none cursor-pointer border-none"
            >
              <option value="">Semua Status</option>
              <option value="PENDING">Pending</option>
              <option value="VERIFIED">Terverifikasi</option>
              <option value="LULUS">Lulus</option>
              <option value="TIDAK LULUS">Tidak Lulus</option>
            </select>
          </div>

          {/* Lapor Diri Filter */}
          <div className="flex items-center gap-2 bg-slate-50/50 hover:bg-slate-50 border-2 border-slate-100 rounded-2xl px-4 py-2 transition-all">
            <Users size={14} className="text-slate-400" />
            <select
              value={laporDiriFilter}
              onChange={(e) => { setLaporDiriFilter(e.target.value); setPage(1); }}
              className="pr-6 py-1 font-bold text-xs text-slate-700 bg-transparent outline-none cursor-pointer border-none"
            >
              <option value="">Status Lapor Diri</option>
              <option value="true">Sudah Lapor</option>
              <option value="false">Belum Lapor</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="bg-white rounded-[2rem] shadow-xl shadow-slate-100 border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80">
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Identitas Siswa</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Informasi Sekolah</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Program Studi</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Status Verifikasi</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-24 text-center">
                    <Loader2 className="w-10 h-10 animate-spin mx-auto text-indigo-500 mb-4" />
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Mensinkronisasi Data...</p>
                  </td>
                </tr>
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-24 text-center">
                    <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-200">
                      <Search size={40} />
                    </div>
                    <p className="text-slate-900 font-black text-xl mb-1">Pendaftar Tidak Ditemukan</p>
                    <p className="text-slate-400 font-medium">Coba gunakan kata kunci lain atau reset filter pencarian Anda</p>
                  </td>
                </tr>
              ) : (
                students.map((student) => (
                  <tr key={student.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-black text-xs shadow-inner shrink-0">
                          {student.nama_lengkap?.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-black text-slate-800 leading-tight mb-0.5">{student.nama_lengkap?.toUpperCase()}</p>
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] font-bold text-slate-400">NISN: {student.nisn || '-'}</span>
                            <span className="text-[9px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100">ID: {student.registration?.no_pendaftaran}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <p className="text-sm font-bold text-slate-700 leading-tight">{student.asal_sekolah || '-'}</p>
                      <p className="text-[10px] font-medium text-slate-400 mt-1 uppercase">Sidanira: <span className="font-black text-slate-600">{student.nilai_rata_rata || '0.00'}</span></p>
                    </td>
                    <td className="px-6 py-5">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-100">
                        <Star size={12} className="fill-indigo-700" />
                        <span className="text-[10px] font-black tracking-tight">{student.jurusan_pilihan || 'BELUM PILIH'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col gap-2">
                        <span className={`inline-flex self-start px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${getStatusBadge(student.registration?.status || 'PENDING')}`}>
                          {student.registration?.status || 'PENDING'}
                        </span>
                        <div className="flex items-center gap-2">
                          {student.registration?.lapor_diri ? (
                            <span className="flex items-center gap-1 text-[9px] font-black text-emerald-600 uppercase tracking-tighter">
                              <CheckCircle size={10} /> Sudah Lapor
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-[9px] font-black text-slate-400 uppercase tracking-tighter">
                              <Loader2 size={10} /> Belum Lapor
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex justify-center">
                        <button 
                          onClick={() => setSelectedStudentId(student.id)}
                          className="p-2.5 text-indigo-600 hover:bg-indigo-50 rounded-xl transition shadow-sm border border-slate-100 bg-white hover:border-indigo-200 flex items-center justify-center"
                          title="Lihat Detail Pendaftar"
                        >
                          <Eye className="w-4.5 h-4.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Modern Pagination */}
        {!loading && totalPages > 1 && (
          <div className="px-6 py-4 bg-slate-50/60 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs font-semibold text-slate-400">
              Menampilkan <span className="text-slate-700 font-bold">{(page-1)*10 + 1}-{Math.min(page*10, total)}</span> dari <span className="text-slate-700 font-bold">{total}</span> pendaftar
            </p>
            <div className="flex items-center gap-2">
              <button 
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
                className="w-10 h-10 flex items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:text-indigo-600 hover:border-indigo-500 disabled:opacity-30 disabled:hover:bg-white disabled:hover:text-slate-500 disabled:hover:border-slate-200 transition-all active:scale-95"
              >
                <ChevronLeft size={16} />
              </button>
              
              <div className="flex items-center px-4.5 py-2 bg-white rounded-xl border border-slate-200 font-black text-xs text-slate-700 shadow-sm">
                {page} <span className="text-slate-300 mx-1">/</span> {totalPages}
              </div>

              <button 
                disabled={page === totalPages}
                onClick={() => setPage(p => p + 1)}
                className="w-10 h-10 flex items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:text-indigo-600 hover:border-indigo-500 disabled:opacity-30 disabled:hover:bg-white disabled:hover:text-slate-500 disabled:hover:border-slate-200 transition-all active:scale-95"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {selectedStudentId && (
        <StudentDetailModal 
          studentId={selectedStudentId} 
          onClose={() => setSelectedStudentId(null)} 
          onUpdate={() => {
            fetchStudents();
            fetchStats();
          }}
        />
      )}
    </div>
  );
};

export default StudentsList;
