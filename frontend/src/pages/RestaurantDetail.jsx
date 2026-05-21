import { useState, useEffect } from 'react';
import { Clock, MapPin, CheckCircle, Store, Utensils, Plus, Minus, ShoppingCart } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { MenuItemCard } from '@/components/ui/menu-item-card';

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

export default function RestaurantDetails() {
  const params = useParams();
  const restaurantId = params.id;
  
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // State for user booking choices
  const [selectedTables, setSelectedTables] = useState([]);
  const [cart, setCart] = useState({});
  const [isBooked, setIsBooked] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [numberOfPeople, setNumberOfPeople] = useState(1);
  const [bookingLoading, setBookingLoading] = useState(false);

  useEffect(() => {
    // Fetch restaurant details, tables, and menu when the page loads
    const fetchData = async () => {
      try {
        const res = await fetch(`${API}/api/restaurants/${restaurantId}`, { credentials: 'include' });
        const result = await res.json();
        
        if (!res.ok) throw new Error(result.error);
        
        setData(result);
      } catch (err) {
        setError('Failed to load restaurant details. Are you sure it exists?');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [restaurantId]);

  const handleAddToCart = (itemId) => {
    setCart(prev => ({
      ...prev,
      [itemId]: (prev[itemId] || 0) + 1
    }));
  };

  const handleRemoveFromCart = (itemId) => {
    setCart(prev => {
      const current = prev[itemId] || 0;
      if (current <= 1) {
        const newCart = { ...prev };
        delete newCart[itemId];
        return newCart;
      }
      return { ...prev, [itemId]: current - 1 };
    });
  };

  const totalSelectedSeats = selectedTables.reduce((total, id) => {
    const table = data?.tables?.find(t => t._id === id);
    return total + (table ? table.seats : 0);
  }, 0);

  const isCapacityExceeded = numberOfPeople > totalSelectedSeats;

  const toggleTableSelection = (tableId) => {
    setSelectedTables(prev => 
      prev.includes(tableId) ? prev.filter(id => id !== tableId) : [...prev, tableId]
    );
  };

  const handleBookTable = async () => {
    if (selectedTables.length === 0 || !customerName || !numberOfPeople) {
      alert("Please fill all details (Tables, Name, Number of People)");
      return;
    }

    if (isCapacityExceeded) {
      // The button will be disabled, but just in case
      alert(`You selected tables with a total of ${totalSelectedSeats} seats, but you have ${numberOfPeople} people. Please select more tables.`);
      return;
    }

    setBookingLoading(true);

    const items = Object.keys(cart).map(itemId => {
      const item = data.menuItems.find(m => m._id === itemId);
      return {
        menuItemId: itemId,
        name: item.name,
        quantity: cart[itemId],
        priceAtBooking: item.price
      };
    });

    let totalPrice = 0;
    items.forEach(i => totalPrice += i.priceAtBooking * i.quantity);
    const advanceAmount = totalPrice * 0.20;

    try {
      const res = await fetch(`${API}/api/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          restaurantId,
          tableIds: selectedTables,
          customerName,
          numberOfPeople,
          items,
          totalAmount: totalPrice,
          advanceAmount
        })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error);
      }

      setIsBooked(true);
    } catch (err) {
      alert(err.message || "Failed to confirm booking.");
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center font-bold text-xl">Loading...</div>;
  if (error) return <div className="min-h-screen flex items-center justify-center font-bold text-red-500">{error}</div>;
  if (!data) return null;

  const { restaurant, tables, menuItems } = data;

  // Calculate cart totals
  let totalItems = 0;
  let totalPrice = 0;
  Object.keys(cart).forEach(itemId => {
    const qty = cart[itemId];
    const item = menuItems.find(m => m._id === itemId);
    if (item) {
      totalItems += qty;
      totalPrice += qty * item.price;
    }
  });

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <main className="flex-1 max-w-7xl mx-auto w-full p-6 pb-32">
        
        {/* Restaurant Header */}
        <div className="glass-card p-8 rounded-3xl mb-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary opacity-5 rounded-full blur-3xl"></div>
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

        {isBooked ? (
          <div className="glass-card p-12 rounded-3xl text-center space-y-4 bg-green-50 border border-green-100 animate-in fade-in zoom-in duration-500">
            <CheckCircle className="mx-auto text-green-500" size={64} />
            <h2 className="text-4xl font-black text-green-700">Booking Confirmed!</h2>
            <p className="text-green-600 text-lg">Your table and food have been successfully reserved.</p>
            <p className="text-green-800 font-medium mt-4">Total Paid: ₹{totalPrice.toFixed(2)}</p>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            
            {/* Left Column: Tables and Menu */}
            <div className="lg:col-span-2 space-y-8">
              
              {/* Step 1: Table Selection */}
              <div className="glass-card p-6 rounded-3xl">
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold">1</div>
                  <h2 className="text-2xl font-bold">Select Your Table</h2>
                </div>
                
                {tables.length === 0 ? (
                  <p className="text-gray-500 italic bg-gray-50 p-4 rounded-xl">No tables available.</p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {tables.map(table => (
                      <button
                        key={table._id}
                        onClick={() => toggleTableSelection(table._id)}
                        className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-2
                          ${selectedTables.includes(table._id) 
                            ? 'border-primary bg-orange-50 text-primary scale-105 shadow-md' 
                            : 'border-gray-100 hover:border-gray-300 hover:shadow-sm'
                          }`}
                      >
                        <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center mb-1 ${selectedTables.includes(table._id) ? 'border-primary bg-primary text-white' : 'border-gray-200 text-gray-400'}`}>
                          <Store size={18} />
                        </div>
                        <span className="font-bold text-sm">{table.tableName}</span>
                        <span className="text-xs text-gray-500">{table.seats} Seats</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Step 2: Food Selection */}
              <div className={`glass-card p-6 rounded-3xl transition-opacity duration-500 ${selectedTables.length === 0 ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
                <div className="flex items-center gap-2 mb-6">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${selectedTables.length > 0 ? 'bg-primary text-white' : 'bg-gray-300 text-white'}`}>2</div>
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
                            quantity={item.quantity || "1 Portion"}
                            prepTimeInMinutes={item.prepTime || 10}
                            onAdd={() => handleAddToCart(item._id)}
                            className={qty > 0 ? "border-primary ring-2 ring-primary/20 shadow-md" : "shadow-sm"}
                          />
                          {qty > 0 && (
                            <div className="absolute top-3 left-3 bg-primary text-white font-bold text-xs px-2.5 py-1 rounded-full shadow-md z-20 flex items-center gap-1 animate-in fade-in zoom-in duration-300">
                              {qty} in Cart
                            </div>
                          )}
                          {qty > 0 && (
                            <div className="absolute bottom-3 right-3 z-20 flex items-center gap-2 bg-background/90 backdrop-blur-sm rounded-full p-1 border border-border shadow-md animate-in fade-in zoom-in duration-300">
                              <button
                                onClick={() => handleRemoveFromCart(item._id)}
                                className="w-7 h-7 flex items-center justify-center bg-white hover:bg-gray-100 rounded-full text-foreground transition-colors font-bold text-xs shadow-sm border border-gray-100"
                                aria-label="Decrease quantity"
                              >
                                <Minus size={10} />
                              </button>
                              <span className="font-bold text-sm w-4 text-center text-foreground">{qty}</span>
                              <button
                                onClick={() => handleAddToCart(item._id)}
                                className="w-7 h-7 flex items-center justify-center bg-primary hover:bg-primary/90 rounded-full text-white transition-colors font-bold text-xs shadow-sm"
                                aria-label="Increase quantity"
                              >
                                <Plus size={10} />
                              </button>
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
                
                {!selectedTables.length ? (
                  <p className="text-gray-400 text-sm italic text-center py-8">Select at least one table to begin your order.</p>
                ) : (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center bg-green-50 p-3 rounded-xl border border-green-100">
                      <span className="text-sm font-medium text-green-800">Selected Tables:</span>
                      <span className="font-bold text-green-700 max-w-[60%] text-right">
                        {selectedTables.map(id => tables.find(t => t._id === id)?.tableName).join(', ')}
                      </span>
                    </div>

                    {totalItems === 0 ? (
                      <p className="text-gray-400 text-sm italic text-center py-4">Your cart is empty. Add some food!</p>
                    ) : (
                      <div className="space-y-3 pt-2">
                        {Object.keys(cart).map(itemId => {
                          const item = menuItems.find(m => m._id === itemId);
                          const qty = cart[itemId];
                          if (!item || qty === 0) return null;
                          return (
                            <div key={itemId} className="flex justify-between text-sm">
                              <span><span className="font-bold text-gray-500 mr-2">{qty}x</span> {item.name}</span>
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

                    <div className="space-y-3 mt-6 pt-4 border-t border-gray-100">
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Your Name</label>
                        <input
                          type="text"
                          required
                          value={customerName}
                          onChange={e => setCustomerName(e.target.value)}
                          className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                          placeholder="John Doe"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Number of People</label>
                        <input
                          type="number"
                          required
                          min="1"
                          value={numberOfPeople}
                          onChange={e => setNumberOfPeople(parseInt(e.target.value) || 1)}
                          className={`w-full px-4 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 ${isCapacityExceeded && selectedTables.length > 0 ? 'border-red-400 focus:ring-red-400 bg-red-50' : 'border-gray-200 focus:ring-primary'}`}
                          placeholder="1"
                        />
                      </div>
                    </div>

                    {isCapacityExceeded && selectedTables.length > 0 && (
                      <div className="bg-red-50 text-red-600 p-3 rounded-xl text-xs font-bold border border-red-100 mt-4 animate-shake">
                        Not enough seats! You have {numberOfPeople} people but only selected {totalSelectedSeats} seats. Please select more tables.
                      </div>
                    )}

                    <button 
                      onClick={handleBookTable}
                      disabled={selectedTables.length === 0 || bookingLoading || isCapacityExceeded}
                      className="w-full bg-primary text-white py-4 rounded-xl font-bold hover:bg-primary-dark transition-all disabled:opacity-50 disabled:scale-100 hover:scale-105 shadow-md mt-6"
                    >
                      {bookingLoading ? 'Confirming...' : 'Confirm Booking & Pay'}
                    </button>
                  </div>
                )}
              </div>
            </div>

          </div>
        )}

        {/* Customer Reviews Section */}
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
