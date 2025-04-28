import React, { useState, useEffect } from 'react';
import { Badge } from 'react-bootstrap';
import notificationService from '../../services/notificationService';

/**
 * Componente che mostra un badge con il conteggio delle notifiche non lette
 * @param {Object} props - Props del componente
 * @param {String} props.type - Tipo di notifiche ('messages', 'orders', 'requests', 'total')
 * @param {String} props.className - Classi CSS aggiuntive
 */
const NotificationBadge = ({ type, className = '' }) => {
  // Stato per il conteggio delle notifiche
  const [count, setCount] = useState(0);

  // Effetto per monitorare le notifiche
  useEffect(() => {
    // Handler per aggiornare il conteggio
    const updateCount = (data) => {
      if (data && typeof data === 'object') {
        setCount(data[type] || 0);
      }
    };

    // Registra il listener per le notifiche
    const removeListener = notificationService.addListener(updateCount);
    
    // Recupera il conteggio iniziale
    notificationService.fetchUnreadCounts().then(updateCount);

    // Pulizia al dismount
    return () => removeListener();
  }, [type]);

  // Non mostrare nulla se non ci sono notifiche
  if (count === 0) return null;

  return (
    <Badge 
      bg="danger" 
      pill 
      className={`ms-2 notification-badge ${className}`}
    >
      {count}
    </Badge>
  );
};

export default NotificationBadge; 