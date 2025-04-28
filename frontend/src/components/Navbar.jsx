import React from 'react';
import { Link } from 'react-router-dom';

const Navbar = () => {
  return (
    <div className="navbar">
      <Link className="nav-link" to="/about">Chi Siamo</Link>
      <Link className="nav-link" to="/contact">Contatti</Link>
    </div>
  );
};

export default Navbar; 