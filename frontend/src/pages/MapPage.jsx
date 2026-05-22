import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  MapPin, 
  Search, 
  LayoutGrid, 
  Map as MapIcon, 
  Sparkles, 
  Star, 
  Clock, 
  ArrowRight, 
  Utensils,
  SlidersHorizontal,
  ChefHat
} from 'lucide-react';
import InteractiveMap from '@/components/Map';
import { cleanImageUrl } from '@/lib/utils';

const PLACEHOLDERS = [
  "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1552566626-52f8b828add9?w=600&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=600&auto=format&fit=crop&q=80"
];

const getRestaurantImage = (rest) => {
  if (rest.imageUrl && rest.imageUrl.trim() !== '') {
    return cleanImageUrl(rest.imageUrl);
  }
  // Deterministic fallback based on _id
  const charCodeSum = (rest._id || '').split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return PLACEHOLDERS[charCodeSum % PLACEHOLDERS.length];
};

const getStatusDetails = (rest) => {
  if (!rest.isOpen) {
    return {
      label: "Closed",
      classes: "bg-slate-100 text-slate-600 border border-slate-200/60"
    };
  }
  if (rest.currentWaitTime === 0 || rest.currentWaitTime <= 15) {
    return {
      label: "Available",
      classes: "bg-emerald-50 text-emerald-700 border border-emerald-100/80"
    };
  }
  if (rest.currentWaitTime <= 30) {
    return {
      label: "Moderate",
      classes: "bg-amber-50 text-amber-700 border border-amber-100/80"
    };
  }
  return {
    label: "Full",
    classes: "bg-rose-50 text-rose-700 border border-rose-100/80"
  };
};

const generateAiInsight = (rest) => {
  if (!rest.isOpen) {
    return "System offline. Kitchen is closed. Pre-order queue opens automatically in the next business window.";
  }
  
  const waitTime = rest.currentWaitTime || 0;
  if (waitTime === 0) {
    return "Perfect booking window! 0-wait detected. Pre-ordering ensures immediate seating & food allocation on arrival.";
  }
  if (waitTime <= 15) {
    return "Optimal throughput active. Seating wait is minimal. Book now to bypass standard kitchen check-in delays.";
  }
  if (waitTime <= 30) {
    return "Moderate congestion. Pre-ordering food now is highly recommended to lock in current prep-queue priorities.";
  }
  return "Peak congestion active. AI estimates pre-ordering saves 25+ mins. High probability of table availability delays.";
};

