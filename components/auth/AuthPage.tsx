import React, { useState, useEffect, useRef } from 'react';
import Login from './Login';
import Signup from './Signup';
import ForgotPassword from './ForgotPassword';

// TypeScript declaration for VANTA object from CDN
declare global {
  interface Window {
    VANTA: any;
  }
}

type AuthView = 'login' | 'signup' | 'forgot';

const AuthPage: React.FC = () => {
  const [view, setView] = useState<AuthView>('login');
  const vantaRef = useRef(null);
  const [vantaEffect, setVantaEffect] = useState<any>(null);

  useEffect(() => {
    // Check if VANTA is loaded and we haven't initialized the effect yet
    if (window.VANTA && !vantaEffect) {
      const isDark = document.documentElement.classList.contains('dark');
      const effect = window.VANTA.WAVES({
        el: vantaRef.current,
        mouseControls: true,
        touchControls: true,
        gyroControls: false,
        minHeight: 200.00,
        minWidth: 200.00,
        scale: 1.00,
        scaleMobile: 1.00,
        color: isDark ? 0x1e293b : 0x6366f1, // slate-800 : indigo-500
        shininess: 35.00,
        waveHeight: 15.00,
        waveSpeed: 0.8,
        zoom: 0.75,
      });
      setVantaEffect(effect);
    }
    // Cleanup function to destroy the effect when the component unmounts
    return () => {
      if (vantaEffect) vantaEffect.destroy();
    };
  }, [vantaEffect]); // Only re-run if vantaEffect state changes

  const renderView = () => {
    switch (view) {
      case 'login':
        return <Login setView={setView} />;
      case 'signup':
        return <Signup setView={setView} />;
      case 'forgot':
        return <ForgotPassword setView={setView} />;
      default:
        return <Login setView={setView} />;
    }
  };

  return (
    <div ref={vantaRef} className="min-h-screen w-full flex justify-center items-center p-4 antialiased">
        <div className="w-full max-w-md mx-auto bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm rounded-2xl shadow-2xl overflow-hidden border border-slate-200/50 dark:border-slate-700/50">
            <div className="p-8 md:p-12 flex flex-col justify-center">
                {renderView()}
            </div>
        </div>
    </div>
  );
};

export default AuthPage;