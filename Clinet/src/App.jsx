import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './hooks/useAuth';

// Public Pages
import Landing from './pages/public/Landing';
import Home from './pages/public/Home';
import Products from './pages/public/Products';
import About from './pages/public/About';
import Contact from './pages/public/Contact';
import QuoteRequest from './pages/public/QuoteRequest';
import Login from './pages/public/Login';
import Signup from './pages/public/Signup';

// CRM Pages
import Dashboard from './pages/crm/Dashboard';
import Leads from './pages/crm/Leads';
import LeadDetail from './pages/crm/LeadDetail';
import Quotations from './pages/crm/Quotations';
import Dispatches from './pages/crm/Dispatches';
import Payments from './pages/crm/Payments';
import Documents from './pages/crm/Documents';
import Users from './pages/crm/Users';
import Security from './pages/crm/Security';
import Reports from './pages/crm/Reports';
import AdminPanel from './pages/crm/AdminPanel';

// Components
import Navbar from './components/Layout/Navbar';
import Footer from './components/Layout/Footer';
import ChatWidget from './components/Chat/ChatWidget';
import PortalLayout from './components/Layout/PortalLayout';

function AdminRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!user || user.role !== 'ADMIN') {
    return <Navigate to="/crm/dashboard" replace />;
  }

  return children;
}

// Layout for CRM Dashboard (Authenticated Pages)
function CrmLayout() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <PortalLayout>
      <Outlet />
    </PortalLayout>
  );
}

function AppContent() {
  const location = useLocation();
  const isCrmRoute = location.pathname.startsWith('/crm');
  const isAuthRoute = location.pathname === '/login' || location.pathname === '/signup';

  useEffect(() => {
    document.title = 'ITO Exim CRM';
  }, []);

  return (
    <div>
      {!isCrmRoute && !isAuthRoute && <Navbar />}

      <Routes>
        {/* Auth pages */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* Public pages */}
        <Route path="/" element={<Landing />} />
        <Route path="/home" element={<Home />} />
        <Route path="/products" element={<Products />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/quote-request" element={<QuoteRequest />} />

        {/* CRM pages under CrmLayout (requires authentication) */}
        <Route element={<CrmLayout />}>
          <Route path="/crm/dashboard" element={<Dashboard />} />
          <Route path="/crm/leads" element={<Leads />} />
          <Route path="/crm/leads/:id" element={<LeadDetail />} />
          <Route path="/crm/quotations" element={<Quotations />} />
          <Route path="/crm/dispatches" element={<Dispatches />} />
          <Route path="/crm/payments" element={<Payments />} />
          <Route path="/crm/documents" element={<Documents />} />

          {/* Admin-only CRM pages */}
          <Route path="/crm/users" element={<AdminRoute><Users /></AdminRoute>} />
          <Route path="/crm/security" element={<AdminRoute><Security /></AdminRoute>} />
          <Route path="/crm/reports" element={<AdminRoute><Reports /></AdminRoute>} />
          <Route path="/crm/admin" element={<AdminRoute><AdminPanel /></AdminRoute>} />
        </Route>

        {/* Catch-all route redirecting to landing page */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {!isCrmRoute && !isAuthRoute && <Footer />}
      <ChatWidget />
    </div>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <Toaster position="top-right" />
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

export default App;