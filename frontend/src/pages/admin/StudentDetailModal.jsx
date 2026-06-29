import React, { useState } from 'react';
import { API_URL, getAssetURL } from '../../utils/url';
import { 
  X, 
  CheckCircle, 
  XCircle, 
  Clock, 
  FileText, 
  Download, 
  Award, 
  ShieldCheck, 
  ShieldX, 
  Loader2,
  User,
  CreditCard,
  MapPin,
  School,
  Calculator,
  Mail,
  Phone,
  Calendar,
  Sparkles,
  Users } from 'lucide-react';
import api from '../../store/useAuthStore';

const StudentDetailModal = ({ studentId, onClose, onUpdate }) => {
  const [student, setStudent] = React.useState(null);
  const [loading, setLoading] = useState(true);
  const [statusLoading, setStatusLoading] = useState(false);
  const [docLoading, setDocLoading] = useState({});
  const [activeTab, setActiveTab] = useState('biodata');

  React.useEffect(() => {
    const fetchDetail = async () => {
      try {
        const res = await api.get(`/admin/students/${studentId}`);
        setStudent(res.data);
      } catch (error) {
        console.error('Failed to fetch student details', error);
      } finally {
        setLoading(false);
      }
    };
    if (studentId) fetchDetail();
  }, [studentId]);

  const handleUpdateStatus = async (newStatus) => {
    setStatusLoading(true);
    try {
      await api.put(`/admin/students/${studentId}/status`, { status: newStatus });
      setStudent({ ...student, registration: { ...student.registration, status: newStatus } });
      onUpdate();
    } catch (error) {
      console.error('Failed to update status', error);
      alert('Gagal mengupdate status');
    } finally {
      setStatusLoading(false);
    }
  };

  const handleDocStatus = async (docId, newStatus) => {
    setDocLoading(prev => ({ ...prev, [docId]: true }));
    try {
      await api.put(`/admin/documents/${docId}/status`, { status: newStatus });
      setStudent(prev => ({
        ...prev,
        documents: prev.documents.map(d => d.id === docId ? { ...d, status: newStatus } : d)
      }));
    } catch (error) {
      console.error('Failed to update document status', error);
      alert('Gagal mengupdate status dokumen');
    } finally {
      setDocLoading(prev => ({ ...prev, [docId]: false }));
    }
  };

  const InfoRow = ({ label, value, icon: Icon }) => (
    <div className="flex items-start justify-between py-3 border-b border-slate-50 last:border-0 group">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400 group-hover:text-blue-600 transition-colors">
          <Icon size={16} />
        </div>
        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{label}</span>
      </div>
      <span className="text-sm font-black text-slate-900 text-right ml-4">{value || '-'}</span>
    </div>
  );

  if (!studentId) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      
      <div className="relative bg-white rounded-[2.5rem] shadow-premium w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col animate-fade-in-up">
        {/* Header */}
        <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div className="flex items-center gap-4">
             <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
                <User size={20} />
             </div>
             <div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight">Detail Data Pendaftar</h2>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Sistem Manajemen Pendaftaran v2.0</p>
             </div>
          </div>
          <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-slate-100 text-slate-400 transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="w-12 h-12 border-4 border-blue-600/10 border-t-blue-600 rounded-full animate-spin" />
              <p className="text-slate-400 font-bold text-xs uppercase tracking-widest animate-pulse">Menghimpun Data...</p>
            </div>
          ) : student ? (
            <div className="p-8">
              {/* Profile Card */}
              <div className="flex flex-col md:flex-row gap-8 bg-slate-900 rounded-[2rem] p-8 mb-10 relative overflow-hidden text-white">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600 opacity-20 rounded-full blur-[80px] -mr-32 -mt-32" />
                
                <div className="relative z-10 w-32 h-44 bg-white/10 rounded-2xl border-2 border-white/20 shadow-2xl overflow-hidden shrink-0 self-center md:self-start">
                  {student.documents?.find(d => d.type === 'FOTO') ? (
                    <img 
                      src={getAssetURL(student.documents.find(d => d.type === 'FOTO').file_path)} 
                      alt="Foto Profil" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-white/20 italic">
                       <User size={48} />
                    </div>
                  )}
                </div>
                
                <div className="relative z-10 flex-grow text-center md:text-left flex flex-col justify-center">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                      <h3 className="text-3xl font-black tracking-tight mb-1">{student.nama_lengkap}</h3>
                      <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mt-3">
                         <span className="bg-white/10 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest border border-white/10">NISN: {student.nisn}</span>
                         <span className="bg-blue-500 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-lg shadow-blue-900/20">{student.jurusan_pilihan}</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-center md:items-end gap-2">
                       <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">Status Pendaftaran</p>
                       <span className={`px-5 py-2 rounded-xl text-xs font-black uppercase tracking-widest shadow-xl ${
                         student.registration?.status === 'LULUS' ? 'bg-emerald-500 text-white' :
                         student.registration?.status === 'VERIFIED' ? 'bg-blue-600 text-white' :
                         student.registration?.status === 'TIDAK LULUS' ? 'bg-rose-600 text-white' :
                         'bg-amber-500 text-white'
                       }`}>
                         {student.registration?.status || 'PENDING'}
                       </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex gap-2 p-1.5 bg-slate-50 rounded-2xl mb-8 border border-slate-100">
                {[
                  { id: 'biodata', label: 'Biodata & Ortu', icon: User },
                  { id: 'akademik', label: 'Data Akademik', icon: Calculator },
                  { id: 'dokumen', label: 'Berkas Dokumen', icon: FileText }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                      activeTab === tab.id ? 'bg-white text-blue-600 shadow-sm border border-slate-100' : 'text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    <tab.icon size={16} />
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <div className="min-h-[300px]">
                {activeTab === 'biodata' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10 animate-fade-in">
                    <div>
                      <h4 className="flex items-center gap-2 text-sm font-black text-slate-900 uppercase tracking-tight mb-6 border-l-4 border-blue-600 pl-3">Identitas Siswa</h4>
                      <div className="space-y-1">
                        <InfoRow label="NIK" value={student.nik} icon={CreditCard} />
                        <InfoRow label="No. KK" value={student.no_kk} icon={CreditCard} />
                        <InfoRow label="Jenis Kelamin" value={student.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan'} icon={User} />
                        <InfoRow label="Tempat, Tgl Lahir" value={`${student.tempat_lahir}, ${student.tgl_lahir ? new Date(student.tgl_lahir).toLocaleDateString('id-ID') : '-'}`} icon={Calendar} />
                        <InfoRow label="Asal Sekolah" value={student.asal_sekolah} icon={School} />
                        <InfoRow label="No. HP" value={student.no_hp} icon={Phone} />
                        <InfoRow label="Email" value={student.user?.email} icon={Mail} />
                      </div>
                    </div>
                    <div>
                      <h4 className="flex items-center gap-2 text-sm font-black text-slate-900 uppercase tracking-tight mb-6 border-l-4 border-indigo-600 pl-3">Data Orang Tua</h4>
                      <div className="space-y-1">
                        <InfoRow label="Nama Ayah" value={student.parent?.nama_ayah} icon={User} />
                        <InfoRow label="Nama Ibu" value={student.parent?.nama_ibu} icon={User} />
                        <InfoRow label="Pekerjaan Ayah" value={student.parent?.pekerjaan_ayah} icon={Sparkles} />
                        <InfoRow label="Penghasilan" value={student.parent?.penghasilan} icon={CreditCard} />
                        <InfoRow label="No. HP Ortu" value={student.parent?.no_hp} icon={Phone} />
                        <div className="mt-6 pt-4 border-t border-slate-50">
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2"><MapPin size={12}/> Alamat Domisili</p>
                           <p className="text-sm font-bold text-slate-700 leading-relaxed">{student.parent?.alamat || 'Belum diisi'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'akademik' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-12 animate-fade-in">
                    <div>
                      <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight mb-6 border-l-4 border-purple-600 pl-3">Nilai Tes Akademik (TKA)</h4>
                      <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 grid grid-cols-2 gap-6">
                         <div className="space-y-1">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">B. Indonesia</p>
                            <p className="text-2xl font-black text-slate-900">{student.nilai_b_indonesia || '0.00'}</p>
                         </div>
                         <div className="space-y-1">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Matematika</p>
                            <p className="text-2xl font-black text-slate-900">{student.nilai_matematika || '0.00'}</p>
                         </div>
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight mb-6 border-l-4 border-emerald-600 pl-3">Nilai Sidanira</h4>
                      <div className="space-y-1">
                         <InfoRow label="Nilai Akhir Sidanira" value={student.nilai_rata_rata} icon={Award} />
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'dokumen' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
                    {student.documents && student.documents.length > 0 ? (
                      student.documents.map((doc) => (
                        <div key={doc.id} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between group hover:shadow-md transition-all">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-16 bg-slate-50 rounded-lg overflow-hidden border border-slate-100 flex-shrink-0 flex items-center justify-center text-slate-300">
                              {doc.file_path.match(/\.(jpg|jpeg|png|webp)$/i) ? (
                                <img src={getAssetURL(doc.file_path)} alt={doc.type} className="w-full h-full object-cover" />
                              ) : (
                                <FileText size={24} />
                              )}
                            </div>
                            <div>
                               <p className="text-xs font-black text-slate-900 uppercase tracking-tight">
                                 {doc.type === 'IJAZAH' ? 'SKL / Ijazah SMP' : doc.type}
                               </p>
                               <div className={`inline-flex items-center gap-1.5 mt-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${
                                 doc.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-600' :
                                 doc.status === 'REJECTED' ? 'bg-rose-50 text-rose-600' :
                                 'bg-amber-50 text-amber-600'
                               }`}>
                                 {doc.status}
                               </div>
                            </div>
                          </div>
                          
                          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                             <a href={getAssetURL(doc.file_path)} target="_blank" rel="noreferrer" className="w-8 h-8 flex items-center justify-center bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-600 hover:text-white transition-all">
                                <Download size={14} />
                             </a>
                             {doc.status === 'PENDING' ? (
                               <>
                                 <button onClick={() => handleDocStatus(doc.id, 'APPROVED')} className="w-8 h-8 flex items-center justify-center bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-600 hover:text-white transition-all">
                                   <CheckCircle size={14} />
                                 </button>
                                 <button onClick={() => handleDocStatus(doc.id, 'REJECTED')} className="w-8 h-8 flex items-center justify-center bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-600 hover:text-white transition-all">
                                   <XCircle size={14} />
                                 </button>
                               </>
                             ) : (
                               <button onClick={() => handleDocStatus(doc.id, 'PENDING')} className="w-8 h-8 flex items-center justify-center bg-slate-100 text-slate-400 rounded-lg hover:bg-slate-200 transition-all">
                                 <Clock size={14} />
                               </button>
                             )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="md:col-span-2 py-12 flex flex-col items-center justify-center text-slate-300 border-2 border-dashed border-slate-100 rounded-[2rem]">
                         <FileText size={48} className="opacity-20 mb-4" />
                         <p className="font-bold text-sm uppercase tracking-widest">Belum ada dokumen pendaftaran</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <p className="text-center text-rose-500 py-20 font-black uppercase tracking-widest">Data tidak ditemukan.</p>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-8 py-6 border-t border-slate-100 bg-slate-50/50 flex flex-wrap gap-4 justify-between items-center">
          <div className="flex items-center gap-3">
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Aksi Cepat Panitia:</p>
             <div className="h-1 w-1 bg-slate-300 rounded-full" />
          </div>
          <div className="flex flex-wrap gap-3">
            {student && (
              <>
                <button 
                  onClick={() => handleUpdateStatus('VERIFIED')}
                  disabled={statusLoading}
                  className="flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-blue-100 disabled:opacity-50"
                >
                  {statusLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ShieldCheck className="w-4 h-4 mr-2" />}
                  Verifikasi Berkas
                </button>
                <button 
                  onClick={() => handleUpdateStatus('LULUS')}
                  disabled={statusLoading}
                  className="flex items-center px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-emerald-100 disabled:opacity-50"
                >
                  {statusLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Award className="w-4 h-4 mr-2" />}
                  Lulus Seleksi
                </button>
                <button 
                  onClick={() => handleUpdateStatus('TIDAK LULUS')}
                  disabled={statusLoading}
                  className="flex items-center px-6 py-3 bg-rose-600 hover:bg-rose-700 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-rose-100 disabled:opacity-50"
                >
                  {statusLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <XCircle className="w-4 h-4 mr-2" />}
                  Gugur Seleksi
                </button>
              </>
            )}
            <button 
              onClick={onClose}
              className="px-6 py-3 bg-white border border-slate-200 text-slate-500 hover:bg-slate-50 text-xs font-black uppercase tracking-widest rounded-xl transition-all"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDetailModal;

