import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import ActiveOrders from './pages/ActiveOrders'; // Added import
import PastOrders from './pages/PastOrders'; // Added import
import OrderTracking from './pages/OrderTracking';
import AdminDashboard from './pages/AdminDashboard';
import { CartProvider } from './context/CartContext';

function App() {
  return (
    <CartProvider>
      <BrowserRouter>
        <div className="app-container">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/active-orders" element={<ActiveOrders />} /> {/* Added route */}
            <Route path="/past-orders" element={<PastOrders />} /> {/* Added route */}
            <Route path="/tracking" element={<OrderTracking />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/" element={<Navigate to="/login" replace />} />
          </Routes>
        </div>
      </BrowserRouter>
    </CartProvider>
  );
}

export default App;
