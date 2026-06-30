import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import api from '../../store/useAuthStore';
import { Search, Eye, Loader2, Filter, FileSpreadsheet, Users, ShieldCheck, CheckCircle, Upload, ChevronLeft, ChevronRight, Star, Trophy, School, Award, Tag } from 'lucide-react';
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
  const [jurusanFilter, setJurusanFilter] = useState('');
  const [sortFilter, setSortFilter] = useState('');
  const [jurusanList, setJurusanList] = useState([]);
  const [exporting, setExporting] = useState(false);
  const [stats, setStats] = useState({ totalPendaftar: 0, verified: 0, lulus: 0 });
  const abortControllerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
    }, 200);
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

  useEffect(() => {
    const fetchJurusan = async () => {
      try {
        const res = await api.get('/admin/jurusan');
        setJurusanList(res.data || []);
      } catch (error) {
        console.error('Failed to fetch jurusan list', error);
      }
    };
    fetchJurusan();
  }, []);

  const fetchStudents = async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setLoading(true);
    try {
      const res = await api.get('/admin/students', {
        params: { 
          page, 
          limit: 10, 
          search, 
          status: statusFilter, 
          lapor_diri: laporDiriFilter,
          jurusan: jurusanFilter,
          sort: sortFilter
        },
        signal: controller.signal
      });
      setStudents(res.data.data);
      setTotalPages(res.data.totalPages);
      setTotal(res.data.total);
    } catch (error) {
      if (error.name === 'CanceledError' || error.message === 'canceled') {
        return;
      }
      console.error('Failed to fetch students', error);
    } finally {
      if (abortControllerRef.current === controller) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [page, search, statusFilter, laporDiriFilter, jurusanFilter, sortFilter]);

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

  const getJurusanBadge = useCallback((code) => {
    const map = {
      'AKL': 'bg-gradient-to-r from-emerald-500/10 to-teal-500/10 text-emerald-700 border-emerald-500/20',
      'DKV': 'bg-gradient-to-r from-fuchsia-500/10 to-pink-500/10 text-fuchsia-700 border-fuchsia-500/20',
      'MPLB': 'bg-gradient-to-r from-blue-500/10 to-indigo-500/10 text-blue-700 border-blue-500/20',
    };
    return map[code] || 'bg-slate-100 text-slate-700 border-slate-200';
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
      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-soft p-6 space-y-4">
        <div className="relative w-full">
          <Search className="w-4.5 h-4.5 absolute left-4.5 top-1/2 transform -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Cari berdasarkan nama lengkap, NISN, atau Nomor Pendaftaran..." 
            value={searchInput}
            onChange={(e) => { setSearchInput(e.target.value); setPage(1); }}
            className="w-full pl-11 pr-4 py-3 bg-slate-50/50 hover:bg-slate-50 focus:bg-white border-2 border-slate-100 hover:border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-2xl text-sm font-semibold transition-all outline-none text-slate-800 placeholder:text-slate-400 shadow-inner-sm font-medium"
          />
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
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

          {/* Jurusan Filter */}
          <div className="flex items-center gap-2 bg-slate-50/50 hover:bg-slate-50 border-2 border-slate-100 rounded-2xl px-4 py-2 transition-all">
            <Star size={14} className="text-slate-400" />
            <select
              value={jurusanFilter}
              onChange={(e) => { setJurusanFilter(e.target.value); setPage(1); }}
              className="pr-6 py-1 font-bold text-xs text-slate-700 bg-transparent outline-none cursor-pointer border-none"
            >
              <option value="">Semua Jurusan</option>
              {jurusanList.map((j) => (
                <option key={j.id} value={j.code}>{j.code}</option>
              ))}
            </select>
          </div>

          {/* Sort Filter */}
          <div className="flex items-center gap-2 bg-slate-50/50 hover:bg-slate-50 border-2 border-slate-100 rounded-2xl px-4 py-2 transition-all">
            <Trophy size={14} className="text-amber-500" />
            <select
              value={sortFilter}
              onChange={(e) => { setSortFilter(e.target.value); setPage(1); }}
              className="pr-6 py-1 font-bold text-xs text-slate-700 bg-transparent outline-none cursor-pointer border-none"
            >
              <option value="">Urutkan: Default</option>
              <option value="ranking">Urutkan: Peringkat</option>
              <option value="nama">Urutkan: Nama (A-Z)</option>
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
                        {/* Avatar box with initials and soft gradient */}
                        <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-500 to-blue-600 text-white flex items-center justify-center font-black text-sm shadow-md shadow-indigo-100 shrink-0">
                          {student.nama_lengkap?.substring(0, 2).toUpperCase()}
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-black text-slate-800 tracking-tight leading-none uppercase">
                            {student.nama_lengkap}
                          </p>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded border border-slate-200/60 font-mono">
                              NISN: {student.nisn || '-'}
                            </span>
                            <span className="inline-flex items-center gap-1 text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100 font-mono">
                              <Tag size={10} className="text-indigo-500" />
                              {student.registration?.no_pendaftaran}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
                          <School size={15} className="text-slate-400 shrink-0" />
                          <span className="truncate max-w-[200px]">{student.asal_sekolah || '-'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sidanira:</span>
                          <span className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 font-mono">
                            <Award size={10} className="text-emerald-500" />
                            {student.nilai_rata_rata ? parseFloat(student.nilai_rata_rata).toFixed(2) : '0.00'}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-2xl border font-black text-xs uppercase tracking-wider shadow-sm transition-all duration-300 ${getJurusanBadge(student.jurusan_pilihan)}`}>
                        <Star size={13} className="fill-current" />
                        {student.jurusan_pilihan || 'BELUM PILIH'}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col gap-2">
                        <span className={`inline-flex self-start px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border shadow-sm ${getStatusBadge(student.registration?.status || 'PENDING')}`}>
                          {student.registration?.status === 'VERIFIED' ? 'TERVERIFIKASI' : student.registration?.status || 'PENDING'}
                        </span>
                        <div>
                          {student.registration?.lapor_diri ? (
                            <span className="inline-flex items-center gap-1.5 text-[10px] font-black text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100 uppercase tracking-wider leading-none">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              Sudah Lapor
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 text-[10px] font-black text-slate-400 bg-slate-50 px-2.5 py-1 rounded-full border border-slate-200/60 uppercase tracking-wider leading-none">
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                              Belum Lapor
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex justify-center">
                        <button 
                          onClick={() => setSelectedStudentId(student.id)}
                          className="flex items-center gap-2 px-4.5 py-2.5 text-xs font-black text-indigo-600 hover:text-white bg-white hover:bg-indigo-600 border border-slate-200 hover:border-indigo-600 rounded-xl shadow-premium-sm transition-all duration-300 active:scale-95 group cursor-pointer"
                          title="Lihat Detail Pendaftar"
                        >
                          <Eye className="w-4 h-4 transition-transform group-hover:scale-110" />
                          <span>DETAIL</span>
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
