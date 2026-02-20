
import React from 'react';
import { Plane, Sparkles, Shield, Clock } from 'lucide-react';

import travelIconUrl from '../assets/travel-icon.svg';
import travelPatternUrl from '../assets/travel-pattern.svg';

interface AuthLayoutProps {
  isLogin: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ isLogin, onToggle, children }) => {
  return (
    <div className="relative w-full max-w-6xl h-[min(680px,calc(100svh-2rem))] md:h-[min(720px,calc(100svh-2rem))] glass-card rounded-[2.5rem] shadow-2xl overflow-hidden z-20 transition-transform duration-500 ease-out scale-[0.97] sm:scale-[0.985] md:scale-100 mx-0 ring-1 ring-white/60">
      {/* Animated gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-sky-500/5 via-transparent to-teal-500/5 pointer-events-none"></div>
      
      {/* Visual Overlay / Decorative Panel */}
      <div 
        className={`absolute top-0 bottom-0 w-1/2 bg-gradient-to-br from-indigo-600 via-sky-600 to-teal-600 transition-all duration-700 ease-in-out z-30 hidden md:flex flex-col items-center justify-center text-white px-12 text-center overflow-hidden ${
          isLogin ? 'left-1/2 rounded-l-[7rem]' : 'left-0 rounded-r-[7rem]'
        }`}
      >
        {/* Animated background pattern */}
        <img
          src={travelPatternUrl}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover opacity-10 pointer-events-none animate-pulse"
          style={{ animationDuration: '8s' }}
        />
        
        {/* Floating orbs */}
        <div className="absolute top-20 left-10 w-32 h-32 bg-white/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '6s' }}></div>
        <div className="absolute bottom-20 right-10 w-40 h-40 bg-teal-300/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '3s', animationDuration: '7s' }}></div>

        <div className="relative space-y-8 z-10">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/15 backdrop-blur-md rounded-full border border-white/30">
              <Sparkles size={14} className="text-yellow-300" />
              <p className="text-xs uppercase tracking-widest font-semibold">
                Zuari Travel Desk
              </p>
              <Sparkles size={14} className="text-yellow-300" />
            </div>
            
            <h2 className="text-5xl font-extrabold tracking-tight leading-tight">
              {isLogin ? 'Welcome Back!' : 'Join Our Journey'}
            </h2>
            
            <p className="text-sky-50/95 text-base leading-relaxed max-w-md mx-auto">
              {isLogin
                ? 'Sign in to manage your travel requests. Get approvals fast and book your tickets seamlessly.'
                : 'Create your account to access the complete travel management system. Submit requests, track approvals, and travel hassle-free.'}
            </p>
          </div>

          {/* Feature highlights */}
          <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto">
            <div className="flex flex-col items-center gap-2 p-3 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20">
              <Plane size={20} className="text-teal-200" />
              <span className="text-xs font-medium">Easy Booking</span>
            </div>
            <div className="flex flex-col items-center gap-2 p-3 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20">
              <Clock size={20} className="text-sky-200" />
              <span className="text-xs font-medium">Fast Approval</span>
            </div>
            <div className="flex flex-col items-center gap-2 p-3 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20">
              <Shield size={20} className="text-indigo-200" />
              <span className="text-xs font-medium">Secure</span>
            </div>
          </div>

          <div className="flex items-center justify-center pt-4">
            <img
              src={travelIconUrl}
              alt="Travel icon"
              className="w-full max-w-[240px] select-none drop-shadow-[0_20px_40px_rgba(2,132,199,0.35)]"
              draggable={false}
              style={{ animation: 'authFloat 6s ease-in-out infinite' }}
            />
          </div>

          <button
            onClick={onToggle}
            className="mt-4 inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-white/20 backdrop-blur-sm border-2 border-white/50 rounded-full font-bold hover:bg-white hover:text-sky-700 hover:border-white transition-all duration-300 uppercase text-sm tracking-wider shadow-lg hover:shadow-xl hover:scale-105"
          >
            {isLogin ? 'New user? Sign Up →' : '← Have an account? Log In'}
          </button>
        </div>
      </div>

      {/* Content Forms Area */}
      <div className="relative grid h-full w-full md:grid-cols-2">
        <div
          className={`relative z-40 p-6 sm:p-8 md:p-14 flex flex-col justify-center ${
            isLogin ? 'md:col-start-1' : 'md:col-start-2'
          }`}
        >
          <div className="mb-8 md:hidden text-center space-y-2">
            <h2 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-sky-600 to-teal-600 bg-clip-text text-transparent">
              {isLogin ? 'Sign in to continue' : 'Create your account'}
            </h2>
            <p className="text-sm text-gray-600">
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
        <button 
          onClick={onToggle} 
          className="text-sky-700 font-semibold hover:text-sky-900 transition-colors underline-offset-4 hover:underline"
        >
          {isLogin ? "New to the Travel Desk? Sign Up →" : "← Already registered? Log In"}
        </button>
      </div>
    </div>
  );
};
