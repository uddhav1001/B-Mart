import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import Login from './pages/Login';
import Register from './pages/Register';
import { CartProvider } from './context/CartContext';
import './checkout.css';

// Lazy load other pages
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Profile = lazy(() => import('./pages/Profile'));
const ActiveOrders = lazy(() => import('./pages/ActiveOrders'));
const PastOrders = lazy(() => import('./pages/PastOrders'));
const OrderTracking = lazy(() => import('./pages/OrderTracking'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const Checkout = lazy(() => import('./pages/Checkout'));
const PaymentPage = lazy(() => import('./pages/PaymentPage'));
const Invoice = lazy(() => import('./pages/Invoice'));

// Loading fallback component
const PageLoader = () => (
  <div style={{ 
    height: '100vh', 
    width: '100vw', 
    display: 'flex', 
    justifyContent: 'center', 
    alignItems: 'center',
    background: '#f4f6f9',
    color: '#0c831f',
    fontSize: '1.2rem',
    fontWeight: 'bold'
  }}>
    <div className="loading-spinner"></div>
    <span style={{ marginLeft: '1rem' }}>B-Mart is loading...</span>
  </div>
);

function App() {
  return (
    <CartProvider>
      <BrowserRouter>
        <div className="app-container">
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/active-orders" element={<ActiveOrders />} />
              <Route path="/past-orders" element={<PastOrders />} />
              <Route path="/tracking" element={<OrderTracking />} />
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password/:token" element={<ResetPassword />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/payment" element={<PaymentPage />} />
              <Route path="/invoice" element={<Invoice />} />
              <Route path="/" element={<Navigate to="/login" replace />} />
            </Routes>
          </Suspense>
        </div>
      </BrowserRouter>
    </CartProvider>
  );
}

export default App;
