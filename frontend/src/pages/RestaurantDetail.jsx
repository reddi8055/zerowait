import { useState, useEffect } from 'react';
import {
  Clock, MapPin, CheckCircle, Store, Plus, Minus,
  ShoppingCart, Mail, Phone, User, Calendar, Hash,
  TimerIcon, Utensils
} from 'lucide-react';
import { useParams } from 'react-router-dom';
import { MenuItemCard } from '@/components/ui/menu-item-card';

// ─── Defined OUTSIDE component so React doesn't remount on every render ───
const InputField = ({ id, label, icon: Icon, type = 'text', value, onChange, placeholder, error: err, ...rest }) => (
  <div>
    <label htmlFor={id} className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
      {label}
    </label>
    <div className="relative">
      {Icon && (
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
          <Icon size={15} />
        </span>
      )}
      <input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`w-full ${Icon ? 'pl-9' : 'pl-4'} pr-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 transition-all
          ${err ? 'border-red-400 focus:ring-red-400 bg-red-50' : 'border-gray-200 focus:ring-primary bg-white'}`}
        {...rest}
      />
    </div>
    {err && <p className="text-xs text-red-500 mt-1 font-medium">{err}</p>}
  </div>
);

const getDefaultFoodImage = (category) => {
  const defaults = {
    starter: "https://images.unsplash.com/photo-1541532713592-79a0317b6b77?w=600&auto=format&fit=crop&q=80",
    main:    "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80",
    dessert: "https://images.unsplash.com/photo-1551024601-bec78aea704b?w=600&auto=format&fit=crop&q=80",
    drink:   "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=600&auto=format&fit=crop&q=80",
  };
  return defaults[category] || defaults.main;
};

// Validation helpers
const isValidEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
// Accept 10-digit Indian number OR any E.164 format (e.g. +919876543210)
const isValidPhone = (v) => {
  const digits = v.replace(/\D/g, '');
  return /^[6-9]\d{9}$/.test(digits) ||       // 10-digit Indian
         /^91[6-9]\d{9}$/.test(digits) ||      // 91 + 10 digits
         /^\+?[1-9]\d{9,14}$/.test(v.replace(/\s/g, '')); // general E.164
};

const API = 'http://localhost:5000';