export default function MapPage() {
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'map'
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filtering & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCuisine, setSelectedCuisine] = useState('All');

  useEffect(() => {
    fetch('http://localhost:5000/api/restaurants', { credentials: 'include' })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load restaurants');
        return res.json();
      })
      .then((data) => {
        if (Array.isArray(data)) {
          setRestaurants(data);
        } else {
          setRestaurants([]);
        }
      })
      .catch((err) => {
        console.error(err);
        setError('Could not load restaurant database. Please make sure the server is online.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  // Extract unique cuisines for the filter list
  const cuisines = ['All', ...new Set(restaurants.map(r => r.cuisineType).filter(Boolean))];

  // Filter restaurants list
  const filteredRestaurants = restaurants.filter((rest) => {
    const matchesSearch = rest.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (rest.cuisineType && rest.cuisineType.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (rest.address && rest.address.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCuisine = selectedCuisine === 'All' || rest.cuisineType === selectedCuisine;
    
    return matchesSearch && matchesCuisine;
  });

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col font-sans tracking-tight text-slate-800">
      
      {/* ── SUB-HEADER CONTROL SHELL ── */}
      <div className="border-b border-slate-100 bg-white/80 backdrop-blur-md sticky top-[72px] z-40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <ChefHat className="text-primary w-6 h-6" /> Explore Restaurants
            </h1>
            <p className="text-sm text-slate-400 font-medium">Pre-book tables, order food, and bypass wait queues instantly.</p>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {/* View Toggle */}
            <div className="flex bg-slate-100 p-1 rounded-xl w-full sm:w-auto border border-slate-200/40">
              <button
                onClick={() => setViewMode('grid')}
                className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all duration-200 flex-1 sm:flex-none ${
                  viewMode === 'grid' 
                    ? 'bg-white text-slate-800 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <LayoutGrid size={16} /> Grid View
              </button>
              <button
                onClick={() => setViewMode('map')}
                className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all duration-200 flex-1 sm:flex-none ${
                  viewMode === 'map' 
                    ? 'bg-white text-slate-800 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <MapIcon size={16} /> Map View
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── CORE LAYOUT CONTAINER ── */}
      <div className="flex-1 max-w-7xl mx-auto w-full px-6 py-8">
        
        {viewMode === 'grid' ? (
          <div className="space-y-8 animate-in fade-in duration-300">
            
            {/* Search & Filters Panel */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-4 items-center justify-between">
              
              {/* Search Box */}
              <div className="relative w-full md:w-96">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search name, cuisine, location..."
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200/80 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:bg-white transition-all text-slate-800 placeholder-slate-400 font-medium"
                />
              </div>

              {/* Cuisine Quick Tags */}
              <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto py-1 scrollbar-none">
                <div className="text-slate-400 p-2"><SlidersHorizontal size={16} /></div>
                {cuisines.map((cuisine) => (
                  <button
                    key={cuisine}
                    onClick={() => setSelectedCuisine(cuisine)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                      selectedCuisine === cuisine
                        ? 'bg-primary text-white shadow-sm shadow-orange-100'
                        : 'bg-slate-50 text-slate-500 hover:bg-slate-100/80 hover:text-slate-800'
                    }`}
                  >
                    {cuisine}
                  </button>
                ))}
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-4 bg-rose-50 border border-rose-100 text-rose-700 rounded-2xl flex items-center justify-center font-bold text-sm">
                {error}
              </div>
            )}

            {/* Loading skeletons */}
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((num) => (
                  <div key={num} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 space-y-4 animate-pulse">
                    <div className="w-full h-48 bg-slate-100 rounded-xl"></div>
                    <div className="h-6 bg-slate-100 rounded-md w-2/3"></div>
                    <div className="h-4 bg-slate-100 rounded-md w-1/3"></div>
                    <div className="h-16 bg-slate-50 rounded-xl w-full"></div>
                    <div className="h-12 bg-slate-100 rounded-xl w-full"></div>
                  </div>
                ))}
              </div>
            ) : filteredRestaurants.length === 0 ? (
              <div className="bg-white border border-slate-100 rounded-3xl p-16 text-center shadow-sm space-y-4">
                <Utensils className="mx-auto text-slate-300 w-16 h-16 animate-bounce-slow" />
                <h3 className="text-xl font-bold text-slate-800">No restaurants match your search</h3>
                <p className="text-sm text-slate-400 max-w-sm mx-auto font-medium">Try checking your spelling, selecting a different cuisine filter, or clearing the search box.</p>
                <button 
                  onClick={() => { setSearchQuery(''); setSelectedCuisine('All'); }}
                  className="bg-primary hover:bg-primary-dark text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-md shadow-orange-100"
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              /* ── 3-COLUMN RESPONSIVE CARD GRID ── */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredRestaurants.map((rest) => {
                  const status = getStatusDetails(rest);
                  const imageSrc = getRestaurantImage(rest);
                  const aiInsight = generateAiInsight(rest);

                  return (
                    <div
                      key={rest._id}
                      className="group bg-white rounded-3xl border border-slate-100/90 shadow-sm overflow-hidden flex flex-col hover:-translate-y-1 hover:shadow-md transition-all duration-300 relative"
                    >
                      {/* Image Area with Rating Nested */}
                      <div className="relative h-48 overflow-hidden bg-slate-100">
                        <img
                          src={imageSrc}
                          alt={rest.name}
                          className="w-full h-full object-cover transition-transform duration-500 ease-in-out group-hover:scale-105"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                        
                        {/* Amber Star Rating Badge nested in corner */}
                        <div className="absolute top-4 right-4 bg-amber-500/95 backdrop-blur-md text-white font-extrabold text-xs px-3 py-1.5 rounded-xl shadow-lg shadow-amber-500/20 flex items-center gap-1">
                          <Star className="w-3.5 h-3.5 fill-white text-transparent" />
                          <span>{rest.rating ? rest.rating.toFixed(1) : "5.0"}</span>
                        </div>

                        {/* Cuisine Tag on Image */}
                        <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm text-slate-800 font-extrabold text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-lg shadow-sm border border-white/50">
                          {rest.cuisineType || "Cuisine"}
                        </div>
                      </div>

                      {/* Info Area */}
                      <div className="p-5 flex-grow flex flex-col">
                        
                        {/* Title, Address & Wait Indicator Row */}
                        <div className="flex justify-between items-start gap-2 mb-2">
                          <h2 className="text-lg font-bold text-slate-800 tracking-tight leading-tight group-hover:text-primary transition-colors">
                            {rest.name}
                          </h2>
                          
                          {/* Elegant Status indicator pill */}
                          <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full whitespace-nowrap shadow-sm ${status.classes}`}>
                            {status.label}
                          </span>
                        </div>

                        {/* Address */}
                        <p className="text-xs text-slate-400 font-semibold flex items-center gap-1 mb-4">
                          <MapPin size={12} className="text-slate-400 shrink-0" />
                          <span className="truncate">{rest.address || "Main Street, City Center"}</span>
                        </p>

                        {/* Wait Time Indicator */}
                        <div className="flex items-center gap-2 mb-5 text-slate-500 text-xs font-bold">
                          <Clock size={14} className="text-slate-400 shrink-0" />
                          <span>
                            {rest.currentWaitTime === 0 ? "No Wait Time" : `${rest.currentWaitTime} mins wait time`}
                          </span>
                        </div>

                        {/* ── SPECIAL AI INTEGRATION FEATURE ── */}
                        <div className="bg-gradient-to-r from-indigo-50/40 to-purple-50/40 border border-indigo-100/50 backdrop-blur-sm rounded-2xl p-4 mb-6 shadow-inner-sm">
                          <div className="flex items-center gap-1.5 mb-1.5">
                            <Sparkles className="text-indigo-500 w-3.5 h-3.5 animate-pulse shrink-0" />
                            <span className="text-indigo-600 font-extrabold text-[10px] uppercase tracking-widest">
                              AI Wait-Time Insight
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 leading-relaxed font-semibold">
                            {aiInsight}
                          </p>
                        </div>

                        {/* Booking CTA Button */}
                        <Link
                          to={`/restaurant/${rest._id}`}
                          className="mt-auto w-full bg-slate-900 hover:bg-primary text-white py-3 px-4 rounded-xl text-xs font-bold transition-all duration-300 flex items-center justify-center gap-2 group-hover:shadow-md group-hover:shadow-orange-200/50 group/btn"
                        >
                          Book Table & Order
                          <ArrowRight size={14} className="transition-transform group-hover/btn:translate-x-1 duration-200" />
                        </Link>

                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <div className="h-[75vh] rounded-3xl overflow-hidden border border-slate-100 shadow-md relative">
            <InteractiveMap />
          </div>
        )}

      </div>
    </div>
  );
}
