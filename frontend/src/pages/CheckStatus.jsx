import { useState } from 'react';
import api from '../store/useAuthStore';
import { 
  Search, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  User, 
  Fingerprint, 
  Hash, 
  GraduationCap,
  Sparkles,
  ArrowRight
} from 'lucide-react';

const CheckStatus = () => {
  const [nisn, setNisn] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!nisn) return;
    
    setLoading(true);
    setError('');
    setResult(null);
    
    try {
      const response = await api.get(`/public/check-status/${nisn}`);
      setResult(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Data tidak ditemukan. Silakan periksa kembali NISN Anda.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'LULUS':
        return (
          <div className="flex items-center gap-2 text-emerald-700 bg-emerald-50 px-5 py-2.5 rounded-2xl font-black border border-emerald-100 shadow-sm">
            <CheckCircle2 className="w-5 h-5" /> 
            <span>LULUS SELEKSI</span>
          </div>
        );
      case 'TIDAK_LULUS':
        return (
          <div className="flex items-center gap-2 text-rose-700 bg-rose-50 px-5 py-2.5 rounded-2xl font-black border border-rose-100 shadow-sm">
            <XCircle className="w-5 h-5" /> 
            <span>BELUM LOLOS</span>
          </div>
        );
      case 'VERIFIED':
        return (
          <div className="flex items-center gap-2 text-blue-700 bg-blue-50 px-5 py-2.5 rounded-2xl font-black border border-blue-100 shadow-sm">
            <CheckCircle2 className="w-5 h-5" /> 
            <span>BERKAS TERVERIFIKASI</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-2 text-amber-700 bg-amber-50 px-5 py-2.5 rounded-2xl font-black border border-amber-100 shadow-sm">
            <Clock className="w-5 h-5" /> 
            <span>DALAM PROSES</span>
          </div>
        );
    }
  };

  return (
    <div className="min-h-[80vh] relative overflow-hidden pt-20 pb-32">
      {/* Background Decorations */}
      <div className="absolute top-0 right-0 -mr-20 w-96 h-96 bg-blue-50 rounded-full blur-[100px] -z-10 opacity-60" />
      <div className="absolute bottom-0 left-0 -ml-20 w-80 h-80 bg-indigo-50 rounded-full blur-[100px] -z-10 opacity-60" />

      <div className="max-w-4xl mx-auto px-4 relative z-10">
        <div className="text-center mb-16 animate-fade-in">
          <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 text-xs font-black px-4 py-2 rounded-full mb-6 border border-blue-100 shadow-sm">
            <Sparkles className="w-4 h-4" />
            <span>PENGUMUMAN HASIL SELEKSI 2026</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-4 tracking-tight">Cek Status Pendaftaran</h2>
          <p className="text-xl text-slate-500 max-w-2xl mx-auto font-medium">
            Masukkan NISN Anda untuk melihat status verifikasi berkas dan hasil kelulusan seleksi PPDB.
          </p>
        </div>

        <div className="bg-white p-2 md:p-10 rounded-[2.5rem] shadow-premium border border-slate-100 animate-fade-in-up">
          <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4 mb-10 p-4 md:p-0">
            <div className="relative flex-grow group">
              <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none transition-colors group-focus-within:text-blue-600">
                <Search className="h-6 w-6 text-slate-400" />
              </div>
              <input
                type="text"
                value={nisn}
                onChange={(e) => setNisn(e.target.value)}
                className="block w-full pl-14 pr-6 py-5 border-2 border-slate-100 rounded-[1.5rem] focus:ring-0 focus:border-blue-500 text-xl font-bold transition-all placeholder:text-slate-300 shadow-sm"
                placeholder="Masukkan 10 digit NISN..."
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="group/btn bg-slate-900 text-white px-10 py-5 rounded-[1.5rem] font-black text-lg hover:bg-blue-600 transition-all shadow-xl shadow-slate-200 hover:shadow-blue-200 disabled:opacity-70 flex items-center justify-center gap-3"
            >
              {loading ? 'Mencari...' : (
                <>
                  Cek Sekarang
                  <ArrowRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          {error && (
            <div className="p-6 bg-rose-50 text-rose-700 rounded-2xl font-bold border-2 border-rose-100 text-center flex items-center justify-center gap-3 animate-fade-in">
              <XCircle className="w-6 h-6" />
              {error}
            </div>
          )}

          {result && (
            <div className="animate-fade-in-up space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  { label: 'Nama Lengkap', value: result.nama_lengkap, icon: User },
                  { label: 'Nomor NISN', value: result.nisn, icon: Fingerprint },
                  { label: 'No Pendaftaran', value: result.no_pendaftaran, icon: Hash },
                  { label: 'Jurusan Pilihan', value: result.jurusan, icon: GraduationCap },
                ].map((item, i) => (
                  <div key={i} className="bg-slate-50/50 p-6 rounded-2xl border border-slate-100 flex items-center gap-5">
                    <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm border border-slate-100 text-blue-600">
                      <item.icon className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">{item.label}</p>
                      <p className="font-black text-slate-800 text-lg leading-none">{item.value || '-'}</p>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="bg-slate-900 rounded-3xl p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl">
                <div>
                  <h4 className="text-white font-black text-xl mb-1">Status Pendaftaran Anda</h4>
                  <p className="text-slate-400 font-medium">Data diperbarui pada {new Date().toLocaleDateString('id-ID')}</p>
                </div>
                {getStatusBadge(result.status)}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CheckStatus;
