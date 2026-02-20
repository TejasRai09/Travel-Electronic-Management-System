
import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, ArrowRight, KeyRound, CheckCircle2 } from 'lucide-react';

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
  const [showPassword, setShowPassword] = useState(false);

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
    <div className="w-full max-w-md mx-auto space-y-8 auth-appear-left">
      <div className="text-center md:text-left space-y-2">
        <h1 className="text-4xl font-black tracking-tight bg-gradient-to-r from-sky-700 via-sky-600 to-teal-600 bg-clip-text text-transparent">
          {mode === 'login' ? 'Sign In' : 'Reset Password'}
        </h1>
        <p className="text-sm text-gray-600 font-medium">Zuari Employee Travel Desk</p>
      </div>

      {error && (
        <div className="p-4 bg-gradient-to-r from-red-50 to-rose-50 text-red-700 text-sm rounded-2xl border-2 border-red-100 shadow-sm auth-appear-zoom">
          <p className="font-semibold">{error}</p>
        </div>
      )}

      {mode === 'login' && (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email Input with Floating Label */}
          <div className="floating-input">
            <div className="relative">
              <Mail className="absolute left-4 top-4 text-gray-400 pointer-events-none z-10" size={20} />
              <input
                id="login-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                inputMode="email"
                placeholder=" "
                className="w-full pl-12 pr-4 py-4 bg-white/90 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all placeholder:text-transparent input-glow font-medium"
              />
              <label className="text-sm font-semibold text-gray-600">
                Email Address
              </label>
            </div>
          </div>

          {/* Password Input with Floating Label */}
          <div className="floating-input">
            <div className="relative">
              <Lock className="absolute left-4 top-4 text-gray-400 pointer-events-none z-10" size={20} />
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                placeholder=" "
                className="w-full pl-12 pr-12 py-4 bg-white/90 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all placeholder:text-transparent input-glow font-medium"
              />
              <label className="text-sm font-semibold text-gray-600">
                Password
              </label>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            <div className="flex justify-end mt-2 px-1">
              <button
                type="button"
                onClick={() => {
                  setMode('forgot');
                  setError('');
                  setPassword('');
                }}
                className="text-xs text-sky-600 hover:text-sky-800 font-bold transition-colors"
              >
                Forgot Password?
              </button>
            </div>
          </div>

          {/* Login Button */}
          <button
            disabled={loading}
            className={`btn-premium w-full py-4 text-white rounded-2xl font-bold shadow-lg shadow-sky-500/30 bg-gradient-to-r from-sky-600 via-sky-500 to-teal-600 hover:from-sky-700 hover:via-sky-600 hover:to-teal-700 hover:shadow-xl hover:shadow-sky-500/40 transition-all duration-300 active:scale-[0.98] focus:outline-none focus:ring-4 focus:ring-sky-500/50 flex items-center justify-center gap-2 text-base ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {loading ? (
              <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-3 bg-gradient-to-r from-transparent via-white to-transparent text-gray-500 font-semibold">
                Don't have an account?
              </span>
            </div>
          </div>

          {/* Sign Up Link */}
          <button
            type="button"
            onClick={onToggle}
            className="w-full py-4 bg-gradient-to-r from-gray-50 to-gray-100 border-2 border-gray-200 hover:border-sky-300 hover:bg-gradient-to-r hover:from-sky-50 hover:to-teal-50 text-gray-700 hover:text-sky-700 rounded-2xl font-bold transition-all duration-300 hover:shadow-md"
          >
            Create New Account
          </button>
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
        <>
          <div className="p-5 bg-gradient-to-r from-emerald-50 to-teal-50 border-2 border-emerald-100 rounded-2xl auth-appear-zoom">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="text-emerald-600" size={24} />
              <p className="text-sm text-emerald-900 font-semibold leading-relaxed">
                OTP sent successfully! Check your email.
              </p>
            </div>
          </div>

          <form onSubmit={handleForgotVerify} className="space-y-6 auth-appear-zoom">
            {/* OTP Input with Floating Label */}
            <div className="floating-input">
              <div className="relative">
                <KeyRound className="absolute left-4 top-4 text-gray-400 pointer-events-none z-10" size={20} />
                <input
                  id="forgot-otp"
                  type="text"
                  maxLength={6}
                  required
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  placeholder=" "
                  className="w-full pl-12 pr-4 py-4 bg-white/90 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all placeholder:text-transparent input-glow font-medium text-center tracking-wider text-lg"
                />
                <label className="text-sm font-semibold text-gray-600">
                  Enter 6-Digit OTP
                </label>
              </div>
            </div>

            {/* New Password Input with Floating Label */}
            <div className="floating-input">
              <div className="relative">
                <Lock className="absolute left-4 top-4 text-gray-400 pointer-events-none z-10" size={20} />
                <input
                  id="forgot-newpass"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  autoComplete="new-password"
                  placeholder=" "
                  className="w-full pl-12 pr-12 py-4 bg-white/90 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all placeholder:text-transparent input-glow font-medium"
                />
                <label className="text-sm font-semibold text-gray-600">
                  New Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Buttons */}
            <div className="space-y-3">
              <button
                disabled={loading}
                className={`btn-premium w-full py-4 text-white rounded-2xl font-bold shadow-lg shadow-emerald-500/30 bg-gradient-to-r from-emerald-600 via-teal-500 to-sky-600 hover:from-emerald-700 hover:via-teal-600 hover:to-sky-700 hover:shadow-xl hover:shadow-emerald-500/40 transition-all duration-300 active:scale-[0.98] focus:outline-none focus:ring-4 focus:ring-emerald-500/50 flex items-center justify-center gap-2 text-base ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                {loading ? (
                  <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <span>Verify & Update Password</span>
                    <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setError('');
                  setOtp('');
                  setNewPassword('');
                }}
                className="w-full py-4 bg-gradient-to-r from-gray-50 to-gray-100 border-2 border-gray-200 hover:border-emerald-300 hover:bg-gradient-to-r hover:from-emerald-50 hover:to-teal-50 text-gray-700 hover:text-emerald-700 rounded-2xl font-bold transition-all duration-300 hover:shadow-md"
              >
                Back to Login
              </button>
            </div>
          </form>
        </>
      )}
    </div>
  );
};