export default function RestaurantDetails() {
  const params = useParams();
  const restaurantId = params.id;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Booking choices
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [cart, setCart] = useState({});

  // Contact info
  const [customerName,  setCustomerName]  = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [bookingTime,   setBookingTime]   = useState('');
  const [numberOfPeople, setNumberOfPeople] = useState(1);

  // UI state
  const [bookingLoading, setBookingLoading] = useState(false);
  const [fieldErrors,    setFieldErrors]    = useState({});

  // Booking result state
  const [bookingResult, setBookingResult] = useState(null); // { bookingId, waitingTimeStatus, totalPrice }

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res    = await fetch(`${API}/api/restaurants/${restaurantId}`, { credentials: 'include' });
        const result = await res.json();
        if (!res.ok) throw new Error(result.error);
        setData(result);
      } catch {
        setError('Failed to load restaurant details. Are you sure it exists?');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [restaurantId]);

  const handleAddToCart    = (id) => setCart(p => ({ ...p, [id]: (p[id] || 0) + 1 }));
  const handleRemoveFromCart = (id) => setCart(p => {
    if ((p[id] || 0) <= 1) { const n = { ...p }; delete n[id]; return n; }
    return { ...p, [id]: p[id] - 1 };
  });

  const totalSelectedSeats = selectedSeats.length;
  const isCapacityExceeded = numberOfPeople > totalSelectedSeats;
  
  const toggleSeatSelection = (tableId, seatIndex) => {
    const seatId = `${tableId}-${seatIndex}`;
    setSelectedSeats(prev => {
      if (prev.includes(seatId)) {
        return prev.filter(id => id !== seatId);
      } else {
        if (prev.length >= numberOfPeople) {
          alert(`You can only select ${numberOfPeople} seats. Unselect a seat first.`);
          return prev;
        }
        return [...prev, seatId];
      }
    });
  };

  const validate = () => {
    const errs = {};
    if (!customerName.trim())              errs.customerName  = 'Name is required.';
    if (!customerEmail.trim())             errs.customerEmail = 'Email is required.';
    else if (!isValidEmail(customerEmail)) errs.customerEmail = 'Enter a valid email address.';
    if (!customerPhone.trim())             errs.customerPhone = 'WhatsApp number is required.';
    else if (!isValidPhone(customerPhone)) errs.customerPhone = 'Enter a valid 10-digit mobile number (e.g. 9876543210).';
    if (!numberOfPeople || numberOfPeople < 1) errs.numberOfPeople = 'Number of people must be at least 1.';
    return errs;
  };

  const handleBookTable = async () => {
    if (selectedSeats.length === 0) {
      alert('Please select at least one seat.');
      return;
    }
    if (isCapacityExceeded) {
      alert(`Not enough seats selected for ${numberOfPeople} people. Please select more tables.`);
      return;
    }

    const errs = validate();
    setFieldErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setBookingLoading(true);

    const cartItems = Object.keys(cart).map(itemId => {
      const item = data.menuItems.find(m => m._id === itemId);
      return { menuItemId: itemId, name: item.name, quantity: cart[itemId], priceAtBooking: item.price };
    });

    let totalPrice = 0;
    cartItems.forEach(i => (totalPrice += i.priceAtBooking * i.quantity));
    const advanceAmount = totalPrice * 0.20;

    try {
      const res = await fetch(`${API}/api/bookings`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          restaurantId,
          tableIds:      [...new Set(selectedSeats.map(id => id.split('-')[0]))],
          customerName:  customerName.trim(),
          customerEmail: customerEmail.trim(),
          customerPhone: customerPhone.trim(),
          city:          data?.restaurant?.city || '',
          bookingTime:   bookingTime ? new Date(bookingTime).toISOString() : new Date().toISOString(),
          numberOfPeople,
          items:         cartItems,
          totalAmount:   totalPrice,
          advanceAmount,
        }),
      });

      const responseData = await res.json();
      if (!res.ok) throw new Error(responseData.error);

      setBookingResult({
        bookingId:        responseData.bookingId,
        waitingTimeStatus: responseData.waitingTimeStatus,
        totalPrice,
      });
    } catch (err) {
      alert(err.message || 'Failed to confirm booking.');
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center font-bold text-xl">Loading...</div>;
  if (error)   return <div className="min-h-screen flex items-center justify-center font-bold text-red-500">{error}</div>;
  if (!data)   return null;

  const { restaurant, tables, menuItems } = data;

  let totalItems = 0;
  let totalPrice = 0;
  Object.keys(cart).forEach(itemId => {
    const qty  = cart[itemId];
    const item = menuItems.find(m => m._id === itemId);
    if (item) { totalItems += qty; totalPrice += qty * item.price; }
  });

  return (
    <div className="min-h-screen bg-transparent flex flex-col pt-[104px]">
      <main className="flex-1 max-w-7xl mx-auto w-full p-6 pb-32">

        {/* Restaurant Header */}
        <div className="glass-card p-8 rounded-3xl mb-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary opacity-5 rounded-full blur-3xl" />
          <h1 className="text-4xl md:text-5xl font-black mb-2 relative z-10">{restaurant.name}</h1>
          <p className="text-gray-500 flex items-center gap-2 mb-6 relative z-10">
            <MapPin size={18} /> {restaurant.cuisineType} Cuisine • ⭐ {restaurant.rating}
          </p>
          <div className="flex flex-wrap gap-4 relative z-10">
            <div className="bg-orange-50 text-primary px-4 py-2 rounded-xl font-bold flex items-center gap-2">
              <Clock size={18} /> {restaurant.currentWaitTime} min wait
            </div>
            <div className={`px-4 py-2 rounded-xl font-bold flex items-center gap-2 ${restaurant.isOpen ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
              <Store size={18} /> {restaurant.isOpen ? 'OPEN NOW' : 'CLOSED'}
            </div>
          </div>
        </div>

        {/* ── SUCCESS SCREEN ── */}
        {bookingResult ? (
          <div className="glass-card p-10 rounded-3xl text-center space-y-6 bg-gradient-to-br from-green-50 to-emerald-50 border border-green-100 animate-in fade-in zoom-in duration-500">
            <CheckCircle className="mx-auto text-green-500" size={72} />
            <div>
              <h2 className="text-4xl font-black text-green-700">Booking Confirmed! 🎉</h2>
              <p className="text-green-600 text-lg mt-2">
                Your table at <strong>{restaurant.name}</strong> is all set.
              </p>
              {(customerEmail || customerPhone) && (
                <p className="text-green-500 text-sm mt-1">
                  A confirmation {customerEmail && customerPhone ? 'email & SMS have' : customerEmail ? 'email has' : 'SMS has'} been sent to you.
                </p>
              )}
            </div>

            {/* Booking Card */}
            <div className="max-w-sm mx-auto bg-white rounded-2xl border border-green-200 shadow-md overflow-hidden text-left">
              {/* Booking ID */}
              <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-5 py-4">
                <p className="text-orange-100 text-xs font-bold uppercase tracking-widest flex items-center gap-1">
                  <Hash size={12} /> Booking ID
                </p>
                <p className="text-white font-mono font-black text-lg tracking-widest mt-1 truncate">
                  {bookingResult.bookingId}
                </p>
              </div>

              {/* Details */}
              <div className="divide-y divide-gray-100">
                <div className="px-5 py-3 flex items-center gap-3">
                  <User size={16} className="text-gray-400 shrink-0" />
                  <div>
                    <p className="text-xs text-gray-400 uppercase font-bold tracking-wide">Customer</p>
                    <p className="text-sm font-semibold text-gray-800">{customerName}</p>
                  </div>
                </div>
                <div className="px-5 py-3 flex items-center gap-3">
                  <Store size={16} className="text-gray-400 shrink-0" />
                  <div>
                    <p className="text-xs text-gray-400 uppercase font-bold tracking-wide">Restaurant</p>
                    <p className="text-sm font-semibold text-gray-800">{restaurant.name}</p>
                  </div>
                </div>
                {bookingTime && (
                  <div className="px-5 py-3 flex items-center gap-3">
                    <Calendar size={16} className="text-gray-400 shrink-0" />
                    <div>
                      <p className="text-xs text-gray-400 uppercase font-bold tracking-wide">Date & Time</p>
                      <p className="text-sm font-semibold text-gray-800">
                        {new Date(bookingTime).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                      </p>
                    </div>
                  </div>
                )}
                <div className="px-5 py-3 flex items-center gap-3">
                  <TimerIcon size={16} className="text-gray-400 shrink-0" />
                  <div>
                    <p className="text-xs text-gray-400 uppercase font-bold tracking-wide">Estimated Wait</p>
                    <p className={`text-sm font-bold ${bookingResult.waitingTimeStatus.includes('Ready') ? 'text-green-600' : 'text-amber-600'}`}>
                      ⏱ {bookingResult.waitingTimeStatus}
                    </p>
                  </div>
                </div>
                <div className="px-5 py-3 flex items-center gap-3">
                  <ShoppingCart size={16} className="text-gray-400 shrink-0" />
                  <div>
                    <p className="text-xs text-gray-400 uppercase font-bold tracking-wide">Total Paid</p>
                    <p className="text-sm font-semibold text-gray-800">₹{bookingResult.totalPrice.toFixed(2)}</p>
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={() => { setBookingResult(null); setCart({}); setSelectedSeats([]); }}
              className="mt-4 px-8 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-all hover:scale-105 shadow-md"
            >
              Make Another Booking
            </button>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">

            {/* Left Column: Tables + Menu */}
            <div className="lg:col-span-2 space-y-8">

              {/* Step 1: Table Selection */}
              <div className="glass-card p-6 rounded-3xl">
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold">1</div>
                  <h2 className="text-2xl font-bold">Select Your Table</h2>
                </div>

                {/* ── BMS Style Number of People Selector ── */}
                <div className="mb-8 bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
                  <p className="text-sm font-bold text-gray-800 mb-3 text-center">How many people?</p>
                  <div className="flex flex-wrap justify-center gap-2">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(num => (
                      <button
                        key={num}
                        onClick={() => {
                          setNumberOfPeople(num);
                          if (selectedSeats.length > num) {
                            setSelectedSeats(prev => prev.slice(0, num));
                          }
                        }}
                        className={`w-10 h-10 rounded-full font-bold text-sm transition-all duration-200 border-2 flex items-center justify-center
                          ${numberOfPeople === num 
                            ? 'bg-primary border-primary text-white scale-110 shadow-md shadow-orange-200' 
                            : 'bg-white border-gray-200 text-gray-600 hover:border-primary/40 hover:text-primary'}`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                  {isCapacityExceeded && selectedSeats.length > 0 && (
                    <p className="text-center text-xs font-bold text-red-500 mt-3 bg-red-50 p-2 rounded-lg border border-red-100">
                      You selected {numberOfPeople} people, but only picked {totalSelectedSeats} seats. Please select more seats!
                    </p>
                  )}
                </div>

                {tables.length === 0 ? (
                  <p className="text-gray-500 italic bg-gray-50 p-4 rounded-xl text-center">No tables available.</p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {tables.map(table => {
                      const isTableSelected = selectedSeats.some(id => id.startsWith(table._id));
                      return (
                        <div
                          key={table._id}
                          className={`p-4 rounded-3xl border-2 transition-all flex flex-col items-center justify-center gap-2
                            ${isTableSelected
                              ? 'border-emerald-500 bg-emerald-50/20 shadow-md shadow-emerald-100'
                              : 'border-gray-100 bg-white hover:border-emerald-300 hover:shadow-sm'}`}
                        >
                          {/* Table Top */}
                          <div className={`w-full py-2 rounded-xl border-[3px] flex items-center justify-center transition-all
                            ${isTableSelected ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-gray-200 bg-gray-50 text-gray-400'}`}>
                            <span className="font-black text-xs uppercase tracking-widest flex items-center gap-1">
                              <Utensils size={14} /> {table.tableName}
                            </span>
                          </div>
                          
                          {/* Chairs Row (BMS Style) */}
                          <div className="flex items-center justify-center gap-2 mt-1 flex-wrap">
                            {Array.from({ length: table.seats }).map((_, i) => {
                              const seatId = `${table._id}-${i}`;
                              const isSelected = selectedSeats.includes(seatId);
                              
                              return (
                                <button 
                                  key={i} 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleSeatSelection(table._id, i);
                                  }}
                                  className={`w-8 h-8 rounded border-[2px] flex items-center justify-center text-xs font-bold transition-all cursor-pointer ${
                                    isSelected 
                                      ? 'border-emerald-500 bg-emerald-500 text-white shadow-sm scale-110' 
                                      : 'border-emerald-500 bg-white text-gray-500 hover:bg-emerald-50 hover:scale-105'
                                  }`} 
                                  title={`Seat ${i+1}`}
                                >
                                   {String(i + 1).padStart(2, '0')}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Step 2: Food Selection */}
              <div className={`glass-card p-6 rounded-3xl transition-opacity duration-500 ${selectedSeats.length === 0 ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
                <div className="flex items-center gap-2 mb-6">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${selectedSeats.length > 0 ? 'bg-primary text-white' : 'bg-gray-300 text-white'}`}>2</div>
                  <h2 className="text-2xl font-bold">Pre-Order Food</h2>
                </div>
                {(!menuItems || menuItems.length === 0) ? (
                  <p className="text-gray-500 italic bg-gray-50 p-4 rounded-xl">This restaurant has not added a menu yet.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {menuItems.map(item => {
                      const qty = cart[item._id] || 0;
                      return (
                        <div key={item._id} className="relative flex flex-col items-center">
                          <MenuItemCard
                            imageUrl={item.imageUrl || getDefaultFoodImage(item.category)}
                            isVegetarian={item.isVegetarian !== undefined ? item.isVegetarian : true}
                            name={item.name}
                            price={item.price}
                            originalPrice={item.originalPrice || item.price}
                            quantity={item.quantity || '1 Portion'}
                            prepTimeInMinutes={item.prepTime || 10}
                            onAdd={() => handleAddToCart(item._id)}
                            className={qty > 0 ? 'border-primary ring-2 ring-primary/20 shadow-md' : 'shadow-sm'}
                          />
                          {qty > 0 && (
                            <div className="absolute top-3 left-3 bg-primary text-white font-bold text-xs px-2.5 py-1 rounded-full shadow-md z-20 flex items-center gap-1 animate-in fade-in zoom-in duration-300">
                              {qty} in Cart
                            </div>
                          )}
                          {qty > 0 && (
                            <div className="absolute bottom-3 right-3 z-20 flex items-center gap-2 bg-background/90 backdrop-blur-sm rounded-full p-1 border border-border shadow-md animate-in fade-in zoom-in duration-300">
                              <button onClick={() => handleRemoveFromCart(item._id)} className="w-7 h-7 flex items-center justify-center bg-white hover:bg-gray-100 rounded-full text-foreground transition-colors font-bold text-xs shadow-sm border border-gray-100" aria-label="Decrease quantity"><Minus size={10} /></button>
                              <span className="font-bold text-sm w-4 text-center text-foreground">{qty}</span>
                              <button onClick={() => handleAddToCart(item._id)} className="w-7 h-7 flex items-center justify-center bg-primary hover:bg-primary/90 rounded-full text-white transition-colors font-bold text-xs shadow-sm" aria-label="Increase quantity"><Plus size={10} /></button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Order Summary */}
            <div className="lg:col-span-1">
              <div className="glass-card p-6 rounded-3xl sticky top-24 border-2 border-transparent hover:border-primary transition-colors duration-500">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2 border-b pb-4">
                  <ShoppingCart className="text-primary" /> Your Order
                </h3>

                {!selectedSeats.length ? (
                  <p className="text-gray-400 text-sm italic text-center py-8">Select at least one seat to begin your order.</p>
                ) : (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center bg-green-50 p-3 rounded-xl border border-green-100">
                      <span className="text-sm font-medium text-green-800">Selected Tables:</span>
                      <span className="font-bold text-green-700 max-w-[60%] text-right">
                        {[...new Set(selectedSeats.map(id => id.split('-')[0]))].map(id => tables.find(t => t._id === id)?.tableName).join(', ')}
                      </span>
                    </div>

                    {totalItems === 0 ? (
                      <p className="text-gray-400 text-sm italic text-center py-4">Your cart is empty. Add some food!</p>
                    ) : (
                      <div className="space-y-3 pt-2">
                        {Object.keys(cart).map(itemId => {
                          const item = menuItems.find(m => m._id === itemId);
                          const qty  = cart[itemId];
                          if (!item || qty === 0) return null;
                          return (
                            <div key={itemId} className="flex justify-between text-sm">
                              <span><span className="font-bold text-gray-500 mr-2">{qty}x</span>{item.name}</span>
                              <span className="font-medium">₹{(qty * item.price).toFixed(2)}</span>
                            </div>
                          );
                        })}
                        <div className="border-t border-dashed pt-3 mt-3">
                          <div className="flex justify-between items-center text-lg font-black">
                            <span>Total</span>
                            <span className="text-primary">₹{totalPrice.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between items-center text-sm font-bold text-orange-600 mt-1 bg-orange-50 p-2 rounded-lg border border-orange-100">
                            <span>Advance to Pay (20%)</span>
                            <span>₹{(totalPrice * 0.20).toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* ── Contact Information ── */}
                    <div className="space-y-3 mt-6 pt-4 border-t border-gray-100">
                      <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-1">
                        <User size={12} /> Contact Information
                      </p>

                      <InputField
                        id="customerName"
                        label="Your Name"
                        icon={User}
                        value={customerName}
                        onChange={e => setCustomerName(e.target.value)}
                        placeholder="Enter your name"
                        error={fieldErrors.customerName}
                      />

                      <InputField
                        id="customerEmail"
                        label="Email Address"
                        icon={Mail}
                        type="email"
                        value={customerEmail}
                        onChange={e => setCustomerEmail(e.target.value)}
                        placeholder="Enter your email"
                        error={fieldErrors.customerEmail}
                      />

                      <InputField
                        id="customerPhone"
                        label="WhatsApp Number (10 digits)"
                        icon={Phone}
                        type="tel"
                        value={customerPhone}
                        onChange={e => setCustomerPhone(e.target.value)}
                        placeholder="9876543210"
                        maxLength={15}
                        error={fieldErrors.customerPhone}
                      />

                      <div>
                        <label htmlFor="bookingTime" className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                          Date & Time (optional)
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                            <Calendar size={15} />
                          </span>
                          <input
                            id="bookingTime"
                            type="datetime-local"
                            value={bookingTime}
                            onChange={e => setBookingTime(e.target.value)}
                            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-white"
                          />
                        </div>
                        <p className="text-xs text-gray-400 mt-1">Peak hours (7–9 PM) may have a wait time.</p>
                      </div>


                    </div>



                    <button
                      id="confirmBookingBtn"
                      onClick={handleBookTable}
                      disabled={selectedSeats.length === 0 || bookingLoading || isCapacityExceeded}
                      className="w-full bg-primary text-white py-4 rounded-xl font-bold hover:bg-primary/90 transition-all disabled:opacity-50 disabled:scale-100 hover:scale-105 shadow-md mt-6"
                    >
                      {bookingLoading ? (
                        <span className="flex items-center justify-center gap-2">
                          <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                          </svg>
                          Confirming...
                        </span>
                      ) : 'Confirm Booking & Pay'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Customer Reviews */}
        <div className="mt-12 glass-card p-8 rounded-3xl animate-in fade-in zoom-in duration-500" style={{ animationDelay: '0.2s' }}>
          <h2 className="text-2xl font-black mb-6 flex items-center gap-2">
            ⭐ Customer Reviews
            <span className="text-gray-400 font-medium text-lg">({restaurant.totalReviews || 0})</span>
          </h2>
          {(!restaurant.reviews || restaurant.reviews.length === 0) ? (
            <p className="text-gray-500 italic bg-gray-50 p-6 rounded-2xl text-center">No reviews yet. Be the first to dine and review!</p>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {restaurant.reviews.map((review, idx) => (
                <div key={idx} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-bold text-gray-800">{review.userName}</span>
                    <span className="text-yellow-400 font-black tracking-widest text-lg">
                      {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm italic">"{review.comment || 'No comment provided.'}"</p>
                  <div className="mt-4 text-xs font-bold text-gray-400 uppercase">
                    {new Date(review.createdAt).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </main>
    </div>
  );
}
