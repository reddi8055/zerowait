import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChefHat, Utensils, Clock, MapPin, Sparkles, ArrowRight } from 'lucide-react';

export default function Home() {
  const navigate = useNavigate();
  
  // Auth state
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [loggedInUser, setLoggedInUser] = useState(null);

  // If user is already logged in, show them a welcome back screen instead of redirecting
  useEffect(() => {
    fetch('http://localhost:5000/api/auth/me', { credentials: "include" })
      .then(res => res.json())
      .then(data => {
        if (data.user) {
          setLoggedInUser(data.user);
        }
      })
      .catch(() => {});
  }, []);

  const handleContinue = () => {
    if (!loggedInUser) return;
    if (loggedInUser.role === 'admin') navigate('/admin');
    else if (loggedInUser.role === 'restaurant') navigate('/restaurant-portal');
    else navigate('/map');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
      const payload = isLogin ? { email, password } : { name, email, password, role: 'user' };

      const response = await fetch(`http://localhost:5000${endpoint}`, { 
        credentials: "include", 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Something went wrong');
      }

      const userRole = data.user.role;
      if (userRole === 'admin') navigate('/admin');
      else if (userRole === 'restaurant') navigate('/restaurant-portal');
      else navigate('/map');
      
      window.location.reload();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] flex flex-col lg:flex-row overflow-hidden bg-background">
      
      {/* LEFT SIDE: Animated Visuals */}
      <div className="flex-1 relative hidden lg:flex flex-col items-center justify-center p-12 overflow-hidden bg-white">
        {/* Background Decorative Elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-30 pointer-events-none">
          <div className="absolute -top-20 -left-20 w-96 h-96 bg-orange-200 rounded-full blur-[100px]"></div>
          <div className="absolute top-1/2 -right-20 w-80 h-80 bg-primary/20 rounded-full blur-[80px]"></div>
          <div className="absolute -bottom-20 left-1/3 w-96 h-96 bg-yellow-200 rounded-full blur-[100px]"></div>
        </div>

        {/* Floating Icons Configuration */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 animate-bounce-slow text-primary/40 rotate-12">
            <ChefHat size={64} />
          </div>
          <div className="absolute top-1/3 right-1/4 animate-pulse-slow text-yellow-500/40 -rotate-12" style={{ animationDelay: '1s' }}>
            <Utensils size={48} />
          </div>
          <div className="absolute bottom-1/3 left-1/3 animate-bounce-slow text-green-500/40 rotate-45" style={{ animationDelay: '2s' }}>
            <Clock size={56} />
          </div>
          <div className="absolute bottom-1/4 right-1/3 animate-pulse-slow text-orange-400/40 -rotate-45" style={{ animationDelay: '1.5s' }}>
            <MapPin size={40} />
          </div>
        </div>

        {/* Hero Text Content */}
        <div className="relative z-10 max-w-xl text-center space-y-6">
          <div className="inline-flex items-center gap-2 bg-orange-50 text-primary font-bold px-4 py-2 rounded-full text-sm mb-4 border border-orange-100 shadow-sm animate-fade-in-up">
            <Sparkles size={16} /> The future of dining is here
          </div>
          <h1 className="text-6xl font-black text-text-charcoal leading-tight animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            Zero Wait.<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-orange-400">
              Maximum Taste.
            </span>
          </h1>
          <p className="text-xl text-gray-500 leading-relaxed animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            Pre-book your table. Pre-order your meal. Walk in and sit down to hot, fresh food instantly.
          </p>
        </div>

        {/* Animated Stats */}
        <div className="absolute bottom-12 flex gap-6 w-full justify-center px-12 z-20">
          <div className="glass-card px-6 py-4 rounded-3xl animate-fade-in-up shadow-xl border-white/60 hover:-translate-y-2 transition-transform duration-300" style={{ animationDelay: '0.4s' }}>
            <div className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary to-orange-400">50+</div>
            <div className="text-xs font-bold text-gray-500 uppercase mt-1">Partner Restaurants</div>
          </div>
          <div className="glass-card px-6 py-4 rounded-3xl animate-fade-in-up shadow-xl border-white/60 hover:-translate-y-2 transition-transform duration-300" style={{ animationDelay: '0.5s' }}>
            <div className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-green-600">10k+</div>
            <div className="text-xs font-bold text-gray-500 uppercase mt-1">Happy Customers</div>
          </div>
          <div className="glass-card px-6 py-4 rounded-3xl animate-fade-in-up shadow-xl border-white/60 hover:-translate-y-2 transition-transform duration-300" style={{ animationDelay: '0.6s' }}>
            <div className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-400">0 min</div>
            <div className="text-xs font-bold text-gray-500 uppercase mt-1">Average Wait Time</div>
          </div>
        </div>
      </div>

      {/* RIGHT SIDE: Auth Form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 relative z-20">
        
        <div className="glass-card w-full max-w-md p-8 sm:p-10 rounded-[2rem] shadow-2xl border-white/50 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
          {loggedInUser ? (
            <div className="text-center">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Sparkles className="text-primary" size={32} />
              </div>
              <h2 className="text-3xl font-black text-gray-800 mb-2">
                Welcome back, {loggedInUser.name || 'User'}!
              </h2>
              <p className="text-gray-500 mb-8">
                You are currently logged in as {loggedInUser.role}.
              </p>
              <button 
                onClick={handleContinue}
                className="w-full bg-gradient-to-r from-primary to-orange-500 text-white font-black py-4 rounded-2xl hover:shadow-lg hover:shadow-orange-200 transition-all hover:-translate-y-1 mt-8 group flex justify-center items-center gap-2"
              >
                Continue to Dashboard
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          ) : (
            <>
              <div className="text-center mb-8">
                <h2 className="text-3xl font-black text-gray-800 mb-2">
                  {isLogin ? 'Welcome Back' : 'Create Account'}
                </h2>
                <p className="text-gray-500">
                  {isLogin ? 'Log in to manage your bookings' : 'Join Zero Wait and skip the line'}
                </p>
              </div>

              {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-sm mb-6 font-bold border border-red-100 flex items-center justify-center animate-shake">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                {!isLogin && (
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Full Name</label>
                    <input 
                      type="text" 
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-5 py-4 rounded-2xl bg-white/50 border border-gray-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all" 
                      placeholder="John Doe" 
                    />
                  </div>
                )}
                
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Email Address</label>
                  <input 
                    type="email" 
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-5 py-4 rounded-2xl bg-white/50 border border-gray-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all" 
                    placeholder="you@example.com" 
                  />
                </div>
                
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Password</label>
                  <input 
                    type="password" 
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-5 py-4 rounded-2xl bg-white/50 border border-gray-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all" 
                    placeholder="••••••••" 
                  />
                </div>

                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-primary to-orange-500 text-white font-black py-4 rounded-2xl hover:shadow-lg hover:shadow-orange-200 transition-all hover:-translate-y-1 mt-8 disabled:opacity-50 disabled:hover:translate-y-0 group flex justify-center items-center gap-2"
                >
                  {loading ? 'Processing...' : (isLogin ? 'Log In' : 'Sign Up')}
                  {!loading && <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />}
                </button>
              </form>

              <div className="mt-8 text-center">
                <button 
                  type="button"
                  onClick={() => {
                    setIsLogin(!isLogin);
                    setError('');
                  }} 
                  className="text-gray-500 font-medium hover:text-gray-800 transition-colors"
                >
                  {isLogin ? "Don't have an account? " : "Already have an account? "}
                  <span className="text-primary font-bold underline decoration-orange-200 underline-offset-4">{isLogin ? 'Sign up' : 'Log in'}</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
      
    </div>
  );
}
