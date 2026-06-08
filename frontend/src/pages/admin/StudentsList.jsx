import React, { useState, useEffect } from 'react';
import api from '../../store/useAuthStore';
import { Search, Download, Eye, Loader2, Filter, FileSpreadsheet, Users, ShieldCheck, CheckCircle, Upload, ChevronLeft, ChevronRight, Star, XCircle, MoreVertical } from 'lucide-react';
import StudentDetailModal from './StudentDetailModal';

const StudentsList = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [laporDiriFilter, setLaporDiriFilter] = useState('');
  const [exporting, setExporting] = useState(false);
  const [stats, setStats] = useState({ verified: 0, lulus: 0 });

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/students', {
        params: { page, limit: 10, search, status: statusFilter, lapor_diri: laporDiriFilter }
      });
      setStudents(res.data.data);
      setTotalPages(res.data.totalPages);
      setTotal(res.data.total);
      
      // Basic stats calculation
      if (page === 1 && !search && !statusFilter) {
         const verifiedCount = res.data.data.filter(s => s.registration?.status === 'VERIFIED').length;
         const lulusCount = res.data.data.filter(s => s.registration?.status === 'LULUS').length;
         setStats({ verified: verifiedCount, lulus: lulusCount });
      }
    } catch (error) {
      console.error('Failed to fetch students', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [page, search, statusFilter, laporDiriFilter]);

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

  const getStatusBadge = (status) => {
    const styles = {
      'LULUS': 'bg-emerald-100 text-emerald-800 border-emerald-200 shadow-sm',
      'VERIFIED': 'bg-blue-100 text-blue-800 border-blue-200 shadow-sm',
      'TIDAK LULUS': 'bg-rose-100 text-rose-800 border-rose-200 shadow-sm',
      'PENDING': 'bg-amber-100 text-amber-800 border-amber-200 shadow-sm',
    };
    return styles[status] || styles['PENDING'];
  };

  const quickStats = [
    { label: 'Total Pendaftar', value: total, icon: Users, color: 'blue' },
    { label: 'Terverifikasi', value: stats.verified, icon: ShieldCheck, color: 'indigo' },
    { label: 'Siswa Lulus', value: stats.lulus, icon: CheckCircle, color: 'emerald' },
  ];

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Data Pendaftar</h1>
          <p className="text-slate-500 font-medium mt-1">
            Manajemen data calon siswa baru Tahun Pelajaran 2026/2027
          </p>
        </div>
        
        <div className="flex flex-wrap gap-3">
          <button 
            onClick={handleExport}
            disabled={exporting}
            className="flex items-center gap-2 px-6 py-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-bold transition-all shadow-xl shadow-slate-200 active:scale-95 disabled:opacity-70"
          >
            {exporting ? <Loader2 className="w-5 h-5 animate-spin" /> : <FileSpreadsheet className="w-5 h-5" />}
            Export Excel
          </button>
          <div className="w-[1px] h-12 bg-slate-200 mx-2 hidden sm:block" />
          <button 
            className="flex items-center gap-2 px-6 py-3.5 bg-white border-2 border-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-50 transition-all shadow-sm active:scale-95"
            onClick={() => alert('Fitur impor tersedia melalui panel khusus')}
          >
            <Upload className="w-5 h-5" />
            Import Data
          </button>
        </div>
      </div>

      {/* Quick Stats Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         {quickStats.map((stat, i) => {
            const Icon = stat.icon;
            return (
               <div key={i} className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm hover:shadow-lg hover:shadow-slate-100 transition-all duration-300 group">
                  <div className="flex items-center gap-5">
                     <div className={`w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-600 group-hover:scale-110 transition-transform`}>
                        <Icon size={28} />
                     </div>
                     <div>
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
                        <p className="text-3xl font-black text-slate-900">{stat.value}</p>
                     </div>
                  </div>
               </div>
            );
         })}
      </div>

      {/* Main Table Container */}
      <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-100 border border-slate-100 overflow-hidden">
        {/* Advanced Filters */}
        <div className="p-8 border-b border-slate-100 bg-slate-50/30 flex flex-col lg:flex-row items-center gap-6">
          <div className="relative flex-1 w-full group">
            <Search className="w-5 h-5 absolute left-5 top-1/2 transform -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
            <input 
              type="text" 
              placeholder="Cari berdasarkan nama lengkap atau NISN..." 
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-14 pr-6 py-4 bg-white border-2 border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-50 focus:border-blue-500 font-medium text-slate-700 outline-none transition-all placeholder:text-slate-300"
            />
          </div>
          
          <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto">
            <div className="flex items-center gap-3 bg-white p-2 rounded-2xl border-2 border-slate-100">
               <div className="p-2 rounded-xl bg-slate-50 text-slate-400">
                  <Filter size={18} />
               </div>
               <select
                 value={statusFilter}
                 onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                 className="pr-8 pl-1 py-1 font-bold text-sm text-slate-700 bg-transparent outline-none cursor-pointer"
               >
                 <option value="">Semua Status</option>
                 <option value="PENDING">Pending</option>
                 <option value="VERIFIED">Terverifikasi</option>
                 <option value="LULUS">Lulus</option>
                 <option value="TIDAK LULUS">Tidak Lulus</option>
               </select>
            </div>

            <div className="flex items-center gap-3 bg-white p-2 rounded-2xl border-2 border-slate-100">
               <div className="p-2 rounded-xl bg-slate-50 text-slate-400">
                  <Users size={18} />
               </div>
               <select
                 value={laporDiriFilter}
                 onChange={(e) => { setLaporDiriFilter(e.target.value); setPage(1); }}
                 className="pr-8 pl-1 py-1 font-bold text-sm text-slate-700 bg-transparent outline-none cursor-pointer"
               >
                 <option value="">Status Lapor Diri</option>
                 <option value="true">Sudah Lapor</option>
                 <option value="false">Belum Lapor</option>
               </select>
            </div>
          </div>
        </div>

        {/* Professional Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80">
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Identitas Siswa</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Informasi Sekolah</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Program Studi</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Status Akun</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 text-center">Detail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-8 py-32 text-center">
                    <Loader2 className="w-10 h-10 animate-spin mx-auto text-blue-600 mb-4" />
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Mensinkronisasi Data...</p>
                  </td>
                </tr>
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-8 py-32 text-center">
                    <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-200">
                      <Search size={40} />
                    </div>
                    <p className="text-slate-900 font-black text-xl mb-1">Pendaftar Tidak Ditemukan</p>
                    <p className="text-slate-400 font-medium">Coba gunakan kata kunci lain atau reset filter pencarian Anda</p>
                  </td>
                </tr>
              ) : (
                students.map((student) => (
                  <tr key={student.id} className="hover:bg-slate-50 transition-all group border-l-4 border-l-transparent hover:border-l-blue-500">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                         <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 font-black text-xs shadow-inner">
                            {student.nama_lengkap?.substring(0, 2).toUpperCase()}
                         </div>
                         <div>
                            <p className="text-sm font-black text-slate-900 leading-tight mb-1">{student.nama_lengkap?.toUpperCase()}</p>
                            <div className="flex items-center gap-2">
                               <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">NISN: {student.nisn || '-'}</span>
                               <span className="text-[10px] font-bold text-blue-500 bg-blue-50 px-2 py-0.5 rounded-md uppercase tracking-tighter">ID: {student.registration?.no_pendaftaran}</span>
                            </div>
                         </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                       <p className="text-sm font-bold text-slate-700 leading-tight">{student.asal_sekolah || '-'}</p>
                       <p className="text-[10px] font-medium text-slate-400 mt-1 uppercase">Sidanira: <span className="font-black text-slate-600">{student.nilai_rata_rata || '0.00'}</span></p>
                    </td>
                    <td className="px-8 py-6">
                      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-indigo-50/50 text-indigo-700 border border-indigo-100">
                        <Star size={14} className="fill-indigo-700" />
                        <span className="text-xs font-black tracking-tight">{student.jurusan_pilihan || 'BELUM PILIH'}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                       <div className="flex flex-col gap-2">
                          <span className={`inline-flex self-start px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${getStatusBadge(student.registration?.status || 'PENDING')}`}>
                            {student.registration?.status || 'PENDING'}
                          </span>
                          <div className="flex items-center gap-2">
                             {student.registration?.lapor_diri ? (
                               <span className="flex items-center gap-1 text-[10px] font-black text-emerald-600 uppercase tracking-tighter">
                                 <CheckCircle size={12} /> Sudah Lapor
                               </span>
                             ) : (
                               <span className="flex items-center gap-1 text-[10px] font-black text-slate-300 uppercase tracking-tighter">
                                 <MoreVertical size={12} /> Belum Lapor
                               </span>
                             )}
                          </div>
                       </div>
                    </td>
                    <td className="px-8 py-6 text-center">
                      <button 
                        onClick={() => setSelectedStudentId(student.id)}
                        className="w-12 h-12 bg-white hover:bg-blue-600 text-blue-600 hover:text-white rounded-2xl shadow-sm hover:shadow-blue-200 border-2 border-slate-100 hover:border-blue-600 transition-all flex items-center justify-center group/btn active:scale-90"
                      >
                        <Eye className="w-5 h-5 transition-transform group-hover/btn:scale-110" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Modern Pagination */}
        {!loading && totalPages > 1 && (
          <div className="px-8 py-6 bg-slate-50/50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm font-medium text-slate-400">
              Menampilkan <span className="text-slate-900 font-black">{(page-1)*10 + 1}-{Math.min(page*10, total)}</span> dari <span className="text-slate-900 font-black">{total}</span> Pendaftar
            </p>
            <div className="flex items-center gap-2">
              <button 
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
                className="w-12 h-12 flex items-center justify-center rounded-2xl border-2 border-slate-200 text-slate-400 hover:bg-white hover:text-blue-600 hover:border-blue-500 disabled:opacity-20 disabled:hover:bg-transparent transition-all"
              >
                <ChevronLeft size={20} />
              </button>
              
              <div className="flex items-center px-4 py-2 bg-white rounded-2xl border-2 border-slate-200 font-black text-sm text-slate-700">
                 {page} / {totalPages}
              </div>

              <button 
                disabled={page === totalPages}
                onClick={() => setPage(p => p + 1)}
                className="w-12 h-12 flex items-center justify-center rounded-2xl border-2 border-slate-200 text-slate-400 hover:bg-white hover:text-blue-600 hover:border-blue-500 disabled:opacity-20 disabled:hover:bg-transparent transition-all"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        )}
      </div>

      {selectedStudentId && (
        <StudentDetailModal 
          studentId={selectedStudentId} 
          onClose={() => setSelectedStudentId(null)} 
          onUpdate={fetchStudents}
        />
      )}
    </div>
  );
};

export default StudentsList;
