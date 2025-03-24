import React, { useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { useRouter } from 'next/navigation';
import styles from '@/styles/Login.module.css';
import { jwtDecode } from 'jwt-decode';

interface GoogleUser {
  name: string;
  email: string;
  picture: string;
  sub: string;
}

const LoginPage: React.FC = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleLoginSuccess = async (credentialResponse: any) => {
    try {
      setIsLoading(true);
      console.log('Login Success:', credentialResponse);
      
      const decoded: GoogleUser = jwtDecode(credentialResponse.credential);
      
      const userData = {
        id: decoded.sub,
        name: decoded.name,
        email: decoded.email,
        imageUrl: decoded.picture
      };

      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('credential', credentialResponse.credential);
      
      router.push('/dashboard');
    } catch (error) {
      console.error('Login error:', error);
      setIsLoading(false);
    }
  };

  const handleLoginError = () => {
    console.log('Login Failed');
    setIsLoading(false);
  };

  return (
    <div className={styles.container}>
      <div className={styles.loginBox}>
        <h1 className={styles.title}>WardrobeX</h1>
        <p className={styles.subtitle}>Your AI-Powered Wardrobe Assistant</p>
        
        {isLoading ? (
          <p>Logging you in...</p>
        ) : (
          <GoogleLogin
            onSuccess={handleLoginSuccess}
            onError={handleLoginError}
            useOneTap
          />
        )}
      </div>
    </div>
  );
};

export default LoginPage; 