import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import {
  FiMail,
  FiLock,
  FiEye,
  FiEyeOff,
  FiLogIn,
  FiShield,
  FiArrowRight
} from 'react-icons/fi';
import toast from 'react-hot-toast';

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await login(formData);
      if (response.success) {
        toast.success('Login successful! Welcome back!', {
          icon: '🎉',
          style: {
            borderRadius: '10px',
            background: '#333',
            color: '#fff',
          },
        });
        // Redirect based on role
        if (response.data.user.role === 'ADMIN') {
          navigate('/crm/dashboard');
        } else {
          navigate('/crm/dashboard');
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      const errorMsg = error.response?.data?.message || 'Login failed. Please check your credentials.';
      toast.error(errorMsg, {
        style: {
          borderRadius: '10px',
          background: '#333',
          color: '#fff',
        },
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-100 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-32 w-80 h-80 bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-32 w-80 h-80 bg-purple-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse delay-1000"></div>
      </div>

      <div className="max-w-md w-full space-y-8 relative z-10">
        {/* Logo and header section */}
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="relative group">
              <div className="absolute inset-0 bg-blue-600 rounded-2xl blur-lg opacity-75 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative h-16 w-16 bg-gradient-to-br from-blue-600 to-blue-500 rounded-2xl flex items-center justify-center shadow-lg transform transition-transform group-hover:scale-105">
                <FiShield className="h-8 w-8 text-white" />
              </div>
            </div>
          </div>
          <h2 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
            Welcome Back
          </h2>
          <p className="mt-3 text-gray-600">
            Sign in to access your account
          </p>
        </div>

        {/* Form section */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            {/* Email input */}
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                <FiMail className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors duration-200" />
              </div>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl bg-white/50 backdrop-blur-sm placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 shadow-sm hover:shadow"
                placeholder="Email address"
              />
              <label htmlFor="email" className="absolute -top-2 left-3 px-1 text-xs text-gray-500 bg-white/80 rounded-md transition-all duration-200">
                Email
              </label>
            </div>

            {/* Password input */}
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                <FiLock className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors duration-200" />
              </div>
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="block w-full pl-10 pr-12 py-3 border border-gray-200 rounded-xl bg-white/50 backdrop-blur-sm placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 shadow-sm hover:shadow"
                placeholder="Password"
              />
              <label htmlFor="password" className="absolute -top-2 left-3 px-1 text-xs text-gray-500 bg-white/80 rounded-md transition-all duration-200">
                Password
              </label>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors duration-200"
              >
                {showPassword ? <FiEyeOff className="h-5 w-5" /> : <FiEye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {/* Options row */}
          <div className="flex items-center justify-between">
            <label className="flex items-center cursor-pointer group">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer"
              />
              <span className="ml-2 text-sm text-gray-600 group-hover:text-gray-900 transition-colors duration-200">
                Remember me
              </span>
            </label>

            <div className="text-sm">
              <a href="#" className="font-medium text-blue-600 hover:text-blue-500 transition-colors duration-200 flex items-center gap-1">
                Forgot password?
                <FiArrowRight className="h-3 w-3" />
              </a>
            </div>
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={loading}
            className="group relative w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent text-sm font-semibold rounded-xl text-white bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-70 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-blue-500/25"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                <span>Signing in...</span>
              </div>
            ) : (
              <>
                <FiLogIn className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                <span>Sign in</span>
              </>
            )}
          </button>

          {/* Sign up link */}
          <div className="text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <Link
                to="/signup"
                className="font-semibold text-blue-600 hover:text-blue-500 transition-colors duration-200 inline-flex items-center gap-1 group"
              >
                Create account
                <FiArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </p>
          </div>
        </form>

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-transparent text-gray-400">Secure login</span>
          </div>
        </div>

        {/* Footer note */}
        <p className="text-center text-xs text-gray-400">
          By signing in, you agree to our{' '}
          <a href="#" className="text-blue-500 hover:text-blue-600">Terms</a> and{' '}
          <a href="#" className="text-blue-500 hover:text-blue-600">Privacy Policy</a>
        </p>
      </div>
    </div>
  );
};

export default Login;