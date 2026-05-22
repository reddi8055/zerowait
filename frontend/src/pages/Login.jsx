import { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // This helps us redirect to other pages
import { Link } from 'react-router-dom';

export default function Login() {
  const navigate = useNavigate();
  
  // State variables to hold what the user types into the form
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  
  // State for showing errors to the user
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // This function runs when the user clicks the Submit button
  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevents the page from refreshing
    setError('');
    setLoading(true);

    try {
      // 1. Choose which backend API endpoint to call (login or register)
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
      
      // 2. Prepare the data to send to the Node.js backend
      const payload = isLogin 
        ? { email, password } 
        : { name, email, password, role: 'user' }; // Public signup is ALWAYS for users

      // 3. Make the API request using standard fetch
      const response = await fetch(`http://localhost:5000${endpoint}`, { credentials: "include", 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      // 4. Handle errors from the backend
      if (!response.ok) {
        throw new Error(data.error || 'Something went wrong');
      }

      // 5. SUCCESS! Now let's redirect the user based on their role
      const userRole = data.user.role;
      
      if (userRole === 'admin') {
        navigate('/admin'); // Redirect to Admin Dashboard
      } else if (userRole === 'restaurant') {
        navigate('/restaurant-portal'); // Redirect to Restaurant Dashboard
      } else {
        navigate('/map'); // Redirect normal users to the Map
      }
      
      // We also force the router to refresh so the Navbar updates with the new role
      window.location.reload();

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">

      <div className="glass-card w-full max-w-md p-8 rounded-3xl">
        <h1 className="text-3xl font-black text-center mb-2">
          {isLogin ? 'Welcome Back' : 'Create Account'}
        </h1>
        <p className="text-center text-gray-500 mb-8">
          {isLogin ? 'Log in to manage your bookings' : 'Join Zero Wait today'}
        </p>

        {/* Display errors if there are any */}
        {error && (
          <div className="bg-red-100 text-red-600 p-3 rounded-xl text-sm mb-6 font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-sm font-medium mb-1">Full Name</label>
              <input 
                type="text" 
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-shadow" 
                placeholder="Enter your name" 
              />
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium mb-1">Email Address</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-shadow" 
              placeholder="you@example.com" 
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <input 
              type="password" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-shadow" 
              placeholder="••••••••" 
            />
          </div>



          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-primary text-white font-bold py-3 rounded-xl hover:bg-primary-dark transition-colors mt-6 shadow-md shadow-orange-200 disabled:opacity-50"
          >
            {loading ? 'Processing...' : (isLogin ? 'Log In' : 'Sign Up')}
          </button>
        </form>

        <div className="mt-6 text-center text-sm">
          <span className="text-gray-500">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
          </span>
          <button 
            onClick={() => {
              setIsLogin(!isLogin);
              setError(''); // Clear errors when switching modes
            }} 
            className="text-primary font-bold hover:underline"
          >
            {isLogin ? 'Sign up' : 'Log in'}
          </button>
        </div>
      </div>
    </div>
  );
}
