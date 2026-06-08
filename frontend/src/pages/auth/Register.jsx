import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  User,
  Hash,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Loader2,
  AlertCircle,
  CheckCircle,
  CheckCircle2,
  UserPlus,
  Shield,
} from 'lucide-react';

// ── Validation Schema ─────────────────────────────────────────────────────────
const schema = yup.object({
  nama_lengkap: yup
    .string()
    .min(3, 'Nama minimal 3 karakter')
    .required('Nama lengkap wajib diisi'),
  nisn: yup
    .string()
    .matches(/^\d{10}$/, 'NISN harus 10 digit angka')
    .required('NISN wajib diisi'),
  email: yup
    .string()
    .email('Format email tidak valid')
    .required('Email wajib diisi'),
  password: yup
    .string()
    .min(6, 'Password minimal 6 karakter')
    .required('Password wajib diisi'),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref('password')], 'Password tidak sama')
    .required('Konfirmasi password wajib diisi'),
});

// ── Reusable Input Field ──────────────────────────────────────────────────────
const InputField = ({ id, label, icon: Icon, error, rightSlot, children }) => (
  <div className="space-y-1.5">
    <label
      htmlFor={id}
      className="block text-sm font-semibold text-slate-700 dark:text-slate-300"
    >
      {label}
    </label>
    <div className="relative group">
      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
        <Icon
          size={16}
          className={`transition-colors duration-200 ${
            error
              ? 'text-red-400'
              : 'text-slate-400 group-focus-within:text-blue-500'
          }`}
        />
      </div>
      {children}
      {rightSlot && (
        <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center">
          {rightSlot}
        </div>
      )}
    </div>
    <AnimatePresence mode="wait">
      {error && (
        <motion.p
          key="error"
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.2 }}
          className="flex items-center gap-1.5 text-xs text-red-500 font-medium"
        >
          <AlertCircle size={12} />
          {error}
        </motion.p>
      )}
    </AnimatePresence>
  </div>
);

const inputClass = (hasError) =>
  `w-full pl-10 pr-4 py-3 rounded-xl border text-sm font-medium transition-all duration-200 outline-none
  bg-slate-50 dark:bg-slate-800/60
  text-slate-900 dark:text-white
  placeholder:text-slate-400 dark:placeholder:text-slate-500
  focus:bg-white dark:focus:bg-slate-800
  focus:ring-2 focus:ring-offset-0
  ${
    hasError
      ? 'border-red-400 dark:border-red-500 focus:border-red-400 focus:ring-red-200 dark:focus:ring-red-900/40'
      : 'border-slate-200 dark:border-slate-700 focus:border-blue-500 focus:ring-blue-200 dark:focus:ring-blue-900/50'
  }`;

// ── Password strength indicator ───────────────────────────────────────────────
const PasswordStrength = ({ password }) => {
  if (!password) return null;
  const checks = [
    { label: 'Min. 6 karakter', ok: password.length >= 6 },
    { label: 'Mengandung angka', ok: /\d/.test(password) },
    { label: 'Huruf besar', ok: /[A-Z]/.test(password) },
  ];
  return (
    <div className="mt-2 space-y-1">
      {checks.map((c) => (
        <div key={c.label} className="flex items-center gap-1.5">
          <CheckCircle2
            size={11}
            className={c.ok ? 'text-emerald-500' : 'text-slate-300 dark:text-slate-600'}
          />
          <span
            className={`text-[11px] font-medium ${
              c.ok
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-slate-400 dark:text-slate-600'
            }`}
          >
            {c.label}
          </span>
        </div>
      ))}
    </div>
  );
};

