import { useState, useEffect } from 'react';
import { Clock, CheckCircle, ChefHat, Utensils, XCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

const API = 'http://localhost:5000';

export default function MyOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Review Modal State
  const [reviewModal, setReviewModal] = useState({ isOpen: false, bookingId: null, restaurantId: null });
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewError, setReviewError] = useState('');

  const fetchOrders = async () => {
    try {
      const res = await fetch(`${API}/api/bookings/mine`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      }
    } catch (err) {
      console.error("Failed to fetch orders", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const submitReview = async (e) => {
    e.preventDefault();
    setReviewLoading(true);
    setReviewError('');
    try {
      const res = await fetch(`${API}/api/restaurants/${reviewModal.restaurantId}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ rating, comment, bookingId: reviewModal.bookingId })
      });
      const data = await res.json();
      if (res.ok) {
        setReviewModal({ isOpen: false, bookingId: null, restaurantId: null });
        setRating(5);
        setComment('');
        fetchOrders(); // refresh to show review submitted
      } else {
        setReviewError(data.error || 'Failed to submit review');
      }
    } catch (err) {
      setReviewError('Failed to connect to server');
    } finally {
      setReviewLoading(false);
    }
  };

  if (loading) {
    return <div className="min-h-[50vh] flex items-center justify-center font-bold text-xl text-gray-500">Loading your orders...</div>;
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'confirmed':
        return <span className="flex items-center gap-1 bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-sm font-bold border border-blue-100"><CheckCircle size={16} /> Confirmed</span>;
      case 'preparing':
        return <span className="flex items-center gap-1 bg-yellow-50 text-yellow-600 px-3 py-1 rounded-full text-sm font-bold border border-yellow-100"><ChefHat size={16} /> Preparing Food</span>;
      case 'ready':
        return <span className="flex items-center gap-1 bg-orange-50 text-orange-600 px-3 py-1 rounded-full text-sm font-bold border border-orange-100"><Utensils size={16} /> Ready to Serve</span>;
      case 'served':
        return <span className="flex items-center gap-1 bg-green-50 text-green-600 px-3 py-1 rounded-full text-sm font-bold border border-green-100"><CheckCircle size={16} /> Served</span>;
      case 'cancelled':
        return <span className="flex items-center gap-1 bg-red-50 text-red-600 px-3 py-1 rounded-full text-sm font-bold border border-red-100"><XCircle size={16} /> Cancelled</span>;
      default:
        return <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-sm font-bold">{status}</span>;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in zoom-in duration-500 pb-16">
      <div className="glass-card p-8 rounded-3xl relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary opacity-5 rounded-full blur-3xl"></div>
        <h1 className="text-3xl font-black mb-2 relative z-10 flex items-center gap-3">
          <Utensils className="text-primary" size={32} /> My Orders
        </h1>
        <p className="text-gray-500 relative z-10">Track the live status of your food and table bookings.</p>
      </div>

      {orders.length === 0 ? (
        <div className="glass-card p-12 rounded-3xl text-center space-y-4">
          <Utensils size={64} className="mx-auto text-gray-300 mb-4" />
          <h2 className="text-2xl font-bold text-gray-700">No orders yet</h2>
          <p className="text-gray-500">Looks like you haven't booked any tables or ordered food recently.</p>
          <Link to="/map" className="inline-block mt-4 bg-primary text-white px-6 py-3 rounded-xl font-bold hover:bg-primary-dark transition-all hover:-translate-y-1 shadow-md">
            Find a Restaurant
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map(order => (
            <div key={order._id} className="glass-card p-6 rounded-3xl border border-gray-100 hover:border-orange-200 transition-colors shadow-sm">
              <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-4 border-b border-gray-100 pb-4">
                <div>
                  <h2 className="text-xl font-black text-gray-800">{order.restaurantId?.name || 'Unknown Restaurant'}</h2>
                  <p className="text-sm text-gray-500 font-medium">
                    Tables: {order.tableIds?.map(t => t.tableName).join(', ') || 'N/A'} • {order.numberOfPeople} People
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {getStatusBadge(order.status)}
                  {order.status === 'served' && !order.isReviewed && (
                    <button 
                      onClick={() => setReviewModal({ isOpen: true, bookingId: order._id, restaurantId: order.restaurantId._id })}
                      className="text-xs font-bold px-3 py-1.5 bg-gradient-to-r from-orange-400 to-primary text-white rounded-full hover:scale-105 transition-all shadow-md shadow-orange-200 animate-pulse"
                    >
                      ★ Leave Review
                    </button>
                  )}
                  {order.isReviewed && (
                    <span className="text-xs font-bold px-3 py-1.5 bg-gray-100 text-gray-500 rounded-full border border-gray-200">
                      Reviewed ✓
                    </span>
                  )}
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Order Details</h3>
                  <ul className="space-y-2">
                    {order.items.map((item, idx) => (
                      <li key={idx} className="flex items-center text-sm">
                        <span className="font-bold text-gray-500 w-6">{item.quantity}x</span>
                        <span className="font-medium">{item.name}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-2xl flex flex-col justify-center border border-gray-100">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-500 font-medium text-sm">Total Bill</span>
                    <span className="font-black text-lg">₹{order.totalAmount?.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-orange-600 font-bold text-sm">Advance Paid</span>
                    <span className="font-bold text-orange-600 bg-orange-100 px-2 py-1 rounded-lg text-sm">₹{order.advanceAmount?.toFixed(2)}</span>
                  </div>
                  <div className="mt-4 text-xs text-gray-400 flex items-center gap-1">
                    <Clock size={12} /> Booked on {new Date(order.createdAt).toLocaleDateString()} at {new Date(order.createdAt).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Review Modal */}
      {reviewModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="glass-card w-full max-w-md p-8 rounded-3xl relative animate-in fade-in zoom-in duration-300">
            <button 
              onClick={() => setReviewModal({ isOpen: false, bookingId: null, restaurantId: null })}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-800 transition-colors"
            >
              <XCircle size={24} />
            </button>
            <h2 className="text-2xl font-black text-gray-800 mb-2">How was your meal?</h2>
            <p className="text-gray-500 text-sm mb-6">Leave a review for other customers to see.</p>
            
            {reviewError && (
              <div className="bg-red-50 text-red-600 text-sm font-bold p-3 rounded-xl mb-4 border border-red-100">{reviewError}</div>
            )}

            <form onSubmit={submitReview} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Rating</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map(num => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setRating(num)}
                      className={`text-3xl transition-transform hover:scale-110 ${rating >= num ? 'text-yellow-400' : 'text-gray-200'}`}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Comment (Optional)</label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary min-h-[100px]"
                  placeholder="The food was amazing!"
                ></textarea>
              </div>
              <button 
                type="submit"
                disabled={reviewLoading}
                className="w-full bg-primary text-white font-bold py-3 rounded-xl hover:bg-primary-dark transition-all shadow-md mt-4 disabled:opacity-50"
              >
                {reviewLoading ? 'Submitting...' : 'Submit Review'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
