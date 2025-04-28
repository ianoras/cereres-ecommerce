import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faEnvelope, faEnvelopeOpen, faCheck, faTrash, 
  faEye, faSync, faExclamationTriangle,
  faEnvelopeOpenText
} from '@fortawesome/free-solid-svg-icons';
import { contactService } from '../../services/api';
import '../../styles/admin/contacts-list.css';

const ContactsList = () => {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedContact, setSelectedContact] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    unread: 0,
    responded: 0,
    lastWeek: 0
  });
  
  // Paginazione
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalContacts, setTotalContacts] = useState(0);
  
  // Filtri
  const [filter, setFilter] = useState('all'); // 'all', 'unread', 'responded'
  
  // Carica le statistiche
  const fetchStats = async () => {
    try {
      const statsResponse = await contactService.getStats();
      setStats(statsResponse.data);
    } catch (err) {
      console.error('Errore nel caricamento delle statistiche:', err);
    }
  };
  
  // Carica i messaggi
  const fetchContacts = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await contactService.getAll(page, 10);
      
      setContacts(response.data.contacts || response.data || []);
      
      // Imposta la paginazione se disponibile nella risposta
      if (response.data.totalPages) {
        setTotalPages(response.data.totalPages);
        setTotalContacts(response.data.total);
      }
      
      // Carica le statistiche
      await fetchStats();
      
    } catch (err) {
      console.error('Errore nel caricamento dei messaggi:', err);
      setError('Errore nel caricamento dei messaggi. ' + 
        (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };
  
  // Primo caricamento
  useEffect(() => {
    fetchContacts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);
  
  // Filtra i messaggi
  const filterContacts = () => {
    if (filter === 'all') return contacts;
    if (filter === 'unread') return contacts.filter(contact => !contact.letto);
    if (filter === 'responded') return contacts.filter(contact => contact.risposto);
    if (filter === 'read') return contacts.filter(contact => contact.letto && !contact.risposto);
    return contacts;
  };
  
  // Formatta la data
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };
  
  // Visualizza un messaggio
  const viewContact = async (contact) => {
    try {
      // Se il messaggio non è stato ancora letto, ottiene i dettagli dal server
      // che implicitamente lo segnerà come letto
      if (!contact.letto) {
        const response = await contactService.getById(contact._id);
        setSelectedContact(response.data.contact);
        
        // Aggiorna le statistiche dopo aver marcato come letto
        fetchStats();
        
        // Aggiorna anche la lista locale dei messaggi per mostrare il messaggio come letto
        const updatedContacts = contacts.map(c => 
          c._id === contact._id ? { ...c, letto: true } : c
        );
        setContacts(updatedContacts);
      } else {
        // Se il messaggio è già stato letto, imposta direttamente il contatto selezionato
        setSelectedContact(contact);
      }
    } catch (err) {
      console.error('Errore durante l\'apertura del messaggio:', err);
      setSelectedContact(contact); // In caso di errore, mostra comunque il messaggio
    }
  };
  
  // Chiudi il dettaglio del messaggio
  const closeContactDetail = () => {
    setSelectedContact(null);
  };
  
  // Segna come risposto
  const markAsResponded = async (contactId) => {
    try {
      await contactService.markAsResponded(contactId);
      
      // Aggiorna il messaggio selezionato se aperto
      if (selectedContact && selectedContact._id === contactId) {
        // Aggiorna sia risposto che letto
        setSelectedContact({ 
          ...selectedContact, 
          risposto: true,
          letto: true 
        });
      }
      
      // Aggiorna solo la lista locale dei messaggi per mostrare il messaggio come risposto
      const updatedContacts = contacts.map(c => 
        c._id === contactId ? { ...c, risposto: true, letto: true } : c
      );
      setContacts(updatedContacts);
      
      // Aggiorna le statistiche dopo aver marcato come risposto
      fetchStats();
      
      // Mostra un messaggio di successo temporaneo
      alert('Messaggio segnato come risposto con successo');
    } catch (err) {
      console.error('Errore nel marcare il messaggio come risposto:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Errore sconosciuto';
      alert(`Errore nel marcare il messaggio come risposto: ${errorMessage}`);
    }
  };
  
  // Segna come letto
  const markAsRead = async (contactId) => {
    try {
      await contactService.getById(contactId);
      
      // Aggiorna la lista locale di messaggi per mostrare il messaggio come letto
      const updatedContacts = contacts.map(c => 
        c._id === contactId ? { ...c, letto: true } : c
      );
      setContacts(updatedContacts);
      
      // Aggiorna le statistiche dopo aver marcato come letto
      fetchStats();
      
      // Mostra un messaggio di successo temporaneo
      alert('Messaggio segnato come letto con successo');
    } catch (err) {
      console.error('Errore nel marcare il messaggio come letto:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Errore sconosciuto';
      alert(`Errore nel marcare il messaggio come letto: ${errorMessage}`);
    }
  };
  
  // Elimina un messaggio
  const deleteContact = async (contactId) => {
    if (!window.confirm('Sei sicuro di voler eliminare questo messaggio?')) {
      return;
    }
    
    try {
      await contactService.delete(contactId);
      
      // Chiudi il dettaglio se è aperto
      if (selectedContact && selectedContact._id === contactId) {
        setSelectedContact(null);
      }
      
      // Aggiorna la lista di messaggi
      fetchContacts();
    } catch (err) {
      console.error('Errore nell\'eliminazione del messaggio:', err);
      alert('Errore nell\'eliminazione del messaggio');
    }
  };
  
  // Cambia pagina
  const changePage = (newPage) => {
    if (newPage < 1 || newPage > totalPages) return;
    setPage(newPage);
  };
  
  // Rendering dei contenuti
  return (
    <div className="contacts-list-container">
      <div className="contacts-header">
        <div className="contacts-header-title">
          {stats.unread > 0 && (
            <div className="unread-badge">
              {stats.unread} {stats.unread === 1 ? 'messaggio non letto' : 'messaggi non letti'}
            </div>
          )}
        </div>
        
        <div className="contacts-stats">
          <div className="stat-box unread">
            <div className="stat-value">{stats.unread}</div>
            <div className="stat-label">Non letti</div>
          </div>
          
          <div className="stat-box responded">
            <div className="stat-value">{stats.responded}</div>
            <div className="stat-label">Risposti</div>
          </div>
          
          <div className="stat-box recent">
            <div className="stat-value">{stats.lastWeek}</div>
            <div className="stat-label">Ultimi 7 giorni</div>
          </div>
        </div>
      </div>
      
      <div className="contacts-actions">
        <div className="filter-controls">
          <span>Filtra:</span>
          <div className="filter-buttons">
            <button 
              className={`filter-btn ${filter === 'all' ? 'active' : ''}`} 
              onClick={() => setFilter('all')}
            >
              Tutti
            </button>
            <button 
              className={`filter-btn ${filter === 'unread' ? 'active' : ''}`} 
              onClick={() => setFilter('unread')}
            >
              Non letti
            </button>
            <button 
              className={`filter-btn ${filter === 'read' ? 'active' : ''}`} 
              onClick={() => setFilter('read')}
            >
              Letti
            </button>
            <button 
              className={`filter-btn ${filter === 'responded' ? 'active' : ''}`} 
              onClick={() => setFilter('responded')}
            >
              Risposti
            </button>
          </div>
        </div>
        
        <button 
          className="btn btn-primary refresh-btn" 
          onClick={fetchContacts}
          disabled={loading}
        >
          <FontAwesomeIcon icon={faSync} spin={loading} /> 
          {loading ? 'Caricamento...' : 'Aggiorna'}
        </button>
      </div>
      
      <div className="contacts-content">
        {loading ? (
          <div className="loading-container">
            <FontAwesomeIcon icon={faSync} spin />
            <p>Caricamento messaggi in corso...</p>
          </div>
        ) : error ? (
          <div className="error-container">
            <FontAwesomeIcon icon={faExclamationTriangle} />
            <p>{error}</p>
            <button 
              className="btn btn-primary" 
              onClick={fetchContacts}
            >
              Riprova
            </button>
          </div>
        ) : contacts.length === 0 ? (
          <div className="empty-container">
            <p>Nessun messaggio trovato</p>
          </div>
        ) : selectedContact ? (
          <div className="contact-detail">
            <div className="contact-detail-header">
              <h3>Dettaglio Messaggio</h3>
              <div className="contact-detail-actions">
                {!selectedContact.risposto && (
                  <button 
                    className="btn btn-success"
                    onClick={() => markAsResponded(selectedContact._id)}
                  >
                    <FontAwesomeIcon icon={faCheck} /> Segna come risposto
                  </button>
                )}
                <button 
                  className="btn btn-danger"
                  onClick={() => deleteContact(selectedContact._id)}
                >
                  <FontAwesomeIcon icon={faTrash} /> Elimina
                </button>
                <button 
                  className="btn btn-secondary"
                  onClick={closeContactDetail}
                >
                  Torna alla lista
                </button>
              </div>
            </div>
            
            <div className="contact-detail-info">
              <div className="detail-row">
                <div className="detail-label">Mittente</div>
                <div className="detail-value">{selectedContact.nome}</div>
              </div>
              <div className="detail-row">
                <div className="detail-label">Email</div>
                <div className="detail-value">
                  <a href={`mailto:${selectedContact.email}`}>{selectedContact.email}</a>
                </div>
              </div>
              <div className="detail-row">
                <div className="detail-label">Data</div>
                <div className="detail-value">{formatDate(selectedContact.createdAt)}</div>
              </div>
              <div className="detail-row">
                <div className="detail-label">Stato</div>
                <div className="detail-value">
                  <div className="status-container">
                    {selectedContact.risposto ? (
                      <span className="status responded">Risposto</span>
                    ) : (
                      <span className="status unread">Non risposto</span>
                    )}
                    
                    {selectedContact.letto ? (
                      <span className="status read">Letto</span>
                    ) : (
                      <span className="status unread">Non letto</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="contact-detail-message">
              <h4>Messaggio</h4>
              <div className="message-content">
                {selectedContact.messaggio}
              </div>
            </div>
            
            <div className="contact-detail-footer">
              <button 
                className="btn btn-primary"
                onClick={() => window.location.href = `mailto:${selectedContact.email}?subject=RE: Messaggio dal sito Cereres&body=Gentile ${selectedContact.nome},%0D%0A%0D%0A`}
              >
                <FontAwesomeIcon icon={faEnvelopeOpenText} /> Rispondi via Email
              </button>
            </div>
          </div>
        ) : (
          <div className="contacts-table-container">
            <table className="contacts-table">
              <thead>
                <tr>
                  <th>Stato</th>
                  <th>Mittente</th>
                  <th>Email</th>
                  <th>Data</th>
                  <th>Messaggio</th>
                  <th>Azioni</th>
                </tr>
              </thead>
              <tbody>
                {filterContacts().map(contact => (
                  <tr 
                    key={contact._id} 
                    className={`contact-row ${contact.risposto ? 'responded' : ''} ${contact.letto ? 'read' : 'unread'}`}
                    onClick={() => viewContact(contact)}
                  >
                    <td className="status-cell">
                      <div className={`status-badge ${contact.risposto ? 'responded' : contact.letto ? 'read' : 'unread'}`}>
                        <FontAwesomeIcon icon={contact.risposto ? faEnvelopeOpen : contact.letto ? faEnvelopeOpen : faEnvelope} />
                      </div>
                    </td>
                    <td>{contact.nome}</td>
                    <td>{contact.email}</td>
                    <td>{formatDate(contact.createdAt)}</td>
                    <td>{contact.messaggio.substring(0, 50)}...</td>
                    <td className="actions-cell">
                      <button
                        title="Visualizza"
                        className="action-btn view-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          viewContact(contact);
                        }}
                      >
                        <FontAwesomeIcon icon={faEye} />
                      </button>
                      
                      {!contact.risposto && (
                        <button
                          title="Segna come risposto"
                          className="action-btn respond-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            markAsResponded(contact._id);
                          }}
                        >
                          <FontAwesomeIcon icon={faCheck} />
                        </button>
                      )}
                      
                      {!contact.letto && (
                        <button
                          title="Segna come letto"
                          className="action-btn read-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            markAsRead(contact._id);
                          }}
                        >
                          <FontAwesomeIcon icon={faEnvelopeOpen} />
                        </button>
                      )}
                      
                      <button
                        title="Elimina"
                        className="action-btn delete-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteContact(contact._id);
                        }}
                      >
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        {!selectedContact && totalPages > 1 && (
          <div className="pagination">
            <button 
              className="pagination-btn"
              onClick={() => changePage(page - 1)}
              disabled={page === 1 || loading}
            >
              Precedente
            </button>
            <span className="pagination-info">
              Pagina {page} di {totalPages} ({totalContacts} messaggi totali)
            </span>
            <button 
              className="pagination-btn"
              onClick={() => changePage(page + 1)}
              disabled={page === totalPages || loading}
            >
              Successiva
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ContactsList; 