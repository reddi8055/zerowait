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
  const [role, setRole] = useState(null); // Default to null (unauthenticated) so it shows Login first

  useEffect(() => {
    // Fetch the user's role from the backend securely on every page load
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
  }, [pathname]); // Re-run when pathname changes to ensure it's always up to date

  const handleLogout = async () => {
    await fetch('http://localhost:5000/api/auth/logout', { credentials: "include",  method: 'POST' });
    setRole(null);
    navigate('/');
    window.location.reload();
  };

  return (
    <nav className="sticky top-0 z-50 glass-card px-6 py-4 flex items-center justify-between">
      <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
        <LogoIcon />
        <span className="text-xl font-bold text-text-charcoal tracking-tight">Zero Wait</span>
      </Link>
      
      <div className="flex items-center gap-6 font-medium text-sm">
        <div className="flex items-center gap-4 animate-in fade-in zoom-in duration-500">
          {role === 'admin' && (
            <Link to="/admin" className={`flex items-center gap-1 transition-all hover:scale-105 ${pathname === '/admin' ? 'text-primary' : 'hover:text-primary'}`}>
              <LayoutDashboard size={18} /> Dashboard
            </Link>
          )}
          {role === 'restaurant' && (
            <Link to="/restaurant-portal" className={`flex items-center gap-1 transition-all hover:scale-105 ${pathname === '/restaurant-portal' ? 'text-primary' : 'hover:text-primary'}`}>
              <Utensils size={18} /> My Restaurant
            </Link>
          )}
          
          {/* Everyone can see the map */}
          <Link to="/map" className={`flex items-center gap-1 transition-all hover:scale-105 ${pathname === '/map' ? 'text-primary' : 'hover:text-primary'}`}>
            <MapIcon size={18} /> Find Food
          </Link>

          {role === 'user' && (
            <Link to="/my-orders" className={`flex items-center gap-1 transition-all hover:scale-105 ${pathname === '/my-orders' ? 'text-primary' : 'hover:text-primary'}`}>
              <Utensils size={18} /> My Orders
            </Link>
          )}

          {role ? (
            <button onClick={handleLogout} className="flex items-center gap-1 text-danger hover:bg-red-100 transition-all ml-2 border border-red-100 bg-red-50 px-4 py-2 rounded-full font-medium hover:scale-105">
              <LogOut size={16} /> Logout
            </button>
          ) : (
            <Link to="/login" className="relative group overflow-hidden bg-gradient-to-r from-orange-400 to-primary text-white px-8 py-2.5 rounded-full font-black shadow-[0_0_15px_rgba(249,115,22,0.5)] hover:shadow-[0_0_25px_rgba(249,115,22,0.8)] transition-all duration-300 hover:scale-110 hover:-translate-y-1 ml-4 flex items-center justify-center animate-bounce-slow border-2 border-white/20 hover:border-white/50">
              <span className="relative z-10 flex items-center gap-2 drop-shadow-md">
                Login <Sparkles size={18} className="animate-pulse text-yellow-200" />
              </span>
              
              {/* Shine effect that sweeps across on hover */}
              <div className="absolute top-0 -left-[100%] w-1/2 h-full bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-12 group-hover:animate-[shine_1s_ease-in-out]"></div>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
