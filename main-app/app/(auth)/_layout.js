// app/(auth)/_layout.js
import { Stack } from 'expo-router';
import { StatusBar } from 'react-native';

export default function AuthLayout() {
    return (
        <>
            <StatusBar barStyle="light-content" backgroundColor="#111827" />
            <Stack
                screenOptions={{
                    headerShown: false,
                    contentStyle: { backgroundColor: '#111827' },
                    animation: 'slide_from_right'
                }}
            >
                <Stack.Screen name="login" />
                <Stack.Screen name="signup" />
            </Stack>
        </>
    );
}
