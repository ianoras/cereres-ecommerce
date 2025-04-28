import React from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHome } from '@fortawesome/free-solid-svg-icons';
import '../styles/BackToHome.css';

const BackToHome = () => {
  return (
    <Link to="/" className="back-to-home">
      <FontAwesomeIcon icon={faHome} />
      <span>Home</span>
    </Link>
  );
};

export default BackToHome; 