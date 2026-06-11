import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { notificationsApi } from '../../api/notifications';
import { FiMenu, FiX, FiUser, FiLogOut, FiHome, FiPackage, FiInfo, FiPhone, FiFileText, FiSettings, FiBell } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const loadNotifications = async () => {
      if (!user) return;
      try {
        const response = await notificationsApi.getNotifications();
        if (response.success) {
          setUnreadCount(response.data.notifications.filter((n) => !n.isRead).length);
        }
      } catch (error) {
        console.error('Unable to load notification badge:', error);
      }
    };

    loadNotifications();
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate('/');
    toast.success('Logged out successfully');
  };

  const navLinks = [
    { to: '/', label: 'Home', icon: FiHome },
    { to: '/products', label: 'Products', icon: FiPackage },
    { to: '/about', label: 'About', icon: FiInfo },
    { to: '/contact', label: 'Contact', icon: FiPhone },
    { to: '/quote-request', label: 'Get Quote', icon: FiFileText },
  ];

  return (
    <nav className="bg-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">ITO</span>
              </div>

            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                {link.label}
              </Link>
            ))}

            {user ? (
              <div className="flex items-center space-x-3 ml-4">
                <Link
                  to="/crm/dashboard"
                  className="relative text-gray-600 hover:text-blue-600"
                  title="Notifications"
                >
                  <FiBell size={22} />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-semibold">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Link>
                <div className="flex items-center space-x-2 bg-gray-100 rounded-lg px-3 py-1">
                  <FiUser className="text-gray-600" size={16} />
                  <span className="text-sm text-gray-700">{user.fullName}</span>
                  <span className="text-xs text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">{user.role}</span>
                </div>
                <Link
                  to="/crm/dashboard"
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition"
                >
                  Dashboard
                </Link>
                {user.role === 'ADMIN' && (
                  <Link
                    to="/crm/admin"
                    className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 transition"
                  >
                    Admin
                  </Link>
                )}
                <button
                  onClick={handleLogout}
                  className="text-gray-600 hover:text-red-600 p-2"
                  title="Logout"
                >
                  <FiLogOut size={20} />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link
                  to="/login"
                  className="text-gray-600 hover:text-blue-600 px-3 py-2 text-sm font-medium"
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-gray-600 hover:text-gray-900"
            >
              {isOpen ? <FiX size={24} /> : <FiMenu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="text-gray-700 hover:text-blue-600 block px-3 py-2 rounded-md text-base font-medium"
                onClick={() => setIsOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            {user ? (
              <>
                <div className="px-3 py-2 text-sm text-gray-600">
                  Logged in as: {user.fullName} ({user.role})
                </div>
                <Link
                  to="/crm/dashboard"
                  className="text-gray-700 hover:text-blue-600 block px-3 py-2 rounded-md text-base font-medium"
                  onClick={() => setIsOpen(false)}
                >
                  Notifications {unreadCount > 0 && (
                    <span className="ml-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-semibold">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Link>
                <Link
                  to="/crm/dashboard"
                  className="text-gray-700 hover:text-blue-600 block px-3 py-2 rounded-md text-base font-medium"
                  onClick={() => setIsOpen(false)}
                >
                  CRM Dashboard
                </Link>
                {user.role === 'ADMIN' && (
                  <Link
                    to="/crm/admin"
                    className="text-gray-700 hover:text-purple-600 block px-3 py-2 rounded-md text-base font-medium"
                    onClick={() => setIsOpen(false)}
                  >
                    Admin Panel
                  </Link>
                )}
                <button
                  onClick={() => {
                    handleLogout();
                    setIsOpen(false);
                  }}
                  className="text-red-600 block px-3 py-2 rounded-md text-base font-medium w-full text-left"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-gray-700 hover:text-blue-600 block px-3 py-2 rounded-md text-base font-medium"
                  onClick={() => setIsOpen(false)}
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  className="bg-blue-600 text-white block px-3 py-2 rounded-md text-base font-medium text-center"
                  onClick={() => setIsOpen(false)}
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}