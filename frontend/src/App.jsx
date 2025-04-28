import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import * as authService from './services/auth.service';

const App = () => {
  useEffect(() => {
    // Inizializza l'autenticazione al caricamento dell'app
    authService.initAuth();
  }, []);

  // ... existing code ...
};

export default App; 