import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faHandshake, 
  faHeart, 
  faLeaf, 
  faUsers, 
  // faMapMarkerAlt, // Non utilizzato
  faEnvelope, 
  faPhone,
  faCheckCircle,
  faExclamationCircle
} from '@fortawesome/free-solid-svg-icons';
import { faInstagram, /* faFacebook, faTwitter, */ faTiktok } from '@fortawesome/free-brands-svg-icons';
import { contactService } from '../services/api';
import '../styles/about-us.css';

const AboutUs = () => {
  // Stile per le sezioni con immagini di sfondo
  const heroStyle = {
    backgroundImage: 'linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url("/images/book_9.jpg")'
  };
  
  const ctaStyle = {
    backgroundImage: 'linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.7)), url("/images/book_3.jpg")'
  };

  // Stato per il form di contatto
  const [contactForm, setContactForm] = useState({
    nome: '',
    email: '',
    messaggio: ''
  });

  // Stato per gestire gli errori e il successo
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null); // null, 'success', 'error'
  const [errorMessage, setErrorMessage] = useState('');

  // Gestione del cambiamento degli input
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setContactForm({
      ...contactForm,
      [name]: value
    });
    // Rimuovi l'errore quando l'utente inizia a digitare
    if (formErrors[name]) {
      setFormErrors({
        ...formErrors,
        [name]: null
      });
    }
  };

  // Validazione del form
  const validateForm = () => {
    const errors = {};
    
    if (!contactForm.nome.trim()) {
      errors.nome = 'Il nome è richiesto';
    }
    
    if (!contactForm.email.trim()) {
      errors.email = 'L\'email è richiesta';
    } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i.test(contactForm.email)) {
      errors.email = 'Email non valida';
    }
    
    if (!contactForm.messaggio.trim()) {
      errors.messaggio = 'Il messaggio è richiesto';
    } else if (contactForm.messaggio.length < 10) {
      errors.messaggio = 'Il messaggio deve contenere almeno 10 caratteri';
    }
    
    return errors;
  };

  // Gestione dell'invio del form
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Reset stati precedenti
    setErrorMessage('');
    
    // Validazione
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    
    setIsSubmitting(true);
    setSubmitStatus(null);
    
    try {
      // Chiamata API reale per inviare il messaggio
      const response = await contactService.create(contactForm);
      
      console.log('Risposta invio messaggio:', response);
      
      setSubmitStatus('success');
      // Reset del form
      setContactForm({
        nome: '',
        email: '',
        messaggio: ''
      });
    } catch (error) {
      console.error('Errore nell\'invio del messaggio:', error);
      setSubmitStatus('error');
      
      // Gestisci i diversi tipi di errore
      if (error.response) {
        // Errore dal server
        setErrorMessage(error.response.data.message || 'Errore nel server. Riprova più tardi.');
      } else if (error.request) {
        // Nessuna risposta ricevuta dal server
        setErrorMessage('Impossibile contattare il server. Verifica la tua connessione internet.');
      } else {
        // Errore nella configurazione della richiesta
        setErrorMessage('Errore nella richiesta. Riprova più tardi.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="about-us-container">
      {/* Hero Section */}
      <section className="about-hero" style={heroStyle}>
        <div className="about-hero-content">
          <h1>Chi Siamo</h1>
          <p className="subtitle">Cereres è il punto dove creatività, sostenibilità e mindfulness si incontrano</p>
        </div>
      </section>

      {/* Storia Section */}
      <section className="about-section story-section">
        <div className="section-content">
          <div className="section-text">
            <h2 className="storia-title">LA NOSTRA STORIA</h2>
            <p className="storia-paragraph">
              Cereres nasce dal bisogno di rallentare. Di ritagliarci uno spazio dove respirare, creare, stare nel presente. L'uncinetto è il nostro modo per farlo: un gesto lento, ripetitivo, quasi meditativo. Abbiamo iniziato recuperando vecchi capi e trasformandoli in filati, poi in pezzi unici. Oggi Cereres è il nostro canale per esprimere creatività in modo sostenibile, con testa, mani e cuore.
            </p>
          </div>
          <div className="section-video">
            <video 
              src="/videos/WhatsApp Video 2025-04-24 at 17.17.21.mp4" 
              controls
              poster="/images/book_2.jpg"
              className="storia-video"
              autoPlay
              muted
              loop
            >
              Il tuo browser non supporta i video HTML5.
            </video>
          </div>
        </div>
      </section>

      {/* Valori Section */}
      <section className="about-section values-section">
        <h2>I Nostri Valori</h2>
        <div className="values-grid">
          <div className="value-card">
            <div className="value-icon">
              <FontAwesomeIcon icon={faHandshake} />
            </div>
            <h3>Qualità</h3>
            <p>Selezioniamo solo i migliori artigiani e prodotti per garantire eccellenza in ogni acquisto.</p>
          </div>
          <div className="value-card">
            <div className="value-icon">
              <FontAwesomeIcon icon={faHeart} />
            </div>
            <h3>Passione</h3>
            <p>Ogni prodotto è realizzato con amore e dedizione, trasmettendo emozioni attraverso l'artigianato.</p>
          </div>
          <div className="value-card">
            <div className="value-icon">
              <FontAwesomeIcon icon={faLeaf} />
            </div>
            <h3>Sostenibilità</h3>
            <p>Promuoviamo pratiche sostenibili e materiali eco-friendly per un futuro migliore.</p>
          </div>
          <div className="value-card">
            <div className="value-icon">
              <FontAwesomeIcon icon={faUsers} />
            </div>
            <h3>Comunità</h3>
            <p>Costruiamo una comunità di appassionati che condividono l'amore per l'artigianato di qualità.</p>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="about-section team-section">
        <h2>Il Nostro Team</h2>
        <div className="team-grid">
          <div className="team-member">
            <div className="member-image">
              <img src="/images/book_4.jpg" alt="Chiara Guarino" />
            </div>
            <h3>Chiara Guarino</h3>
            <p className="member-role">Fondatrice & Artigiana</p>
            <p className="member-bio">
              Chiara è il cuore artigiano di Cereres. Ha un occhio preciso per l'estetica e una passione naturale per il fatto a mano. È lei che dà forma ai filati, che immagina le trame e trasforma l'intuizione in oggetti unici.
            </p>
          </div>
          <div className="team-member">
            <div className="member-image">
              <img src="/images/book_5.webp" alt="Mariagrazia Ianora" />
            </div>
            <h3>Mariagrazia Ianora</h3>
            <p className="member-role">Fondatrice & Stratega</p>
            <p className="member-bio">
              Grace è la mente strategica dietro Cereres. Si occupa del management e dei social, ma in realtà tiene insieme tutto: idee, visioni, persone. È lei che dà ritmo al progetto, trasformando intuizioni in direzioni. Con uno sguardo attento al dettaglio e una visione ampia, fa da ponte tra il cuore creativo e il mondo esterno, credendo nella comunicazione autentica e nel potere delle storie.
            </p>
          </div>
        </div>
      </section>

      {/* Contatti Section */}
      <section className="about-section contact-section">
        <h2>Contattaci</h2>
        <div className="contact-content centered-contact">
          <div className="contact-form-container">
            <div className="contact-info-centered">
              <div className="contact-item">
                <FontAwesomeIcon icon={faEnvelope} />
                <p>cereres@blu.it</p>
              </div>
              <div className="contact-item">
                <FontAwesomeIcon icon={faPhone} />
                <p>+39 123 456 7890</p>
              </div>
              <div className="social-links">
                <a href="https://www.instagram.com/_cereres?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                  <FontAwesomeIcon icon={faInstagram} />
                </a>
                <a href="https://www.tiktok.com/@_cereres?is_from_webapp=1&sender_device=pc" target="_blank" rel="noopener noreferrer" aria-label="TikTok">
                  <FontAwesomeIcon icon={faTiktok} />
                </a>
              </div>
            </div>
            <div className="contact-form">
              <h3>Invia un messaggio</h3>
              {submitStatus === 'success' ? (
                <div className="success-message">
                  <FontAwesomeIcon icon={faCheckCircle} />
                  <p>Grazie per averci contattato! Ti risponderemo al più presto.</p>
                  <button 
                    className="btn btn-secondary mt-3" 
                    onClick={() => setSubmitStatus(null)}
                  >
                    Invia un altro messaggio
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit}>
                  <div className={`form-group ${formErrors.nome ? 'has-error' : ''}`}>
                    <label htmlFor="nome">Nome</label>
                    <input 
                      type="text" 
                      id="nome"
                      name="nome" 
                      placeholder="Il tuo nome" 
                      value={contactForm.nome}
                      onChange={handleInputChange}
                    />
                    {formErrors.nome && <div className="error-message">{formErrors.nome}</div>}
                  </div>
                  <div className={`form-group ${formErrors.email ? 'has-error' : ''}`}>
                    <label htmlFor="email">Email</label>
                    <input 
                      type="email" 
                      id="email"
                      name="email" 
                      placeholder="La tua email" 
                      value={contactForm.email}
                      onChange={handleInputChange}
                    />
                    {formErrors.email && <div className="error-message">{formErrors.email}</div>}
                  </div>
                  <div className={`form-group ${formErrors.messaggio ? 'has-error' : ''}`}>
                    <label htmlFor="messaggio">Messaggio</label>
                    <textarea 
                      id="messaggio"
                      name="messaggio" 
                      placeholder="Il tuo messaggio" 
                      rows="4"
                      value={contactForm.messaggio}
                      onChange={handleInputChange}
                    ></textarea>
                    {formErrors.messaggio && <div className="error-message">{formErrors.messaggio}</div>}
                  </div>
                  <button 
                    type="submit" 
                    className="btn btn-primary"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Invio in corso...' : 'Invia Messaggio'}
                  </button>
                  {submitStatus === 'error' && (
                    <div className="error-submit">
                      <FontAwesomeIcon icon={faExclamationCircle} />
                      <p>{errorMessage || 'Si è verificato un errore. Riprova più tardi.'}</p>
                    </div>
                  )}
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="about-section cta-section" style={ctaStyle}>
        <div className="cta-content">
          <h2>Scopri i Nostri Prodotti</h2>
          <p>Esplora la nostra collezione di prodotti artigianali unici</p>
          <Link to="/products" className="btn btn-primary">Vai ai Prodotti</Link>
        </div>
      </section>
    </div>
  );
};

export default AboutUs; 