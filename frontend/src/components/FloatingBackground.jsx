import { useLocation } from 'react-router-dom';
import { ChefHat, Utensils, Clock, MapPin } from 'lucide-react';

export default function FloatingBackground() {
  const location = useLocation();
  
  // Don't render on the home page or login page as they have their own specific backgrounds
  if (location.pathname === '/' || location.pathname === '/login') {
    return null;
  }

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      <div className="absolute -top-20 -left-20 w-96 h-96 bg-orange-200/30 rounded-full blur-[100px]"></div>
      <div className="absolute top-1/2 -right-20 w-80 h-80 bg-primary/10 rounded-full blur-[80px]"></div>
      <div className="absolute -bottom-40 left-1/3 w-[500px] h-[500px] bg-yellow-200/20 rounded-full blur-[120px]"></div>

      <div className="absolute top-[20%] left-[5%] animate-bounce-slow text-orange-400/15 rotate-12">
        <ChefHat size={160} />
      </div>
      <div className="absolute top-[60%] right-[5%] animate-pulse-slow text-yellow-500/15 -rotate-12" style={{ animationDelay: '1s' }}>
        <Utensils size={140} />
      </div>
      <div className="absolute bottom-[10%] left-[8%] animate-bounce-slow text-green-500/10 rotate-45" style={{ animationDelay: '2s' }}>
        <Clock size={120} />
      </div>
      <div className="absolute top-[30%] right-[12%] animate-pulse-slow text-primary/15 -rotate-45" style={{ animationDelay: '1.5s' }}>
        <MapPin size={100} />
      </div>
    </div>
  );
}
