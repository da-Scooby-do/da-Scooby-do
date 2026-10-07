import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { handleAuthRedirect } from './lib/authRedirect';

// Finish email-confirmation / Google sign-in returns before the hash router reads the URL.
handleAuthRedirect().finally(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
});
