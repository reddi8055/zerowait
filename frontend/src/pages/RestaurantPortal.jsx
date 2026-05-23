import { useState, useEffect } from 'react';
import {
  ChefHat, Clock, PlusCircle, Utensils, Info, Settings,
  Camera, Phone, MapPin, Save, Lock, Eye, EyeOff, CheckCircle,
  ToggleLeft, ToggleRight, Trash2, Star, Grid
} from 'lucide-react';
import { MenuItemCard } from '@/components/ui/menu-item-card';
import { cleanImageUrl } from '@/lib/utils';

const getDefaultFoodImage = (category) => {
  const defaults = {
    starter: "https://images.unsplash.com/photo-1541532713592-79a0317b6b77?w=600&auto=format&fit=crop&q=80", // starter/appetizer
    main: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80", // main
    dessert: "https://images.unsplash.com/photo-1551024601-bec78aea704b?w=600&auto=format&fit=crop&q=80", // dessert
    drink: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=600&auto=format&fit=crop&q=80", // drink
  };
  return defaults[category] || defaults.main;
};

const API = 'http://localhost:5000';

export default function RestaurantDashboard() {
  const [restaurant, setRestaurant] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');

  // Menu state
  const [newItem, setNewItem] = useState({
    name: '',
    category: 'main',
    price: '',
    originalPrice: '',
    prepTime: 10,
    imageUrl: '',
    isVegetarian: true,
    quantity: '1 Portion'
  });
  const [isAdding, setIsAdding] = useState(false);
  const [menuMsg, setMenuMsg] = useState('');

  // Profile state
  const [profile, setProfile] = useState({
    name: '', cuisineType: '', address: '', phone: '', openingHours: '', description: '', imageUrl: ''
  });
  const [profileMsg, setProfileMsg] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  // Password state
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [pwMsg, setPwMsg] = useState('');
  const [savingPw, setSavingPw] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    try {
      const [restRes, menuRes, bookingsRes, tablesRes] = await Promise.all([
        fetch(`${API}/api/restaurants/mine`, { credentials: 'include' }),
        fetch(`${API}/api/menu`, { credentials: 'include' }),
        fetch(`${API}/api/bookings/restaurant`, { credentials: 'include' }),
        fetch(`${API}/api/restaurants/mine/tables`, { credentials: 'include' })
      ]);
      if (restRes.ok) {
        const r = await restRes.json();
        setRestaurant(r);
        setProfile({
          name: r.name || '',
          cuisineType: r.cuisineType || '',
          address: r.address || '',
          phone: r.phone || '',
          openingHours: r.openingHours || '',
          description: r.description || '',
          imageUrl: r.imageUrl || ''
        });
      }
      if (menuRes.ok) {
        const m = await menuRes.json();
        setMenuItems(m.menuItems || []);
      }
      if (bookingsRes.ok) {
        const b = await bookingsRes.json();
        setBookings(b);
      }
      if (tablesRes.ok) {
        const t = await tablesRes.json();
        setTables(t);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const updateBookingStatus = async (id, status) => {
    try {
      const res = await fetch(`${API}/api/bookings/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        fetchAll(); // Refresh bookings
      }
    } catch (err) {
      console.error(err);
    }
  };

  const toggleOpen = async () => {
    // Read the latest value directly to avoid stale closures
    const currentIsOpen = restaurant?.isOpen ?? false;
    const res = await fetch(`${API}/api/restaurants/mine`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ isOpen: !currentIsOpen })
    });
    if (res.ok) {
      const updated = await res.json();
      setRestaurant(updated);
    }
  };

  const updateWaitTime = async (delta) => {
    const newTime = Math.max(0, (restaurant.currentWaitTime || 0) + delta);
    const res = await fetch(`${API}/api/restaurants/mine`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ currentWaitTime: newTime })
    });
    if (res.ok) setRestaurant(await res.json());
  };

  const updateCapacity = async (delta) => {
    const newCapacity = Math.max(0, (restaurant.capacity || 0) + delta);
    const res = await fetch(`${API}/api/restaurants/mine`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ capacity: newCapacity })
    });
    if (res.ok) setRestaurant(await res.json());
  };

  const updateIndividualTable = async (tableId, delta) => {
    const table = tables.find(t => t._id === tableId);
    if (!table) return;
    const newSeats = Math.max(1, table.seats + delta);
    
    // Optimistic update
    setTables(prev => prev.map(t => t._id === tableId ? { ...t, seats: newSeats } : t));
    
    try {
      await fetch(`${API}/api/restaurants/mine/tables/${tableId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ seats: newSeats })
      });
    } catch (err) {
      console.error(err);
      fetchAll(); // Revert on failure
    }
  };

  const updateSeatsPerTable = async (delta) => {
    const newSeats = Math.max(1, (restaurant.seatsPerTable || 4) + delta);
    const res = await fetch(`${API}/api/restaurants/mine`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ seatsPerTable: newSeats })
    });
    if (res.ok) setRestaurant(await res.json());
  };

  const handleAddItem = async (e) => {
    e.preventDefault();
    setIsAdding(true);
    setMenuMsg('');
    try {
      const res = await fetch(`${API}/api/menu`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ 
          ...newItem, 
          imageUrl: cleanImageUrl(newItem.imageUrl),
          price: parseFloat(newItem.price),
          originalPrice: newItem.originalPrice ? parseFloat(newItem.originalPrice) : parseFloat(newItem.price),
          prepTime: parseInt(newItem.prepTime) || 10
        })
      });
      if (res.ok) {
        setNewItem({ 
          name: '', 
          category: 'main', 
          price: '', 
          originalPrice: '', 
          prepTime: 10, 
          imageUrl: '', 
          isVegetarian: true, 
          quantity: '1 Portion' 
        });
        setMenuMsg('✅ Item added!');
        fetchAll();
        setTimeout(() => setMenuMsg(''), 3000);
      }
    } catch (err) { console.error(err); }
    finally { setIsAdding(false); }
  };

  const handleDeleteItem = async (id) => {
    await fetch(`${API}/api/menu/${id}`, { method: 'DELETE', credentials: 'include' });
    fetchAll();
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileMsg('');
    try {
      const res = await fetch(`${API}/api/restaurants/mine`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ...profile,
          imageUrl: cleanImageUrl(profile.imageUrl)
        })
      });
      const data = await res.json();
      if (res.ok) {
        setRestaurant(data);
        setProfileMsg('✅ Profile saved successfully!');
      } else {
        setProfileMsg(`❌ ${data.error}`);
      }
    } catch (err) {
      setProfileMsg('❌ Failed to save');
    } finally {
      setSavingProfile(false);
      setTimeout(() => setProfileMsg(''), 4000);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwMsg('');
    if (pwForm.newPassword !== pwForm.confirm) {
      return setPwMsg('❌ New passwords do not match');
    }
    setSavingPw(true);
    try {
      const res = await fetch(`${API}/api/restaurants/change-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword })
      });
      const data = await res.json();
      if (res.ok) {
        setPwMsg('✅ Password changed successfully!');
        setPwForm({ currentPassword: '', newPassword: '', confirm: '' });
      } else {
        setPwMsg(`❌ ${data.error}`);
      }
    } catch (err) {
      setPwMsg('❌ Failed to change password');
    } finally {
      setSavingPw(false);
      setTimeout(() => setPwMsg(''), 4000);
    }
  };

  if (loading) return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="font-semibold text-gray-500">Loading your dashboard...</p>
      </div>
    </div>
  );

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: ChefHat },
    { id: 'tables', label: 'Tables', icon: Grid },
    { id: 'menu', label: 'Menu', icon: Utensils },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="space-y-6 pb-16">

      {/* ── WELCOME BANNER ── */}
      <div className="relative rounded-3xl overflow-hidden" style={{ minHeight: '180px' }}>
        {restaurant?.imageUrl ? (
          <img src={cleanImageUrl(restaurant.imageUrl)} alt={restaurant.name} className="absolute inset-0 w-full h-full object-cover" referrerPolicy="no-referrer" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-orange-400 via-primary to-orange-600" />
        )}
        <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
        <div className="relative z-10 p-8 flex items-end justify-between h-full" style={{ minHeight: '180px' }}>
          <div>
            <p className="text-orange-200 text-sm font-semibold uppercase tracking-widest mb-1">Welcome back 👋</p>
            <h1 className="text-4xl md:text-5xl font-black text-white drop-shadow-lg">
              {restaurant?.name || 'Your Restaurant'}
            </h1>
            <p className="text-orange-100 mt-1 font-medium">
              {restaurant?.cuisineType} Cuisine
              {restaurant?.address && ` • ${restaurant.address}`}
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <button
              onClick={toggleOpen}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-sm shadow-lg transition-all hover:scale-105 ${
                restaurant?.isOpen
                  ? 'bg-green-400 text-green-900'
                  : 'bg-red-400 text-red-900'
              }`}
            >
              {restaurant?.isOpen ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
              {restaurant?.isOpen ? 'OPEN' : 'CLOSED'}
            </button>
            <div className="flex items-center gap-1 text-yellow-300 font-bold">
              <Star size={14} fill="currentColor" />
              <span className="text-sm">{restaurant?.rating?.toFixed(1) || '5.0'} Rating</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── TABS ── */}
      <div className="flex gap-2 p-1 bg-gray-100 rounded-2xl w-fit">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all ${
              activeTab === tab.id
                ? 'bg-white shadow-md text-primary'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── DASHBOARD TAB ── */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            {/* Wait Time */}
            <div className="glass-card p-6 rounded-2xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-orange-100 rounded-xl"><Clock className="text-primary" size={22} /></div>
                <h2 className="text-xl font-bold">Live Wait Time</h2>
              </div>
              <p className="text-gray-500 text-sm mb-6">Update this so customers see accurate estimates.</p>
              <div className="flex items-center gap-6">
                <button
                  onClick={() => updateWaitTime(-5)}
                  className="w-12 h-12 rounded-2xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center font-bold text-xl transition-all hover:scale-105"
                >−</button>
                <div className="text-center">
                  <div className="text-5xl font-black text-primary">{restaurant?.currentWaitTime ?? 0}</div>
                  <div className="text-sm font-medium text-gray-400 mt-1">minutes</div>
                </div>
                <button
                  onClick={() => updateWaitTime(5)}
                  className="w-12 h-12 rounded-2xl bg-orange-50 hover:bg-orange-100 border border-orange-200 flex items-center justify-center font-bold text-xl text-primary transition-all hover:scale-105"
                >+</button>
              </div>
            </div>

            {/* Total Tables */}
            <div className="glass-card p-6 rounded-2xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-blue-100 rounded-xl"><Utensils className="text-blue-600" size={22} /></div>
                <h2 className="text-xl font-bold">Total Tables</h2>
              </div>
              <p className="text-gray-500 text-sm mb-6">Manage how many tables are available for booking.</p>
              <div className="flex items-center gap-6">
                <button
                  onClick={() => updateCapacity(-1)}
                  className="w-12 h-12 rounded-2xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center font-bold text-xl transition-all hover:scale-105"
                >−</button>
                <div className="text-center w-16">
                  <div className="text-5xl font-black text-blue-600">{restaurant?.capacity ?? 0}</div>
                  <div className="text-sm font-medium text-gray-400 mt-1">tables</div>
                </div>
                <button
                  onClick={() => updateCapacity(1)}
                  className="w-12 h-12 rounded-2xl bg-blue-50 hover:bg-blue-100 border border-blue-200 flex items-center justify-center font-bold text-xl text-blue-600 transition-all hover:scale-105"
                >+</button>
              </div>
            </div>

            {/* Seats per Table */}
            <div className="glass-card p-6 rounded-2xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-emerald-100 rounded-xl"><Utensils className="text-emerald-600" size={22} /></div>
                <h2 className="text-xl font-bold">Seats per Table</h2>
              </div>
              <p className="text-gray-500 text-sm mb-6">Manage how many chairs are at each table.</p>
              <div className="flex items-center gap-6">
                <button
                  onClick={() => updateSeatsPerTable(-1)}
                  className="w-12 h-12 rounded-2xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center font-bold text-xl transition-all hover:scale-105"
                >−</button>
                <div className="text-center w-16">
                  <div className="text-5xl font-black text-emerald-600">{restaurant?.seatsPerTable ?? 4}</div>
                  <div className="text-sm font-medium text-gray-400 mt-1">chairs</div>
                </div>
                <button
                  onClick={() => updateSeatsPerTable(1)}
                  className="w-12 h-12 rounded-2xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 flex items-center justify-center font-bold text-xl text-emerald-600 transition-all hover:scale-105"
                >+</button>
              </div>
            </div>

            {/* Stats */}
            <div className="glass-card p-6 rounded-2xl space-y-4">
              <h2 className="text-xl font-bold">Today's Activity</h2>
              {[
                { label: 'Active Orders', value: bookings.filter(b => !['served', 'cancelled'].includes(b.status)).length, color: 'text-orange-500' },
                { label: 'Completed Orders', value: bookings.filter(b => b.status === 'served').length, color: 'text-green-500' },
                { label: 'Menu Items', value: menuItems.length, color: 'text-blue-500' },
              ].map(stat => (
                <div key={stat.label} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                  <span className="font-medium text-gray-700">{stat.label}</span>
                  <span className={`font-black text-2xl ${stat.color}`}>{stat.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Live Orders */}
          <div className="glass-card p-6 rounded-2xl border-l-4 border-l-orange-300">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <ChefHat className="text-primary" size={22} /> Live Orders
            </h2>
            
            {bookings.filter(b => !['served', 'cancelled'].includes(b.status)).length === 0 ? (
              <div className="text-center py-10 text-gray-400 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                <ChefHat size={40} className="mx-auto mb-3 opacity-30" />
                <p className="font-semibold">No active orders right now.</p>
                <p className="text-sm mt-1">When customers pre-order, they'll appear here!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {bookings.filter(b => !['served', 'cancelled'].includes(b.status)).map(booking => (
                  <div key={booking._id} className="border border-gray-100 p-4 rounded-xl shadow-sm bg-white">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-bold text-lg">{booking.customerName} <span className="text-gray-500 text-sm font-normal">({booking.numberOfPeople} People)</span></h3>
                        <p className="text-sm text-gray-600 font-medium">
                          {booking.tableIds && booking.tableIds.length > 0 
                            ? booking.tableIds.map(t => t.tableName).join(', ') 
                            : 'Unknown Table'}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="font-black text-primary text-lg">Total: ₹{booking.totalAmount.toFixed(2)}</div>
                        <div className="text-xs text-orange-600 font-bold bg-orange-50 px-2 py-1 rounded inline-block mt-1">Paid: ₹{booking.advanceAmount.toFixed(2)}</div>
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 p-3 rounded-lg mb-4 text-sm">
                      <ul className="space-y-1">
                        {booking.items.map((item, idx) => (
                          <li key={idx} className="flex justify-between">
                            <span><span className="font-bold text-gray-500 mr-2">{item.quantity}x</span>{item.name}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 items-center justify-between border-t border-gray-100 pt-3 mt-3">
                      <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Status: <span className="text-gray-800">{booking.status}</span></span>
                      <div className="flex gap-2">
                        {booking.status === 'confirmed' && (
                          <button onClick={() => updateBookingStatus(booking._id, 'preparing')} className="text-xs font-bold px-3 py-1.5 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 transition-colors">Start Preparing</button>
                        )}
                        {booking.status === 'preparing' && (
                          <button onClick={() => updateBookingStatus(booking._id, 'ready')} className="text-xs font-bold px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors">Mark Ready</button>
                        )}
                        {booking.status === 'ready' && (
                          <button onClick={() => updateBookingStatus(booking._id, 'served')} className="text-xs font-bold px-3 py-1.5 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors">Mark Served</button>
                        )}
                        <button onClick={() => updateBookingStatus(booking._id, 'cancelled')} className="text-xs font-bold px-3 py-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors">Cancel</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TABLES TAB ── */}
      {activeTab === 'tables' && (
        <div className="space-y-6">
          <div className="glass-card p-6 rounded-2xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-emerald-100 rounded-xl"><Grid className="text-emerald-600" size={22} /></div>
              <h2 className="text-xl font-bold">Manage Individual Tables</h2>
            </div>
            <p className="text-gray-500 text-sm mb-6">Customize the exact number of chairs for each specific table in your restaurant.</p>

            {tables.length === 0 ? (
              <div className="text-center py-10 text-gray-400 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                <Grid size={40} className="mx-auto mb-3 opacity-30" />
                <p className="font-semibold">No tables found.</p>
                <p className="text-sm mt-1">Go to Dashboard and increase Total Tables first.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {tables.map(table => (
                  <div key={table._id} className="p-4 bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-md transition-all flex flex-col items-center">
                    <div className="font-black text-gray-800 mb-1">{table.tableName}</div>
                    <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">{table.seats} Chairs</div>
                    <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-1 border border-gray-100">
                      <button 
                        onClick={() => updateIndividualTable(table._id, -1)}
                        className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center font-bold text-gray-600 hover:bg-gray-100 hover:text-red-500 transition-colors shadow-sm"
                      >−</button>
                      <span className="font-black w-4 text-center">{table.seats}</span>
                      <button 
                        onClick={() => updateIndividualTable(table._id, 1)}
                        className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center font-bold text-gray-600 hover:bg-gray-100 hover:text-emerald-500 transition-colors shadow-sm"
                      >+</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── MENU TAB ── */}
      {activeTab === 'menu' && (
        <div className="space-y-6">
          <div className="glass-card p-6 rounded-2xl">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <PlusCircle className="text-primary" size={22} /> Add Menu Item
            </h2>

            {menuMsg && (
              <div className="flex items-center gap-2 bg-green-50 text-green-700 p-3 rounded-xl mb-4 font-medium border border-green-200">
                <CheckCircle size={18} /> {menuMsg}
              </div>
            )}

            <form onSubmit={handleAddItem} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Item Name</label>
                <input
                  required type="text" value={newItem.name}
                  onChange={e => setNewItem({ ...newItem, name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="e.g. Truffle Fries"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Category</label>
                <select
                  value={newItem.category}
                  onChange={e => setNewItem({ ...newItem, category: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="starter">Starter</option>
                  <option value="main">Main Course</option>
                  <option value="dessert">Dessert</option>
                  <option value="drink">Drink</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Dietary</label>
                <select
                  value={newItem.isVegetarian ? "veg" : "nonveg"}
                  onChange={e => setNewItem({ ...newItem, isVegetarian: e.target.value === "veg" })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="veg">🟢 Vegetarian</option>
                  <option value="nonveg">🔴 Non-Vegetarian</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Price (₹)</label>
                <input
                  required type="number" step="0.01" min="0" value={newItem.price}
                  onChange={e => setNewItem({ ...newItem, price: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Original Price (₹)</label>
                <input
                  type="number" step="0.01" min="0" value={newItem.originalPrice}
                  onChange={e => setNewItem({ ...newItem, originalPrice: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Blank if no discount"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Prep Time (mins)</label>
                <input
                  required type="number" min="1" value={newItem.prepTime}
                  onChange={e => setNewItem({ ...newItem, prepTime: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="10"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Quantity/Serving</label>
                <input
                  required type="text" value={newItem.quantity}
                  onChange={e => setNewItem({ ...newItem, quantity: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="e.g. Serves 1, 450 ml"
                />
              </div>
              <div className="md:col-span-4">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Image URL</label>
                <input
                  type="url" value={newItem.imageUrl}
                  onChange={e => setNewItem({ ...newItem, imageUrl: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="https://images.unsplash.com/..."
                />
              </div>
              <div className="md:col-span-4">
                <button
                  disabled={isAdding} type="submit"
                  className="w-full md:w-auto bg-primary text-white font-bold py-3 px-8 rounded-xl hover:bg-primary-dark transition-all hover:scale-105 shadow-md shadow-orange-200 flex items-center gap-2 disabled:opacity-50"
                >
                  <PlusCircle size={18} /> {isAdding ? 'Adding...' : 'Add to Menu'}
                </button>
              </div>
            </form>
          </div>

          {/* Menu List */}
          <div className="glass-card p-6 rounded-2xl">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Utensils className="text-primary" size={22} /> Current Menu
              <span className="ml-auto text-sm font-normal text-gray-400">{menuItems.length} items</span>
            </h2>

            {menuItems.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <Utensils size={40} className="mx-auto mb-3 opacity-30" />
                <p className="font-semibold">Your menu is empty.</p>
                <p className="text-sm mt-1">Add items above so customers can pre-order!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {menuItems.map(item => (
                  <div key={item._id} className="relative flex flex-col items-center group/portal">
                    <MenuItemCard
                      imageUrl={item.imageUrl || getDefaultFoodImage(item.category)}
                      isVegetarian={item.isVegetarian !== undefined ? item.isVegetarian : true}
                      name={item.name}
                      price={item.price}
                      originalPrice={item.originalPrice || item.price}
                      quantity={item.quantity || "1 Portion"}
                      prepTimeInMinutes={item.prepTime || 10}
                      onAdd={() => {}}
                      className="pointer-events-none shadow-sm w-full"
                    />
                    <button
                      onClick={() => handleDeleteItem(item._id)}
                      className="absolute top-3 left-3 bg-red-500 hover:bg-red-600 text-white font-bold p-2.5 rounded-full shadow-md z-30 flex items-center gap-1 opacity-0 group-hover/portal:opacity-100 transition-all duration-200 cursor-pointer pointer-events-auto"
                      title="Delete Item"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── SETTINGS TAB ── */}
      {activeTab === 'settings' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Profile Settings */}
          <div className="glass-card p-6 rounded-2xl space-y-5">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Camera className="text-primary" size={22} /> Restaurant Profile
            </h2>

            {profileMsg && (
              <div className={`p-3 rounded-xl text-sm font-medium border ${profileMsg.startsWith('✅') ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                {profileMsg}
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="space-y-4">
              {/* Image Preview */}
              {profile.imageUrl && (
                <img src={cleanImageUrl(profile.imageUrl)} alt="Preview" className="w-full h-40 object-cover rounded-2xl border border-gray-200" referrerPolicy="no-referrer" />
              )}

              {[
                { label: 'Restaurant Name', key: 'name', type: 'text', placeholder: 'Mehfil Restaurant', icon: null },
                { label: 'Cuisine Type', key: 'cuisineType', type: 'text', placeholder: 'Indian, Chinese…', icon: null },
                { label: 'Phone Number', key: 'phone', type: 'tel', placeholder: '+91 98765 43210', icon: <Phone size={16} className="text-gray-400" /> },
                { label: 'Address', key: 'address', type: 'text', placeholder: '123 MG Road, Hyderabad', icon: <MapPin size={16} className="text-gray-400" /> },
                { label: 'Opening Hours', key: 'openingHours', type: 'text', placeholder: 'Mon–Sun 11am – 11pm', icon: <Clock size={16} className="text-gray-400" /> },
                { label: 'Cover Image URL', key: 'imageUrl', type: 'url', placeholder: 'https://…/image.jpg', icon: <Camera size={16} className="text-gray-400" /> },
              ].map(field => (
                <div key={field.key}>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">{field.label}</label>
                  <div className="relative">
                    {field.icon && <span className="absolute left-3 top-1/2 -translate-y-1/2">{field.icon}</span>}
                    <input
                      type={field.type}
                      value={profile[field.key]}
                      onChange={e => setProfile({ ...profile, [field.key]: e.target.value })}
                      className={`w-full border border-gray-200 rounded-xl py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary ${field.icon ? 'pl-9 pr-4' : 'px-4'}`}
                      placeholder={field.placeholder}
                    />
                  </div>
                </div>
              ))}

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Description</label>
                <textarea
                  value={profile.description}
                  onChange={e => setProfile({ ...profile, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                  placeholder="Tell customers about your restaurant…"
                />
              </div>

              <button
                type="submit" disabled={savingProfile}
                className="w-full flex items-center justify-center gap-2 bg-primary text-white font-bold py-3 rounded-xl hover:bg-primary-dark transition-all hover:scale-[1.02] shadow-md shadow-orange-200 disabled:opacity-50"
              >
                <Save size={18} /> {savingProfile ? 'Saving…' : 'Save Profile'}
              </button>
            </form>
          </div>

          {/* Change Password */}
          <div className="glass-card p-6 rounded-2xl space-y-5 h-fit">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Lock className="text-primary" size={22} /> Change Password
            </h2>

            {pwMsg && (
              <div className={`p-3 rounded-xl text-sm font-medium border ${pwMsg.startsWith('✅') ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                {pwMsg}
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-4">
              {[
                { label: 'Current Password', key: 'currentPassword', show: showCurrent, setShow: setShowCurrent },
                { label: 'New Password', key: 'newPassword', show: showNew, setShow: setShowNew },
                { label: 'Confirm New Password', key: 'confirm', show: showNew, setShow: setShowNew },
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">{f.label}</label>
                  <div className="relative">
                    <input
                      type={f.show ? 'text' : 'password'}
                      required
                      value={pwForm[f.key]}
                      onChange={e => setPwForm({ ...pwForm, [f.key]: e.target.value })}
                      className="w-full px-4 pr-10 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="••••••••"
                    />
                    <button type="button" onClick={() => f.setShow(!f.show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {f.show ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              ))}

              <button
                type="submit" disabled={savingPw}
                className="w-full flex items-center justify-center gap-2 bg-gray-900 text-white font-bold py-3 rounded-xl hover:bg-gray-700 transition-all hover:scale-[1.02] disabled:opacity-50"
              >
                <Lock size={18} /> {savingPw ? 'Changing…' : 'Change Password'}
              </button>
            </form>
          </div>

        </div>
      )}
    </div>
  );
}
