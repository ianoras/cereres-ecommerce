import React from 'react';
import { Badge } from 'react-bootstrap';

const NotificationBadge = ({ count }) => {
  if (count <= 0) {
    return null;
  }

  return (
    <Badge bg="danger" pill className="notification-badge ms-2">
      {count}
    </Badge>
  );
};

export default NotificationBadge; 