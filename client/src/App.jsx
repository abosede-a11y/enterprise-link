import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import AppShell from './components/layout/AppShell';
import AdminShell from './components/layout/AdminShell';

import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import DashboardPage from './pages/DashboardPage';
import FaqPage from './pages/FaqPage';
import ProfilePage from './pages/ProfilePage';
import TransactionsPage from './pages/TransactionsPage';
import OnboardingPage from './pages/OnboardingPage';
import SupportPage from './pages/SupportPage';

import AdminLoginPage from './pages/admin/AdminLoginPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminOnboarding from './pages/admin/AdminOnboarding';
import AdminTransactions from './pages/admin/AdminTransactions';
import { AdminTickets, AdminFaqs } from './pages/admin/AdminTicketsAndFaqs';

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="auth-page"><div className="spinner spinner-dark" /></div>;
  return user ? children : <Navigate to="/login" replace />;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="auth-page"><div className="spinner spinner-dark" /></div>;
  return user ? <Navigate to="/dashboard" replace /> : children;
};

const AppRoutes = () => (
  <Routes>
    {/* Public auth routes */}
    <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
    <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
    <Route path="/forgot-password" element={<PublicRoute><ForgotPasswordPage /></PublicRoute>} />
    <Route path="/reset-password" element={<PublicRoute><ResetPasswordPage /></PublicRoute>} />

    {/* User routes */}
    <Route element={<PrivateRoute><AppShell /></PrivateRoute>}>
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/faq" element={<FaqPage />} />
      <Route path="/profile" element={<ProfilePage />} />
      <Route path="/transactions" element={<TransactionsPage />} />
      <Route path="/onboarding" element={<OnboardingPage />} />
      <Route path="/support" element={<SupportPage />} />
    </Route>

    {/* Admin routes */}
    <Route path="/admin/login" element={<AdminLoginPage />} />
    <Route path="/admin" element={<AdminShell />}>
      <Route path="dashboard" element={<AdminDashboard />} />
      <Route path="users" element={<AdminUsers />} />
      <Route path="onboarding" element={<AdminOnboarding />} />
      <Route path="transactions" element={<AdminTransactions />} />
      <Route path="tickets" element={<AdminTickets />} />
      <Route path="faqs" element={<AdminFaqs />} />
    </Route>

    <Route path="/" element={<Navigate to="/dashboard" replace />} />
    <Route path="*" element={<Navigate to="/dashboard" replace />} />
  </Routes>
);

const App = () => (
  <AuthProvider>
    <BrowserRouter>
      <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
      <AppRoutes />
    </BrowserRouter>
  </AuthProvider>
);

export default App;
