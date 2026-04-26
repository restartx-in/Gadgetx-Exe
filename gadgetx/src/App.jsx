import { HashRouter as Router } from 'react-router-dom';
import { ToastProvider } from './context/ToastContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AppLayout from './layouts/AppLayout'; 

import './App.css';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <ToastProvider>
          <AppLayout />
        </ToastProvider>
      </Router>
    </QueryClientProvider>
  );
}

export default App;