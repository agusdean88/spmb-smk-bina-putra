import React, { useState, useEffect } from 'react';
import api from '../../store/useAuthStore';
import { Loader2, BarChart2, TrendingUp, CheckCircle, XCircle, Clock, ShieldCheck, FileText, Download } from 'lucide-react';

const Laporan = () => {
  const [laporan, setLaporan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const fetchLaporan = async () => {
      try {
        const res = await api.get('/admin/laporan');
        setLaporan(res.data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchLaporan();
  }, []);

  const handleExportPDF = async () => {
    try {
      setExporting(true);
      const response = await api.get('/admin/laporan/export-pdf', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Laporan_Penerimaan_SPMB_2026.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      alert('Gagal mengunduh laporan PDF');
    } finally {
      setExporting(false);
    }
  };

  if (loading) return (
    <div className="flex h-full justify-center items-center">
      <div className="text-center space-y-3">
        <Loader2 className="animate-spin text-blue-600 w-10 h-10 mx-auto" />
        <p className="text-slate-500 text-sm">Memuat laporan...</p>
      </div>
    </div>
  );

  const summaryCards = [
    { label: 'Total Lulus', value: laporan?.overall.lulus, icon: CheckCircle, color: 'emerald', gradient: 'from-emerald-500 to-teal-600' },
    { label: 'Tidak Lulus', value: laporan?.overall.tidakLulus, icon: XCircle, color: 'red', gradient: 'from-red-500 to-rose-600' },
    { label: 'Terverifikasi', value: laporan?.overall.verified, icon: ShieldCheck, color: 'blue', gradient: 'from-blue-500 to-indigo-600' },
    { label: 'Masih Pending', value: laporan?.overall.pending, icon: Clock, color: 'amber', gradient: 'from-amber-400 to-orange-500' },
  ];

  const totalKuota = laporan?.perJurusan.reduce((acc, j) => acc + j.quota, 0) || 0;
  const totalLulus = laporan?.overall.lulus || 0;
  const overallPct = totalKuota > 0 ? Math.round((totalLulus / totalKuota) * 100) : 0;

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Laporan Penerimaan</h1>
          <p className="text-slate-500 font-medium">Rekapitulasi data pendaftar dan statistik hasil seleksi</p>
        </div>
        <button 
          onClick={handleExportPDF}
          disabled={exporting}
          className="flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-6 py-4 rounded-2xl font-bold transition-all shadow-xl shadow-slate-200 active:scale-95 disabled:opacity-70"
        >
          {exporting ? <Loader2 className="animate-spin w-5 h-5" /> : <Download className="w-5 h-5" />}
          {exporting ? 'Mencetak...' : 'Cetak Laporan PDF'}
        </button>
      </div>

      {/* Main Stats Banner */}
      <div className="bg-gradient-to-br from-indigo-600 via-blue-600 to-blue-700 rounded-[2.5rem] p-8 text-white shadow-2xl shadow-blue-200 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-12 opacity-10">
          <TrendingUp size={120} />
        </div>
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="space-y-4">
            <div className="inline-flex items-center px-4 py-1.5 bg-white/20 backdrop-blur-md rounded-full text-xs font-bold uppercase tracking-widest">
              Overview Status Kuota
            </div>
            <h2 className="text-4xl font-black leading-tight">Kuota Terisi: {overallPct}%</h2>
            <div className="space-y-2">
              <div className="w-full h-4 bg-white/20 rounded-full overflow-hidden backdrop-blur-sm border border-white/10">
                <div className="h-full bg-white rounded-full shadow-[0_0_15px_rgba(255,255,255,0.5)] transition-all duration-1000" style={{ width: `${overallPct}%` }} />
              </div>
              <p className="text-blue-100 text-sm font-medium">
                {totalLulus} dari {totalKuota} kuota kursi telah terisi oleh siswa lulus seleksi.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-6">
             <div className="bg-white/10 backdrop-blur-md rounded-3xl p-6 border border-white/10">
                <p className="text-blue-100 text-xs font-bold uppercase tracking-wider mb-1">Total Lulus</p>
                <p className="text-4xl font-black">{totalLulus}</p>
             </div>
             <div className="bg-white/10 backdrop-blur-md rounded-3xl p-6 border border-white/10">
                <p className="text-blue-100 text-xs font-bold uppercase tracking-wider mb-1">Total Pendaftar</p>
                <p className="text-4xl font-black">{laporan?.overall.verified + laporan?.overall.pending}</p>
             </div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {summaryCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div key={i} className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 group hover:shadow-xl hover:shadow-slate-100 transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${card.gradient} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">{card.label}</p>
              <p className="text-3xl font-black text-slate-900">{card.value}</p>
            </div>
          );
        })}
      </div>

      {/* Per Jurusan Statistics */}
      <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-100 border border-slate-100 overflow-hidden">
        <div className="px-8 py-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <div className="flex items-center space-x-3">
             <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-blue-600 shadow-sm">
                <BarChart2 className="w-5 h-5" />
             </div>
             <h2 className="font-black text-slate-800 text-lg">Rincian Per Jurusan</h2>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/80">
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Program Keahlian</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 text-center">Kuota</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 text-center">Pendaftar</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 text-center text-emerald-600">Lulus</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 text-center text-rose-600">Gagal</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 text-center">Kapasitas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {laporan?.perJurusan.map(j => {
                const pct = j.quota > 0 ? Math.round((j.lulus / j.quota) * 100) : 0;
                return (
                  <tr key={j.jurusan} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3">
                         <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 font-bold text-xs group-hover:bg-blue-600 group-hover:text-white transition-colors">
                            {j.jurusan}
                         </div>
                         <p className="text-sm font-black text-slate-800">{j.name}</p>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-center text-sm font-black text-slate-700">{j.quota}</td>
                    <td className="px-8 py-6 text-center">
                      <span className="text-sm font-black text-blue-600">{j.total}</span>
                    </td>
                    <td className="px-8 py-6 text-center">
                      <span className="text-sm font-black text-emerald-600">{j.lulus}</span>
                    </td>
                    <td className="px-8 py-6 text-center">
                      <span className="text-sm font-black text-rose-600">{j.tidakLulus}</span>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center justify-end space-x-4">
                        <div className="flex-1 w-24 h-2.5 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                          <div className={`h-full rounded-full transition-all duration-1000 ${pct >= 100 ? 'bg-rose-500' : 'bg-emerald-500'}`} style={{ width: `${Math.min(pct, 100)}%` }} />
                        </div>
                        <span className={`text-xs font-black ${pct >= 100 ? 'text-rose-600' : 'text-emerald-600'}`}>{pct}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      
      <div className="bg-slate-900 rounded-3xl p-8 text-white flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden relative">
        <div className="absolute top-0 right-0 p-8 opacity-20 rotate-12">
            <FileText size={80} />
        </div>
        <div className="relative z-10">
          <h3 className="text-xl font-black mb-2">Butuh Laporan Lengkap?</h3>
          <p className="text-slate-400 text-sm max-w-md">
            Laporan di atas adalah rekapitulasi ringkas. Untuk mendapatkan data detail seluruh siswa per kolom, silakan gunakan fitur ekspor di menu Data Pendaftar.
          </p>
        </div>
        <button 
           onClick={handleExportPDF}
           className="relative z-10 px-8 py-4 bg-white text-slate-900 rounded-2xl font-black hover:bg-blue-50 transition-colors shadow-lg active:scale-95"
        >
           Unduh Rekap PDF
        </button>
      </div>
    </div>
  );
};

export default Laporan;
