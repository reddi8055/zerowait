import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { LogOut, LayoutDashboard, Utensils, Map as MapIcon, Sparkles } from 'lucide-react';

export const LogoIcon = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="16" cy="16" r="15.5" fill="#111111" stroke="#333333" />
    <path d="M21 10.5H19L13 18.5V10.5H11V21.5H13L19 13.5V21.5H21V10.5Z" fill="white" />
    <path d="M19 13.5L13 21.5H11L17 13.5H19Z" fill="url(#grad)" />
    <defs>
      <linearGradient id="grad" x1="15" y1="13.5" x2="15" y2="21.5" gradientUnits="userSpaceOnUse">
        <stop stopColor="white" stopOpacity="1" />
        <stop offset="1" stopColor="white" stopOpacity="0.2" />
      </linearGradient>
    </defs>
  </svg>
);

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const pathname = location.pathname;
  const [role, setRole] = useState(null);

  useEffect(() => {
    fetch('http://localhost:5000/api/auth/me', { credentials: "include" })
      .then(res => res.json())
      .then(data => {
        if (data.user) {
          setRole(data.user.role);
        } else {
          setRole(null);
        }
      })
      .catch(() => setRole(null));
  }, [pathname]);

  const handleLogout = async () => {
    await fetch('http://localhost:5000/api/auth/logout', { credentials: "include",  method: 'POST' });
    setRole(null);
    navigate('/');
    window.location.reload();
  };

  if (pathname === '/' || pathname === '/login') return null;

  return (
    <div className="fixed top-0 inset-x-0 z-50 p-4 pointer-events-none">
      <nav className="max-w-7xl mx-auto backdrop-blur-2xl bg-white/70 border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] px-6 py-3.5 rounded-2xl flex items-center justify-between pointer-events-auto transition-all duration-300">
        
        {/* LOGO */}
        <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity group">
          <div className="bg-slate-900 rounded-xl p-1.5 shadow-sm group-hover:scale-105 transition-transform duration-300">
            <LogoIcon />
          </div>
          <span className="text-xl font-black text-slate-900 tracking-tight group-hover:text-primary transition-colors duration-300">
            ZeroWait<span className="text-primary">.</span>
          </span>
        </Link>
        
        {/* NAV LINKS */}
        <div className="flex items-center gap-2 font-bold text-sm text-slate-600">
          <div className="flex items-center gap-1 bg-slate-100/50 p-1.5 rounded-xl border border-slate-200/50">
            {role === 'admin' && (
              <Link to="/admin" className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all duration-300 ${pathname === '/admin' ? 'bg-white shadow-sm text-primary' : 'hover:bg-white/60 hover:text-slate-900'}`}>
                <LayoutDashboard size={16} /> <span className="hidden sm:inline">Dashboard</span>
              </Link>
            )}
            {role === 'restaurant' && (
              <Link to="/restaurant-portal" className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all duration-300 ${pathname === '/restaurant-portal' ? 'bg-white shadow-sm text-primary' : 'hover:bg-white/60 hover:text-slate-900'}`}>
                <Utensils size={16} /> <span className="hidden sm:inline">Portal</span>
              </Link>
            )}
            
            <Link to="/map" className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all duration-300 ${pathname === '/map' ? 'bg-white shadow-sm text-primary' : 'hover:bg-white/60 hover:text-slate-900'}`}>
              <MapIcon size={16} /> <span className="hidden sm:inline">Explore</span>
            </Link>

            {role === 'user' && (
              <Link to="/my-orders" className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all duration-300 ${pathname === '/my-orders' ? 'bg-white shadow-sm text-primary' : 'hover:bg-white/60 hover:text-slate-900'}`}>
                <Utensils size={16} /> <span className="hidden sm:inline">Orders</span>
              </Link>
            )}
          </div>

          {/* ACTIONS */}
          <div className="flex items-center pl-4 border-l border-slate-200/60 ml-2">
            {role ? (
              <button 
                onClick={handleLogout} 
                className="flex items-center justify-center gap-2 text-rose-500 hover:text-white bg-rose-50 hover:bg-rose-500 transition-all duration-300 px-5 py-2.5 rounded-xl font-bold shadow-sm hover:shadow-rose-200 hover:scale-105"
              >
                <LogOut size={16} /> <span className="hidden sm:inline">Logout</span>
              </button>
            ) : (
              <Link to="/login" className="relative group overflow-hidden bg-slate-900 text-white px-6 py-2.5 rounded-xl font-bold shadow-md hover:shadow-xl transition-all duration-300 hover:scale-105 flex items-center justify-center border border-slate-800">
                <span className="relative z-10 flex items-center gap-2">
                  Login <Sparkles size={16} className="text-yellow-400" />
                </span>
                <div className="absolute top-0 -left-[100%] w-1/2 h-full bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12 group-hover:animate-[shine_1s_ease-in-out]"></div>
              </Link>
            )}
          </div>
        </div>
      </nav>
    </div>
  );
}
