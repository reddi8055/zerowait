import { useState, useEffect } from 'react';
import { Users, Store, CalendarCheck, PlusCircle } from 'lucide-react';

export default function AdminDashboard() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [stats, setStats] = useState({ totalRestaurants: 0, activeUsers: 0, bookingsToday: 0 });

  // Fetch stats on load
  const fetchStats = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/admin/stats');
      const data = await res.json();
      if (res.ok) setStats(data);
    } catch (err) {
      console.error('Failed to fetch stats');
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  // Form State for new restaurant
  const [formData, setFormData] = useState({
    name: '',
    cuisineType: '',
    mapX: 500,
    mapY: 500,
    address: '',
    numTables: 5,
    capacity: 20,
    ownerEmail: '',
    ownerPassword: ''
  });

  const handleCreateRestaurant = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const payload = {
        ...formData,
      };

      const res = await fetch('http://localhost:5000/api/restaurants', { credentials: "include", 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create');

      setSuccess(`Successfully created ${formData.name} with ${formData.numTables} tables!`);
      // Reset form
      setFormData({ name: '', cuisineType: '', mapX: 500, mapY: 500, address: '', numTables: 5, capacity: 20, ownerEmail: '', ownerPassword: '' });
      // Refresh the live stats so the number of restaurants updates!
      fetchStats();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-gray-500 mt-1">Manage restaurants, users, and view platform metrics.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card p-6 rounded-2xl flex items-start gap-4">
          <div className="p-3 bg-blue-100 text-blue-600 rounded-xl"><Store size={24} /></div>
          <div><p className="text-sm font-medium text-gray-500">Total Restaurants</p><p className="text-3xl font-bold mt-1">{stats.totalRestaurants}</p></div>
        </div>
        <div className="glass-card p-6 rounded-2xl flex items-start gap-4">
          <div className="p-3 bg-green-100 text-green-600 rounded-xl"><CalendarCheck size={24} /></div>
          <div><p className="text-sm font-medium text-gray-500">Bookings Today</p><p className="text-3xl font-bold mt-1">{stats.bookingsToday}</p></div>
        </div>
        <div className="glass-card p-6 rounded-2xl flex items-start gap-4">
          <div className="p-3 bg-purple-100 text-purple-600 rounded-xl"><Users size={24} /></div>
          <div><p className="text-sm font-medium text-gray-500">Active Users</p><p className="text-3xl font-bold mt-1">{stats.activeUsers}</p></div>
        </div>
      </div>

      {/* ADD RESTAURANT SECTION */}
      <div className="glass-card p-6 rounded-2xl mt-8">
        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
          <PlusCircle className="text-primary" /> Add New Restaurant
        </h2>
        
        {success && <div className="bg-green-100 text-green-700 p-3 rounded-lg mb-4">{success}</div>}
        {error && <div className="bg-red-100 text-red-700 p-3 rounded-lg mb-4">{error}</div>}

        <form onSubmit={handleCreateRestaurant} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Restaurant Name</label>
            <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-2 border rounded-xl" placeholder="E.g. Joe's Pizza" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Cuisine Type</label>
            <input required type="text" value={formData.cuisineType} onChange={e => setFormData({...formData, cuisineType: e.target.value})} className="w-full px-4 py-2 border rounded-xl" placeholder="E.g. Italian" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Owner Email (For Login)</label>
            <input required type="email" value={formData.ownerEmail} onChange={e => setFormData({...formData, ownerEmail: e.target.value})} className="w-full px-4 py-2 border rounded-xl" placeholder="owner@restaurant.com" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Owner Password</label>
            <input required type="password" value={formData.ownerPassword} onChange={e => setFormData({...formData, ownerPassword: e.target.value})} className="w-full px-4 py-2 border rounded-xl" placeholder="••••••••" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Number of Tables</label>
            <input required type="number" min="1" value={formData.numTables} onChange={e => setFormData({...formData, numTables: parseInt(e.target.value)})} className="w-full px-4 py-2 border rounded-xl" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Map Position (X Coordinate)</label>
            <input required type="number" value={formData.mapX} onChange={e => setFormData({...formData, mapX: parseInt(e.target.value)})} className="w-full px-4 py-2 border rounded-xl" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Map Position (Y Coordinate)</label>
            <input required type="number" value={formData.mapY} onChange={e => setFormData({...formData, mapY: parseInt(e.target.value)})} className="w-full px-4 py-2 border rounded-xl" />
          </div>
          
          <div className="md:col-span-2 pt-4">
            <button disabled={loading} type="submit" className="bg-primary text-white font-bold py-3 px-6 rounded-xl hover:bg-primary-dark transition-colors">
              {loading ? 'Creating...' : 'Create Restaurant & Tables'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
