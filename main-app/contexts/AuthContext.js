// contexts/AuthContext.js
import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [accessToken, setAccessToken] = useState(null);
    const [refreshToken, setRefreshToken] = useState(null);
    const [loading, setLoading] = useState(true);

    // Load tokens on mount
    useEffect(() => {
        loadTokens();
    }, []);

    const loadTokens = async () => {
        try {
            const storedAccessToken = await AsyncStorage.getItem('accessToken');
            const storedRefreshToken = await AsyncStorage.getItem('refreshToken');
            const storedUser = await AsyncStorage.getItem('user');

            if (storedAccessToken && storedUser) {
                setAccessToken(storedAccessToken);
                setRefreshToken(storedRefreshToken);
                setUser(JSON.parse(storedUser));

                // Set authorization header
                api.defaults.headers.common['Authorization'] = `Bearer ${storedAccessToken}`;
            }
        } catch (error) {
            console.error('Load tokens error:', error);
        } finally {
            setLoading(false);
        }
    };

    const login = async (email, password, deviceId) => {
        try {
            const response = await api.post('/auth/login', {
                email,
                password,
                deviceId
            });

            if (response.data.success) {
                const { user, accessToken, refreshToken } = response.data;

                // Store tokens and user
                await AsyncStorage.setItem('accessToken', accessToken);
                await AsyncStorage.setItem('refreshToken', refreshToken);
                await AsyncStorage.setItem('user', JSON.stringify(user));

                setAccessToken(accessToken);
                setRefreshToken(refreshToken);
                setUser(user);

                // Set authorization header
                api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;

                return { success: true };
            }
            return { success: false, message: response.data.message };
        } catch (error) {
            console.error('Login error:', error);
            return {
                success: false,
                message: error.response?.data?.message || 'Login failed'
            };
        }
    };

    const signup = async (name, email, password, deviceId) => {
        try {
            const response = await api.post('/auth/signup', {
                name,
                email,
                password,
                deviceId
            });

            if (response.data.success) {
                const { user, accessToken, refreshToken } = response.data;

                // Store tokens and user
                await AsyncStorage.setItem('accessToken', accessToken);
                await AsyncStorage.setItem('refreshToken', refreshToken);
                await AsyncStorage.setItem('user', JSON.stringify(user));

                setAccessToken(accessToken);
                setRefreshToken(refreshToken);
                setUser(user);

                // Set authorization header
                api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;

                return { success: true };
            }
            return { success: false, message: response.data.message };
        } catch (error) {
            console.error('Signup error:', error);
            return {
                success: false,
                message: error.response?.data?.message || 'Signup failed'
            };
        }
    };

    const logout = async () => {
        try {
            // Clear storage
            await AsyncStorage.removeItem('accessToken');
            await AsyncStorage.removeItem('refreshToken');
            await AsyncStorage.removeItem('user');

            // Clear state
            setAccessToken(null);
            setRefreshToken(null);
            setUser(null);

            // Remove authorization header
            delete api.defaults.headers.common['Authorization'];
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    const refreshAccessToken = async () => {
        try {
            const response = await api.post('/auth/refresh-token', {
                refreshToken
            });

            if (response.data.success) {
                const { accessToken: newAccessToken, refreshToken: newRefreshToken } = response.data;

                await AsyncStorage.setItem('accessToken', newAccessToken);
                await AsyncStorage.setItem('refreshToken', newRefreshToken);

                setAccessToken(newAccessToken);
                setRefreshToken(newRefreshToken);

                api.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`;

                return true;
            }
            return false;
        } catch (error) {
            console.error('Refresh token error:', error);
            await logout();
            return false;
        }
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                accessToken,
                refreshToken,
                loading,
                login,
                signup,
                logout,
                refreshAccessToken,
                isAuthenticated: !!user
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
