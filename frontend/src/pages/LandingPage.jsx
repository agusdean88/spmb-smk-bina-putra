import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { getApiURL, getAssetURL } from '../utils/url';
import api from '../store/useAuthStore';
import {
  ArrowRight,
  Monitor,
  Trophy,
  Users,
  FileText,
  GraduationCap,
  CheckCircle2,
  Sparkles,
  Target,
  Rocket,
  ShieldCheck,
  ChevronRight,
  Calendar,
  Megaphone,
  Loader2,
  ExternalLink,
  Zap,
  UserPlus,
  FileEdit,
  UploadCloud,
  Printer,
  Home,
  Info,
  Download,
  Eye,
  Image as ImageIcon,
  FileSearch,
  File as FileIcon,
  FileSpreadsheet,
  DownloadCloud
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

const FeaturedAnnouncement = () => {
  const [featured, setFeatured] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const res = await api.get('/public/announcements/featured');
        if (res.data && res.data.length > 0) {
          setFeatured(res.data[0]);
        }
      } catch (error) {
        console.error('Failed to fetch featured announcement', error);
      } finally {
        setLoading(false);
      }
    };
    fetchFeatured();
  }, []);

  if (loading || !featured) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative z-50 bg-slate-900 overflow-hidden group"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4 flex-1">
            <div className="p-3 bg-blue-500 rounded-2xl shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform">
              <Megaphone className="w-5 h-5 text-white animate-pulse" />
            </div>
            <div className="min-w-0">
              <span className="inline-block px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">
                Penting
              </span>
              <h4 className="text-white font-bold text-sm sm:text-base truncate group-hover:text-blue-400 transition-colors">
                {featured.title}
              </h4>
            </div>
          </div>
          <Link 
            to={`/pengumuman/${featured.slug}`}
            className="w-full md:w-auto px-6 py-3 bg-white text-slate-900 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-500 hover:text-white transition-all shadow-xl flex items-center justify-center gap-2"
          >
            Lihat Detail <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
      <div className="absolute top-0 right-0 w-64 h-full bg-gradient-to-l from-blue-600/20 to-transparent pointer-events-none" />
    </motion.div>
  );
};

const AnnouncementPreview = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLatest = async () => {
      try {
        const res = await api.get('/public/announcements', { params: { limit: 3 } });
        setAnnouncements(res.data.data);
      } catch (error) {
        console.error('Failed to fetch announcements', error);
      } finally {
        setLoading(false);
      }
    };
    fetchLatest();
  }, []);

  if (loading) {
    return [1, 2, 3].map(i => (
      <div key={i} className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-soft animate-pulse">
        <div className="aspect-video bg-slate-100 rounded-3xl mb-6"></div>
        <div className="h-4 bg-slate-100 rounded w-1/3 mb-4"></div>
        <div className="h-6 bg-slate-100 rounded w-3/4 mb-4"></div>
        <div className="h-20 bg-slate-100 rounded w-full mb-6"></div>
        <div className="h-12 bg-slate-100 rounded-2xl w-full"></div>
      </div>
    ));
  }

  if (announcements.length === 0) {
    return (
      <div className="col-span-full py-20 text-center bg-white rounded-[3rem] border border-dashed border-slate-200">
        <Megaphone className="w-12 h-12 text-slate-300 mx-auto mb-4" />
        <p className="text-slate-500 font-bold">Belum ada pengumuman terbaru.</p>
      </div>
    );
  }

  return announcements.map((ann, idx) => (
    <motion.div 
      key={ann.id}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.1 }}
      viewport={{ once: true }}
      className="group bg-white rounded-[2.5rem] p-4 border border-slate-100 shadow-soft hover:shadow-premium transition-all duration-500 flex flex-col h-full relative"
    >
      <div className="relative aspect-video rounded-[2rem] overflow-hidden mb-6 bg-slate-100">
        {ann.cover_image ? (
          <img 
            src={`${getApiURL().replace('/api', '')}/${ann.cover_image}`}
            alt={ann.title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
            <Megaphone className="w-12 h-12 text-blue-200" />
          </div>
        )}
        <div className="absolute top-4 left-4">
          <span className="px-4 py-2 bg-white/90 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-widest text-blue-600 shadow-sm border border-white">
            {ann.attachment_type || 'Info'}
          </span>
        </div>
      </div>
      
      <div className="px-4 pb-4 flex flex-col flex-grow">
        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-slate-400 mb-4">
          <Calendar size={12} className="text-blue-500" />
          {format(new Date(ann.published_at || ann.created_at), 'dd MMM yyyy', { locale: id })}
        </div>
        
        <h4 className="text-xl font-black text-slate-900 mb-4 line-clamp-2 group-hover:text-blue-600 transition-colors leading-tight">
          {ann.title}
        </h4>
        
        <div 
          className="text-slate-500 text-sm leading-relaxed mb-8 line-clamp-2 flex-grow font-medium"
          dangerouslySetInnerHTML={{ __html: ann.content.replace(/<[^>]*>?/gm, '') }}
        />

        <Link 
          to={`/pengumuman/${ann.slug}`} 
          className="inline-flex items-center justify-center w-full py-4 bg-slate-900 text-white rounded-[1.25rem] font-bold text-[10px] uppercase tracking-[0.2em] hover:bg-blue-600 transition-all shadow-xl shadow-slate-100 hover:shadow-blue-200"
        >
          Baca Selengkapnya
          <ArrowRight size={14} className="ml-2 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>
    </motion.div>
  ));
};

