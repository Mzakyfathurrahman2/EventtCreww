import { useState, useEffect } from 'react';
import { authApi } from '../api/authApi';

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          const res = await authApi.getMe();
          setUser(res.data.data);
        }
      } catch (error) {
        console.error('Failed to get user profile', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  return { user, loading };
};
