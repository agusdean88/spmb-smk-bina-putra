import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../store/useAuthStore';
import { 
  Calendar, 
  Clock, 
  Megaphone, 
  Loader2, 
  Search, 
  ChevronRight, 
  FileText, 
  Image as ImageIcon,
  FileSpreadsheet,
  AlertCircle,
  ArrowRight,
  Filter,
  Inbox,
  Trophy,
  Briefcase,
  Monitor,
  BookOpen,
  RefreshCw
} from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { motion } from 'framer-motion';
import { getApiURL, getAssetURL } from '../utils/url';

const Announcements = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  
  // Filter States
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [activeType, setActiveType] = useState('Semua');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);

  // Realtime Ranking States
  const [selectedJurusan, setSelectedJurusan] = useState('');
  const [jurusanList, setJurusanList] = useState([]);
  const [rankingData, setRankingData] = useState([]);
  const [rankingLoading, setRankingLoading] = useState(false);
  const [rankingSearch, setRankingSearch] = useState('');
  const [rankingLimit, setRankingLimit] = useState(10);

  const API_BASE = getApiURL().replace('/api', '');

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchAnnouncements = useCallback(async (pageNum = 1, isLoadMore = false) => {
    if (isLoadMore) setLoadingMore(true);
    else setLoading(true);

    try {
      const response = await api.get('/public/announcements', {
        params: {
          search: debouncedSearch,
          type: activeType === 'Semua' ? '' : activeType,
          page: pageNum,
          limit: 9
        }
      });
      
      const newData = response.data.data;
      if (isLoadMore) {
        setAnnouncements(prev => [...prev, ...newData]);
      } else {
        setAnnouncements(newData);
      }
      
      setHasMore(response.data.page < response.data.totalPages);
      setTotal(response.data.total);
    } catch (error) {
      console.error('Fetch error:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [debouncedSearch, activeType]);

  useEffect(() => {
    setPage(1);
    fetchAnnouncements(1, false);
  }, [debouncedSearch, activeType, fetchAnnouncements]);

  // Fetch Jurusan List
  useEffect(() => {
    const fetchJurusan = async () => {
      try {
        const res = await api.get('/public/jurusan');
        setJurusanList(res.data);
        if (res.data.length > 0) {
          setSelectedJurusan(res.data[0].code);
        }
      } catch (err) {
        console.error('Error fetching jurusan:', err);
      }
    };
    fetchJurusan();
  }, []);

  // Fetch Realtime Ranking Data
  useEffect(() => {
    if (!selectedJurusan) return;
    const fetchRanking = async () => {
      setRankingLoading(true);
      try {
        const res = await api.get('/public/seleksi', {
          params: { jurusan: selectedJurusan }
        });
        setRankingData(res.data.students || []);
      } catch (err) {
        console.error('Error fetching ranking:', err);
      } finally {
        setRankingLoading(false);
      }
    };
    fetchRanking();
  }, [selectedJurusan]);

  const handleLoadMore = useCallback(() => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchAnnouncements(nextPage, true);
  }, [page, fetchAnnouncements]);

  const getFileIcon = (type) => {
    switch (type) {
      case 'pdf': return <FileText size={14} />;
      case 'excel': return <FileSpreadsheet size={14} />;
      case 'image': return <ImageIcon size={14} />;
      default: return <AlertCircle size={14} />;
    }
  };

  const filteredRankings = rankingData.filter(s => 
    s.nama_lengkap?.toLowerCase().includes(rankingSearch.toLowerCase()) ||
    s.nisn?.includes(rankingSearch)
  );

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-32">
      {/* Premium Header */}
      <div className="relative bg-white pt-40 pb-24 overflow-hidden border-b border-slate-100">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-50/50 rounded-full blur-[120px] -mr-48 -mt-48" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-indigo-50/50 rounded-full blur-[100px] -ml-48 -mb-48" />
        
        <div className="max-w-7xl mx-auto px-4 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-3 px-6 py-2.5 bg-blue-50 text-blue-600 rounded-full mb-8 border border-blue-100 shadow-sm"
          >
            <Megaphone size={18} className="animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em]">Official Announcements</span>
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-7xl font-black text-slate-900 mb-8 tracking-tight leading-[0.95]"
          >
            Pusat Informasi <br/><span className="text-blue-600">Terbaru PPDB</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-slate-500 text-lg md:text-xl max-w-2xl mx-auto font-medium"
          >
            Temukan berita, jadwal, dan pengumuman resmi seputar seleksi peserta didik baru di SMK Bina Putra.
          </motion.p>
        </div>
      </div>

      {/* Advanced Filter Bar */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-slate-200/60 shadow-premium-sm">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex flex-col lg:flex-row items-center gap-6">
            {/* Search */}
            <div className="relative w-full lg:w-[400px] group">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={20} />
              <input
                type="text"
                placeholder="Cari berita atau pengumuman..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-14 pr-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-sm font-bold placeholder:text-slate-400"
              />
            </div>
            
            {/* Type Tabs */}
            <div className="flex items-center gap-2 p-1.5 bg-slate-100 rounded-2xl w-full lg:w-auto overflow-x-auto scrollbar-hide">
              {['Semua', 'Image', 'PDF', 'Excel'].map((type) => (
                <button
                  key={type}
                  onClick={() => setActiveType(type)}
                  className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                    activeType === type 
                      ? 'bg-white text-blue-600 shadow-premium-sm ring-1 ring-blue-100' 
                      : 'text-slate-500 hover:text-slate-900 hover:bg-white/50'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>

            <div className="hidden lg:flex items-center gap-2 ml-auto text-slate-400 font-bold text-[10px] uppercase tracking-widest">
              <Filter size={14} className="text-blue-500" />
              Menampilkan {announcements.length} dari {total} data
            </div>
          </div>
        </div>
      </div>

      {/* Realtime Ranking Showcase Section */}
      <div className="max-w-7xl mx-auto px-4 pt-16">
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-[2.5rem] p-8 md:p-12 text-white relative overflow-hidden shadow-2xl border border-indigo-950/50 mb-10">
          <div className="absolute -right-16 -top-16 w-64 h-64 bg-indigo-500/20 rounded-full blur-[80px] pointer-events-none" />
          <div className="absolute -left-16 -bottom-16 w-64 h-64 bg-blue-500/10 rounded-full blur-[80px] pointer-events-none" />
          
          <div className="relative z-10 flex flex-col xl:flex-row xl:items-center justify-between gap-8">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 rounded-full text-[10px] font-black uppercase tracking-widest mb-4">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Live Auto-Sync
              </div>
              <h2 className="text-3xl md:text-4xl font-black mb-3 tracking-tight leading-tight">
                Peringkat Seleksi Realtime PPDB
              </h2>
              <p className="text-slate-300 text-sm font-medium leading-relaxed mb-6">
                Data peringkat di bawah disinkronkan secara langsung (realtime) dengan sistem seleksi panitia PPDB SMK Bina Putra. Urutan peringkat ditentukan oleh Nilai Akhir (Sidanira 70% + Tes Akademik 30%).
              </p>
              
              {/* Jurusan Selection Pills */}
              <div className="flex flex-wrap gap-2.5">
                {jurusanList.map((j) => {
                  const isActive = selectedJurusan === j.code;
                  return (
                    <button
                      key={j.code}
                      onClick={() => {
                        setSelectedJurusan(j.code);
                        setRankingLimit(10);
                        setRankingSearch('');
                      }}
                      className={`px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 flex items-center gap-2 ${
                        isActive 
                          ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30 ring-2 ring-blue-400' 
                          : 'bg-white/5 text-slate-300 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      {j.code === 'AKL' && <Briefcase size={12} />}
                      {j.code === 'DKV' && <Monitor size={12} />}
                      {j.code === 'MPLB' && <BookOpen size={12} />}
                      {j.name}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Micro Stats Card */}
            <div className="bg-white/5 border border-white/10 rounded-[2rem] p-6 backdrop-blur-md shrink-0 w-full xl:w-80">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center">
                  <Trophy size={20} />
                </div>
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">Kuota Jurusan</h4>
                  <p className="text-sm font-black text-white line-clamp-1">
                    {jurusanList.find(j => j.code === selectedJurusan)?.name || 'Jurusan'}
                  </p>
                </div>
              </div>
              <div className="space-y-3 pt-2 border-t border-white/5">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400 font-bold">Kapasitas Kuota</span>
                  <span className="text-white font-black">{jurusanList.find(j => j.code === selectedJurusan)?.quota || 0} Siswa</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400 font-bold">Total Terdaftar</span>
                  <span className="text-white font-black">{rankingData.length} Pendaftar</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400 font-bold">Status Data</span>
                  <span className="text-emerald-400 font-black flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Aktif & Valid
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Live Ranking Table/Widget */}
        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden mb-16">
          {/* Header Action bar */}
          <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text"
                placeholder="Cari nama atau NISN pendaftar..."
                value={rankingSearch}
                onChange={(e) => setRankingSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-2xl text-xs font-bold transition-all outline-none"
              />
            </div>
            
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
              <RefreshCw size={12} className="text-blue-500 animate-spin" />
              Sistem Sinkronisasi Otomatis
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80">
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 text-center w-20">Rank</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 w-40">NISN</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Nama Lengkap</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 text-center w-36">Nilai Akhir</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 text-center w-36">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rankingLoading ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-16 text-center">
                      <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-500 mb-3" />
                      <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Memuat Peringkat...</p>
                    </td>
                  </tr>
                ) : filteredRankings.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-16 text-center text-slate-400 font-semibold text-sm">
                      Tidak ada data peringkat ditemukan.
                    </td>
                  </tr>
                ) : (
                  filteredRankings.slice(0, rankingLimit).map((student) => {
                    const isTop3 = student.ranking <= 3;
                    return (
                      <tr key={student.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4.5 text-center">
                          {isTop3 ? (
                            <span className={`inline-flex w-7 h-7 rounded-full items-center justify-center font-black text-xs ${
                              student.ranking === 1 ? 'bg-amber-100 text-amber-800 border border-amber-200 animate-bounce'
                              : student.ranking === 2 ? 'bg-slate-100 text-slate-700 border border-slate-200'
                              : 'bg-orange-100 text-orange-850 border border-orange-200'
                            }`}>
                              {student.ranking}
                            </span>
                          ) : (
                            <span className="text-xs font-bold text-slate-400 font-mono">#{student.ranking}</span>
                          )}
                        </td>
                        <td className="px-6 py-4.5">
                          <span className="text-xs font-bold text-slate-600 font-mono">{student.nisn}</span>
                        </td>
                        <td className="px-6 py-4.5">
                          <span className="text-xs font-black text-slate-800 uppercase tracking-tight">
                            {student.nama_lengkap}
                          </span>
                        </td>
                        <td className="px-6 py-4.5 text-center">
                          <span className="text-xs font-black text-blue-600 font-mono bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100">
                            {student.nilai_akhir?.toFixed(2)}
                          </span>
                        </td>
                        <td className="px-6 py-4.5 text-center">
                          <span className={`inline-flex px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                            student.status_seleksi === 'LULUS' 
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                              : student.status_seleksi === 'CADANGAN'
                              ? 'bg-amber-50 text-amber-700 border-amber-100'
                              : 'bg-slate-50 text-slate-400 border-slate-100'
                          }`}>
                            {student.status_seleksi}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          
          {/* Expanded control */}
          {filteredRankings.length > rankingLimit && (
            <div className="p-4 border-t border-slate-100 text-center bg-slate-50/20">
              <button 
                onClick={() => setRankingLimit(prev => prev + 20)}
                className="text-[10px] font-black text-blue-600 hover:text-blue-700 uppercase tracking-widest hover:underline"
              >
                Tampilkan Lebih Banyak Peringkat
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Announcements Section */}
      <div className="max-w-7xl mx-auto px-4 py-16">
        <h2 className="text-3xl font-black text-slate-900 mb-8 tracking-tight flex items-center gap-2">
          <Megaphone className="text-blue-500" size={28} />
          Pengumuman & Berita Terbaru
        </h2>

        {loading && page === 1 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="animate-pulse bg-white rounded-[2.5rem] p-6 shadow-soft border border-slate-100">
                <div className="aspect-video bg-slate-100 rounded-[2rem] mb-6"></div>
                <div className="h-4 bg-slate-100 rounded-full w-1/3 mb-4"></div>
                <div className="h-8 bg-slate-100 rounded-2xl w-3/4 mb-4"></div>
                <div className="space-y-2 mb-8">
                  <div className="h-4 bg-slate-100 rounded-full w-full"></div>
                  <div className="h-4 bg-slate-100 rounded-full w-5/6"></div>
                </div>
                <div className="h-14 bg-slate-100 rounded-[1.25rem] w-full"></div>
              </div>
            ))}
          </div>
        ) : announcements.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-32 bg-white rounded-[4rem] border border-dashed border-slate-200 shadow-premium-sm"
          >
            <div className="inline-flex p-8 bg-slate-50 rounded-full mb-8 text-slate-300">
              <Inbox size={64} strokeWidth={1.5} />
            </div>
            <h3 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">Belum Ada Pengumuman</h3>
            <p className="text-slate-500 max-w-sm mx-auto font-medium">
              Coba gunakan kriteria pencarian lain atau kembali ke kategori "Semua".
            </p>
            <button 
              onClick={() => { setSearch(''); setActiveType('Semua'); }}
              className="mt-10 px-8 py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-600 transition-all shadow-xl"
            >
              Reset Semua Filter
            </button>
          </motion.div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
              {announcements.map((item, index) => (
                <motion.div 
                  key={item.id} 
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: index % 3 * 0.1 }}
                  viewport={{ once: true }}
                  className="group bg-white rounded-[2.5rem] p-4 border border-slate-100 shadow-soft hover:shadow-premium transition-all duration-500 flex flex-col h-full"
                >
                  {/* Image/Cover */}
                  <div className="relative aspect-video w-full rounded-[2rem] overflow-hidden bg-slate-100 mb-6">
                    {item.cover_image ? (
                      <img 
                        src={getAssetURL(item.cover_image)} 
                        alt={item.title} 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
                        <Megaphone className="w-16 h-16 text-blue-100" />
                      </div>
                    )}
                    
                    {/* Floating Badges */}
                    <div className="absolute top-4 left-4 flex gap-2">
                      <div className="px-4 py-2 bg-white/95 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-widest text-blue-600 shadow-sm flex items-center gap-2">
                        {getFileIcon(item.attachment_type)}
                        {item.attachment_type || 'General'}
                      </div>
                      {item.is_featured && (
                        <div className="px-4 py-2 bg-amber-500 text-white rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg shadow-amber-200">
                          Penting
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="px-4 pb-4 flex flex-col flex-grow">
                    <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-wider text-slate-400 mb-4">
                      <Calendar size={12} className="text-blue-500" />
                      {format(new Date(item.published_at || item.created_at), 'dd MMMM yyyy', { locale: id })}
                    </div>

                    <h3 className="text-2xl font-black text-slate-900 mb-4 line-clamp-2 group-hover:text-blue-600 transition-colors leading-tight tracking-tight">
                      {item.title}
                    </h3>

                    <div 
                      className="text-slate-500 text-sm leading-relaxed mb-10 line-clamp-3 flex-grow font-medium"
                      dangerouslySetInnerHTML={{ __html: item.content.replace(/<[^>]*>?/gm, '') }}
                    />

                    <Link 
                      to={`/pengumuman/${item.slug}`}
                      className="inline-flex items-center justify-center gap-2 w-full py-5 bg-slate-900 text-white rounded-[1.25rem] font-black text-[10px] uppercase tracking-[0.2em] hover:bg-blue-600 transition-all shadow-xl shadow-slate-100 hover:shadow-blue-200"
                    >
                      Baca Selengkapnya
                      <ArrowRight size={14} className="ml-1 transition-transform group-hover:translate-x-1" />
                    </Link>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Premium Pagination */}
            {hasMore && (
              <div className="mt-20 flex justify-center">
                <button
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="group relative inline-flex items-center gap-4 px-12 py-5 bg-white border border-slate-200 text-slate-900 rounded-[1.5rem] font-black text-[10px] uppercase tracking-[0.2em] hover:bg-slate-900 hover:text-white transition-all shadow-premium-sm hover:shadow-premium hover:-translate-y-1 disabled:opacity-50"
                >
                  {loadingMore ? (
                    <Loader2 size={20} className="animate-spin text-blue-600" />
                  ) : (
                    <>
                      Tampilkan Berita Lainnya
                      <div className="p-1 bg-slate-100 rounded-lg group-hover:bg-white/20 transition-colors">
                        <ChevronRight size={16} className="rotate-90" />
                      </div>
                    </>
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Announcements;
