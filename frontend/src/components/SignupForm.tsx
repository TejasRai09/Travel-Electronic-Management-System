
import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, UserPlus, KeyRound, CheckCircle2, Building2 } from 'lucide-react';

import { apiPost } from '../services/api';

interface SignupFormProps {
  onToggle: () => void;
}

export const SignupForm: React.FC<SignupFormProps> = ({ onToggle }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [showOtp, setShowOtp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleInitialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.endsWith('@adventz.com')) {
      setError('Please use your corporate @adventz.com email.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await apiPost<{ ok: true }>('/auth/signup/request-otp', {
        email,
        password,
        confirmPassword,
      });
      setShowOtp(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await apiPost<{ ok: true; token: string }>('/auth/signup/verify-otp', {
        email,
        otp,
      });

      alert('Account created successfully. Please log in.');
      onToggle();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'OTP verification failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-8 auth-appear-right">
      <div className="text-center md:text-left space-y-2">
        <h1 className="text-4xl font-black tracking-tight bg-gradient-to-r from-teal-700 via-sky-600 to-indigo-600 bg-clip-text text-transparent">Create Account</h1>
        <p className="text-sm text-gray-600 font-medium">Join the Zuari Employee Travel Desk</p>
      </div>

      {error && (
        <div className="p-4 bg-gradient-to-r from-red-50 to-rose-50 text-red-700 text-sm rounded-2xl border-2 border-red-100 shadow-sm auth-appear-zoom">
          <p className="font-semibold">{error}</p>
        </div>
      )}

      {!showOtp ? (
        <form onSubmit={handleInitialSubmit} className="space-y-5">
          {/* Email Input with Floating Label */}
          <div className="floating-input">
            <div className="relative">
              <Mail className="absolute left-4 top-4 text-gray-400 pointer-events-none z-10" size={20} />
              <input
                id="signup-email"
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
                Company Email (@adventz.com)
              </label>
            </div>
            <p className="text-xs text-gray-500 px-1 mt-1.5 flex items-center gap-1">
              <Building2 size={12} />
              Use your official corporate email
            </p>
          </div>

          {/* Password Inputs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="floating-input">
              <div className="relative">
                <Lock className="absolute left-4 top-4 text-gray-400 pointer-events-none z-10" size={20} />
                <input
                  id="signup-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
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
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="floating-input">
              <div className="relative">
                <Lock className="absolute left-4 top-4 text-gray-400 pointer-events-none z-10" size={20} />
                <input
                  id="signup-confirm"
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                  placeholder=" "
                  className="w-full pl-12 pr-12 py-4 bg-white/90 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all placeholder:text-transparent input-glow font-medium"
                />
                <label className="text-sm font-semibold text-gray-600">
                  Confirm Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
          </div>

          {/* Sign Up Button */}
          <button
            disabled={loading}
            className={`btn-premium w-full py-4 text-white rounded-2xl font-bold shadow-lg shadow-teal-500/30 bg-gradient-to-r from-teal-600 via-sky-500 to-indigo-600 hover:from-teal-700 hover:via-sky-600 hover:to-indigo-700 hover:shadow-xl hover:shadow-teal-500/40 transition-all duration-300 active:scale-[0.98] focus:outline-none focus:ring-4 focus:ring-teal-500/50 flex items-center justify-center gap-2 text-base ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {loading ? (
              <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <UserPlus size={20} />
                <span>Create Account</span>
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
                Already have an account?
              </span>
            </div>
          </div>

          {/* Login Link */}
          <button
            type="button"
            onClick={onToggle}
            className="w-full py-4 bg-gradient-to-r from-gray-50 to-gray-100 border-2 border-gray-200 hover:border-teal-300 hover:bg-gradient-to-r hover:from-teal-50 hover:to-sky-50 text-gray-700 hover:text-teal-700 rounded-2xl font-bold transition-all duration-300 hover:shadow-md"
          >
            Sign In Instead
          </button>
        </form>
      ) : (
        <form onSubmit={handleOtpSubmit} className="space-y-6 auth-appear-zoom">
          <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl border border-emerald-200 flex items-start gap-3">
            <CheckCircle2 size={20} className="text-emerald-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-emerald-900">
              <p className="font-semibold mb-1">OTP Sent Successfully!</p>
              <p>We've sent a 6-digit code to <strong>{email}</strong>. Check your inbox and enter it below.</p>
            </div>
          </div>

          <div className="floating-input">
            <div className="relative">
              <KeyRound className="absolute left-4 top-4 text-gray-400 pointer-events-none z-10" size={20} />
              <input
                id="signup-otp"
                type="text"
                maxLength={6}
                required
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder=" "
                className="w-full pl-12 pr-4 py-4 bg-white/90 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all placeholder:text-transparent input-glow font-bold tracking-[0.25em] text-lg"
              />
              <label className="text-sm font-semibold text-gray-600">
                Enter 6-Digit OTP
              </label>
            </div>
          </div>

          <button
            disabled={loading}
            className={`btn-premium w-full py-4 text-white rounded-2xl font-bold shadow-lg shadow-emerald-500/30 bg-gradient-to-r from-emerald-600 via-teal-600 to-sky-600 hover:from-emerald-700 hover:via-teal-700 hover:to-sky-700 hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {loading ? (
              <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <CheckCircle2 size={20} />
                <span>Verify & Complete Setup</span>
              </>
            )}
          </button>
          
          <button 
            type="button" 
            onClick={() => setShowOtp(false)}
            className="w-full text-center text-sm text-gray-600 hover:text-teal-700 font-semibold transition-colors"
          >
            ← Change Email
          </button>
        </form>
      )}
    </div>
  );
};

