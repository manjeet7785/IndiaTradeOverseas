import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './hooks/useAuth';
// Public Pages
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
import Employees from './pages/crm/Employees';
import Security from './pages/crm/Security';
import Reports from './pages/crm/Reports';
import AdminPanel from './pages/crm/AdminPanel';
import ProductUpload from './pages/crm/ProductUpload';
import Tasks from './pages/crm/Tasks';
// Components
import Navbar from './components/Layout/Navbar';
import Sidebar from './components/Layout/Sidebar';
import Footer from './components/Layout/Footer';
import ChatWidget from './components/Chat/ChatWidget';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  return children;
}

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
    return <Navigate to="/crm/dashboard" />;
  }

  return children;
}

function AppLayout() {
  const { user } = useAuth();
  const location = useLocation();
  const isCRM = location.pathname.startsWith('/crm');
  const isAuth = location.pathname === '/login' || location.pathname === '/signup';

  if (isAuth) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
      </Routes>
    );
  }

  if (isCRM && user) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Navbar />
          <main className="flex-1 overflow-y-auto p-6">
            <Routes>
              <Route path="/crm/dashboard" element={<Dashboard />} />
              <Route path="/crm/leads" element={<Leads />} />
              <Route path="/crm/leads/:id" element={<LeadDetail />} />
              <Route path="/crm/quotations" element={<Quotations />} />
              <Route path="/crm/dispatches" element={<Dispatches />} />
              <Route path="/crm/payments" element={<Payments />} />
              <Route path="/crm/documents" element={<Documents />} />
              <Route path="/crm/products" element={<ProductUpload />} />
              <Route path="/crm/tasks" element={<Tasks />} />
              <Route path="/crm/employees" element={<AdminRoute><Employees /></AdminRoute>} />
              <Route path="/crm/security" element={<AdminRoute><Security /></AdminRoute>} />
              <Route path="/crm/reports" element={<AdminRoute><Reports /></AdminRoute>} />
              <Route path="/crm/admin" element={<AdminRoute><AdminPanel /></AdminRoute>} />
            </Routes>
          </main>
        </div>
        <ChatWidget />
      </div>
    );
  }

  return (
    <div>
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/products" element={<Products />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/quote-request" element={<QuoteRequest />} />
        </Routes>
      </main>
      <Footer />
      <ChatWidget />
    </div>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <Toaster position="top-right" />
        <AppLayout />
      </AuthProvider>
    </Router>
  );
}

export default App;