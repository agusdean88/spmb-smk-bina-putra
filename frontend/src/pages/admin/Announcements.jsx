import React, { useState, useEffect, useCallback, Suspense, lazy } from 'react';
import api from '../../store/useAuthStore';
import { 
  Plus, Edit2, Trash2, Loader2, Calendar, Megaphone, 
  Search, Filter, ChevronLeft, ChevronRight, Eye, 
  CheckCircle, Clock, Archive, MoreVertical, X,
  Image as ImageIcon, FileText, Globe, Pin, AlertTriangle,
  ArrowUpRight, Share2, MoreHorizontal, FileSpreadsheet,
  DownloadCloud
} from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import toast from 'react-hot-toast';
import ConfirmModal from '../../components/ConfirmModal';
import { getApiURL } from '../../utils/url';

// Lazy load components
const RichTextEditor = lazy(() => import('../../components/admin/RichTextEditor'));

const AdminAnnouncements = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  
  const [filters, setFilters] = useState({
    search: '',
    type: '',
    status: '',
    page: 1,
    limit: 10
  });

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedAnn, setSelectedAnn] = useState(null);
  const [editId, setEditId] = useState(null);

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    status: 'PUBLISHED',
    is_featured: false,
    published_at: format(new Date(), 'yyyy-MM-dd\'T\'HH:mm'),
    cover_image: null,
    attachment_file: null
  });

  const API_BASE = getApiURL().replace('/api', '');

  const fetchAnnouncements = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/announcements', { params: filters });
      setAnnouncements(res.data.data);
      setTotal(res.data.total);
      setTotalPages(res.data.totalPages);
    } catch (error) {
      console.error('Failed to fetch announcements', error);
      toast.error('Gagal mengambil data pengumuman');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  const handleOpenForm = (announcement = null) => {
    if (announcement) {
      setEditId(announcement.id);
      setFormData({
        title: announcement.title,
        content: announcement.content,
        status: announcement.status,
        is_featured: announcement.is_featured,
        published_at: format(new Date(announcement.published_at || announcement.created_at), 'yyyy-MM-dd\'T\'HH:mm'),
        cover_image: null,
        attachment_file: null
      });
    } else {
      setEditId(null);
      setFormData({
        title: '',
        content: '',
        status: 'PUBLISHED',
        is_featured: false,
        published_at: format(new Date(), 'yyyy-MM-dd\'T\'HH:mm'),
        cover_image: null,
        attachment_file: null
      });
    }
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditId(null);
  };

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    if (files && files[0]) {
      if (files[0].size > 10 * 1024 * 1024) {
        toast.error('Ukuran file maksimal 10MB');
        e.target.value = '';
        return;
      }
      setFormData(prev => ({ ...prev, [name]: files[0] }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) return toast.error('Judul wajib diisi');
    if (!formData.content.trim() || formData.content === '<p><br></p>') return toast.error('Isi pengumuman wajib diisi');

    setFormLoading(true);
    const loadingToast = toast.loading(editId ? 'Memperbarui...' : 'Menyimpan...');
    
    const data = new FormData();
    Object.keys(formData).forEach(key => {
      if (formData[key] !== null) {
        data.append(key, formData[key]);
      }
    });

    try {
      if (editId) {
        await api.put(`/admin/announcements/${editId}`, data);
        toast.success('Pengumuman berhasil diperbarui', { id: loadingToast });
      } else {
        await api.post('/admin/announcements', data);
        toast.success('Pengumuman berhasil diterbitkan', { id: loadingToast });
      }
      handleCloseForm();
      fetchAnnouncements();
    } catch (error) {
      console.error('Submit error', error);
      toast.error(error.response?.data?.message || 'Gagal menyimpan pengumuman', { id: loadingToast });
    } finally {
      setFormLoading(false);
    }
  };

  const confirmDelete = (ann) => {
    setSelectedAnn(ann);
    setIsDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedAnn) return;
    const loadingToast = toast.loading('Menghapus...');
    try {
      await api.delete(`/admin/announcements/${selectedAnn.id}`);
      toast.success('Pengumuman berhasil dihapus', { id: loadingToast });
      setIsDeleteModalOpen(false);
      setSelectedAnn(null);
      fetchAnnouncements();
    } catch (error) {
      console.error('Delete error', error);
      toast.error('Gagal menghapus pengumuman', { id: loadingToast });
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PUBLISHED':
        return <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-700 border border-emerald-200"><CheckCircle size={10} className="mr-1" /> Published</span>;
      case 'DRAFT':
        return <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-700 border border-amber-200"><Clock size={10} className="mr-1" /> Draft</span>;
      case 'ARCHIVED':
        return <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-600 border border-slate-200"><Archive size={10} className="mr-1" /> Archived</span>;
      default:
        return status;
    }
  };

  const getFileIcon = (type) => {
    switch (type) {
      case 'pdf': return <FileText size={16} className="text-rose-500" />;
      case 'excel': return <FileSpreadsheet size={16} className="text-emerald-500" />;
      case 'image': return <ImageIcon size={16} className="text-blue-500" />;
      default: return <FileText size={16} className="text-slate-400" />;
    }
  };

  return (
    <div className="space-y-8 max-w-[1600px] mx-auto pb-12 animate-fade-in">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-4 mb-3">
            <div className="p-3 bg-slate-900 text-white rounded-2xl shadow-xl">
              <Megaphone size={28} />
            </div>
            <div>
              <h1 className="text-4xl font-black text-slate-900 tracking-tight">Pengumuman</h1>
              <p className="text-slate-500 font-medium">Kelola sistem informasi dan berita terkini portal PPDB.</p>
            </div>
          </div>
        </div>
        
        <button 
          onClick={() => handleOpenForm()}
          className="group inline-flex items-center px-8 py-4 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 transition-all shadow-xl shadow-blue-100 font-black text-[10px] uppercase tracking-widest"
        >
          <Plus className="w-5 h-5 mr-2 group-hover:rotate-90 transition-transform duration-300" /> 
          Buat Pengumuman Baru
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total', value: total, icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Published', value: announcements.filter(a => a.status === 'PUBLISHED').length, icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Penting', value: announcements.filter(a => a.is_featured).length, icon: Pin, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Drafts', value: announcements.filter(a => a.status === 'DRAFT').length, icon: Clock, color: 'text-slate-600', bg: 'bg-slate-50' }
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-soft flex items-center gap-4">
            <div className={`p-4 rounded-2xl ${stat.bg} ${stat.color}`}>
              <stat.icon size={24} />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
              <p className="text-2xl font-black text-slate-900">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters Section */}
      <div className="bg-white rounded-[2.5rem] shadow-premium-sm border border-slate-100 p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1 group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={20} />
            <input
              type="text"
              placeholder="Cari judul pengumuman atau konten..."
              value={filters.search}
              onChange={(e) => setFilters({...filters, search: e.target.value, page: 1})}
              className="w-full pl-14 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 focus:bg-white transition-all text-sm font-bold shadow-inner"
            />
          </div>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center px-6 bg-slate-50 border border-slate-100 rounded-2xl focus-within:ring-4 focus-within:ring-blue-50 transition-all">
              <Filter size={18} className="text-slate-400 mr-3" />
              <select 
                value={filters.type}
                onChange={(e) => setFilters({...filters, type: e.target.value, page: 1})}
                className="py-4 bg-transparent text-[10px] font-black uppercase tracking-widest text-slate-700 outline-none pr-4"
              >
                <option value="">Semua Format</option>
                <option value="image">Gambar</option>
                <option value="pdf">PDF</option>
                <option value="excel">Excel</option>
              </select>
            </div>
            <div className="flex items-center px-6 bg-slate-50 border border-slate-100 rounded-2xl focus-within:ring-4 focus-within:ring-blue-50 transition-all">
              <Globe size={18} className="text-slate-400 mr-3" />
              <select 
                value={filters.status}
                onChange={(e) => setFilters({...filters, status: e.target.value, page: 1})}
                className="py-4 bg-transparent text-[10px] font-black uppercase tracking-widest text-slate-700 outline-none pr-4"
              >
                <option value="">Semua Status</option>
                <option value="PUBLISHED">Published</option>
                <option value="DRAFT">Draft</option>
                <option value="ARCHIVED">Archived</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-[3rem] shadow-premium border border-slate-100 overflow-hidden">
        {loading ? (
          <div className="py-40 flex flex-col items-center justify-center space-y-6">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-slate-100 border-t-blue-600 rounded-full animate-spin"></div>
              <Megaphone className="absolute inset-0 m-auto text-blue-600 animate-pulse" size={24} />
            </div>
            <p className="text-slate-400 font-black uppercase tracking-[0.3em] text-[10px]">Menyinkronkan Basis Data...</p>
          </div>
        ) : announcements.length === 0 ? (
          <div className="py-40 text-center max-w-md mx-auto">
            <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-8 text-slate-200">
              <Megaphone size={48} strokeWidth={1.5} />
            </div>
            <p className="text-3xl font-black text-slate-900 mb-2 tracking-tight">Data Tidak Ditemukan</p>
            <p className="text-slate-500 font-medium">Belum ada pengumuman yang sesuai dengan filter saat ini.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Info Pengumuman</th>
                  <th className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Format</th>
                  <th className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Status</th>
                  <th className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Jadwal Terbit</th>
                  <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Manajemen</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {announcements.map((ann) => (
                  <tr key={ann.id} className="hover:bg-slate-50/70 transition-all group">
                    <td className="px-10 py-6">
                      <div className="flex items-center gap-5">
                        <div className={`relative flex-shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center transition-all group-hover:scale-110 shadow-sm border border-slate-100 ${ann.is_featured ? 'bg-amber-100 text-amber-600' : 'bg-white text-slate-500'}`}>
                          {ann.is_featured ? <Pin size={24} className="rotate-45" /> : <Megaphone size={24} />}
                        </div>
                        <div className="min-w-0">
                          <p className="text-base font-black text-slate-900 group-hover:text-blue-600 transition-colors truncate max-w-lg">{ann.title}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Slug: {ann.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-6">
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-xl border border-slate-100 w-fit">
                        {getFileIcon(ann.attachment_type)}
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">{ann.attachment_type || 'None'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-6">{getStatusBadge(ann.status)}</td>
                    <td className="px-6 py-6">
                      <div className="flex flex-col">
                        <span className="text-sm font-black text-slate-700">
                          {format(new Date(ann.published_at || ann.created_at), 'dd MMM yyyy', { locale: id })}
                        </span>
                        <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-0.5">
                          {format(new Date(ann.published_at || ann.created_at), 'HH:mm')} WIB
                        </span>
                      </div>
                    </td>
                    <td className="px-10 py-6 text-right">
                      <div className="flex justify-end gap-3">
                        <button 
                          onClick={() => { setSelectedAnn(ann); setIsPreviewOpen(true); }}
                          className="p-3 bg-white text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-2xl border border-slate-100 shadow-premium-sm transition-all"
                          title="Preview"
                        >
                          <Eye size={20} />
                        </button>
                        <button 
                          onClick={() => handleOpenForm(ann)}
                          className="p-3 bg-white text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-2xl border border-slate-100 shadow-premium-sm transition-all"
                          title="Edit"
                        >
                          <Edit2 size={20} />
                        </button>
                        <button 
                          onClick={() => confirmDelete(ann)}
                          className="p-3 bg-white text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-2xl border border-slate-100 shadow-premium-sm transition-all"
                          title="Hapus"
                        >
                          <Trash2 size={20} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading && total > 0 && (
          <div className="px-10 py-8 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-6 bg-slate-50/30">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
              Menampilkan <span className="text-slate-900">{announcements.length}</span> dari <span className="text-slate-900">{total}</span> total berita
            </p>
            <div className="flex items-center gap-2">
              <button 
                disabled={filters.page === 1}
                onClick={() => setFilters({...filters, page: filters.page - 1})}
                className="p-3 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 disabled:opacity-30 transition-all shadow-premium-sm"
              >
                <ChevronLeft size={22} />
              </button>
              
              <div className="flex items-center px-6 py-3 bg-white border border-slate-200 rounded-2xl shadow-premium-sm">
                <span className="text-sm font-black text-slate-900">{filters.page}</span>
                <span className="mx-3 text-slate-300">/</span>
                <span className="text-sm font-bold text-slate-500">{totalPages}</span>
              </div>

              <button 
                disabled={filters.page === totalPages}
                onClick={() => setFilters({...filters, page: filters.page + 1})}
                className="p-3 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 disabled:opacity-30 transition-all shadow-premium-sm"
              >
                <ChevronRight size={22} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Form Drawer */}
      {isFormOpen && (
        <div className="fixed inset-0 z-[100] flex justify-end bg-slate-900/60 backdrop-blur-xl animate-fade-in">
          <div className="w-full max-w-4xl bg-white h-full shadow-2xl flex flex-col animate-slide-in-right">
            <div className="px-10 py-8 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-2xl ${editId ? 'bg-indigo-600' : 'bg-blue-600'} text-white shadow-xl`}>
                  {editId ? <Edit2 size={24} /> : <Plus size={24} />}
                </div>
                <div>
                  <h2 className="text-3xl font-black text-slate-900 tracking-tight">
                    {editId ? 'Edit Pengumuman' : 'Konten Baru'}
                  </h2>
                  <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-1">Lengkapi seluruh detail informasi</p>
                </div>
              </div>
              <button onClick={handleCloseForm} className="p-4 hover:bg-slate-100 rounded-[1.5rem] transition-all group">
                <X size={28} className="group-hover:rotate-90 transition-transform" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} id="announcement-form" className="flex-1 overflow-y-auto p-10 space-y-12">
              {/* Basic Fields */}
              <div className="space-y-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <FileText size={14} className="text-blue-500" /> Judul Berita <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    className="w-full px-8 py-5 bg-slate-50 border border-slate-100 rounded-3xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 focus:bg-white transition-all outline-none font-black text-xl text-slate-900 placeholder:text-slate-300 shadow-inner"
                    placeholder="Contoh: Jadwal Ujian Seleksi Tahap 1..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <Globe size={14} className="text-blue-500" /> Status Publikasi
                    </label>
                    <select 
                      value={formData.status}
                      onChange={(e) => setFormData({...formData, status: e.target.value})}
                      className="w-full px-8 py-5 bg-slate-50 border border-slate-100 rounded-3xl focus:ring-4 focus:ring-blue-100 outline-none font-black text-xs uppercase tracking-widest text-slate-700 appearance-none transition-all shadow-inner"
                    >
                      <option value="PUBLISHED">Published</option>
                      <option value="DRAFT">Draft</option>
                      <option value="ARCHIVED">Archived</option>
                    </select>
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <Calendar size={14} className="text-blue-500" /> Waktu Terbit
                    </label>
                    <input 
                      type="datetime-local" 
                      value={formData.published_at}
                      onChange={(e) => setFormData({...formData, published_at: e.target.value})}
                      className="w-full px-8 py-5 bg-slate-50 border border-slate-100 rounded-3xl text-sm font-black text-slate-700 focus:ring-4 focus:ring-blue-50 focus:border-blue-500 transition-all outline-none shadow-inner"
                    />
                  </div>
                </div>
              </div>

              {/* Rich Editor */}
              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Edit2 size={14} className="text-blue-500" /> Konten Utama <span className="text-rose-500">*</span>
                </label>
                <div className="rounded-[2.5rem] overflow-hidden border border-slate-100 shadow-soft min-h-[450px]">
                  <Suspense fallback={<div className="h-48 flex items-center justify-center bg-slate-50 text-slate-400">Loading Editor...</div>}>
                    <RichTextEditor 
                      value={formData.content} 
                      onChange={(val) => setFormData({...formData, content: val})}
                      placeholder="Tulis rincian informasi di sini..."
                    />
                  </Suspense>
                </div>
              </div>

              {/* File Uploads */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <ImageIcon size={14} className="text-blue-500" /> Cover Pengumuman (HD)
                  </label>
                  <div className="relative group">
                    <div className="w-full h-48 bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 group-hover:border-blue-400 group-hover:bg-blue-50 transition-all overflow-hidden shadow-inner">
                      {formData.cover_image ? (
                        <div className="w-full h-full relative">
                          <img src={URL.createObjectURL(formData.cover_image)} alt="Preview" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                            <span className="text-white text-[10px] font-black uppercase tracking-[0.3em]">Ganti Cover</span>
                          </div>
                        </div>
                      ) : (
                        <>
                          <ImageIcon size={32} className="mb-3 opacity-20" />
                          <span className="text-[10px] font-black uppercase tracking-widest">Klik / Drop Image</span>
                        </>
                      )}
                    </div>
                    <input 
                      type="file" 
                      name="cover_image"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                  </div>
                </div>
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <FileText size={14} className="text-rose-500" /> Lampiran File (PDF/Excel)
                  </label>
                  <div className="relative group">
                    <div className="w-full h-48 bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 group-hover:border-rose-400 group-hover:bg-rose-50 transition-all overflow-hidden shadow-inner">
                      {formData.attachment_file ? (
                        <div className="flex flex-col items-center p-6 text-center">
                          <div className="p-4 bg-white rounded-2xl shadow-premium-sm text-rose-600 mb-3">
                            {formData.attachment_file.name.endsWith('.pdf') ? <FileText size={32} /> : <FileSpreadsheet size={32} />}
                          </div>
                          <span className="text-[10px] font-black text-slate-600 truncate max-w-full px-6">{formData.attachment_file.name}</span>
                        </div>
                      ) : (
                        <>
                          <DownloadCloud size={32} className="mb-3 opacity-20" />
                          <span className="text-[10px] font-black uppercase tracking-widest">Upload PDF/XLSX</span>
                        </>
                      )}
                    </div>
                    <input 
                      type="file" 
                      name="attachment_file"
                      accept=".pdf,.xlsx,.xls"
                      onChange={handleFileChange}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              {/* Extra Features */}
              <div className="bg-slate-900 rounded-[3rem] p-10 space-y-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12">
                  <Pin size={120} />
                </div>
                <h3 className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em] flex items-center gap-3">
                  <div className="w-1.5 h-6 bg-blue-500 rounded-full"></div>
                  Advanced Placement
                </h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 relative z-10">
                  <label className="flex items-center gap-5 cursor-pointer group bg-white/10 backdrop-blur-md p-6 rounded-[2rem] border border-white/10 hover:bg-white/20 transition-all">
                    <div className="relative flex items-center">
                      <input 
                        type="checkbox" 
                        checked={formData.is_featured}
                        onChange={(e) => setFormData({...formData, is_featured: e.target.checked})}
                        className="peer w-7 h-7 rounded-xl border-white/20 bg-transparent text-blue-500 focus:ring-blue-500 transition-all" 
                      />
                    </div>
                    <div>
                      <p className="text-sm font-black text-white">Featured Announcement</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Sematkan di banner utama</p>
                    </div>
                    <Pin size={24} className={`ml-auto transition-all ${formData.is_featured ? 'text-amber-500 scale-125' : 'text-white/20'}`} />
                  </label>
                </div>
              </div>
            </form>

            <div className="p-10 border-t border-slate-100 bg-white sticky bottom-0 z-10 flex gap-6 shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.05)]">
              <button 
                onClick={handleCloseForm}
                className="flex-1 px-10 py-6 bg-slate-50 text-slate-500 rounded-3xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-100 transition-all"
              >
                Batalkan
              </button>
              <button 
                form="announcement-form"
                type="submit"
                disabled={formLoading}
                className="flex-[2] px-10 py-6 bg-slate-900 text-white rounded-3xl font-black uppercase tracking-widest text-[10px] hover:bg-blue-600 transition-all shadow-premium hover:shadow-blue-200 flex items-center justify-center gap-4 disabled:opacity-50"
              >
                {formLoading ? (
                  <Loader2 size={20} className="animate-spin" />
                ) : (
                  <CheckCircle size={20} />
                )}
                {editId ? 'Perbarui Konten' : 'Publikasikan Sekarang'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {isPreviewOpen && selectedAnn && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-6 bg-slate-900/80 backdrop-blur-xl animate-fade-in">
          <div className="bg-[#f8fafc] w-full max-w-5xl rounded-[4rem] shadow-premium overflow-hidden flex flex-col max-h-[95vh] animate-zoom-in">
            <div className="px-12 py-8 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
              <div className="flex items-center gap-4">
                <div className="w-1.5 h-8 bg-blue-600 rounded-full"></div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">Pratinjau Live</h3>
              </div>
              <button onClick={() => setIsPreviewOpen(false)} className="p-4 hover:bg-slate-100 rounded-[1.5rem] transition-all"><X size={28} /></button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {selectedAnn.cover_image && (
                <div className="w-full aspect-[21/9] bg-slate-100 relative overflow-hidden">
                  <img src={`${API_BASE}/${selectedAnn.cover_image}`} alt="Preview" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#f8fafc] via-transparent to-transparent"></div>
                </div>
              )}

              <div className="px-16 pb-20 -mt-20 relative space-y-12">
                <div className="space-y-8">
                  <div className="flex flex-wrap items-center gap-4">
                    {getStatusBadge(selectedAnn.status)}
                    <span className="px-5 py-2 bg-white rounded-full text-[10px] font-black uppercase tracking-widest text-slate-500 border border-slate-100 shadow-sm">
                      {selectedAnn.attachment_type?.toUpperCase() || 'GENERAL'}
                    </span>
                    {selectedAnn.is_featured && <span className="bg-amber-500 text-white px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl shadow-amber-200 flex items-center gap-2"><Pin size={12} /> Featured</span>}
                  </div>
                  
                  <h2 className="text-6xl font-black text-slate-900 leading-[1.05] tracking-tight">{selectedAnn.title}</h2>
                  
                  <div className="flex items-center gap-10 text-slate-400 font-bold border-y border-slate-100 py-8">
                    <div className="flex items-center gap-3">
                      <Calendar className="text-blue-500" size={20} />
                      <span className="uppercase tracking-[0.2em] text-[10px] font-black">{format(new Date(selectedAnn.published_at || selectedAnn.created_at), 'EEEE, dd MMMM yyyy', { locale: id })}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Clock className="text-blue-500" size={20} />
                      <span className="uppercase tracking-[0.2em] text-[10px] font-black">{format(new Date(selectedAnn.published_at || selectedAnn.created_at), 'HH:mm')} WIB</span>
                    </div>
                  </div>
                </div>

                <div 
                  className="prose prose-2xl prose-slate max-w-none text-slate-700 leading-relaxed font-medium announcement-content"
                  dangerouslySetInnerHTML={{ __html: selectedAnn.content }}
                />

                {selectedAnn.attachment_file && (
                  <div className="p-10 bg-slate-900 rounded-[3.5rem] shadow-premium text-white flex flex-col md:flex-row items-center justify-between gap-10 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-10 opacity-10 -rotate-12">
                      {getFileIcon(selectedAnn.attachment_type)}
                    </div>
                    <div className="relative z-10 flex items-center gap-8">
                      <div className="p-6 bg-white/10 backdrop-blur-2xl rounded-[2.5rem] border border-white/20">
                        {getFileIcon(selectedAnn.attachment_type)}
                      </div>
                      <div>
                        <p className="text-3xl font-black tracking-tight mb-2">File Terlampir</p>
                        <p className="text-slate-400 font-bold text-sm tracking-widest uppercase">Format: {selectedAnn.attachment_type}</p>
                      </div>
                    </div>
                    <a 
                      href={`${API_BASE}/${selectedAnn.attachment_file}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="relative z-10 px-12 py-5 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-blue-500 transition-all flex items-center gap-4 shadow-xl shadow-blue-500/20"
                    >
                      Buka Dokumen <ArrowUpRight size={20} />
                    </a>
                  </div>
                )}
              </div>
            </div>
            
            <div className="px-16 py-8 border-t border-slate-100 bg-white flex justify-between items-center">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Database Record: #{selectedAnn.id}</span>
              <button 
                onClick={() => setIsPreviewOpen(false)}
                className="px-12 py-5 bg-slate-900 text-white rounded-3xl font-black uppercase tracking-widest text-[10px] hover:bg-blue-600 transition-all shadow-premium"
              >
                Tutup Pratinjau
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal 
        isOpen={isDeleteModalOpen}
        onClose={() => { setIsDeleteModalOpen(false); setSelectedAnn(null); }}
        onConfirm={handleDelete}
        title="Konfirmasi Hapus"
        message={`Apakah Anda benar-benar ingin menghapus berita "${selectedAnn?.title}"? Tindakan ini permanen.`}
        confirmText="Hapus Permanen"
        type="danger"
      />

      <style>{`
        .animate-slide-in-right {
          animation: slideInRight 0.5s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        .shadow-soft {
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05);
        }
        .shadow-premium {
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.15);
        }
        .shadow-premium-sm {
          box-shadow: 0 10px 20px -5px rgba(0, 0, 0, 0.08);
        }
        .announcement-content img {
          border-radius: 2rem;
          margin: 3rem 0;
          box-shadow: 0 20px 40px -10px rgba(0,0,0,0.1);
        }
      `}</style>
    </div>
  );
};

export default AdminAnnouncements;
