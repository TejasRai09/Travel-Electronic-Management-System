
import React, { useState } from 'react';

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
    <div className="w-full max-w-sm mx-auto space-y-6 auth-appear-right">
      <div className="text-center md:text-left">
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Create Account</h1>
        <p className="mt-2 text-sm text-gray-500">Register for the Zuari Employee Travel Desk</p>
      </div>

      {error && (
        <div className="p-3 bg-red-50 text-red-700 text-sm rounded-xl border border-red-100">
          {error}
        </div>
      )}

      {!showOtp ? (
        <form onSubmit={handleInitialSubmit} className="space-y-4">
          <div className="space-y-1">
            <label htmlFor="signup-email" className="text-sm font-semibold text-gray-700 ml-1">
              Company Email
            </label>
            <input
              id="signup-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              inputMode="email"
              className="w-full px-4 py-3 bg-white/80 border border-gray-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none transition-colors"
              placeholder="name@adventz.com"
            />
            <p className="text-xs text-gray-500 px-1">Use your official corporate email.</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label htmlFor="signup-password" className="text-sm font-semibold text-gray-700 ml-1">
                Password
              </label>
              <input
                id="signup-password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                className="w-full px-4 py-3 bg-white/80 border border-gray-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none transition-colors"
                placeholder="••••"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="signup-confirm" className="text-sm font-semibold text-gray-700 ml-1">
                Confirm
              </label>
              <input
                id="signup-confirm"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                className="w-full px-4 py-3 bg-white/80 border border-gray-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none transition-colors"
                placeholder="••••"
              />
            </div>
          </div>

          <button
            disabled={loading}
            className={`w-full py-4 text-white rounded-xl font-bold shadow-lg shadow-sky-200/60 bg-gradient-to-r from-sky-600 to-teal-600 hover:from-sky-700 hover:to-teal-700 hover:shadow-xl transition-all focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 flex items-center justify-center ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : "Next Step"}
          </button>

          <div className="text-center text-sm text-gray-600">
            <span>Already registered?</span>{' '}
            <button
              type="button"
              onClick={onToggle}
              className="font-semibold text-sky-700 hover:text-sky-900 underline underline-offset-4"
            >
              Log in
            </button>
          </div>
        </form>
      ) : (
        <form onSubmit={handleOtpSubmit} className="space-y-6 auth-appear-zoom">
          <div className="space-y-3 text-center">
            <label htmlFor="signup-otp" className="text-sm font-semibold text-gray-700">
              We sent a 6-digit OTP to your corporate email
            </label>
            <div className="flex justify-center">
               <input
                id="signup-otp"
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

          <button
            disabled={loading}
            className={`w-full py-4 text-white rounded-xl font-bold shadow-lg shadow-teal-200/60 bg-gradient-to-r from-teal-600 to-sky-600 hover:from-teal-700 hover:to-sky-700 hover:shadow-xl transition-all focus:outline-none focus:ring-2 focus:ring-teal-600 focus:ring-offset-2 flex items-center justify-center ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : "Verify & Sign Up"}
          </button>
          
          <button 
            type="button" 
            onClick={() => setShowOtp(false)}
            className="w-full text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            Back to email edit
          </button>
        </form>
      )}
    </div>
  );
};
