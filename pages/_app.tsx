import React from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import type { AppProps } from 'next/app';
import { Toaster } from 'react-hot-toast';

function MyApp({ Component, pageProps }: AppProps) {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  
  console.log('Client ID:', clientId);

  if (!clientId) {
    console.error('NEXT_PUBLIC_GOOGLE_CLIENT_ID is not defined');
    return null;
  }

  return (
    <GoogleOAuthProvider clientId={clientId}>
      <Component {...pageProps} />
      <Toaster 
        position="top-center"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            style: {
              background: '#4CAF50',
            },
          },
          error: {
            style: {
              background: '#f44336',
            },
          },
        }}
      />
    </GoogleOAuthProvider>
  );
}

export default MyApp; 