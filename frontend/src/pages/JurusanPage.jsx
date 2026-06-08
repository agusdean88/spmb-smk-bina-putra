import { useState, useEffect } from 'react';
import api from '../store/useAuthStore';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { 
  Briefcase, 
  Monitor, 
  BookOpen, 
  Sparkles, 
  Users, 
  Target,
  ArrowRight,
  TrendingUp,
  ShieldCheck
} from 'lucide-react';
import { Link } from 'react-router-dom';

const JurusanPage = () => {
  const [jurusan, setJurusan] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchJurusan = async () => {
      try {
        const response = await api.get('/public/jurusan');
        setJurusan(response.data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchJurusan();
  }, []);

  const getMajorConfig = (code) => {
    switch (code) {
      case 'AKL':
        return {
          icon: Briefcase,
          color: 'blue',
          tag: 'Keuangan',
          desc: 'Mencetak tenaga ahli di bidang akuntansi dan laporan keuangan digital.'
        };
      case 'DKV':
        return {
          icon: Monitor,
          color: 'amber',
          tag: 'Kreatif',
          desc: 'Mengembangkan talenta kreatif di bidang desain grafis dan media digital.'
        };
      case 'MPLB':
        return {
          icon: BookOpen,
          color: 'purple',
          tag: 'Manajemen',
          desc: 'Keahlian dalam manajemen perkantoran dan layanan bisnis modern.'
        };
      default:
        return {
          icon: Briefcase,
          color: 'slate',
          tag: 'Umum',
          desc: 'Program keahlian unggulan dengan kurikulum berbasis industri.'
        };
    }
  };

  const colorStyles = {
    blue: "bg-blue-50 text-blue-600 border-blue-100 bar-blue-500 shadow-blue-100",
    amber: "bg-amber-50 text-amber-600 border-amber-100 bar-amber-500 shadow-amber-100",
    purple: "bg-purple-50 text-purple-600 border-purple-100 bar-purple-500 shadow-purple-100",
    slate: "bg-slate-50 text-slate-600 border-slate-100 bar-slate-500 shadow-slate-100",
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="bg-[#fcfdff] min-h-screen py-24 relative overflow-hidden">
      {/* Background Decorations */}
      <div className="absolute top-0 right-0 w-[700px] h-[700px] bg-blue-50/50 rounded-full blur-[140px] -mr-48 -mt-48 animate-pulse" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-indigo-50/50 rounded-full blur-[120px] -ml-32 -mb-32 animate-blob" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-20 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-5 py-2 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-[0.3em] border border-blue-100 mb-6">
            <Sparkles size={14} className="animate-pulse" />
            Vocational Programs
          </div>
          <h1 className="text-5xl sm:text-6xl font-black text-slate-900 leading-[1.1] tracking-tight mb-8">
            Pilihan <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Masa Depan</span>
          </h1>
          <p className="text-lg text-slate-500 leading-relaxed font-medium">
            Pilih program keahlian yang sesuai dengan passion dan impian karirmu. Kami menyediakan kurikulum standar industri untuk kesuksesanmu.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {jurusan.map((j) => {
            const config = getMajorConfig(j.code);
            const style = colorStyles[config.color];
            const Icon = config.icon;
            const percentage = Math.min(100, Math.round((j.registered / j.quota) * 100));
            const isFull = percentage >= 100;
            const isRunningOut = percentage > 80 && !isFull;

            return (
              <div key={j.id} className="group relative">
                <div className="relative h-full glass p-10 rounded-[3.5rem] border border-white shadow-soft hover:shadow-premium transition-all duration-500 hover:-translate-y-3 flex flex-col">
                  {/* Badge & Icon */}
                  <div className="flex justify-between items-start mb-10">
                    <div className={`w-20 h-20 ${style.split(' ')[0]} ${style.split(' ')[1]} rounded-[2rem] flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-500`}>
                      <Icon size={40} />
                    </div>
                    <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${style.split(' ')[0]} ${style.split(' ')[1]} border ${style.split(' ')[2]}`}>
                      {config.tag}
                    </div>
                  </div>

                  {/* Content */}
                  <h3 className="text-3xl font-black text-slate-900 mb-4 tracking-tight leading-tight">
                    {j.name} <span className="text-blue-600 text-xl">({j.code})</span>
                  </h3>
                  <p className="text-slate-500 leading-relaxed mb-10 font-medium text-sm">
                    {config.desc}
                  </p>

                  {/* Quota Progress */}
                  <div className="mt-auto space-y-6">
                    <div className="flex justify-between items-end">
                      <div className="space-y-1">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Kapasitas Kuota</p>
                        <div className="flex items-center gap-2">
                          <Users size={16} className="text-slate-400" />
                          <span className="text-xl font-black text-slate-900">{j.registered} <span className="text-slate-300 text-sm font-bold">/ {j.quota}</span></span>
                        </div>
                      </div>
                      <div className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest ${
                        isFull ? 'bg-rose-50 text-rose-600 border border-rose-100' : 
                        isRunningOut ? 'bg-amber-50 text-amber-600 border border-amber-100' : 
                        'bg-emerald-50 text-emerald-600 border border-emerald-100'
                      }`}>
                        {isFull ? 'Kuota Penuh' : isRunningOut ? 'Hampir Penuh' : 'Tersedia'}
                      </div>
                    </div>

                    <div className="relative h-4 bg-slate-100 rounded-full overflow-hidden border border-slate-50 shadow-inner">
                      <div 
                        className={`absolute top-0 left-0 h-full rounded-full transition-all duration-1000 ease-out ${
                          isFull ? 'bg-gradient-to-r from-rose-500 to-rose-600 shadow-rose-200' : 
                          isRunningOut ? 'bg-gradient-to-r from-amber-500 to-amber-600 shadow-amber-200' : 
                          'bg-gradient-to-r from-blue-500 to-indigo-600 shadow-blue-200'
                        } shadow-lg`} 
                        style={{ width: `${percentage}%` }}
                      />
                      {percentage > 0 && (
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer pointer-events-none" />
                      )}
                    </div>
                    
                    <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      <span>Pendaftar Aktif</span>
                      <span className={isFull ? 'text-rose-500' : isRunningOut ? 'text-amber-500' : 'text-blue-600'}>{percentage}% Terisi</span>
                    </div>
                  </div>

                  <div className="mt-10 pt-8 border-t border-slate-50">
                    <Link 
                      to="/register" 
                      className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 transition-all duration-300 shadow-lg ${
                        isFull ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-slate-900 text-white hover:bg-blue-600 shadow-slate-200 hover:shadow-blue-200 hover:-translate-y-1'
                      }`}
                    >
                      {isFull ? 'Pendaftaran Ditutup' : 'Daftar di Jurusan Ini'}
                      {!isFull && <ArrowRight size={16} />}
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Info Grid */}
        <div className="mt-32 grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { icon: TrendingUp, title: 'Prospek Karir', desc: 'Lulusan kami banyak terserap di perusahaan multinasional dan startup ternama.' },
            { icon: ShieldCheck, title: 'Sertifikasi Keahlian', desc: 'Setiap siswa dibekali sertifikat kompetensi BNSP yang diakui secara nasional.' },
            { icon: Target, title: 'Fasilitas Praktik', desc: 'Lab komputer dan ruang praktik dengan standar industri terkini.' },
          ].map((item, i) => (
            <div key={i} className="flex gap-6 p-8 glass rounded-[2.5rem] border border-white/60">
              <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-md flex-shrink-0 text-blue-600 border border-slate-100">
                <item.icon size={28} />
              </div>
              <div>
                <h4 className="text-xl font-black text-slate-900 mb-2 tracking-tight">{item.title}</h4>
                <p className="text-sm text-slate-500 font-medium leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default JurusanPage;

