import { useEffect } from 'react';
import { useRouter } from 'next/router';

export const useAuth = () => {
  const router = useRouter();
  
  useEffect(() => {
    const user = localStorage.getItem('user');
    if (!user && router.pathname !== '/login') {
      router.push('/login');
    }
  }, []);
}; 