// ── Register Component ────────────────────────────────────────────────────────
const Register = () => {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
    mode: 'onChange',
  });

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [globalError, setGlobalError] = useState('');
  const [success, setSuccess] = useState(false);

  const { register: registerUser } = useAuthStore();
  const navigate = useNavigate();

  const passwordValue = watch('password');

  const onSubmit = async (data) => {
    if (loading) return;
    setLoading(true);
    setGlobalError('');

    const result = await registerUser(data);

    if (result.success) {
      setSuccess(true);
      toast.success('Pendaftaran berhasil! Selamat datang 🎉');
      await new Promise((r) => setTimeout(r, 1200));
      navigate('/student');
    } else {
      setGlobalError(
        result.message || 'Registrasi gagal. Email atau NISN sudah terdaftar.'
      );
      toast.error('Registrasi gagal. Periksa kembali data Anda.');
    }

    setLoading(false);
  };

  return (
    <div>
      {/* Heading */}
      <div className="mb-6">
        <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
          Buat Akun Baru 🚀
        </h2>

      </div>

      {/* Global error */}
      <AnimatePresence>
        {globalError && (
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: -6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: -6 }}
            transition={{ duration: 0.25 }}
            className="flex items-start gap-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/60 text-red-700 dark:text-red-400 rounded-xl px-4 py-3 mb-5 text-sm"
          >
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <span>{globalError}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success state */}
      <AnimatePresence>
        {success && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-10 gap-4"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center"
            >
              <CheckCircle size={40} className="text-emerald-500" />
            </motion.div>
            <div className="text-center">
              <p className="text-slate-900 dark:text-white font-bold text-lg">
                Pendaftaran Berhasil!
              </p>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                Mengalihkan ke dashboard...
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Form */}
      {!success && (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          {/* Nama Lengkap */}
          <InputField
            id="nama_lengkap"
            label="Nama Lengkap"
            icon={User}
            error={errors.nama_lengkap?.message}
          >
            <input
              id="nama_lengkap"
              {...register('nama_lengkap')}
              type="text"
              className={inputClass(!!errors.nama_lengkap)}
              placeholder="Sesuai Ijazah / Akta"
              autoComplete="name"
            />
          </InputField>

          {/* NISN */}
          <InputField
            id="nisn"
            label="NISN"
            icon={Hash}
            error={errors.nisn?.message}
          >
            <input
              id="nisn"
              {...register('nisn')}
              type="text"
              inputMode="numeric"
              maxLength={10}
              className={inputClass(!!errors.nisn)}
              placeholder="10 Digit Nomor NISN"
            />
          </InputField>

          {/* Email */}
          <InputField
            id="email"
            label="Email"
            icon={Mail}
            error={errors.email?.message}
          >
            <input
              id="email"
              {...register('email')}
              type="email"
              className={inputClass(!!errors.email)}
              placeholder="nama@email.com"
              autoComplete="email"
            />
          </InputField>

          {/* Password */}
          <InputField
            id="password"
            label="Password"
            icon={Lock}
            error={errors.password?.message}
            rightSlot={
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="text-slate-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
                aria-label="Toggle password visibility"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            }
          >
            <input
              id="password"
              {...register('password')}
              type={showPassword ? 'text' : 'password'}
              className={`${inputClass(!!errors.password)} pr-10`}
              placeholder="Min. 6 karakter"
              autoComplete="new-password"
            />
          </InputField>
          <PasswordStrength password={passwordValue} />

          {/* Confirm Password */}
          <InputField
            id="confirmPassword"
            label="Konfirmasi Password"
            icon={Lock}
            error={errors.confirmPassword?.message}
            rightSlot={
              <button
                type="button"
                onClick={() => setShowConfirmPassword((v) => !v)}
                className="text-slate-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
                aria-label="Toggle confirm password visibility"
              >
                {showConfirmPassword ? (
                  <EyeOff size={16} />
                ) : (
                  <Eye size={16} />
                )}
              </button>
            }
          >
            <input
              id="confirmPassword"
              {...register('confirmPassword')}
              type={showConfirmPassword ? 'text' : 'password'}
              className={`${inputClass(!!errors.confirmPassword)} pr-10`}
              placeholder="Ulangi password"
              autoComplete="new-password"
            />
          </InputField>

          {/* Info box */}
          <div className="flex items-start gap-2.5 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/50 rounded-xl px-4 py-3 text-xs text-blue-700 dark:text-blue-300 my-2">
            <Shield size={14} className="shrink-0 mt-0.5" />
            <span>
              Data Anda aman dan hanya digunakan untuk keperluan SPMB.
            </span>
          </div>

          {/* Action buttons */}
          <div className="pt-2">
            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: loading ? 1 : 1.015 }}
              whileTap={{ scale: loading ? 1 : 0.985 }}
              className={`w-full flex items-center justify-center gap-2.5 py-3.5 px-6 rounded-xl font-bold text-sm transition-all duration-200 shadow-lg
                ${
                  loading
                    ? 'bg-blue-400 dark:bg-blue-800 cursor-not-allowed shadow-none'
                    : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-blue-500/30 hover:shadow-blue-500/50'
                } text-white`}
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>Mendaftarkan...</span>
                </>
              ) : (
                <>
                  <UserPlus size={18} />
                  <span>Daftar Sekarang</span>
                </>
              )}
            </motion.button>
          </div>
        </form>
      )}

      {/* Login link */}
      {!success && (
        <>
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800" />
            <span className="text-xs text-slate-400 dark:text-slate-600 font-medium">
              atau
            </span>
            <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800" />
          </div>
          <p className="text-center text-sm text-slate-600 dark:text-slate-400">
            Sudah punya akun?{' '}
            <Link
              to="/login"
              className="font-bold text-blue-600 dark:text-blue-400 hover:text-blue-500 transition-colors"
            >
              Masuk di sini →
            </Link>
          </p>
        </>
      )}
    </div>
  );
};

export default Register;
