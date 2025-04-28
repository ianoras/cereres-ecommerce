import React from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faInstagram, faTiktok } from '@fortawesome/free-brands-svg-icons';
import '../styles/footer.css';

const Footer = () => {
  return (
    <footer>
      <div className="footer-content">
        <div className="footer-logo">
          <h2>Cereres</h2>
          <p>Creazioni artigianali uniche</p>
        </div>
        <div className="footer-links">
          <h3>Collegamenti Rapidi</h3>
          <ul>
            <li><Link to="/">Home</Link></li>
            <li><Link to="/products">Prodotti</Link></li>
            <li><Link to="/about">Chi Siamo</Link></li>
            <li><Link to="/cart">Carrello</Link></li>
          </ul>
        </div>
        <div className="footer-social">
          <h3>Seguici</h3>
          <div className="social-links">
            <a href="https://www.instagram.com/_cereres?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
              <FontAwesomeIcon icon={faInstagram} />
            </a>
            <a href="https://www.tiktok.com/@_cereres?is_from_webapp=1&sender_device=pc" target="_blank" rel="noopener noreferrer" aria-label="TikTok">
              <FontAwesomeIcon icon={faTiktok} />
            </a>
          </div>
        </div>
      </div>
      <div className="footer-bottom">
        <p>&copy; {new Date().getFullYear()} Cereres. Tutti i diritti riservati.</p>
      </div>
    </footer>
  );
};

export default Footer; 