import React, { useState, useEffect } from 'react';
import api from '../../store/useAuthStore';
import { Loader2, Edit2, Save, X, GraduationCap, Users as UsersIcon } from 'lucide-react';

const JurusanQuota = () => {
  const [jurusans, setJurusans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editQuota, setEditQuota] = useState('');

  const fetchJurusan = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/jurusan');
      setJurusans(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJurusan();
  }, []);

  const handleSave = async (id) => {
    try {
      await api.put(`/admin/jurusan/${id}/quota`, { quota: editQuota });
      setEditingId(null);
      fetchJurusan();
    } catch (error) {
      alert('Gagal menyimpan kuota');
    }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
          <GraduationCap className="w-8 h-8 text-indigo-600" />
          Jurusan & Kuota
        </h1>
        <p className="text-slate-500 font-medium mt-1">Kelola kuota penerimaan dan kapasitas masing-masing program keahlian</p>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="flex h-[40vh] items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
            <p className="text-slate-400 font-bold text-xs uppercase tracking-[0.2em] animate-pulse">Memuat Data Jurusan...</p>
          </div>
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {jurusans.map((j, idx) => {
              const pct = j.quota > 0 ? Math.min(100, Math.round(((j.registered || 0) / j.quota) * 100)) : 0;
              const colorTheme = pct >= 100 ? 'rose' : pct >= 75 ? 'amber' : 'emerald';
              
              const pctColorMap = {
                rose: { text: 'text-rose-600', bg: 'bg-rose-50 border-rose-100', progress: 'bg-rose-500' },
                amber: { text: 'text-amber-600', bg: 'bg-amber-50 border-amber-100', progress: 'bg-amber-500' },
                emerald: { text: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-100', progress: 'bg-emerald-500' },
              };
              
              const theme = pctColorMap[colorTheme];

              return (
                <div 
                  key={j.id} 
                  className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-soft hover:shadow-premium transition-all duration-500 hover:-translate-y-1 group flex flex-col"
                  style={{ animationDelay: `${idx * 100}ms` }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-3 rounded-2xl bg-indigo-50 text-indigo-600 transition-transform duration-500 group-hover:scale-110">
                      <GraduationCap className="w-6 h-6" />
                    </div>
                    <div className={`flex items-center gap-1 text-xs font-black px-2.5 py-1 rounded-full ${theme.bg} ${theme.text}`}>
                      {pct}% Terisi
                    </div>
                  </div>
                  <div className="mb-4">
                    <h3 className="text-xl font-black text-slate-800 tracking-tight mb-0.5 group-hover:text-indigo-600 transition-colors">
                      {j.name}
                    </h3>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{j.code}</p>
                  </div>
                  
                  <div className="mt-auto space-y-3">
                    <div className="flex items-center justify-between text-sm font-semibold">
                      <span className="text-slate-400">Terdaftar / Kuota</span>
                      <span className="text-slate-700 font-black">
                        {j.registered || 0} <span className="text-slate-300">/</span> {j.quota}
                      </span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-1000 ${theme.progress}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Details Table */}
          <div className="bg-white rounded-[2rem] shadow-xl shadow-slate-100 border border-slate-100 overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-indigo-500 shadow-sm border border-slate-100">
                  <UsersIcon size={18} />
                </div>
                <div>
                  <h2 className="font-black text-slate-800">Detail Kuota Jurusan</h2>
                  <p className="text-xs text-slate-400 font-medium mt-0.5">Atur kapasitas masing-masing program keahlian</p>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80">
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 text-center">Kode</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Nama Jurusan</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 text-center">Pendaftar</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 text-center">Kuota</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {jurusans.map((j) => (
                    <tr key={j.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-6 py-5 text-center">
                        <span className="font-mono text-sm font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg border border-indigo-100">
                          {j.code}
                        </span>
                      </td>
                      <td className="px-6 py-5 font-black text-slate-800 text-sm">
                        {j.name}
                      </td>
                      <td className="px-6 py-5 text-center">
                        <span className="inline-flex items-center px-3.5 py-1 rounded-xl bg-blue-50 text-blue-700 text-sm font-black border border-blue-100">
                          {j.registered || 0}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-center">
                        {editingId === j.id ? (
                          <input 
                            type="number" 
                            value={editQuota} 
                            onChange={(e) => setEditQuota(e.target.value)}
                            className="w-24 px-4 py-2 border-2 border-indigo-100 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl text-center text-sm font-bold transition-all outline-none"
                            autoFocus
                          />
                        ) : (
                          <span className="text-sm font-black text-slate-700">{j.quota}</span>
                        )}
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex justify-center items-center gap-2">
                          {editingId === j.id ? (
                            <>
                              <button 
                                onClick={() => handleSave(j.id)} 
                                className="p-2.5 text-emerald-600 hover:bg-emerald-50 rounded-xl transition shadow-sm border border-slate-100 bg-white hover:border-emerald-200"
                                title="Simpan"
                              >
                                <Save className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => setEditingId(null)} 
                                className="p-2.5 text-rose-500 hover:bg-rose-50 rounded-xl transition shadow-sm border border-slate-100 bg-white hover:border-rose-200"
                                title="Batal"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </>
                          ) : (
                            <button 
                              onClick={() => { setEditingId(j.id); setEditQuota(j.quota); }}
                              className="p-2.5 text-indigo-600 hover:bg-indigo-50 rounded-xl transition shadow-sm border border-slate-100 bg-white hover:border-indigo-200"
                              title="Edit Kuota"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default JurusanQuota;
