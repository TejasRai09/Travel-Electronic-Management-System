
import React, { useState } from 'react';

import { apiPost } from '../services/api';

interface LoginFormProps {
  onToggle: () => void;
  onLoggedIn?: (token: string) => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onToggle, onLoggedIn }) => {
  const [mode, setMode] = useState<'login' | 'forgot' | 'forgotOtp'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const result = await apiPost<{ ok: true; token: string }>('/auth/login', { email, password });
      localStorage.setItem('travelDeskToken', result.token);
      // Store normalized email (lowercase) to match backend
      localStorage.setItem('userEmail', email.trim().toLowerCase());
      onLoggedIn?.(result.token);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await apiPost<{ ok: true }>('/auth/password/request-otp', { email });
      setMode('forgotOtp');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await apiPost<{ ok: true }>('/auth/password/verify-otp', { email, otp, newPassword });
      alert('Password updated. Please log in.');
      setMode('login');
      setPassword('');
      setOtp('');
      setNewPassword('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'OTP verification failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm mx-auto space-y-7 auth-appear-left">
      <div className="text-center md:text-left">
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">
          {mode === 'login' ? 'Sign In' : 'Reset Password'}
        </h1>
        <p className="mt-2 text-sm text-gray-500">Zuari Employee Travel Desk</p>
      </div>

      {error && (
        <div className="p-3 bg-red-50 text-red-700 text-sm rounded-xl border border-red-100">
          {error}
        </div>
      )}

      {mode === 'login' && (
        <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-1">
          <label htmlFor="login-email" className="text-sm font-semibold text-gray-700 ml-1">
            Email Address
          </label>
          <input
            id="login-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            inputMode="email"
            className="w-full px-4 py-3 bg-white/80 border border-gray-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none transition-colors placeholder:text-gray-400"
            placeholder="name@adventz.com"
          />
        </div>

        <div className="space-y-1">
          <div className="flex justify-between items-center px-1">
            <label htmlFor="login-password" className="text-sm font-semibold text-gray-700">
              Password
            </label>
            <button
              type="button"
              onClick={() => {
                setMode('forgot');
                setError('');
                setPassword('');
              }}
              className="text-xs text-sky-700 hover:text-sky-900 font-medium"
            >
              Forgot?
            </button>
          </div>
          <input
            id="login-password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            className="w-full px-4 py-3 bg-white/80 border border-gray-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none transition-colors placeholder:text-gray-400"
            placeholder="••••••••"
          />
        </div>

        <button
          disabled={loading}
          className={`w-full py-4 text-white rounded-xl font-bold shadow-lg shadow-sky-200/60 bg-gradient-to-r from-sky-600 to-teal-600 hover:from-sky-700 hover:to-teal-700 hover:shadow-xl transition-all active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 flex items-center justify-center space-x-2 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <span>Log In</span>
          )}
        </button>

        <div className="text-center text-sm text-gray-600">
          <span>New employee?</span>{' '}
          <button
            type="button"
            onClick={onToggle}
            className="font-semibold text-sky-700 hover:text-sky-900 underline underline-offset-4"
          >
            Create an account
          </button>
        </div>
      </form>
      )}

      {mode === 'forgot' && (
        <form onSubmit={handleForgotRequest} className="space-y-6">
          <div className="space-y-1">
            <label htmlFor="forgot-email" className="text-sm font-semibold text-gray-700 ml-1">
              Corporate Email
            </label>
            <input
              id="forgot-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              inputMode="email"
              className="w-full px-4 py-3 bg-white/80 border border-gray-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none transition-colors placeholder:text-gray-400"
              placeholder="name@adventz.com"
            />
            <p className="text-xs text-gray-500 px-1">We’ll send an OTP to reset your password.</p>
          </div>

          <button
            disabled={loading}
            className={`w-full py-4 text-white rounded-xl font-bold shadow-lg shadow-sky-200/60 bg-gradient-to-r from-sky-600 to-teal-600 hover:from-sky-700 hover:to-teal-700 hover:shadow-xl transition-all active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 flex items-center justify-center ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : 'Send OTP'}
          </button>

          <button
            type="button"
            onClick={() => {
              setMode('login');
              setError('');
            }}
            className="w-full text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            Back to login
          </button>
        </form>
      )}

      {mode === 'forgotOtp' && (
        <form onSubmit={handleForgotVerify} className="space-y-6 auth-appear-zoom">
          <div className="space-y-3 text-center">
            <label htmlFor="forgot-otp" className="text-sm font-semibold text-gray-700">
              Enter the 6-digit OTP sent to your email
            </label>
            <div className="flex justify-center">
              <input
                id="forgot-otp"
                type="text"
                maxLength={6}
                required
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                inputMode="numeric"
                autoComplete="one-time-code"
                className="w-full max-w-[220px] text-center tracking-[0.45em] text-2xl font-bold px-4 py-3 bg-sky-50 border-2 border-sky-200 rounded-xl focus:border-sky-500 focus:ring-2 focus:ring-sky-500/30 outline-none transition-colors"
                placeholder="000000"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label htmlFor="forgot-newpass" className="text-sm font-semibold text-gray-700 ml-1">
              New Password
            </label>
            <input
              id="forgot-newpass"
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              autoComplete="new-password"
              className="w-full px-4 py-3 bg-white/80 border border-gray-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none transition-colors placeholder:text-gray-400"
              placeholder="••••••••"
            />
          </div>

          <button
            disabled={loading}
            className={`w-full py-4 text-white rounded-xl font-bold shadow-lg shadow-teal-200/60 bg-gradient-to-r from-teal-600 to-sky-600 hover:from-teal-700 hover:to-sky-700 hover:shadow-xl transition-all focus:outline-none focus:ring-2 focus:ring-teal-600 focus:ring-offset-2 flex items-center justify-center ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : 'Verify & Update Password'}
          </button>

          <button
            type="button"
            onClick={() => {
              setMode('login');
              setError('');
              setOtp('');
              setNewPassword('');
            }}
            className="w-full text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            Back to login
          </button>
        </form>
      )}
    </div>
  );
};
