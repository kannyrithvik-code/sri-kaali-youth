import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { FestivalProvider } from './context/FestivalContext';
import { MainLayout } from './components/layout/MainLayout';

import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { LoginApprovalWaiting } from './pages/LoginApprovalWaiting';
import { MemberHome } from './pages/MemberHome';
import { Dashboard } from './pages/Dashboard';
import { Categories } from './pages/Categories';
import { Expenses } from './pages/Expenses';
import { Donations } from './pages/Donations';
import { LuckyDraw } from './pages/LuckyDraw';
import { Velampata } from './pages/Velampata';
import { Sponsors } from './pages/Sponsors';
import { Reports } from './pages/Reports';
import { Users } from './pages/Users';
import { Settings } from './pages/Settings';
import { AdminLoginRequests } from './pages/AdminLoginRequests';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, pendingLogin } = useAuth();
  if (!isAuthenticated) {
    if (pendingLogin) {
      return <Navigate to="/login-approval" replace />;
    }
    return <Navigate to="/login" replace />;
  }
  return children;
};

const AdminRoute = ({ children }) => {
  const { isAuthenticated, isAdmin } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  if (!isAdmin) {
    return <Navigate to="/member" replace />;
  }
  return children;
};

const IndexRedirect = () => {
  const { isAdmin } = useAuth();
  return <Navigate to={isAdmin ? "/dashboard" : "/member"} replace />;
};

function AppRoutes() {
  const { isAdmin } = useAuth();

  return (
    <Routes>
      {/* Public Auth Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/login-approval" element={<LoginApprovalWaiting />} />

      {/* Protected Main Application Layout */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<IndexRedirect />} />
        <Route path="member" element={<MemberHome />} />

        {/* Shared Data Entry Routes */}
        <Route path="expenses/decoration" element={<Expenses />} />
        <Route path="expenses/aagaman" element={<Expenses />} />
        <Route path="expenses/day/:day" element={<Expenses />} />
        <Route path="expenses/last-day" element={<Expenses />} />
        <Route path="donations" element={<Donations />} />
        <Route path="lucky-draw" element={<LuckyDraw />} />
        <Route path="velampata" element={<Velampata />} />
        <Route path="sponsors" element={<Sponsors />} />

        {/* Admin Only Routes */}
        <Route path="dashboard" element={<AdminRoute><Dashboard /></AdminRoute>} />
        <Route path="categories" element={<AdminRoute><Categories /></AdminRoute>} />
        <Route path="reports" element={<AdminRoute><Reports /></AdminRoute>} />
        <Route path="users" element={<AdminRoute><Users /></AdminRoute>} />
        <Route path="settings" element={<AdminRoute><Settings /></AdminRoute>} />
        <Route path="admin/login-requests" element={<AdminRoute><AdminLoginRequests /></AdminRoute>} />

        <Route path="*" element={<Navigate to={isAdmin ? "/dashboard" : "/member"} replace />} />
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <FestivalProvider>
          <AppRoutes />
        </FestivalProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
