import { useState, useEffect } from 'react';
import { getBaseURL } from '../../utils/url';
import api from '../../store/useAuthStore';
import { 
  UploadCloud, 
  File, 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  Clock, 
  AlertCircle,
  FileText,
  Trash2,
  ExternalLink,
  Info
} from 'lucide-react';

const DOCUMENT_TYPES = [
  { id: 'IJAZAH', name: 'SKL / Ijazah SMP', required: true, desc: 'Scan Ijazah asli atau Surat Keterangan Lulus' },
  { id: 'SIDANIRA', name: 'Nilai Sidanira', required: true, desc: 'Nilai prestasi akademik semester 1 s/d 5' },
  { id: 'KK', name: 'Kartu Keluarga', required: true, desc: 'Scan Kartu Keluarga (KK) asli yang masih berlaku' },
  { id: 'FOTO', name: 'Pas Foto 3x4', required: true, desc: 'Pas foto terbaru (JPG/PNG), latar belakang merah/biru' },
  { id: 'PRESTASI', name: 'Sertifikat Prestasi', required: false, desc: 'Sertifikat lomba/kegiatan (Jika ada)' },
];

const UploadDocuments = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploadingId, setUploadingId] = useState(null);
  const [message, setMessage] = useState({ text: '', type: '' });

  const fetchDocuments = async () => {
    try {
      const response = await api.get('/student/profile');
      setDocuments(response.data.documents || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleUpload = async (e, typeId) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setMessage({ text: 'Ukuran file maksimal 5MB', type: 'error' });
      return;
    }

    const formData = new FormData();
    formData.append('type', typeId);
    formData.append('file', file);

    setUploadingId(typeId);
    setMessage({ text: '', type: '' });

    try {
      await api.post('/student/documents', formData);
      setMessage({ text: 'Dokumen berhasil diunggah!', type: 'success' });
      fetchDocuments();
    } catch (error) {
      setMessage({ text: error.response?.data?.message || 'Gagal upload dokumen', type: 'error' });
    } finally {
      setUploadingId(null);
    }
  };

  const getDocStatus = (typeId) => {
    const doc = documents.find(d => d.type === typeId);
    if (!doc) return { status: 'MISSING', label: 'Belum Diunggah', color: 'text-slate-400', bg: 'bg-slate-50', icon: Clock };
    
    switch (doc.status) {
      case 'VERIFIED': return { status: 'VERIFIED', label: 'Terverifikasi', color: 'text-emerald-600', bg: 'bg-emerald-50', icon: CheckCircle2, file: doc.file_path };
      case 'REJECTED': return { status: 'REJECTED', label: 'Ditolak', color: 'text-rose-600', bg: 'bg-rose-50', icon: XCircle, file: doc.file_path };
      default: return { status: 'PENDING', label: 'Dalam Peninjauan', color: 'text-blue-600', bg: 'bg-blue-50', icon: Clock, file: doc.file_path };
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-blue-600/10 border-t-blue-600 rounded-full animate-spin" />
        <p className="text-slate-400 font-bold text-xs uppercase tracking-[0.2em] animate-pulse">Memuat Berkas...</p>
      </div>
    </div>
  );

  return (
    <div className="animate-fade-in pb-20">
      {/* Page Header */}
      <div className="mb-12">
         <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-600 text-[10px] font-black px-3 py-1 rounded-full mb-4 uppercase tracking-[0.2em]">Dokumen Digital</div>
         <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Unggah Berkas Pendaftaran</h2>
         <p className="text-slate-500 font-bold text-sm">Pastikan dokumen dalam format PDF atau Gambar (JPG/PNG) dengan kualitas yang jelas.</p>
      </div>

      {message.text && (
        <div className={`mb-10 p-6 rounded-3xl flex items-center gap-4 animate-fade-in-up border shadow-lg ${message.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-700 shadow-emerald-100' : 'bg-rose-50 border-rose-100 text-rose-700 shadow-rose-100'}`}>
          <div className={`p-2 rounded-xl ${message.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>
             {message.type === 'success' ? <CheckCircle2 size={24} /> : <AlertCircle size={24} />}
          </div>
          <span className="font-bold text-lg">{message.text}</span>
        </div>
      )}

      {/* Documents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {DOCUMENT_TYPES.map((docType) => {
          const docState = getDocStatus(docType.id);
          const StateIcon = docState.icon;
          
          return (
            <div key={docType.id} className="bg-white rounded-[2.5rem] border border-slate-100 shadow-soft overflow-hidden flex flex-col group hover:shadow-premium transition-all duration-500 hover:-translate-y-1">
              <div className="p-8 flex-grow">
                <div className="flex justify-between items-start mb-6">
                   <div className={`w-14 h-14 ${docState.bg} rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 duration-500`}>
                      <FileText className={docState.color} size={28} />
                   </div>
                   <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full ${docState.bg} ${docState.color} text-[10px] font-black uppercase tracking-widest`}>
                      <StateIcon size={12} />
                      {docState.label}
                   </div>
                </div>

                <h4 className="text-xl font-black text-slate-900 mb-2 flex items-center">
                  {docType.name}
                  {docType.required && <span className="text-rose-500 ml-1 text-sm">*</span>}
                </h4>
                <p className="text-slate-500 font-medium text-sm leading-relaxed mb-8">
                  {docType.desc}
                </p>

                {docState.file && (
                  <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex items-center justify-between group/file hover:bg-white transition-colors">
                     <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-white border border-slate-200 rounded-lg flex items-center justify-center text-slate-400">
                           <File size={16} />
                        </div>
                        <div className="max-w-[150px] truncate">
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Nama File</p>
                           <p className="text-xs font-bold text-slate-700 truncate">{docState.file.split('-').pop()}</p>
                        </div>
                     </div>
                     <a 
                      href={`${getBaseURL()}/${docState.file}`} 
                      target="_blank" 
                      className="p-2 text-slate-400 hover:text-blue-600 transition-colors"
                      title="Lihat Dokumen"
                    >
                        <ExternalLink size={18} />
                     </a>
                  </div>
                )}
              </div>

              <div className="p-4 bg-slate-50/50 border-t border-slate-50 mt-auto">
                <input
                  type="file"
                  id={`upload-${docType.id}`}
                  className="hidden"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => handleUpload(e, docType.id)}
                  disabled={uploadingId === docType.id || docState.status === 'VERIFIED'}
                />
                <label
                  htmlFor={`upload-${docType.id}`}
                  className={`flex items-center justify-center w-full px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${
                    uploadingId === docType.id ? 'bg-slate-200 text-slate-400 cursor-not-allowed' :
                    docState.status === 'VERIFIED' ? 'bg-emerald-100 text-emerald-600 cursor-not-allowed border border-emerald-200' :
                    'bg-white border border-slate-200 text-slate-600 hover:bg-slate-900 hover:text-white hover:border-slate-900 cursor-pointer shadow-sm active:scale-95'
                  }`}
                >
                  {uploadingId === docType.id ? (
                    <><Loader2 size={16} className="animate-spin mr-2" /> Menunggu...</>
                  ) : docState.status === 'VERIFIED' ? (
                    <><CheckCircle2 size={16} className="mr-2" /> Terverifikasi</>
                  ) : (
                    <><UploadCloud size={16} className="mr-2" /> {docState.file ? 'Ganti Dokumen' : 'Pilih & Unggah'}</>
                  )}
                </label>
              </div>
            </div>
          );
        })}
      </div>

      {/* Security Info */}
      <div className="mt-16 bg-indigo-50/50 border border-indigo-100/50 rounded-3xl p-8 flex flex-col md:flex-row items-center gap-6">
         <div className="w-16 h-16 bg-indigo-100 rounded-[1.5rem] flex items-center justify-center text-indigo-600 shrink-0">
            <Info size={32} />
         </div>
         <div className="flex-grow text-center md:text-left">
            <h5 className="text-lg font-black text-indigo-900 mb-1 tracking-tight">Data Aman & Terenkripsi</h5>
            <p className="text-indigo-700/70 font-medium text-sm leading-relaxed max-w-2xl">
               Semua berkas yang Anda unggah akan disimpan secara aman di server kami dan hanya digunakan untuk kepentingan administrasi pendaftaran siswa baru.
            </p>
         </div>
      </div>
    </div>
  );
};

export default UploadDocuments;
