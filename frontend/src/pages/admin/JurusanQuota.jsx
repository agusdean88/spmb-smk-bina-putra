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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-800">Jurusan & Kuota</h1>
        <p className="text-slate-500 text-sm mt-1">Kelola kuota penerimaan untuk masing-masing jurusan</p>
      </div>

      {/* Stats Cards */}
      {!loading && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {jurusans.map(j => {
            const pct = j.quota > 0 ? Math.round(((j.registered || 0) / j.quota) * 100) : 0;
            return (
              <div key={j.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="p-2 rounded-xl bg-indigo-50">
                    <GraduationCap className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800">{j.name}</p>
                    <p className="text-xs text-slate-400">{j.code}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-slate-500">Pendaftar / Kuota</span>
                  <span className="font-bold text-slate-700">{j.registered || 0} / {j.quota}</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${pct >= 100 ? 'bg-red-500' : pct >= 75 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                    style={{ width: `${Math.min(pct, 100)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50">
          <h3 className="font-semibold text-slate-700 text-sm flex items-center">
            <UsersIcon className="w-4 h-4 mr-2 text-slate-400" />
            Detail Kuota Jurusan
          </h3>
        </div>
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50/80">
              <th className="px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-100">Kode</th>
              <th className="px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-100">Nama Jurusan</th>
              <th className="px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-100 text-center">Pendaftar</th>
              <th className="px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-100 text-center">Kuota</th>
              <th className="px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-100 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr><td colSpan="5" className="px-5 py-16 text-center"><Loader2 className="animate-spin mx-auto text-blue-500 w-7 h-7" /></td></tr>
            ) : (
              jurusans.map(j => (
                <tr key={j.id} className="hover:bg-blue-50/30 transition-colors">
                  <td className="px-5 py-4 font-mono text-sm font-semibold text-indigo-600">{j.code}</td>
                  <td className="px-5 py-4 text-sm font-medium text-slate-700">{j.name}</td>
                  <td className="px-5 py-4 text-center">
                    <span className="inline-flex items-center px-3 py-1 rounded-lg bg-blue-50 text-blue-700 text-sm font-bold border border-blue-100">
                      {j.registered || 0}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-center">
                    {editingId === j.id ? (
                      <input 
                        type="number" 
                        value={editQuota} 
                        onChange={(e) => setEditQuota(e.target.value)}
                        className="w-20 px-3 py-1.5 border border-blue-300 rounded-lg text-center text-sm focus:ring-2 focus:ring-blue-500"
                        autoFocus
                      />
                    ) : (
                      <span className="text-sm font-bold text-slate-700">{j.quota}</span>
                    )}
                  </td>
                  <td className="px-5 py-4 text-center">
                    {editingId === j.id ? (
                      <div className="flex justify-center space-x-1">
                        <button onClick={() => handleSave(j.id)} className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-xl transition">
                          <Save className="w-4 h-4" />
                        </button>
                        <button onClick={() => setEditingId(null)} className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <button 
                        onClick={() => { setEditingId(j.id); setEditQuota(j.quota); }}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default JurusanQuota;
