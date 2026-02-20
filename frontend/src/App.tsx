import React, { useEffect, useState } from 'react';
import { AuthLayout } from './components/AuthLayout';
import { LoginForm } from './components/LoginForm';
import { SignupForm } from './components/SignupForm';
import { BackgroundAnimation } from './components/BackgroundAnimation';
import EmployeeDashboardApp from './DashboardApp';

const App: React.FC = () => {
  const [isLoginView, setIsLoginView] = useState(true);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const existing = localStorage.getItem('travelDeskToken');
    setToken(existing);
  }, []);

  const toggleView = () => setIsLoginView(!isLoginView);

  if (token) {
    return <EmployeeDashboardApp />;
  }

  return (
    <div className="relative h-[100svh] w-full flex items-center justify-center overflow-hidden px-4">
      <BackgroundAnimation />
      
      {/* Branding Logo */}
      <div className="fixed top-4 left-1 md:top-6 md:left-4 z-50">
        <img
          src="https://www.zuariindustries.in/assets/web/img/logo/zuari_logo.png"
          alt="Zuari Logo"
          className="h-12 md:h-14 w-auto object-contain drop-shadow-sm bg-white/70 backdrop-blur-md rounded-xl px-3 py-2 ring-1 ring-black/5"
        />
      </div>

      {/* Main Sliding Container */}
      <AuthLayout isLogin={isLoginView} onToggle={toggleView}>
        {isLoginView ? (
          <LoginForm onToggle={toggleView} onLoggedIn={(newToken) => setToken(newToken)} />
        ) : (
          <SignupForm onToggle={toggleView} />
        )}
      </AuthLayout>

      {/* Footer Info */}
      <div className="fixed bottom-4 text-slate-400 text-xs tracking-wider uppercase z-10">
        © {new Date().getFullYear()} Zuari Industries Limited. Internal Use Only.
      </div>
    </div>
  );
};

export default App;
