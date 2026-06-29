import { useState, useEffect } from 'react';
import api from '../../store/useAuthStore';
import { 
  UploadCloud, 
  FileText, 
  Image as ImageIcon, 
  Trash2, 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  DownloadCloud, 
  Eye,
  Plus,
  Info,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import toast from 'react-hot-toast';
import { getApiURL, getAssetURL } from '../../utils/url';
import ConfirmModal from '../../components/ConfirmModal';

const AdminBrochures = () => {
  const [brochures, setBrochures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedBrochure, setSelectedBrochure] = useState(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    file: null
  });

  const API_BASE = getApiURL().replace('/api', '');

  const fetchBrochures = async () => {
    try {
      const res = await api.get('/admin/brosur');
      setBrochures(res.data);
    } catch (error) {
      console.error('Failed to fetch brochures', error);
      toast.error('Gagal memuat data brosur');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBrochures();
  }, []);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!formData.file) return toast.error('Pilih file terlebih dahulu');

    setUploading(true);
    const data = new FormData();
    data.append('title', formData.title);
    data.append('description', formData.description);
    data.append('brochure', formData.file);

    try {
      await api.post('/admin/brosur', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success('Brosur berhasil diunggah');
      setFormData({ title: '', description: '', file: null });
      setIsModalOpen(false);
      fetchBrochures();
    } catch (error) {
      console.error('Upload error', error);
      toast.error(error.response?.data?.message || 'Gagal mengunggah brosur');
    } finally {
      setUploading(false);
    }
  };

  const handleToggleStatus = async (brochureId, currentStatus) => {
    try {
      await api.patch(`/admin/brosur/${brochureId}/status`, { is_active: !currentStatus });
      toast.success(`Brosur ${!currentStatus ? 'diaktifkan' : 'dinonaktifkan'}`);
      fetchBrochures();
    } catch (error) {
      toast.error('Gagal mengubah status');
    }
  };

  const handleDelete = async () => {
    if (!selectedBrochure) return;
    try {
      await api.delete(`/admin/brosur/${selectedBrochure.id}`);
      toast.success('Brosur berhasil dihapus');
      fetchBrochures();
      setIsDeleteModalOpen(false);
    } catch (error) {
      toast.error('Gagal menghapus brosur');
    }
  };

  return (
    <div className="p-4 sm:p-8 space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Manajemen Brosur</h1>
          <p className="text-slate-500 font-medium">Kelola dokumen informasi PPDB yang dapat diunduh calon siswa</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-600 transition-all shadow-xl shadow-slate-200"
        >
          <Plus size={18} /> Unggah Brosur Baru
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
          <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Memuat data brosur...</p>
        </div>
      ) : brochures.length === 0 ? (
        <div className="bg-white rounded-[2rem] border-2 border-dashed border-slate-100 p-20 text-center">
          <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-6 text-slate-200">
            <FileText size={40} />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">Belum ada brosur</h3>
          <p className="text-slate-500 max-w-sm mx-auto mb-8">Silakan unggah brosur sekolah dalam format PDF atau Gambar untuk ditampilkan di halaman utama.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {brochures.map((b) => (
            <div 
              key={b.id} 
              className={`group bg-white rounded-[2.5rem] border ${b.is_active ? 'border-blue-500 ring-4 ring-blue-500/5' : 'border-slate-100'} p-6 transition-all duration-500 relative`}
            >
              {b.is_active && (
                <div className="absolute -top-3 -right-3 px-4 py-1.5 bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg z-10 animate-bounce-subtle">
                  Sedang Aktif
                </div>
              )}
              
              <div className="aspect-[3/4] rounded-3xl bg-slate-50 mb-6 overflow-hidden relative group-hover:shadow-2xl transition-all duration-500 border border-slate-100 flex items-center justify-center">
                {b.file_type === 'pdf' ? (
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-20 h-20 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-500">
                      <FileText size={40} />
                    </div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">PDF Document</span>
                  </div>
                ) : (
                  <img 
                    src={getAssetURL(b.file_path)} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" 
                    alt={b.title} 
                  />
                )}
                
                {/* Quick Actions */}
                <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 backdrop-blur-sm">
                  <a 
                    href={getAssetURL(b.file_path)} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="p-4 bg-white text-slate-900 rounded-2xl hover:scale-110 transition-transform shadow-xl"
                  >
                    <Eye size={20} />
                  </a>
                  <a 
                    href={`${getApiURL()}/public/brosur/download/${b.id}`}
                    className="p-4 bg-blue-600 text-white rounded-2xl hover:scale-110 transition-transform shadow-xl"
                  >
                    <DownloadCloud size={20} />
                  </a>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="font-black text-slate-900 line-clamp-1 group-hover:text-blue-600 transition-colors">{b.title}</h3>
                  <p className="text-xs text-slate-400 font-medium flex items-center gap-2 mt-1">
                    <Calendar size={12} /> {format(new Date(b.created_at), 'dd MMMM yyyy', { locale: id })}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                  <button
                    onClick={() => handleToggleStatus(b.id, b.is_active)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                      b.is_active 
                      ? 'bg-blue-50 text-blue-600 border border-blue-100' 
                      : 'bg-slate-50 text-slate-400 border border-slate-100 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-100'
                    }`}
                  >
                    {b.is_active ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                    {b.is_active ? 'Aktif' : 'Aktifkan'}
                  </button>

                  <button
                    onClick={() => {
                      setSelectedBrochure(b);
                      setIsDeleteModalOpen(true);
                    }}
                    className="p-2 text-slate-300 hover:text-rose-600 transition-colors"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-fade-in">
          <div className="bg-white rounded-[3rem] w-full max-w-xl overflow-hidden shadow-2xl animate-scale-in">
            <div className="p-8 sm:p-12">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">Unggah Brosur</h2>
                  <p className="text-slate-500 text-sm font-medium">Lengkapi informasi brosur sekolah</p>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="p-3 hover:bg-slate-50 rounded-2xl transition-colors">
                  <XCircle size={24} className="text-slate-300" />
                </button>
              </div>

              <form onSubmit={handleUpload} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Judul Brosur</label>
                  <input 
                    type="text" 
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    placeholder="Contoh: Brosur PPDB 2026 Utama"
                    className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:border-blue-500 focus:bg-white outline-none transition-all font-medium text-slate-700"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Keterangan Singkat (Opsional)</label>
                  <textarea 
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Tambahkan deskripsi singkat..."
                    className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:border-blue-500 focus:bg-white outline-none transition-all font-medium text-slate-700 min-h-[100px] resize-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">File Brosur (PDF/JPG/PNG)</label>
                  <div className="relative">
                    <input 
                      type="file" 
                      required
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => setFormData({...formData, file: e.target.files[0]})}
                      className="hidden" 
                      id="file-upload" 
                    />
                    <label 
                      htmlFor="file-upload"
                      className="flex flex-col items-center justify-center p-10 bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2rem] hover:border-blue-500 hover:bg-blue-50/30 transition-all cursor-pointer group"
                    >
                      {formData.file ? (
                        <div className="flex flex-col items-center gap-4 animate-scale-in">
                          <div className="p-4 bg-emerald-50 rounded-2xl text-emerald-500 border border-emerald-100">
                            {formData.file.type === 'application/pdf' ? <FileText size={32} /> : <ImageIcon size={32} />}
                          </div>
                          <div className="text-center">
                            <p className="text-sm font-black text-slate-900 line-clamp-1">{formData.file.name}</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{(formData.file.size / 1024 / 1024).toFixed(2)} MB</p>
                          </div>
                        </div>
                      ) : (
                        <>
                          <UploadCloud className="w-12 h-12 text-slate-300 mb-4 group-hover:scale-110 group-hover:text-blue-500 transition-all" />
                          <p className="text-sm font-bold text-slate-900">Klik untuk memilih file</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">PDF, JPG, atau PNG (Max 10MB)</p>
                        </>
                      )}
                    </label>
                  </div>
                </div>

                <div className="pt-4 flex gap-4">
                  <button 
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 px-8 py-4 glass border border-slate-200 text-slate-500 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-white transition-all"
                  >
                    Batal
                  </button>
                  <button 
                    type="submit"
                    disabled={uploading}
                    className="flex-2 px-8 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-600 transition-all shadow-xl shadow-slate-200 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {uploading ? (
                      <> <Loader2 className="w-4 h-4 animate-spin" /> Mengunggah... </>
                    ) : (
                      <> <CheckCircle2 className="w-4 h-4" /> Simpan Brosur </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmModal 
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title="Hapus Brosur?"
        message={`Apakah Anda yakin ingin menghapus brosur "${selectedBrochure?.title}"? Tindakan ini tidak dapat dibatalkan.`}
        confirmText="Ya, Hapus"
        cancelText="Batal"
        type="danger"
      />
    </div>
  );
};

export default AdminBrochures;
