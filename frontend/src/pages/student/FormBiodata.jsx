import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import api from '../../store/useAuthStore';
import { 
  Loader2, 
  Save, 
  User, 
  Users, 
  BookOpen, 
  MapPin, 
  Phone, 
  Mail,
  ChevronRight,
  Sparkles,
  Info,
  CreditCard,
  School,
  Calculator,
  Heart,
  Calendar } from 'lucide-react';

const FormBiodata = () => {
  const { register, handleSubmit, reset, formState: { errors } } = useForm();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [message, setMessage] = useState({ text: '', type: '' });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await api.get('/student/profile');
        const data = response.data;
        
        let formattedDate = '';
        if (data.tgl_lahir) {
          formattedDate = new Date(data.tgl_lahir).toISOString().split('T')[0];
        }

        reset({
          nisn: data.nisn || '',
          nik: data.nik || '',
          no_kk: data.no_kk || '',
          nama_lengkap: data.nama_lengkap || '',
          jenis_kelamin: data.jenis_kelamin || '',
          tempat_lahir: data.tempat_lahir || '',
          tgl_lahir: formattedDate,
          agama: data.agama || '',
          asal_sekolah: data.asal_sekolah || '',
          no_hp: data.no_hp || '',
          email: data.email || '',
          jurusan_pilihan: data.jurusan_pilihan || '',
          nilai_rata_rata: data.nilai_rata_rata || '',
          nilai_b_indonesia: data.nilai_b_indonesia || '',
          nilai_b_inggris: data.nilai_b_inggris || '',
          nilai_matematika: data.nilai_matematika || '',
          nilai_ips: data.nilai_ips || '',
          nilai_ipa: data.nilai_ipa || '',
          nama_ayah: data.parent?.nama_ayah || '',
          nama_ibu: data.parent?.nama_ibu || '',
          pekerjaan_ayah: data.parent?.pekerjaan_ayah || '',
          pekerjaan_ibu: data.parent?.pekerjaan_ibu || '',
          penghasilan: data.parent?.penghasilan || '',
          no_hp_ortu: data.parent?.no_hp || '',
          alamat_ortu: data.parent?.alamat || ''
        });
      } catch (error) {
        console.error(error);
      } finally {
        setInitialLoading(false);
      }
    };
    fetchProfile();
  }, [reset]);

  const onSubmit = async (data) => {
    setLoading(true);
    setMessage({ text: '', type: '' });
    try {
      await api.put('/student/biodata', data);
      setMessage({ text: 'Biodata berhasil diperbarui!', type: 'success' });
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setTimeout(() => setMessage({ text: '', type: '' }), 5000);
    } catch (error) {
      setMessage({ text: error.response?.data?.message || 'Gagal menyimpan biodata', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
       <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-blue-600/10 border-t-blue-600 rounded-full animate-spin" />
        <p className="text-slate-400 font-bold text-xs uppercase tracking-[0.2em] animate-pulse">Memuat Formulir...</p>
      </div>
    </div>
  );

  const FormSection = ({ title, icon: Icon, children, desc, color = "blue" }) => {
    const colorClasses = {
      blue: "text-blue-600 bg-blue-50 border-blue-100",
      indigo: "text-indigo-600 bg-indigo-50 border-indigo-100",
      purple: "text-purple-600 bg-purple-50 border-purple-100",
      emerald: "text-emerald-600 bg-emerald-50 border-emerald-100"
    };

    return (
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-soft overflow-hidden mb-12 group transition-all duration-500 hover:shadow-premium">
        <div className="px-8 py-8 border-b border-slate-50 bg-slate-50/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-5">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm border ${colorClasses[color]} group-hover:scale-110 transition-transform duration-500`}>
              <Icon size={28} />
            </div>
            <div>
               <h3 className="text-xl font-black text-slate-900 tracking-tight leading-tight">{title}</h3>
               <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">{desc}</p>
            </div>
          </div>
        </div>
        <div className="p-8 md:p-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
            {children}
          </div>
        </div>
      </div>
    );
  };

  const InputField = ({ label, name, type = "text", placeholder, options, required, step, icon: Icon }) => (
    <div className="space-y-2">
      <div className="flex items-center justify-between ml-1">
        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      </div>
      <div className="relative group/input">
        {Icon && (
          <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within/input:text-blue-600 transition-colors pointer-events-none">
            <Icon size={18} />
          </div>
        )}
        {options ? (
          <select 
            {...register(name, { required })}
            className={`w-full ${Icon ? 'pl-14' : 'px-6'} py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600 focus:bg-white transition-all font-bold text-slate-900 text-sm outline-none appearance-none cursor-pointer`}
          >
            {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>
        ) : (
          <input 
            type={type}
            step={step}
            placeholder={placeholder}
            {...register(name, { required })}
            className={`w-full ${Icon ? 'pl-14' : 'px-6'} py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600 focus:bg-white transition-all font-bold text-slate-900 text-sm outline-none placeholder:text-slate-300`}
          />
        )}
        {options && (
          <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-300">
            <ChevronRight size={16} className="rotate-90" />
          </div>
        )}
      </div>
      {errors[name] && (
        <p className="text-[10px] font-black text-rose-500 mt-1.5 ml-1 uppercase tracking-widest flex items-center gap-1.5">
          <Info size={12} /> Wajib diisi dengan benar
        </p>
      )}
    </div>
  );

  return (
    <div className="animate-fade-in pb-32 max-w-5xl mx-auto">
      {/* Header Form */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-10 mb-16 relative">
        <div className="relative z-10">
           <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-600 text-[10px] font-black px-4 py-1.5 rounded-full mb-6 uppercase tracking-[0.2em] border border-blue-100">
             <Sparkles size={14} className="animate-pulse" />
             Digital Identity
           </div>
           <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight mb-4 leading-tight">
             Lengkapi <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Biodata Pendaftar</span>
           </h2>
           <p className="text-slate-500 font-medium text-lg max-w-xl">
             Pastikan seluruh data yang Anda masukkan sudah benar dan sesuai dengan dokumen asli.
           </p>
        </div>
        
        {message.text && (
          <div className={`px-6 py-4 rounded-[2rem] flex items-center gap-4 animate-fade-in-up shadow-2xl ${message.type === 'success' ? 'bg-emerald-600 text-white shadow-emerald-200' : 'bg-rose-600 text-white shadow-rose-200'}`}>
             <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
               {message.type === 'success' ? <Heart size={20} /> : <Info size={20} />}
             </div>
             <span className="font-black text-sm uppercase tracking-wide">{message.text}</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="relative">
        {/* A. Data Pribadi */}
        <FormSection title="Data Pribadi Siswa" icon={User} desc="Identitas Utama Calon Siswa" color="blue">
          <InputField label="Nama Lengkap" name="nama_lengkap" required placeholder="Sesuai Ijazah" icon={User} />
          <InputField label="NISN" name="nisn" required placeholder="10 Digit NISN" icon={CreditCard} />
          <InputField label="NIK" name="nik" required placeholder="16 Digit NIK" icon={CreditCard} />
          <InputField label="No. KK" name="no_kk" required placeholder="16 Digit No. KK" icon={CreditCard} />
          <InputField label="Jenis Kelamin" name="jenis_kelamin" icon={Heart} options={[
            { value: '', label: 'Pilih Jenis Kelamin' },
            { value: 'L', label: 'Laki-laki' },
            { value: 'P', label: 'Perempuan' }
          ]} />
          <InputField label="Tempat Lahir" name="tempat_lahir" placeholder="Kota Kelahiran" icon={MapPin} />
          <InputField label="Tanggal Lahir" name="tgl_lahir" type="date" icon={Calendar} />
          <InputField label="Agama" name="agama" icon={Sparkles} options={[
            { value: '', label: 'Pilih Agama' },
            { value: 'Islam', label: 'Islam' },
            { value: 'Kristen', label: 'Kristen' },
            { value: 'Katolik', label: 'Katolik' },
            { value: 'Hindu', label: 'Hindu' },
            { value: 'Buddha', label: 'Buddha' },
            { value: 'Konghucu', label: 'Konghucu' }
          ]} />
          <InputField label="Asal Sekolah" name="asal_sekolah" placeholder="SMP / MTs Asal" icon={School} />
          <InputField label="No. HP / WhatsApp" name="no_hp" placeholder="0812..." icon={Phone} />
          <InputField label="Jurusan Pilihan" name="jurusan_pilihan" required icon={BookOpen} options={[
            { value: '', label: 'Pilih Jurusan' },
            { value: 'AKL', label: 'Akuntansi dan Keuangan Lembaga (AKL)' },
            { value: 'DKV', label: 'Desain Komunikasi Visual (DKV)' },
            { value: 'MPLB', label: 'Manajemen Perkantoran (MPLB)' }
          ]} />
          <InputField label="Email Aktif" name="email" type="email" placeholder="nama@example.com" icon={Mail} />
        </FormSection>

        {/* B. Data Orang Tua */}
        <FormSection title="Data Orang Tua" icon={Users} desc="Informasi Ayah dan Ibu Kandung" color="indigo">
          <InputField label="Nama Ayah" name="nama_ayah" placeholder="Nama Lengkap Ayah" icon={User} />
          <InputField label="Nama Ibu" name="nama_ibu" placeholder="Nama Lengkap Ibu" icon={User} />
          <InputField label="Pekerjaan Ayah" name="pekerjaan_ayah" icon={Sparkles} />
          <InputField label="Pekerjaan Ibu" name="pekerjaan_ibu" icon={Sparkles} />
          <InputField label="Penghasilan" name="penghasilan" icon={CreditCard} options={[
            { value: '', label: 'Pilih Range Penghasilan' },
            { value: '< 1 Juta', label: '< 1.000.000' },
            { value: '1 - 3 Juta', label: '1.000.000 - 3.000.000' },
            { value: '3 - 5 Juta', label: '3.000.000 - 5.000.000' },
            { value: '> 5 Juta', label: '> 5.000.000' }
          ]} />
          <InputField label="No HP Orang Tua" name="no_hp_ortu" placeholder="0812..." icon={Phone} />
          <div className="md:col-span-2">
            <div className="space-y-2">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Alamat Lengkap Domisili</label>
              <div className="relative">
                <div className="absolute left-5 top-5 text-slate-300">
                  <MapPin size={18} />
                </div>
                <textarea 
                  {...register('alamat_ortu')} 
                  rows="4" 
                  className="w-full pl-14 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-[2rem] focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600 focus:bg-white transition-all font-bold text-slate-900 text-sm outline-none placeholder:text-slate-300 resize-none"
                  placeholder="Masukkan alamat lengkap rumah saat ini..."
                ></textarea>
              </div>
            </div>
          </div>
        </FormSection>

        {/* C. Nilai Akademik */}
        <FormSection title="Prestasi Akademik" icon={Calculator} desc="Nilai Sidanira dan TKA" color="purple">
          <div className="md:col-span-2">
            <InputField label="Nilai Akhir Sidanira" name="nilai_rata_rata" type="number" step="0.01" placeholder="0.00" icon={Sparkles} />
          </div>
          <div className="md:col-span-2">
             <div className="bg-amber-50/50 border border-amber-100/50 rounded-3xl p-6 flex flex-col md:flex-row md:items-center gap-5">
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-amber-600 shadow-sm shrink-0 border border-amber-100">
                  <Info size={24} />
                </div>
                <div>
                  <h4 className="text-sm font-black text-amber-900 uppercase tracking-tight">Tes Kemampuan Akademik (TKA)</h4>
                  <p className="text-xs font-medium text-amber-700/80 mt-0.5">Input nilai mata pelajaran utama sesuai dengan hasil tes pendaftaran.</p>
                </div>
             </div>
          </div>
          <InputField label="Bahasa Indonesia" name="nilai_b_indonesia" type="number" step="0.01" placeholder="0.00" icon={Calculator} />
          <InputField label="Matematika" name="nilai_matematika" type="number" step="0.01" placeholder="0.00" icon={Calculator} />
        </FormSection>

        {/* Floating Action Button */}
        <div className="fixed bottom-12 left-0 right-0 z-50 flex justify-center pointer-events-none">
           <button
            type="submit"
            disabled={loading}
            className="pointer-events-auto group flex items-center gap-4 bg-slate-900 hover:bg-blue-600 text-white px-12 py-6 rounded-[2.5rem] font-black transition-all shadow-premium hover:shadow-blue-200 active:scale-95 disabled:opacity-70 disabled:scale-100 disabled:bg-slate-400"
          >
            {loading ? (
              <Loader2 className="animate-spin" size={24} />
            ) : (
              <>
                <Save size={24} className="group-hover:rotate-12 transition-transform" />
                <span className="text-lg tracking-tight">Perbarui Data Sekarang</span>
                <ChevronRight size={20} className="text-white/30 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </div>
      </form>

      {/* Info Footer */}
      <div className="mt-10 text-center max-w-2xl mx-auto px-6">
         <p className="text-slate-400 font-medium text-sm leading-relaxed">
           Data yang Anda simpan akan terenkripsi dan hanya digunakan untuk keperluan seleksi penerimaan siswa baru SMK Bina Putra Jakarta.
         </p>
      </div>
    </div>
  );
};

export default FormBiodata;

