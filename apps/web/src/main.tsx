import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { App } from './App';
import { ApiError } from './api/client';
import './index.css';

//cache
const queryClient = new QueryClient({
  defaultOptions: {
    queries:{
      retry:(failureCount, error) =>
        !(error instanceof ApiError && error.status <500) && failureCount <2,

    },
  },
});
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>
)