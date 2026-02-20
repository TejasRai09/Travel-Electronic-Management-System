
import React from 'react';

import travelIconUrl from '../assets/travel-icon.svg';
import travelPatternUrl from '../assets/travel-pattern.svg';

interface AuthLayoutProps {
  isLogin: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ isLogin, onToggle, children }) => {
  return (
    <div className="relative w-full max-w-5xl h-[min(620px,calc(100svh-2rem))] md:h-[min(660px,calc(100svh-2rem))] bg-[var(--surface)] backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden z-20 transition-transform duration-500 ease-out scale-[0.97] sm:scale-[0.985] md:scale-100 mx-0 ring-1 ring-black/5">
      {/* Visual Overlay / Decorative Panel */}
      <div 
        className={`absolute top-0 bottom-0 w-1/2 bg-gradient-to-br from-sky-700 via-sky-600 to-teal-700 transition-all duration-700 ease-in-out z-30 hidden md:flex flex-col items-center justify-center text-white px-12 text-center ${
          isLogin ? 'left-1/2 rounded-l-[100px]' : 'left-0 rounded-r-[100px]'
        }`}
      >
        <img
          src={travelPatternUrl}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover opacity-[0.18] pointer-events-none"
        />

        <div className="relative space-y-6">
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-[0.22em] text-sky-100/90">
              Zuari • Travel Desk
            </p>
            <h2 className="text-4xl font-bold tracking-tight">
              {isLogin ? 'Plan your next trip' : 'Create your travel profile'}
            </h2>
            <p className="text-sky-100/90 text-lg leading-relaxed">
              {isLogin
                ? 'Sign in to raise a travel request. Your manager approves it, then tickets (train/flight) are arranged.'
                : 'Register with your corporate email to submit travel requests and track approval status.'}
            </p>
          </div>

          <div className="flex items-center justify-center">
            <img
              src={travelIconUrl}
              alt="Travel icon"
              className="w-full max-w-[260px] select-none drop-shadow-[0_18px_30px_rgba(2,132,199,0.26)]"
              draggable={false}
            />
          </div>

          <button
            onClick={onToggle}
            className="mt-2 inline-flex items-center justify-center px-10 py-3 border-2 border-white/85 rounded-full font-semibold hover:bg-white hover:text-sky-800 transition-colors duration-300 uppercase text-sm tracking-widest"
          >
            {isLogin ? 'New user? Sign Up' : 'Have an account? Log In'}
          </button>
        </div>
      </div>

      {/* Content Forms Area */}
      <div className="relative grid h-full w-full md:grid-cols-2">
        <div
          className={`relative z-40 p-6 sm:p-8 md:p-12 flex flex-col justify-center ${
            isLogin ? 'md:col-start-1' : 'md:col-start-2'
          }`}
        >
          <div className="mb-6 md:hidden text-center">
            <h2 className="text-2xl font-bold tracking-tight text-gray-900">
              {isLogin ? 'Sign in to continue' : 'Create your account'}
            </h2>
            <p className="mt-2 text-sm text-gray-500">
              {isLogin
                ? 'Raise travel requests and track approvals.'
                : 'Use your corporate email to register for travel requests.'}
            </p>
          </div>
          {children}
        </div>
        <div className="hidden md:block" />
      </div>

      {/* Mobile Toggle Button (Visible only on small screens) */}
      <div className="absolute bottom-6 left-0 right-0 text-center md:hidden z-40">
        <button onClick={onToggle} className="text-sky-700 font-medium hover:underline underline-offset-4">
          {isLogin ? "New to the Travel Desk? Sign Up" : "Already registered? Log In"}
        </button>
      </div>
    </div>
  );
};
