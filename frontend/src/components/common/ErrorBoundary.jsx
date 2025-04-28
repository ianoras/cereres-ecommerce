import React, { Component } from 'react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
    console.error("Errore catturato dal boundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-container p-4 bg-light rounded shadow-sm">
          <h2 className="text-danger mb-3">Si è verificato un errore</h2>
          <p>Qualcosa è andato storto durante il caricamento di questa componente.</p>
          
          <div className="d-flex justify-content-between mt-4">
            <button 
              className="btn btn-outline-secondary"
              onClick={() => this.setState({ hasError: false })}
            >
              Prova a recuperare
            </button>
            
            <button 
              className="btn btn-primary"
              onClick={() => window.location.reload()}
            >
              Ricarica pagina
            </button>
          </div>
          
          {process.env.NODE_ENV === 'development' && (
            <details className="mt-4">
              <summary className="text-secondary">Dettagli tecnici</summary>
              <pre className="bg-dark text-light p-3 mt-2 rounded">
                {this.state.error && this.state.error.toString()}
                <br />
                {this.state.errorInfo && this.state.errorInfo.componentStack}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary; 