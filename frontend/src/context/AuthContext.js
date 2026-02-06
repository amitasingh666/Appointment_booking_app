import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../api/axios';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
        setLoading(false);
    }, []);

    const login = async (email, password) => {
        try {
            const response = await api.post('/auth/login', { email, password });
            const userData = response.data;
            // userData includes: { message, token, user: { id, fullName, email, role } }
            // We want to store token + user details
            const dataToStore = {
                token: userData.token,
                ...userData.user
            };

            localStorage.setItem('user', JSON.stringify(dataToStore));
            setUser(dataToStore);
            return dataToStore;
        } catch (error) {
            throw error.response?.data?.message || 'Login failed';
        }
    };

    const register = async (fullName, email, password, phone, role, category, specialization) => {
        try {
            const response = await api.post('/auth/register', {
                fullName, email, password, phone, role, category, specialization
            });

            const userData = response.data;
            const dataToStore = {
                token: userData.token,
                ...userData.user
            };

            localStorage.setItem('user', JSON.stringify(dataToStore));
            setUser(dataToStore);
            return dataToStore;
        } catch (error) {
            throw error.response?.data?.message || 'Registration failed';
        }
    };

    const logout = () => {
        localStorage.removeItem('user');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, register, logout, loading }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
