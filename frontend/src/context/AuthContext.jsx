import React, { createContext, useState, useEffect } from 'react';
import API from '../api/axios';
import { jwtDecode } from "jwt-decode";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // ▶️ Charger l'état utilisateur depuis le token localStorage
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      const decoded = jwtDecode(token);
      setUser({
        id: decoded.user_id,         // ✅ important pour filtrer les soumissions
        email: decoded.email,
        role: decoded.role,
        exp: decoded.exp
      });
    }
    setLoading(false);
  }, []);

  // ▶️ Fonction de connexion (login)
  const login = async (username, password) => {
    // Envoie username, email (pour compat future), et password
    const response = await API.post('/auth/token/', { username, email: username, password });
    const { access, refresh } = response.data;

    localStorage.setItem('access_token', access);
    localStorage.setItem('refresh_token', refresh);

    const decoded = jwtDecode(access);
    setUser({
      id: decoded.user_id,
      email: decoded.email,
      role: decoded.role,
      exp: decoded.exp
    });
  };


  // ▶️ Déconnexion
  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
  {children}
</AuthContext.Provider>
  );
};
