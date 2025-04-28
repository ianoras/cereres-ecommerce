import React from 'react';

const LoadingSpinner = ({ 
  size = 'md', 
  message = 'Caricamento in corso...', 
  fullPage = false,
  timeout = null 
}) => {
  const [showTimeout, setShowTimeout] = React.useState(false);
  
  React.useEffect(() => {
    let timeoutId = null;
    
    if (timeout) {
      timeoutId = setTimeout(() => {
        setShowTimeout(true);
      }, timeout);
    }
    
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [timeout]);

  // Determinare le dimensioni dello spinner
  const getSpinnerClass = () => {
    switch(size) {
      case 'sm': return 'spinner-border-sm';
      case 'lg': return '';
      default: return '';
    }
  };
  
  // Contenitore condizionale per fullPage
  const Wrapper = ({ children }) => {
    if (fullPage) {
      return (
        <div className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center bg-white bg-opacity-75" style={{ zIndex: 1050 }}>
          {children}
        </div>
      );
    }
    return <>{children}</>;
  };

  return (
    <Wrapper>
      <div className="d-flex flex-column align-items-center text-center">
        <div className={`spinner-border ${getSpinnerClass()}`} role="status">
          <span className="visually-hidden">{message}</span>
        </div>
        
        {message && <p className="mt-3">{message}</p>}
        
        {showTimeout && (
          <div className="mt-3 text-muted small">
            <p>L'operazione sta richiedendo più tempo del previsto.</p>
            <p>Controllare la connessione Internet e riprovare più tardi se necessario.</p>
          </div>
        )}
      </div>
    </Wrapper>
  );
};

export default LoadingSpinner; 