import React, { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [token, setToken] = useState(localStorage.getItem('token') || null);
    const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')) || null);
    const [loading, setLoading] = useState(true); // Loading state for initializing auth

    useEffect(() => {
        // If we have a token but no user info, maybe we fetch the profile here in a real app
        // Currently, we'll assume user info is saved on login
        setLoading(false);
    }, []);

    const login = (jwtToken, userInfo) => {
        localStorage.setItem('token', jwtToken);
        localStorage.setItem('user', JSON.stringify(userInfo));
        setToken(jwtToken);
        setUser(userInfo);
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setToken(null);
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ token, user, login, logout, loading }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
