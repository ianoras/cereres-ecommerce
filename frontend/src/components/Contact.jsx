import React, { useState } from 'react';
import { Form, Button, Container, Row, Col, Alert } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPaperPlane } from '@fortawesome/free-solid-svg-icons';
import { contactService } from '../services/api';
import '../styles/contact.css';

const Contact = () => {
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    messaggio: ''
  });
  
  const [errors, setErrors] = useState({});
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.nome.trim()) {
      newErrors.nome = 'Il nome è richiesto';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'L\'email è richiesta';
    } else if (!/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(formData.email)) {
      newErrors.email = 'Formato email non valido';
    }
    
    if (!formData.messaggio.trim()) {
      newErrors.messaggio = 'Il messaggio è richiesto';
    } else if (formData.messaggio.trim().length < 10) {
      newErrors.messaggio = 'Il messaggio deve contenere almeno 10 caratteri';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      setSending(true);
      setError('');
      
      await contactService.create(formData);
      
      setSent(true);
      setFormData({
        nome: '',
        email: '',
        messaggio: ''
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Si è verificato un errore durante l\'invio del messaggio');
      console.error('Errore invio messaggio:', err);
    } finally {
      setSending(false);
    }
  };
  
  return (
    <Container className="contact-container my-5">
      <h2 className="text-center mb-4">Contattaci</h2>
      <p className="text-center mb-4">
        Hai domande o desideri maggiori informazioni? Compila il form sottostante e ti contatteremo al più presto.
      </p>
      
      {sent && (
        <Alert variant="success" onClose={() => setSent(false)} dismissible>
          Messaggio inviato con successo! Ti risponderemo al più presto.
        </Alert>
      )}
      
      {error && (
        <Alert variant="danger" onClose={() => setError('')} dismissible>
          {error}
        </Alert>
      )}
      
      <Row className="justify-content-center">
        <Col md={8}>
          <Form onSubmit={handleSubmit} className="contact-form">
            <Form.Group className="mb-3">
              <Form.Label>Nome</Form.Label>
              <Form.Control
                type="text"
                name="nome"
                value={formData.nome}
                onChange={handleChange}
                isInvalid={!!errors.nome}
              />
              <Form.Control.Feedback type="invalid">
                {errors.nome}
              </Form.Control.Feedback>
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Email</Form.Label>
              <Form.Control
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                isInvalid={!!errors.email}
              />
              <Form.Control.Feedback type="invalid">
                {errors.email}
              </Form.Control.Feedback>
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Messaggio</Form.Label>
              <Form.Control
                as="textarea"
                rows={5}
                name="messaggio"
                value={formData.messaggio}
                onChange={handleChange}
                isInvalid={!!errors.messaggio}
              />
              <Form.Control.Feedback type="invalid">
                {errors.messaggio}
              </Form.Control.Feedback>
            </Form.Group>
            
            <div className="text-center">
              <Button 
                variant="primary" 
                type="submit" 
                disabled={sending}
                className="contact-submit-btn"
              >
                {sending ? 'Invio in corso...' : (
                  <>
                    <FontAwesomeIcon icon={faPaperPlane} className="me-2" />
                    Invia messaggio
                  </>
                )}
              </Button>
            </div>
          </Form>
        </Col>
      </Row>
    </Container>
  );
};

export default Contact; 