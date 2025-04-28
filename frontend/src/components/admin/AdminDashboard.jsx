import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Nav, Tab } from 'react-bootstrap';
import { Link, useLocation } from 'react-router-dom';
import NotificationCenter from '../common/NotificationCenter';
import NotificationBadge from '../common/NotificationBadge';
import notificationService from '../../services/notificationService';

const AdminDashboard = () => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('overview');
  const [notificationCounts, setNotificationCounts] = useState({
    messages: 0,
    orders: 0,
    requests: 0,
    total: 0
  });

  // Inizializza il servizio di notifiche
  useEffect(() => {
    // Avvia il polling solo se non è già attivo
    // Nota: il servizio ora gestisce internamente il debounce delle richieste
    if (!notificationService.pollingInterval) {
      notificationService.startPolling(30000); // Polling ogni 30 secondi
    }
    
    return () => {
      // Non fermiamo il polling alla smontatura del componente
      // per evitare interruzioni nelle altre pagine admin
      // notificationService.stopPolling();
    };
  }, []);

  // Aggiungi listener per gli aggiornamenti delle notifiche
  useEffect(() => {
    const removeListener = notificationService.addListener(setNotificationCounts);
    
    // Aggiorniamo i conteggi all'avvio usando i valori già in memoria
    const currentCounts = {
      messages: notificationService.getUnreadCount('messages'),
      orders: notificationService.getUnreadCount('orders'),
      requests: notificationService.getUnreadCount('requests'),
      total: notificationService.getUnreadCount()
    };
    setNotificationCounts(currentCounts);
    
    return () => {
      removeListener();
    };
  }, []);

  // Determina la tab attiva in base alla query string
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const section = params.get('section');
    if (section) {
      setActiveTab(section);
    }
  }, [location]);

  return (
    <Container fluid className="admin-dashboard py-4">
      <Row className="mb-4">
        <Col>
          <h1>Pannello Amministratore</h1>
        </Col>
        <Col xs="auto" className="d-flex align-items-center">
          <NotificationCenter />
        </Col>
      </Row>

      <Tab.Container activeKey={activeTab} onSelect={setActiveTab}>
        <Row>
          <Col md={3}>
            <Card className="mb-4">
              <Card.Header>
                <Nav variant="pills" className="flex-column">
                  <Nav.Item>
                    <Nav.Link eventKey="overview" as={Link} to="/admin?section=overview">
                      Panoramica
                    </Nav.Link>
                  </Nav.Item>
                  <Nav.Item>
                    <Nav.Link eventKey="orders" as={Link} to="/admin?section=orders">
                      Ordini
                      <NotificationBadge type="orders" />
                    </Nav.Link>
                  </Nav.Item>
                  <Nav.Item>
                    <Nav.Link eventKey="custom-requests" as={Link} to="/admin?section=custom-requests">
                      Richieste Personalizzate
                      <NotificationBadge type="requests" />
                    </Nav.Link>
                  </Nav.Item>
                  <Nav.Item>
                    <Nav.Link eventKey="contacts" as={Link} to="/admin?section=contacts">
                      Messaggi di Contatto
                      <NotificationBadge type="messages" />
                    </Nav.Link>
                  </Nav.Item>
                  <Nav.Item>
                    <Nav.Link eventKey="products" as={Link} to="/admin?section=products">
                      Prodotti
                    </Nav.Link>
                  </Nav.Item>
                  <Nav.Item>
                    <Nav.Link eventKey="users" as={Link} to="/admin?section=users">
                      Utenti
                    </Nav.Link>
                  </Nav.Item>
                  <Nav.Item>
                    <Nav.Link eventKey="settings" as={Link} to="/admin?section=settings">
                      Impostazioni
                    </Nav.Link>
                  </Nav.Item>
                </Nav>
              </Card.Header>
            </Card>
          </Col>
          <Col md={9}>
            <Tab.Content>
              <Tab.Pane eventKey="overview">
                <Card>
                  <Card.Header>
                    <h2>Panoramica</h2>
                  </Card.Header>
                  <Card.Body>
                    <p>Benvenuto nel pannello amministratore. Seleziona una sezione dal menu a sinistra.</p>
                  </Card.Body>
                </Card>
              </Tab.Pane>
              <Tab.Pane eventKey="orders">
                <Card>
                  <Card.Header>
                    <h2>Ordini</h2>
                  </Card.Header>
                  <Card.Body>
                    {/* Componente per la lista degli ordini */}
                  </Card.Body>
                </Card>
              </Tab.Pane>
              <Tab.Pane eventKey="custom-requests">
                <Card>
                  <Card.Header>
                    <h2>Richieste Personalizzate</h2>
                  </Card.Header>
                  <Card.Body>
                    {/* Componente per la lista delle richieste personalizzate */}
                  </Card.Body>
                </Card>
              </Tab.Pane>
              <Tab.Pane eventKey="contacts">
                <Card>
                  <Card.Header>
                    <h2>Messaggi di Contatto</h2>
                  </Card.Header>
                  <Card.Body>
                    {/* Componente per la lista dei messaggi di contatto */}
                  </Card.Body>
                </Card>
              </Tab.Pane>
              <Tab.Pane eventKey="products">
                <Card>
                  <Card.Header>
                    <h2>Prodotti</h2>
                  </Card.Header>
                  <Card.Body>
                    {/* Componente per la gestione dei prodotti */}
                  </Card.Body>
                </Card>
              </Tab.Pane>
              <Tab.Pane eventKey="users">
                <Card>
                  <Card.Header>
                    <h2>Utenti</h2>
                  </Card.Header>
                  <Card.Body>
                    {/* Componente per la gestione degli utenti */}
                  </Card.Body>
                </Card>
              </Tab.Pane>
              <Tab.Pane eventKey="settings">
                <Card>
                  <Card.Header>
                    <h2>Impostazioni</h2>
                  </Card.Header>
                  <Card.Body>
                    {/* Componente per le impostazioni */}
                  </Card.Body>
                </Card>
              </Tab.Pane>
            </Tab.Content>
          </Col>
        </Row>
      </Tab.Container>
    </Container>
  );
};

export default AdminDashboard; 