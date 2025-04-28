import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home.jsx';
import AboutUs from './pages/AboutUs.jsx';
import Products from './pages/Products.jsx';
import ProductDetail from './pages/ProductDetail.jsx';
import ProductCustomize from './pages/ProductCustomize.jsx';
import Cart from './pages/Cart.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Profile from './pages/Profile.jsx';
import CustomRequests from './pages/CustomRequests.jsx';
import Admin from './pages/Admin.jsx';
import AuthSuccess from './pages/AuthSuccess.jsx';
import Orders from './pages/Orders.jsx';
import * as AuthService from './services/auth.service';
import Checkout from './pages/Checkout.jsx';
import Customization from './pages/Customization.jsx';

function App() {
  // Nessuna inizializzazione del servizio di notifiche
  
  return (
    <Router>
      <div className="d-flex flex-column min-vh-100">
        <Routes>
          {/* Route per login e registrazione senza Header e Footer */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* Route per admin senza Header e Footer */}
          <Route path="/admin/*" element={<Admin />} />
          
          {/* Altre route con Header e Footer */}
          <Route path="/" element={
            <>
              <Header />
              <main className="flex-grow-1">
                <Home />
              </main>
              <Footer />
            </>
          } />
          <Route path="/about" element={
            <>
              <Header />
              <main className="flex-grow-1">
                <AboutUs />
              </main>
              <Footer />
            </>
          } />
          <Route path="/products" element={
            <>
              <Header />
              <main className="flex-grow-1">
                <Products />
              </main>
              <Footer />
            </>
          } />
          <Route path="/products/:id" element={
            <>
              <Header />
              <main className="flex-grow-1">
                <ProductDetail />
              </main>
              <Footer />
            </>
          } />
          <Route path="/products/:id/customize" element={
            <>
              <Header />
              <main className="flex-grow-1">
                <ProductCustomize />
              </main>
              <Footer />
            </>
          } />
          <Route path="/cart" element={
            <>
              <Header />
              <main className="flex-grow-1">
                <Cart />
              </main>
              <Footer />
            </>
          } />
          <Route path="/checkout" element={
            <>
              <Header />
              <main className="flex-grow-1">
                <Checkout />
              </main>
              <Footer />
            </>
          } />
          <Route path="/profile" element={
            <>
              <Header />
              <main className="flex-grow-1">
                <Profile />
              </main>
              <Footer />
            </>
          } />
          <Route path="/orders" element={
            <>
              <Header />
              <main className="flex-grow-1">
                <Orders />
              </main>
              <Footer />
            </>
          } />
          <Route path="/custom-requests" element={
            <>
              <Header />
              <main className="flex-grow-1">
                <CustomRequests />
              </main>
              <Footer />
            </>
          } />
          <Route path="/customization" element={
            <>
              <Header />
              <main className="flex-grow-1">
                <Customization />
              </main>
              <Footer />
            </>
          } />
          <Route path="/auth/success" element={<AuthSuccess />} />
        </Routes>
        <ToastContainer />
      </div>
    </Router>
  );
}

export default App; 