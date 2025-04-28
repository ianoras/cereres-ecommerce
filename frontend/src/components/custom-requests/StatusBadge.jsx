import React from 'react';

const StatusBadge = ({ status }) => {
  let color;
  let label;
  
  switch (status) {
    case 'pending':
    case 'inviata':
      color = '#3498db';
      label = 'In Attesa';
      break;
    case 'in_progress':
    case 'in valutazione':
      color = '#f39c12';
      label = 'In Lavorazione';
      break;
    case 'quoted':
    case 'preventivo inviato':
      color = '#9b59b6';
      label = 'Preventivo Inviato';
      break;
    case 'accepted':
    case 'approvata':
      color = '#27ae60';
      label = 'Approvata';
      break;
    case 'rejected':
    case 'rifiutata':
      color = '#e74c3c';
      label = 'Rifiutata';
      break;
    case 'completed':
    case 'completata':
      color = '#16a085';
      label = 'Completata';
      break;
    case 'cancelled':
    case 'annullata':
      color = '#7f8c8d';
      label = 'Annullata';
      break;
    default:
      color = '#777';
      label = status;
  }
  
  return (
    <span className="status-badge" style={{ backgroundColor: color }}>
      {label}
    </span>
  );
};

export default StatusBadge; 