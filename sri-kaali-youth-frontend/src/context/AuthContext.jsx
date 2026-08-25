import { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch (e) {
      return null;
    }
  });

  const [token, setToken] = useState(() => localStorage.getItem('token') || null);

  const [pendingLogin, setPendingLoginState] = useState(() => {
    try {
      const savedPending = sessionStorage.getItem('pendingLogin');
      return savedPending ? JSON.parse(savedPending) : null;
    } catch (e) {
      return null;
    }
  });

  const setPendingLoginData = (data) => {
    if (data) {
      sessionStorage.setItem('pendingLogin', JSON.stringify(data));
      setPendingLoginState(data);
    } else {
      sessionStorage.removeItem('pendingLogin');
      setPendingLoginState(null);
    }
  };

  const clearPendingLoginData = () => {
    sessionStorage.removeItem('pendingLogin');
    setPendingLoginState(null);
  };

  const login = (tokenData, userData) => {
    clearPendingLoginData();
    localStorage.setItem('token', tokenData);
    localStorage.setItem('user', JSON.stringify(userData));
    setToken(tokenData);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.removeItem('pendingLogin');
    setToken(null);
    setUser(null);
    setPendingLoginState(null);
  };

  const isAuthenticated = Boolean(token && user);
  const isAdmin = user?.role === 'Admin';
  const isMember = user?.role === 'Member';

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        pendingLogin,
        setPendingLoginData,
        clearPendingLoginData,
        login,
        logout,
        isAuthenticated,
        isAdmin,
        isMember,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
