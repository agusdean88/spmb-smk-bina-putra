import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/useAuthStore';
import { useSettingsStore } from './store/useSettingsStore';
import { useEffect, lazy, Suspense } from 'react';

// Layouts
import { Toaster } from 'react-hot-toast';
import MainLayout from './layouts/MainLayout';
import AuthLayout from './layouts/AuthLayout';
import AdminLayout from './layouts/AdminLayout';
import StudentLayout from './layouts/StudentLayout';

// Public Pages
const LandingPage = lazy(() => import('./pages/LandingPage'));
const Announcements = lazy(() => import('./pages/Announcements'));
const AnnouncementDetail = lazy(() => import('./pages/AnnouncementDetail'));
const CheckStatus = lazy(() => import('./pages/CheckStatus'));
const JurusanPage = lazy(() => import('./pages/JurusanPage'));
const CaraDaftar = lazy(() => import('./pages/CaraDaftar'));

// Auth Pages
const Login = lazy(() => import('./pages/auth/Login'));
const Register = lazy(() => import('./pages/auth/Register'));

// Student Pages
const Dashboard = lazy(() => import('./pages/student/Dashboard'));
const FormBiodata = lazy(() => import('./pages/student/FormBiodata'));
const UploadDocuments = lazy(() => import('./pages/student/UploadDocuments'));

// Admin Pages
const AdminDashboard = lazy(() => import('./pages/admin/Dashboard'));
const StudentsList = lazy(() => import('./pages/admin/StudentsList'));
const AdminAnnouncements = lazy(() => import('./pages/admin/Announcements'));
const JurusanQuota = lazy(() => import('./pages/admin/JurusanQuota'));
const Seleksi = lazy(() => import('./pages/admin/Seleksi'));
const Laporan = lazy(() => import('./pages/admin/Laporan'));
const UserManagement = lazy(() => import('./pages/admin/UserManagement'));
const Settings = lazy(() => import('./pages/admin/Settings'));
const AdminBrochures = lazy(() => import('./pages/admin/AdminBrochures'));


const ProtectedRoute = ({ children, role }) => {
  const { isAuthenticated, user } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" />;
  if (role && (!user || user.role !== role)) return <Navigate to="/" />;
  return children;
};

function App() {
  const fetchSettings = useSettingsStore(state => state.fetchSettings);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  return (
    <Router>
      <Toaster position="top-right" />
      <Suspense fallback={
        <div className="flex h-screen items-center justify-center bg-slate-50">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-blue-600/10 border-t-blue-600 rounded-full animate-spin" />
            <p className="text-slate-400 font-bold text-xs uppercase tracking-[0.2em] animate-pulse">Menghubungkan...</p>
          </div>
        </div>
      }>
        <Routes>
          {/* Public Routes */}
          <Route element={<MainLayout />}>
            <Route path="/" element={<LandingPage />} />
            <Route path="/jurusan" element={<JurusanPage />} />
            <Route path="/cara-daftar" element={<CaraDaftar />} />
            <Route path="/pengumuman" element={<Announcements />} />
            <Route path="/pengumuman/:slug" element={<AnnouncementDetail />} />
            <Route path="/cek-status" element={<CheckStatus />} />
          </Route>

          {/* Auth Routes */}
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
          </Route>

          {/* Student Routes */}
          <Route path="/student" element={
            <ProtectedRoute role="STUDENT">
              <StudentLayout />
            </ProtectedRoute>
          }>
            <Route index element={<Dashboard />} />
            <Route path="biodata" element={<FormBiodata />} />
            <Route path="upload" element={<UploadDocuments />} />
          </Route>

          {/* Admin Routes */}
          <Route path="/admin" element={
            <ProtectedRoute role="ADMIN">
              <AdminLayout />
            </ProtectedRoute>
          }>
            <Route index element={<AdminDashboard />} />
            <Route path="students" element={<StudentsList />} />
            <Route path="jurusan" element={<JurusanQuota />} />
            <Route path="seleksi" element={<Seleksi />} />
            <Route path="laporan" element={<Laporan />} />
            <Route path="announcements" element={<AdminAnnouncements />} />
            <Route path="users" element={<UserManagement />} />
            <Route path="brosur" element={<AdminBrochures />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;
