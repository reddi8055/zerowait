import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Admin from './pages/Admin';
import RestaurantPortal from './pages/RestaurantPortal';
import MapPage from './pages/MapPage';
import RestaurantDetail from './pages/RestaurantDetail';
import MyOrders from './pages/MyOrders';
import FloatingBackground from './components/FloatingBackground';
// Pages that need the padded content wrapper (not Map which is full screen)
function PageLayout({ children }) {
  return (
    <div className="max-w-7xl mx-auto px-6 pb-8 pt-[104px]">
      {children}
    </div>
  );
}

function App() {
  return (
    <Router>
      <div className="min-h-screen flex flex-col" style={{ background: 'var(--color-background)' }}>
        <Navbar />
        <FloatingBackground />
        <div className="flex-1 relative z-10">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Home />} />
            <Route path="/map" element={<MapPage />} />
            <Route path="/admin" element={<PageLayout><Admin /></PageLayout>} />
            <Route path="/restaurant-portal" element={<PageLayout><RestaurantPortal /></PageLayout>} />
            <Route path="/restaurant/:id" element={<RestaurantDetail />} />
            <Route path="/my-orders" element={<PageLayout><MyOrders /></PageLayout>} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