const BrochureSection = () => {
  const [brochure, setBrochure] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBrochure = async () => {
      try {
        const res = await api.get('/public/brosur');
        setBrochure(res.data);
      } catch (error) {
        // Not active brochure is 404, which is fine
        console.warn('No active brochure found');
      } finally {
        setLoading(false);
      }
    };
    fetchBrochure();
  }, []);

  if (loading || !brochure) return null;

  const API_BASE = getApiURL().replace('/api', '');

  return (
    <section className="py-32 relative overflow-hidden">
      <div className="absolute top-1/2 left-0 -translate-y-1/2 w-[500px] h-[500px] bg-blue-100/30 rounded-full blur-[120px] -ml-64 pointer-events-none" />
      <div className="absolute top-1/2 right-0 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-100/30 rounded-full blur-[120px] -mr-64 pointer-events-none" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="glass rounded-[4rem] border border-white/60 shadow-premium overflow-hidden">
          <div className="lg:grid lg:grid-cols-12 items-center">
            {/* Preview Column */}
            <div className="lg:col-span-5 p-8 lg:p-12">
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className="relative aspect-[3/4] bg-slate-900 rounded-[2.5rem] shadow-2xl overflow-hidden group cursor-pointer"
              >
                {brochure.file_type === 'pdf' ? (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-800 to-slate-950 p-12 text-center">
                    <div className="w-24 h-24 bg-rose-500/20 rounded-3xl flex items-center justify-center mb-8 border border-rose-500/30 group-hover:scale-110 transition-transform duration-500">
                      <FileText className="w-12 h-12 text-rose-500" />
                    </div>
                    <h5 className="text-white font-black text-xl mb-2">E-Brochure PDF</h5>
                    <p className="text-slate-400 text-sm font-medium">Klik untuk melihat pratinjau dokumen resmi</p>
                  </div>
                ) : (
                  <img 
                    src={`${API_BASE}/${brochure.file_path}`} 
                    alt="Brosur PPDB" 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
                  />
                )}
                
                {/* Overlay Action */}
                <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                  <a 
                    href={`${getApiURL()}/public/brosur`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-5 bg-white text-slate-900 rounded-full shadow-2xl hover:scale-110 transition-transform"
                  >
                    <Eye className="w-6 h-6" />
                  </a>
                </div>
              </motion.div>
            </div>

            {/* Content Column */}
            <div className="lg:col-span-7 p-8 lg:p-20 lg:pl-0">
              <div className="max-w-xl">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-blue-100 mb-8">
                  <Sparkles className="w-3 h-3" /> Digital Brochure
                </div>
                
                <h3 className="text-4xl lg:text-6xl font-black text-slate-900 leading-[0.95] tracking-tight mb-8">
                  Unduh Informasi <br />
                  <span className="text-blue-600">Lengkap PPDB.</span>
                </h3>
                
                <p className="text-lg text-slate-500 font-medium leading-relaxed mb-12">
                  Dapatkan informasi mendalam mengenai jurusan, biaya pendidikan, fasilitas, dan tata cara pendaftaran melalui brosur resmi kami.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <a 
                    href={`${getApiURL()}/public/brosur?download=1`}
                    className="flex items-center justify-center gap-3 px-8 py-5 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-600 transition-all shadow-xl shadow-slate-200 hover:shadow-blue-200"
                  >
                    <DownloadCloud className="w-5 h-5" /> Download PDF
                  </a>
                  <a 
                    href={`${getApiURL()}/public/brosur`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-3 px-8 py-5 glass border border-slate-200 text-slate-700 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-white transition-all"
                  >
                    <Eye className="w-5 h-5" /> Lihat Online
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const LandingPage = () => {
  const [sysSettings, setSysSettings] = useState({ registration_status: 'open', registration_mode: 'online', school_year: '2026/2027', hero_image: '' });
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [heroUrl, setHeroUrl] = useState('/assets/hero-image.png');
  const [imageLoading, setImageLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await api.get('/public/settings');
        setSysSettings(res.data);
        if (res.data.hero_image) {
          setHeroUrl(`${getAssetURL(res.data.hero_image)}?v=${Date.now()}`);
        }
      } catch (error) {
        console.error('Failed to fetch public settings', error);
      } finally {
        setLoadingSettings(false);
      }
    };
    fetchSettings();
  }, []);

  const features = [
    { icon: Monitor, title: 'Fasilitas Modern', desc: 'Lab komputer terkini, ruang praktik standar industri, dan perpustakaan digital lengkap.', color: 'blue', badge: 'Advanced Tech' },
    { icon: Trophy, title: 'Berprestasi', desc: 'Siswa/i kami rutin memenangkan berbagai perlombaan di tingkat nasional maupun internasional.', color: 'amber', badge: 'Award Winning' },
    { icon: Users, title: 'Kelas Tahsin', desc: 'Kelas ini dibimbing oleh Guru - guru yang sudah terlatih dalam bidang ini, sehingga diharapkan siswa dan siswi dapat memperbaiki bacaan Al-Quran.', color: 'purple', badge: 'Religious Education' },
  ];

  const stats = [
    { label: 'Siswa Aktif', value: '1,200+', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Alumni Sukses', value: '5,000+', icon: GraduationCap, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Partner Industri', value: '50+', icon: Target, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Akreditasi', value: 'A', icon: ShieldCheck, color: 'text-indigo-600', bg: 'bg-indigo-50' },
  ];

  const colorMap = {
    blue: { bg: 'bg-blue-50', icon: 'text-blue-600', ring: 'ring-blue-100', border: 'border-blue-100' },
    amber: { bg: 'bg-amber-50', icon: 'text-amber-600', ring: 'ring-amber-100', border: 'border-amber-100' },
    purple: { bg: 'bg-purple-50', icon: 'text-purple-600', ring: 'ring-purple-100', border: 'border-purple-100' },
  };

  const isClosed = sysSettings.registration_status === 'closed';
  const isOffline = sysSettings.registration_mode === 'offline';

  return (
    <div className="bg-[#fcfdff] overflow-hidden">
      <FeaturedAnnouncement />
      {/* Hero Section */}
      <section className="relative min-h-[95vh] flex items-center pt-24 pb-24 lg:pt-32 lg:pb-32">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-[700px] h-[700px] bg-blue-100/40 rounded-full blur-[140px] animate-blob" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-[600px] h-[600px] bg-indigo-100/40 rounded-full blur-[120px] animate-blob animation-delay-2000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] bg-purple-50/20 rounded-full blur-[160px] animate-blob animation-delay-4000" />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="lg:grid lg:grid-cols-12 lg:gap-16 items-center">
            <div className="lg:col-span-7 text-center lg:text-left animate-fade-in-up">
              <div className={`inline-flex items-center gap-2 glass text-[10px] font-black uppercase tracking-[0.2em] px-5 py-2.5 rounded-full mb-8 border border-white/60 shadow-lg ${isClosed ? 'text-rose-600' : isOffline ? 'text-amber-600' : 'text-blue-700'}`}>
                {isClosed ? (
                   <> <Info className="w-4 h-4" /> <span>Pendaftaran TA {sysSettings.school_year} Saat Ini Ditutup</span> </>
                ) : isOffline ? (
                   <> <Home className="w-4 h-4" /> <span>Pendaftaran TA {sysSettings.school_year} (Mode Offline)</span> </>
                ) : (
                   <> <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" /> <span>Pendaftaran TA {sysSettings.school_year} Telah Dibuka!</span> </>
                )}
              </div>

              <h1 className="text-6xl sm:text-7xl lg:text-[5rem] font-black tracking-tight text-slate-900 leading-[0.95] mb-6">
                Build Your <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600">Digital Career</span>
              </h1>

              <div className="flex items-center gap-3 mb-8 justify-center lg:justify-start">
                <div className="h-1 w-10 bg-blue-600 rounded-full" />
                <span className="text-base sm:text-lg font-bold text-slate-600 italic tracking-wide">
                  "Mendidik Dengan Hati, Berprestasi Dengan Aksi"
                </span>
              </div>

              <p className="text-xl text-slate-500 leading-relaxed max-w-2xl mx-auto lg:mx-0 mb-12 font-medium">
                Bergabunglah dengan <span className="font-bold text-slate-900">SMK Bina Putra Jakarta</span>. Kami mencetak talenta digital masa depan melalui kurikulum berbasis industri dan <span className="text-blue-600 font-bold">Berkarakter</span>.
              </p>

              <div className="flex flex-col sm:flex-row gap-5 justify-center lg:justify-start">
                {isClosed ? (
                  <div className="px-10 py-5 bg-rose-50 text-rose-600 rounded-2xl font-black uppercase tracking-widest text-xs border border-rose-100 shadow-xl shadow-rose-50 flex items-center gap-2">
                    <Info size={16} /> Pendaftaran Ditutup
                  </div>
                ) : isOffline ? (
                  <div className="px-10 py-5 bg-amber-50 text-amber-700 rounded-2xl font-black uppercase tracking-widest text-xs border border-amber-100 shadow-xl shadow-amber-50 flex flex-col items-start gap-1">
                    <span className="flex items-center gap-2"><Home size={16} /> Mode Pendaftaran Offline</span>
                    <span className="text-[10px] font-bold text-amber-600/70 lowercase tracking-normal">Silakan datang langsung ke lokasi sekolah</span>
                  </div>
                ) : (
                  <Link
                    to="/register"
                    className="group inline-flex items-center justify-center px-10 py-5 text-lg font-black uppercase tracking-widest text-xs rounded-2xl text-white bg-slate-900 hover:bg-blue-600 shadow-2xl shadow-slate-200 hover:shadow-blue-200 transition-all duration-300 hover:-translate-y-1"
                  >
                    Daftar Sekarang
                    <ArrowRight className="ml-3 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                )}
                <Link
                  to="/cara-daftar"
                  className="inline-flex items-center justify-center px-10 py-5 text-lg font-black uppercase tracking-widest text-xs rounded-2xl text-slate-700 glass border border-white/60 hover:bg-white transition-all duration-300 shadow-sm"
                >
                  Panduan Daftar
                </Link>
                <a
                  href={`${getApiURL()}/public/brosur`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center px-6 py-5 text-lg font-black uppercase tracking-widest text-[10px] rounded-2xl text-blue-600 bg-blue-50 border border-blue-100 hover:bg-blue-100 transition-all duration-300 shadow-sm gap-2"
                >
                  <FileText className="w-4 h-4" /> Brosur
                </a>
              </div>

              {/* Trust Badges */}
              <div className="mt-16 flex flex-wrap justify-center lg:justify-start items-center gap-8">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center border border-emerald-100">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  </div>
                  <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Akreditasi A</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center border border-blue-100">
                    <ShieldCheck className="w-4 h-4 text-blue-500" />
                  </div>
                  <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Lulusan Siap Kerja</span>
                </div>
              </div>
            </div>

            <div className="mt-16 lg:mt-0 lg:col-span-5 relative group">
              {/* Decorative Background Glow */}
              <div className="absolute -inset-4 bg-gradient-to-tr from-blue-600/20 to-purple-600/20 rounded-[3.5rem] blur-3xl opacity-30 group-hover:opacity-60 transition-opacity duration-1000" />
              
              {/* Image Container */}
              <div className="relative z-20 rounded-[3rem] overflow-hidden shadow-[0_40px_80px_-15px_rgba(0,0,0,0.15)] border-[10px] border-white ring-1 ring-slate-100/50 animate-float">
                
                {/* Loading Skeleton */}
                {imageLoading && (
                  <div className="absolute inset-0 bg-slate-100 animate-pulse flex items-center justify-center">
                    <ImageIcon className="w-12 h-12 text-slate-300" />
                  </div>
                )}

                <img
                  className={`w-full object-cover aspect-[3/4] lg:aspect-[4/5] transform group-hover:scale-110 transition-all duration-[1.5s] ease-out ${imageLoading ? 'opacity-0' : 'opacity-100'}`}
                  src={heroUrl}
                  alt="Hero SMK Bina Putra Jakarta"
                  onLoad={() => setImageLoading(false)}
                  onError={(e) => { 
                    e.target.src = '/assets/hero-image.png';
                    setImageLoading(false);
                  }}
                />

                {/* Glassy Overlay Gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/10 to-transparent opacity-80" />
                
                {/* Content Overlay */}
                <div className="absolute bottom-10 left-10 right-10 text-white translate-y-2 group-hover:translate-y-0 transition-transform duration-500">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 bg-blue-500/20 backdrop-blur-md rounded-2xl border border-white/20 shadow-xl">
                      <Rocket className="w-6 h-6 text-blue-300" />
                    </div>
                    <span className="font-black tracking-[0.3em] uppercase text-[10px] text-blue-200">Digital Generation</span>
                  </div>
                  <h3 className="text-4xl font-black leading-tight tracking-tight">Mulai Karirmu <br /> Bersama Kami</h3>
                  <div className="flex items-center gap-4 mt-5">
                    <div className="h-px w-8 bg-blue-400" />
                    <p className="text-white/70 text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2">
                      <CheckCircle2 size={12} className="text-blue-400" /> Sekolah Pusat Keunggulan
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Announcements */}
      <section className="py-32 bg-[#f8fafc]/50 relative">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-20 gap-10">
            <div className="max-w-2xl text-center lg:text-left space-y-6">
              <div className="inline-block px-5 py-2 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-[0.3em] border border-indigo-100">Latest News</div>
              <h3 className="text-5xl font-black text-slate-900 tracking-tight">Pengumuman Terkini</h3>
            </div>
            <Link to="/pengumuman" className="inline-flex items-center gap-3 px-8 py-4 glass border border-white text-slate-900 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-slate-900 hover:text-white transition-all shadow-xl mx-auto lg:mx-0">Lihat Semua <ExternalLink size={16} /></Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <AnnouncementPreview />
          </div>
        </div>
      </section>

      <BrochureSection />

      {/* CTA Section */}
      <section className="py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden bg-slate-900 rounded-[4rem] px-8 py-24 sm:px-20 sm:py-32 shadow-2xl">
            <div className="relative z-10 max-w-3xl mx-auto text-center space-y-12">
              <h2 className="text-5xl sm:text-7xl font-black text-white leading-[0.95] tracking-tight">
                Siap Melangkah Menuju <br />
                <span className="text-blue-400">Masa Depan?</span>
              </h2>
              <div className="flex flex-col items-center justify-center gap-8 pt-4">
                {/* Registration Action */}
                <div className="flex justify-center w-full">
                  {isClosed ? (
                    <div className="px-12 py-6 bg-white/10 text-white rounded-2xl text-xs font-black uppercase tracking-[0.2em] border border-white/20">Pendaftaran TA {sysSettings.school_year} Ditutup</div>
                  ) : isOffline ? (
                    <div className="px-12 py-6 bg-amber-500 text-white rounded-2xl text-xs font-black uppercase tracking-[0.2em] shadow-xl">Kunjungi Sekolah untuk Pendaftaran Offline</div>
                  ) : (
                    <Link to="/register" className="px-12 py-6 bg-white text-slate-900 text-xs font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-blue-50 transition-all shadow-2xl hover:-translate-y-1">Daftar Online Sekarang</Link>
                  )}
                </div>


              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
