import React, { useState, useEffect, useCallback } from 'react';
import api from '../../store/useAuthStore';
import {
  Loader2, PlayCircle, Trophy, Download, CheckCircle, Info,
  Users, XCircle, Medal, RefreshCw, Edit3, X, Save, AlertTriangle,
  TrendingUp, Award, BarChart2, Clock
} from 'lucide-react';

// --- Status Badge ---
const StatusBadge = ({ status }) => {
  const map = {
    LULUS:       { cls: 'bg-emerald-100 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500', label: 'LULUS' },
    CADANGAN:    { cls: 'bg-amber-100 text-amber-700 border-amber-200',   dot: 'bg-amber-500',   label: 'CADANGAN' },
    'TIDAK LULUS': { cls: 'bg-rose-100 text-rose-700 border-rose-200',   dot: 'bg-rose-500',    label: 'TIDAK LULUS' },
    VERIFIED:    { cls: 'bg-blue-100 text-blue-700 border-blue-200',      dot: 'bg-blue-500',    label: 'TERVERIFIKASI' },
  };
  const cfg = map[status] || { cls: 'bg-slate-100 text-slate-500 border-slate-200', dot: 'bg-slate-400', label: status || '-' };
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black tracking-widest border ${cfg.cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
};

// --- Rank Badge ---
const RankBadge = ({ rank }) => {
  if (rank === 1) return <div className="w-9 h-9 bg-gradient-to-br from-amber-400 to-amber-600 text-white rounded-full flex items-center justify-center font-black text-sm shadow-lg shadow-amber-200 ring-4 ring-amber-50">{rank}</div>;
  if (rank === 2) return <div className="w-9 h-9 bg-gradient-to-br from-slate-300 to-slate-500 text-white rounded-full flex items-center justify-center font-black text-sm shadow-md ring-4 ring-slate-50">{rank}</div>;
  if (rank === 3) return <div className="w-9 h-9 bg-gradient-to-br from-orange-400 to-orange-600 text-white rounded-full flex items-center justify-center font-black text-sm shadow-md ring-4 ring-orange-50">{rank}</div>;
  return <div className="w-9 h-9 bg-slate-100 text-slate-500 rounded-full flex items-center justify-center font-bold text-sm border border-slate-200">{rank}</div>;
};


// --- Main Component ---
const Seleksi = () => {
  const [jurusans, setJurusans] = useState([]);
  const [selectedJurusan, setSelectedJurusan] = useState('');
  const [data, setData] = useState(null); // { jurusan, students }
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);

  useEffect(() => {
    api.get('/admin/jurusan').then(res => {
      setJurusans(res.data);
      if (res.data.length > 0) setSelectedJurusan(res.data[0].code);
    }).catch(console.error);
  }, []);

  const fetchRanking = useCallback(async (silent = false) => {
    if (!selectedJurusan) return;
    if (!silent) setLoading(true);
    try {
      const res = await api.get('/admin/seleksi', { params: { jurusan: selectedJurusan } });
      setData(res.data);
      setLastUpdate(new Date());
    } catch (err) {
      console.error(err);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [selectedJurusan]);

  useEffect(() => {
    fetchRanking();
  }, [fetchRanking]);

  // Realtime polling every 30s
  useEffect(() => {
    const interval = setInterval(() => fetchRanking(true), 30000);
    return () => clearInterval(interval);
  }, [fetchRanking]);

  const handleProcess = async () => {
    const jurusanName = jurusans.find(j => j.code === selectedJurusan)?.name || selectedJurusan;
    if (!window.confirm(`Proses seleksi otomatis untuk ${jurusanName}?\n\nSistem akan menghitung nilai akhir dan memperbarui status LULUS/CADANGAN/TIDAK LULUS.`)) return;
    setProcessing(true);
    try {
      const res = await api.post('/admin/seleksi', { jurusan: selectedJurusan });
      const s = res.data.summary;
      alert(`✅ Seleksi selesai!\n\nTotal: ${s.total} siswa\nLulus: ${s.lulus}\nCadangan: ${s.cadangan}\nTidak Lulus: ${s.tidakLulus}`);
      fetchRanking();
    } catch {
      alert('Gagal memproses seleksi.');
    } finally {
      setProcessing(false);
    }
  };

  const handleExportPDF = async () => {
    try {
      setExporting(true);
      const res = await api.get('/admin/seleksi/export-pdf', { params: { jurusan: selectedJurusan }, responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Ranking_${selectedJurusan}_2026.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch {
      alert('Gagal mengunduh PDF');
    } finally {
      setExporting(false);
    }
  };

  const students = data?.students || [];
  const jurusanInfo = data?.jurusan || jurusans.find(j => j.code === selectedJurusan);
  const quota = jurusanInfo?.quota || 0;
  const lulusCount = students.filter(s => s.status_seleksi === 'LULUS').length;
  const cadanganCount = students.filter(s => s.status_seleksi === 'CADANGAN').length;
  const avgNilaiAkhir = students.length > 0
    ? (students.reduce((sum, s) => sum + (parseFloat(s.nilai_akhir) || 0), 0) / students.length).toFixed(2)
    : '0.00';

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <Trophy className="w-8 h-8 text-amber-500" />
            Seleksi & Ranking
          </h1>
          <p className="text-slate-500 font-medium mt-1">Perangkingan otomatis: Sidanira (70%) + TKA (30%)</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Jurusan Tabs */}
          <div className="flex bg-white border-2 border-slate-100 rounded-2xl p-1 shadow-sm gap-1">
            {jurusans.map(j => (
              <button
                key={j.id}
                onClick={() => setSelectedJurusan(j.code)}
                className={`px-5 py-2.5 rounded-xl font-black text-sm transition-all ${selectedJurusan === j.code ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'}`}
              >
                {j.code}
              </button>
            ))}
          </div>

          <button
            onClick={() => fetchRanking()}
            className="w-11 h-11 bg-white border-2 border-slate-100 rounded-xl flex items-center justify-center text-slate-500 hover:border-blue-400 hover:text-blue-600 transition-all shadow-sm"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={handleExportPDF}
            disabled={exporting || students.length === 0}
            className="flex items-center gap-2 bg-white border-2 border-slate-100 hover:border-blue-400 hover:text-blue-600 text-slate-600 px-5 py-2.5 rounded-xl font-bold transition-all shadow-sm disabled:opacity-50 text-sm"
          >
            {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            PDF
          </button>

          <button
            onClick={handleProcess}
            disabled={processing || students.length === 0}
            className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-6 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-indigo-200 disabled:opacity-50 text-sm"
          >
            {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <PlayCircle className="w-4 h-4" />}
            {processing ? 'Memproses...' : 'Proses Seleksi'}
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 shrink-0"><Users size={22} /></div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Pendaftar</p>
            <p className="text-2xl font-black text-slate-900">{students.length}</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-slate-600 shrink-0"><BarChart2 size={22} /></div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Kuota</p>
            <p className="text-2xl font-black text-slate-900">{quota} <span className="text-sm font-bold text-slate-400">kursi</span></p>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 shrink-0"><CheckCircle size={22} /></div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Lulus</p>
            <p className="text-2xl font-black text-emerald-700">{lulusCount} <span className="text-xs text-amber-500 font-bold">+{cadanganCount} cad.</span></p>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600 shrink-0"><TrendingUp size={22} /></div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Rata-rata Nilai</p>
            <p className="text-2xl font-black text-slate-900">{avgNilaiAkhir}</p>
          </div>
        </div>
      </div>

      {/* Formula Info */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100 rounded-2xl px-6 py-4 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2 text-indigo-700">
          <Award className="w-5 h-5" />
          <span className="font-black text-sm">Formula Nilai Akhir:</span>
        </div>
        <code className="bg-white px-4 py-1.5 rounded-lg font-mono text-sm text-indigo-800 border border-indigo-100 shadow-sm font-bold">
          (Sidanira × 0.70) + (TKA × 0.30)
        </code>
        {lastUpdate && (
          <div className="ml-auto flex items-center gap-1.5 text-xs text-slate-400 font-medium">
            <Clock className="w-3.5 h-3.5" />
            Update: {lastUpdate.toLocaleTimeString('id-ID')}
          </div>
        )}
      </div>

      {/* Ranking Table */}
      <div className="bg-white rounded-3xl shadow-xl shadow-slate-100 border border-slate-100 overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-amber-500 shadow-sm border border-slate-100">
              <Trophy size={18} />
            </div>
            <div>
              <h2 className="font-black text-slate-800">Papan Peringkat — {jurusanInfo?.name || selectedJurusan}</h2>
              <p className="text-xs text-slate-400 font-medium mt-0.5">Diurutkan otomatis berdasarkan nilai tertinggi</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
            <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />Lulus</div>
            <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />Cadangan</div>
            <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-500 inline-block" />Tidak Lulus</div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80">
                {['Rank','Informasi Siswa','Sidanira (70%)','TKA (30%)','Nilai Akhir','Status','Aksi'].map(h => (
                  <th key={h} className="px-5 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan="7" className="py-24 text-center"><Loader2 className="animate-spin mx-auto text-indigo-400 w-10 h-10" /></td></tr>
              ) : students.length === 0 ? (
                <tr><td colSpan="7" className="py-24 text-center">
                  <div className="flex flex-col items-center gap-3 opacity-30">
                    <Users size={48} />
                    <p className="font-bold">Belum ada data siswa untuk jurusan ini.</p>
                  </div>
                </td></tr>
              ) : students.map((s) => {
                const statusKey = s.status_seleksi || s.registration?.status;
                const rowBg =
                  statusKey === 'LULUS' ? 'hover:bg-emerald-50/50 bg-white' :
                  statusKey === 'CADANGAN' ? 'hover:bg-amber-50/40 bg-amber-50/20' :
                  'hover:bg-rose-50/30 bg-rose-50/10';

                return (
                  <tr key={s.id} className={`group transition-all ${rowBg}`}>
                    <td className="px-5 py-4">
                      <RankBadge rank={s.ranking} />
                    </td>
                    <td className="px-5 py-4 min-w-[180px]">
                      <p className="font-black text-slate-800 text-sm">{s.nama_lengkap}</p>
                      <p className="text-[10px] text-slate-400 font-bold tracking-wider mt-0.5">
                        {s.nisn || '-'} · {s.asal_sekolah || '-'}
                      </p>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <div className="inline-flex flex-col items-center">
                        <span className="text-lg font-black text-blue-600">{s.nilai_sidanira ?? '—'}</span>
                        <span className="text-[9px] text-blue-400 font-black">×70%</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <div className="inline-flex flex-col items-center">
                        <span className="text-lg font-black text-purple-600">{s.nilai_tka ?? '—'}</span>
                        <span className="text-[9px] text-purple-400 font-black">×30%</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <div className="inline-flex items-center px-4 py-1.5 bg-indigo-50 rounded-xl border-2 border-indigo-100">
                        <span className="text-lg font-black text-indigo-700">
                          {s.nilai_akhir ? parseFloat(s.nilai_akhir).toFixed(2) : '0.00'}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge status={statusKey} />
                    </td>
                    <td className="px-5 py-4">
                      <div className="text-[10px] font-bold text-slate-400 italic">Automatic</div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Table Footer */}
        {!loading && students.length > 0 && (
          <div className="px-6 py-4 bg-slate-50/60 border-t border-slate-100 flex flex-wrap items-center gap-4 text-xs text-slate-500 font-medium">
            <span>{students.length} siswa terdaftar</span>
            <span className="text-slate-300">·</span>
            <span className="text-emerald-600 font-bold">{lulusCount} Lulus</span>
            <span className="text-amber-500 font-bold">{cadanganCount} Cadangan</span>
            <span className="text-rose-500 font-bold">{students.length - lulusCount - cadanganCount} Tidak Lulus</span>
            <span className="ml-auto text-slate-400">Kuota tersisa: {Math.max(0, quota - lulusCount)} kursi</span>
          </div>
        )}
      </div>

      {/* Info Box */}
      {!loading && students.length > 0 && (
        <div className="bg-amber-50 border-2 border-amber-100 rounded-2xl p-5 flex items-start gap-4">
          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-amber-500 shadow-sm shrink-0">
            <AlertTriangle size={20} />
          </div>
          <div>
            <p className="font-black text-amber-900 text-sm">Instruksi Seleksi Otomatis</p>
            <p className="text-xs text-amber-800 leading-relaxed mt-1">
              Ranking dihitung otomatis berdasarkan Nilai Sidanira dan TKA (Bahasa Indonesia & Matematika) yang diinput oleh siswa di biodata.
              Klik <strong>"Proses Seleksi"</strong> untuk menetapkan status resmi: Ranking 1–{quota} = <strong>LULUS</strong>,
              ranking {quota + 1}–{Math.ceil(quota * 1.2)} = <strong>CADANGAN</strong>, sisanya = <strong>TIDAK LULUS</strong>.
            </p>
          </div>
        </div>
      )}

    </div>
  );
};

export default Seleksi;
