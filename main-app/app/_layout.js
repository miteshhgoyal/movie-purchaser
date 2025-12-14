// app/_layout.js
import React, { useEffect, useState } from 'react';
import { Stack, useSegments, useRouter, useRootNavigationState } from 'expo-router';
import { StatusBar, View, ActivityIndicator } from 'react-native';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import './globals.css';

function NavigationContent() {
    const { isAuthenticated, loading } = useAuth();
    const segments = useSegments();
    const router = useRouter();
    const navigationState = useRootNavigationState();
    const [isNavigationReady, setIsNavigationReady] = useState(false);

    useEffect(() => {
        if (navigationState?.key) {
            setIsNavigationReady(true);
        }
    }, [navigationState]);

    useEffect(() => {
        if (!isNavigationReady || loading) {
            return;
        }

        const inAuthGroup = segments[0] === '(auth)';
        const inTabsGroup = segments[0] === '(tabs)';

        if (!isAuthenticated && !inAuthGroup) {
            // User is not authenticated, redirect to login
            router.replace('/(auth)/login');
        } else if (isAuthenticated && inAuthGroup) {
            // User is authenticated but on auth screen, redirect to tabs
            router.replace('/(tabs)');
        }
    }, [isAuthenticated, segments, isNavigationReady, loading]);

    if (!isNavigationReady || loading) {
        return (
            <View style={{ flex: 1, backgroundColor: '#111827', alignItems: 'center', justifyContent: 'center' }}>
                <ActivityIndicator size="large" color="#ef4444" />
            </View>
        );
    }

    return (
        <>
            <StatusBar barStyle="light-content" backgroundColor="#111827" />
            <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen
                    name="(auth)"
                    options={{
                        headerShown: false,
                        animation: 'fade'
                    }}
                />
                <Stack.Screen
                    name="(tabs)"
                    options={{
                        headerShown: false,
                        animation: 'fade'
                    }}
                />
            </Stack>
        </>
    );
}

export default function RootLayout() {
    return (
        <AuthProvider>
            <NavigationContent />
        </AuthProvider>
    );
}
