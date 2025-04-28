import React from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGem, faPalette, faHandHoldingHeart, faComments } from '@fortawesome/free-solid-svg-icons';
import '../styles/customization.css';

const Customization = () => {
  // Stile per le sezioni con immagini di sfondo
  const heroStyle = {
    backgroundImage: 'linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.6)), url("/images/book_6.jpg")'
  };

  // Array di immagini per la galleria provenienti dalle immagini caricate dall'utente
  const customGalleryImages = [
    '/images/gall1.jpeg',
    '/images/gall2.jpeg',
    '/images/gall3.jpeg',
    '/images/gall4.jpeg',
    '/images/gall5.jpeg',
    '/images/gall6.jpeg',
    '/images/gall7.jpeg',
    '/images/gall8.jpeg'
  ];

  return (
    <div className="customization-container">
      {/* Hero Section */}
      <section className="customization-hero" style={heroStyle}>
        <div className="hero-content">
          <h1>Personalizzazioni Uniche</h1>
          <p className="subtitle">Ogni creazione racchiude la tua essenza</p>
        </div>
      </section>

      {/* Introduzione */}
      <section className="customization-section intro-section">
        <div className="container">
          <h2 className="section-title">La Tua Visione, Le Nostre Mani</h2>
          <div className="intro-content">
            <div className="intro-text">
              <p>
                In Cereres crediamo che ogni oggetto artigianale debba raccontare una storia - la <em>tua</em> storia. 
                La personalizzazione è al centro della nostra filosofia, perché sappiamo che ciò che rende speciale un 
                prodotto è il significato che porta con sé.
              </p>
              <p>
                Dai vita alle tue idee attraverso le nostre creazioni all'uncinetto, sviluppate su misura 
                per rispecchiare i tuoi gusti, le tue passioni e la tua unicità. Dal design alla scelta dei 
                colori, ogni aspetto è pensato insieme a te, in un dialogo creativo che trasforma la tua visione 
                in realtà tangibile.
              </p>
            </div>
            <div className="intro-image">
              <img src="/images/book_3.jpg" alt="Creazione personalizzata Cereres" />
            </div>
          </div>
        </div>
      </section>

      {/* Il nostro processo */}
      <section className="customization-section process-section">
        <div className="container">
          <h2 className="section-title">Il Nostro Processo Creativo</h2>
          <div className="process-steps">
            <div className="process-step">
              <div className="step-icon">
                <FontAwesomeIcon icon={faComments} />
              </div>
              <h3>Consulenza</h3>
              <p>Iniziamo con una conversazione per comprendere la tua visione, preferenze ed esigenze specifiche.</p>
            </div>
            <div className="process-step">
              <div className="step-icon">
                <FontAwesomeIcon icon={faPalette} />
              </div>
              <h3>Design</h3>
              <p>Sviluppiamo il concept, ti proponiamo opzioni di colori, materiali e finiture.</p>
            </div>
            <div className="process-step">
              <div className="step-icon">
                <FontAwesomeIcon icon={faGem} />
              </div>
              <h3>Creazione</h3>
              <p>Realizziamo il pezzo con cura artigianale, fedeli al design concordato.</p>
            </div>
            <div className="process-step">
              <div className="step-icon">
                <FontAwesomeIcon icon={faHandHoldingHeart} />
              </div>
              <h3>Consegna</h3>
              <p>Ricevi la tua creazione unica, realizzata esclusivamente per te.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Video Section */}
      <section className="customization-section video-section">
        <div className="container">
          <h2 className="section-title">Guarda Come Lavoriamo</h2>
          <div className="video-container">
            <video 
              src="/videos/WhatsApp Video 2025-04-24 at 17.17.21.mp4" 
              controls
              poster="/images/book_2.jpg"
              className="customization-video"
            >
              Il tuo browser non supporta i video HTML5.
            </video>
          </div>
          <p className="video-caption">
            Ogni punto racconta una storia, ogni creazione porta con sé le emozioni di chi l'ha realizzata.
          </p>
        </div>
      </section>

      {/* Galleria di personalizzazioni */}
      <section className="customization-section gallery-section">
        <div className="container">
          <h2 className="section-title">Ispirazioni Personalizzate</h2>
          <p className="gallery-intro">
            Esplora alcune delle nostre creazioni personalizzate che abbiamo realizzato per i nostri clienti. 
            Ogni pezzo è unico e racconta una storia diversa.
          </p>
          <div className="custom-gallery">
            {customGalleryImages.map((image, index) => (
              <div className="gallery-item" key={index}>
                <img src={image} alt={`Creazione personalizzata ${index + 1}`} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="customization-section cta-section">
        <div className="container">
          <h2>Pronto a Creare Qualcosa di Speciale?</h2>
          <p>
            Ogni personalizzazione inizia con una conversazione. Raccontaci la tua idea e trasformiamola insieme 
            in una creazione unica.
          </p>
          <div className="cta-buttons">
            <Link to="/about" className="btn btn-primary">Contattaci</Link>
            <Link to="/products" className="btn btn-outline">Esplora i Nostri Prodotti</Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Customization; 