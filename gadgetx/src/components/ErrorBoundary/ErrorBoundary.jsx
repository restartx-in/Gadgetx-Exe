import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error: error,
      errorInfo: errorInfo,
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            padding: '20px',
            backgroundColor: '#f5f5f5',
          }}
        >
          <h1 style={{ color: '#d32f2f', marginBottom: '16px' }}>
            Something went wrong
          </h1>
          <p style={{ color: '#666', marginBottom: '24px', textAlign: 'center' }}>
            An unexpected error occurred. Please check the console for details.
          </p>
          {this.state.error && (
            <details
              style={{
                backgroundColor: 'white',
                padding: '16px',
                borderRadius: '4px',
                maxWidth: '600px',
                width: '100%',
                marginTop: '16px',
              }}
            >
              <summary style={{ cursor: 'pointer', fontWeight: 'bold', marginBottom: '8px' }}>
                Error Details
              </summary>
              <pre
                style={{
                  whiteSpace: 'pre-wrap',
                  fontSize: '12px',
                  color: '#d32f2f',
                  overflow: 'auto',
                }}
              >
                {this.state.error.toString()}
                {this.state.errorInfo?.componentStack}
              </pre>
            </details>
          )}
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null, errorInfo: null });
              window.location.reload();
            }}
            style={{
              marginTop: '24px',
              padding: '12px 24px',
              backgroundColor: '#1976d2',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '16px',
            }}
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
