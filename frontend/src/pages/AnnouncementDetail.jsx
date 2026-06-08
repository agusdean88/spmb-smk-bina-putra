import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../store/useAuthStore';
import { 
  Calendar, 
  Clock, 
  FileText, 
  ChevronLeft, 
  Share2, 
  ArrowUpRight, 
  Megaphone, 
  Loader2, 
  AlertCircle, 
  Home,
  DownloadCloud,
  FileSpreadsheet,
  Image as ImageIcon,
  ArrowRight,
  ExternalLink,
  Eye
} from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { getApiURL } from '../utils/url';

const AnnouncementDetail = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [ann, setAnn] = useState(null);
  const [loading, setLoading] = useState(true);

  const API_BASE = getApiURL().replace('/api', '');

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const res = await api.get(`/public/announcements/${slug}`);
        setAnn(res.data);
      } catch (error) {
        console.error('Failed to fetch announcement', error);
        toast.error('Pengumuman tidak ditemukan');
        navigate('/pengumuman');
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
    window.scrollTo(0, 0);
  }, [slug, navigate]);

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: ann.title,
        url: window.location.href
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link disalin ke clipboard!');
    }
  };

  const getFileIcon = (type) => {
    switch (type) {
      case 'pdf': return <FileText size={24} />;
      case 'excel': return <FileSpreadsheet size={24} />;
      case 'image': return <ImageIcon size={24} />;
      default: return <FileText size={24} />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-6">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-slate-100 border-t-blue-600 rounded-full animate-spin"></div>
            <Megaphone className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-blue-600 w-6 h-6" />
          </div>
          <p className="text-slate-400 font-black uppercase tracking-[0.3em] text-[10px]">Memproses Informasi...</p>
        </div>
      </div>
    );
  }

  if (!ann) return null;

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-32">
      {/* Dynamic Hero Header */}
      <div className="relative bg-white pt-40 pb-20 overflow-hidden">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-blue-50/40 rounded-full blur-[140px] -mr-64 -mt-64 opacity-70" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-50/40 rounded-full blur-[120px] -ml-64 -mb-64 opacity-70" />
        
        <div className="max-w-4xl mx-auto px-4 relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-12">
            <Link 
              to="/pengumuman"
              className="inline-flex items-center gap-3 text-slate-500 hover:text-blue-600 font-black text-[10px] uppercase tracking-widest transition-all group"
            >
              <div className="p-3 bg-white rounded-2xl border border-slate-100 shadow-premium-sm group-hover:bg-blue-50 transition-colors">
                <ChevronLeft size={18} />
              </div>
              Kembali ke Index
            </Link>
            
            <button 
              onClick={handleShare}
              className="px-6 py-3 bg-white text-slate-600 hover:text-blue-600 rounded-2xl border border-slate-100 shadow-premium-sm hover:shadow-premium transition-all flex items-center gap-3 font-black text-[10px] uppercase tracking-widest"
            >
              <Share2 size={16} />
              Bagikan Info
            </button>
          </div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-wrap items-center gap-3 mb-8"
          >
            {ann.is_featured && (
              <span className="bg-amber-500 text-white px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl shadow-amber-200 flex items-center gap-2">
                <AlertCircle size={14} /> Penting
              </span>
            )}
            <span className="bg-blue-50 text-blue-600 px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border border-blue-100 shadow-sm">
              {ann.attachment_type || 'General Announcement'}
            </span>
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-6xl font-black text-slate-900 leading-[1.05] tracking-tight mb-12"
          >
            {ann.title}
          </motion.h1>

          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex flex-wrap items-center gap-10 text-slate-400 font-bold border-y border-slate-100 py-10"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-50 text-blue-500 rounded-2xl shadow-inner">
                <Calendar size={20} />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] uppercase tracking-[0.2em] text-slate-300 font-black">Publish Date</span>
                <span className="text-slate-700 tracking-tight">{format(new Date(ann.published_at || ann.created_at), 'EEEE, dd MMMM yyyy', { locale: id })}</span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="p-3 bg-indigo-50 text-indigo-500 rounded-2xl shadow-inner">
                <Clock size={20} />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] uppercase tracking-[0.2em] text-slate-300 font-black">Waktu</span>
                <span className="text-slate-700 tracking-tight">{format(new Date(ann.published_at || ann.created_at), 'HH:mm')} WIB</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Main Content & Sidebar */}
      <div className="max-w-7xl mx-auto px-4 -mt-10 grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-8">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-[4rem] shadow-premium border border-slate-100 overflow-hidden"
          >
            {/* Cover Image */}
            {ann.cover_image && (
              <div className="w-full aspect-video bg-slate-100 border-b border-slate-50 relative overflow-hidden">
                <img 
                  src={`${API_BASE}/${ann.cover_image}`} 
                  alt={ann.title} 
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <div className="p-8 md:p-16">
              {/* Rich Text Area */}
              <div 
                className="announcement-content text-slate-700 text-lg leading-relaxed font-medium"
                dangerouslySetInnerHTML={{ __html: ann.content }}
              />

              {/* Attachment / Preview Area */}
              {ann.attachment_file && (
                <div className="mt-16 space-y-8">
                  <div className="p-8 bg-slate-900 rounded-[3rem] shadow-premium text-white flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-12 opacity-10 -rotate-12 transition-transform group-hover:scale-125 group-hover:rotate-0 duration-700">
                      {getFileIcon(ann.attachment_type)}
                    </div>
                    
                    <div className="relative z-10 flex items-center gap-6 text-center md:text-left">
                      <div className="p-5 bg-white/10 backdrop-blur-xl rounded-[2rem] border border-white/20 shadow-2xl">
                        {getFileIcon(ann.attachment_type)}
                      </div>
                      <div>
                        <p className="text-2xl font-black tracking-tight mb-1">Dokumen Pendukung</p>
                        <p className="text-slate-400 font-bold text-sm tracking-wide">Tersedia dalam format {ann.attachment_type?.toUpperCase()}</p>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto relative z-10">
                      <a 
                        href={`${API_BASE}/${ann.attachment_file}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="px-8 py-4 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-blue-500 transition-all flex items-center justify-center gap-3 shadow-xl shadow-blue-500/20"
                      >
                        Buka File <Eye size={16} />
                      </a>
                      <a 
                        href={`${API_BASE}/${ann.attachment_file}`} 
                        download
                        className="px-8 py-4 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all flex items-center justify-center gap-3"
                      >
                        Download <DownloadCloud size={16} />
                      </a>
                    </div>
                  </div>

                  {/* PDF Preview if applicable */}
                  {ann.attachment_type === 'pdf' && (
                    <div className="bg-slate-50 rounded-[3rem] border border-slate-200 overflow-hidden">
                      <div className="px-10 py-6 border-b border-slate-200 flex items-center justify-between bg-white">
                        <div className="flex items-center gap-3">
                          <FileText className="text-blue-600" size={20} />
                          <span className="text-xs font-black uppercase tracking-widest text-slate-900">PDF Preview</span>
                        </div>
                        <a href={`${API_BASE}/${ann.attachment_file}`} target="_blank" className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline flex items-center gap-2">
                          Layar Penuh <ExternalLink size={14} />
                        </a>
                      </div>
                      <iframe 
                        src={`${API_BASE}/${ann.attachment_file}`}
                        className="w-full h-[600px] border-none"
                        title="PDF Preview"
                      />
                    </div>
                  )}

                  {/* Image Preview if applicable */}
                  {ann.attachment_type === 'image' && (
                    <div className="rounded-[3rem] border border-slate-100 overflow-hidden shadow-soft">
                      <img 
                        src={`${API_BASE}/${ann.attachment_file}`} 
                        alt="Lampiran" 
                        className="w-full h-auto"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-4 space-y-10">
          {/* Related Announcements */}
          <div className="bg-white rounded-[3rem] p-10 border border-slate-100 shadow-soft">
            <h4 className="text-xl font-black text-slate-900 mb-8 flex items-center gap-3">
              <span className="w-1.5 h-6 bg-blue-600 rounded-full" />
              Berita Terkait
            </h4>
            <div className="space-y-8">
              {ann.related && ann.related.length > 0 ? (
                ann.related.map((rel) => (
                  <Link key={rel.id} to={`/pengumuman/${rel.slug}`} className="group block">
                    <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-2">
                      {format(new Date(rel.published_at), 'dd MMM yyyy')}
                    </p>
                    <h5 className="font-bold text-slate-800 leading-tight group-hover:text-blue-600 transition-colors line-clamp-2">
                      {rel.title}
                    </h5>
                    <div className="mt-4 flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0">
                      Baca Detail <ArrowRight size={12} />
                    </div>
                  </Link>
                ))
              ) : (
                <p className="text-slate-400 text-sm font-medium">Belum ada berita terkait.</p>
              )}
            </div>
          </div>

          {/* Quick Contact / Info */}
          <div className="bg-gradient-to-br from-indigo-600 to-blue-700 rounded-[3rem] p-10 text-white relative overflow-hidden shadow-premium">
            <div className="absolute top-0 right-0 p-8 opacity-20 rotate-12">
              <Megaphone size={120} />
            </div>
            <div className="relative z-10">
              <h4 className="text-2xl font-black tracking-tight mb-4">Butuh Bantuan?</h4>
              <p className="text-blue-100 font-medium text-sm leading-relaxed mb-10">
                Jika Anda memiliki pertanyaan seputar pengumuman ini, jangan ragu untuk menghubungi panitia.
              </p>
              <Link to="/cek-status" className="w-full py-4 bg-white text-blue-700 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl hover:bg-slate-50 transition-all">
                Hubungi Kami <ArrowUpRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnnouncementDetail;
