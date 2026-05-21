import { useState, useRef, useEffect } from 'react';
import { MapPin, Search, ZoomIn, ZoomOut, Crosshair, ChefHat, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function InteractiveMap() {
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  
  const [userLocation, setUserLocation] = useState({ x: 400, y: 400 });
  const [searchRadius, setSearchRadius] = useState(250); // radius in svg units
  const [selectedRest, setSelectedRest] = useState(null);
  const [restaurants, setRestaurants] = useState([]); // <--- REAL DATA STATE

  const svgRef = useRef(null);

  useEffect(() => {
    // Fetch real restaurants from the database when the map loads
    fetch('http://localhost:5000/api/restaurants', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if(Array.isArray(data)) setRestaurants(data);
      })
      .catch(console.error);
  }, []);

  const handleMouseDown = (e) => {
    setIsDragging(true);
    setStartPos({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setPan({ x: e.clientX - startPos.x, y: e.clientY - startPos.y });
  };

  const handleMouseUp = () => setIsDragging(false);

  const zoomIn = () => setScale(prev => Math.min(prev + 0.2, 3));
  const zoomOut = () => setScale(prev => Math.max(prev - 0.2, 0.5));
  const resetView = () => {
    setScale(1);
    setPan({ x: 0, y: 0 });
  };

  // Click on SVG to move user pin
  const handleMapClick = (e) => {
    if (isDragging) return; // Prevent clicking while dragging
    if (e.target.tagName !== 'rect' && e.target.tagName !== 'svg' && e.target.tagName !== 'path') return;
    
    const svgRect = svgRef.current.getBoundingClientRect();
    const clickX = (e.clientX - svgRect.left - pan.x) / scale;
    const clickY = (e.clientY - svgRect.top - pan.y) / scale;
    
    setUserLocation({ x: clickX, y: clickY });
    setSelectedRest(null);
  };

  const getWaitTimeColor = (time) => {
    if (time === 0) return '#10B981'; // Green
    if (time <= 20) return '#F59E0B'; // Yellow
    return '#EF4444'; // Red
  };

  const isWithinRadius = (rx, ry) => {
    const dist = Math.sqrt(Math.pow(rx - userLocation.x, 2) + Math.pow(ry - userLocation.y, 2));
    return dist <= searchRadius;
  };

  return (
    <div className="relative w-full h-[calc(100vh-80px)] overflow-hidden bg-blue-50">
      
      {/* Controls Overlay */}
      <div className="absolute top-6 left-6 z-10 glass-card p-4 rounded-2xl w-80 space-y-4">
        <h2 className="font-bold text-lg flex items-center gap-2"><MapPin className="text-primary"/> Explore City</h2>
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-600">Search Radius</label>
          <input 
            type="range" 
            min="100" max="600" 
            value={searchRadius} 
            onChange={(e) => setSearchRadius(Number(e.target.value))}
            className="w-full accent-primary"
          />
          <div className="flex justify-between text-xs text-gray-500">
            <span>2km</span>
            <span>10km</span>
          </div>
        </div>
        <p className="text-xs text-gray-500 italic mt-2">Click anywhere on the map to set your location.</p>
      </div>

      <div className="absolute bottom-6 right-6 z-10 flex flex-col gap-2">
        <button onClick={zoomIn} className="w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50"><ZoomIn/></button>
        <button onClick={zoomOut} className="w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50"><ZoomOut/></button>
        <button onClick={resetView} className="w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50"><Crosshair/></button>
      </div>

      {/* The Map SVG */}
      <div 
        className="w-full h-full cursor-grab active:cursor-grabbing select-none"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <svg 
          ref={svgRef}
          width="100%" 
          height="100%" 
          onClick={handleMapClick}
          style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`, transformOrigin: '0 0', transition: isDragging ? 'none' : 'transform 0.2s ease-out' }}
        >
          {/* Base Grid / Land */}
          <rect width="1000" height="800" fill="#fefae0" />
          
          {/* River */}
          <path d="M0,200 Q250,250 500,100 T1000,300 L1000,350 Q500,150 250,300 T0,250 Z" fill="#90e0ef" />
          
          {/* Park */}
          <rect x="600" y="450" width="200" height="150" rx="20" fill="#d8f3dc" />
          
          {/* Roads */}
          <line x1="0" y1="400" x2="1000" y2="400" stroke="#e0e1dd" strokeWidth="20" />
          <line x1="300" y1="0" x2="300" y2="800" stroke="#e0e1dd" strokeWidth="20" />
          <line x1="700" y1="0" x2="700" y2="800" stroke="#e0e1dd" strokeWidth="20" />

          {/* User Location Radius */}
          <circle 
            cx={userLocation.x} 
            cy={userLocation.y} 
            r={searchRadius} 
            fill="rgba(249, 115, 22, 0.1)" 
            stroke="#F97316" 
            strokeWidth="2" 
            strokeDasharray="5,5" 
          />

          {/* User Pin */}
          <g transform={`translate(${userLocation.x}, ${userLocation.y})`}>
            <circle cx="0" cy="0" r="12" fill="#3B82F6" />
            <circle cx="0" cy="0" r="4" fill="white" />
          </g>

          {/* Restaurant Pins */}
          {restaurants.map(rest => {
            const inRange = isWithinRadius(rest.mapX, rest.mapY);
            const color = getWaitTimeColor(rest.currentWaitTime);
            return (
              <g 
                key={rest._id} 
                transform={`translate(${rest.mapX}, ${rest.mapY})`} 
                className="cursor-pointer transition-transform hover:scale-110"
                onClick={(e) => { e.stopPropagation(); setSelectedRest(rest); }}
              >
                {/* Glow if within radius */}
                {inRange && <circle cx="0" cy="0" r="20" fill={color} opacity="0.3" />}
                
                <path d="M0 -20 Q 15 -20 15 -5 Q 15 10 0 20 Q -15 10 -15 -5 Q -15 -20 0 -20 Z" fill={color} stroke="white" strokeWidth="2" />
                <circle cx="0" cy="-7" r="5" fill="white" />
                <path d="M-2,-10 L-2,-4 M2,-10 L2,-4" stroke={color} strokeWidth="1"/>
              </g>
            )
          })}
        </svg>
      </div>

      {/* Selected Restaurant Tooltip Card */}
      {selectedRest && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20 glass-card p-5 rounded-2xl w-80 shadow-2xl animate-in zoom-in duration-200">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-xl font-bold">{selectedRest.name}</h3>
            <button onClick={() => setSelectedRest(null)} className="text-gray-400 hover:text-gray-600">×</button>
          </div>
          <p className="text-sm text-gray-500 mb-4">{selectedRest.cuisineType} • ⭐ {selectedRest.rating}</p>
          
          <div className="flex items-center gap-2 mb-6">
            <Clock size={16} color={getWaitTimeColor(selectedRest.currentWaitTime)} />
            <span className="font-bold" style={{ color: getWaitTimeColor(selectedRest.currentWaitTime) }}>
              {selectedRest.currentWaitTime === 0 ? 'No Wait Time!' : `${selectedRest.currentWaitTime} min wait`}
            </span>
          </div>

          <Link 
            to={`/restaurant/${selectedRest._id}`}
            className="block w-full text-center bg-primary text-white py-2.5 rounded-xl font-bold hover:bg-primary-dark transition-colors"
          >
            View Menu & Book
          </Link>
        </div>
      )}
    </div>
  );
}
