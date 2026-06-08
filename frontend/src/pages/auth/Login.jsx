import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Loader2,
  AlertCircle,
  CheckCircle,
  ShieldCheck,
} from 'lucide-react';

const schema = yup
  .object({
    email: yup
      .string()
      .email('Format email tidak valid')
      .required('Email wajib diisi'),
    password: yup
      .string()
      .min(6, 'Password minimal 6 karakter')
      .required('Password wajib diisi'),
    rememberMe: yup.boolean(),
  })
  .required();

// ── Reusable Input Field ──────────────────────────────────────────────────────
const InputField = ({
  id,
  label,
  icon: Icon,
  error,
  rightSlot,
  children,
  ...rest
}) => (
  <div className="space-y-1.5">
    <label
      htmlFor={id}
      className="block text-sm font-semibold text-slate-700 dark:text-slate-300"
    >
      {label}
    </label>
    <div className="relative group">
      {/* left icon */}
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
      {/* input rendered via prop */}
      {children}
      {/* right slot (eye toggle, etc.) */}
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

// ── Login Component ───────────────────────────────────────────────────────────
const Login = () => {
  const {
    register,
    handleSubmit,
    formState: { errors, isValid, dirtyFields },
    watch,
  } = useForm({
    resolver: yupResolver(schema),
    mode: 'onChange',
  });

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [globalError, setGlobalError] = useState('');
  const [success, setSuccess] = useState(false);
  const submitAttempted = useRef(false);

  const loginFn = useAuthStore((state) => state.login);
  const navigate = useNavigate();

  const onSubmit = async (data) => {
    if (loading) return; // anti double-submit
    submitAttempted.current = true;
    setLoading(true);
    setGlobalError('');

    const result = await loginFn(data.email, data.password);

    if (result.success) {
      setSuccess(true);
      toast.success('Berhasil masuk! Mengalihkan...', { duration: 2000 });
      await new Promise((r) => setTimeout(r, 800));
      const user = JSON.parse(localStorage.getItem('user'));
      navigate(user?.role === 'ADMIN' ? '/admin' : '/student');
    } else {
      setGlobalError(result.message || 'Email atau password salah');
      toast.error('Login gagal. Periksa kembali data Anda.');
    }

    setLoading(false);
  };

  return (
    <div>
      {/* Heading */}
      <div className="mb-7">
        <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
          Selamat Datang 👋
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

      {/* Success overlay */}
      <AnimatePresence>
        {success && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-8 gap-4"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center"
            >
              <CheckCircle size={32} className="text-emerald-500" />
            </motion.div>
            <p className="text-slate-700 dark:text-slate-300 font-semibold">
              Login berhasil! Mengalihkan...
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {!success && (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
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
                aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
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
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </InputField>

          {/* Remember + Forgot */}
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer group">
              <div className="relative">
                <input
                  type="checkbox"
                  {...register('rememberMe')}
                  id="rememberMe"
                  className="sr-only peer"
                />
                <div className="w-9 h-5 rounded-full border-2 border-slate-300 dark:border-slate-600 peer-checked:border-blue-500 peer-checked:bg-blue-500 transition-all duration-200 bg-slate-100 dark:bg-slate-800" />
                <div className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-all duration-200 peer-checked:translate-x-4" />
              </div>
              <span className="text-sm text-slate-600 dark:text-slate-400 font-medium">
                Ingat saya
              </span>
            </label>
            <Link
              to="#"
              className="text-sm font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-500 transition-colors"
            >
              Lupa password?
            </Link>
          </div>

          {/* Submit */}
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
                <span>Memverifikasi...</span>
              </>
            ) : (
              <>
                <ShieldCheck size={18} />
                <span>Masuk Sekarang</span>
                <ArrowRight size={16} className="ml-auto" />
              </>
            )}
          </motion.button>
        </form>
      )}

      {/* Divider + Register link */}
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
            Belum punya akun?{' '}
            <Link
              to="/register"
              className="font-bold text-blue-600 dark:text-blue-400 hover:text-blue-500 transition-colors"
            >
              Daftar sekarang →
            </Link>
          </p>
        </>
      )}
    </div>
  );
};

export default Login;
