// app/(auth)/login.js
import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Device from 'expo-device';
import { useAuth } from '@/contexts/AuthContext';

export default function LoginScreen() {
    const router = useRouter();
    const { login } = useAuth();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        // Validation
        if (!email.trim() || !password.trim()) {
            Alert.alert('Error', 'Please enter email and password');
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            Alert.alert('Error', 'Please enter a valid email address');
            return;
        }

        try {
            setLoading(true);
            const deviceId = Device.osInternalBuildId || Device.modelId || 'unknown_device';

            const result = await login(email, password, deviceId);

            if (result.success) {
                router.replace('/(tabs)');
            } else {
                Alert.alert('Login Failed', result.message || 'Invalid credentials');
            }
        } catch (error) {
            Alert.alert('Error', 'Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#111827' }} edges={['top', 'bottom']}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView
                    contentContainerStyle={{ flexGrow: 1, padding: 24 }}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    {/* Logo/Title */}
                    <View style={{ alignItems: 'center', marginTop: 60, marginBottom: 40 }}>
                        <View style={{
                            width: 80,
                            height: 80,
                            borderRadius: 40,
                            backgroundColor: '#ef4444',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginBottom: 24
                        }}>
                            <Ionicons name="film" size={40} color="#fff" />
                        </View>
                        <Text style={{ fontSize: 32, fontWeight: 'bold', color: '#fff', marginBottom: 8 }}>
                            Welcome Back
                        </Text>
                        <Text style={{ fontSize: 16, color: '#9ca3af' }}>
                            Sign in to continue watching
                        </Text>
                    </View>

                    {/* Email Input */}
                    <View style={{ marginBottom: 20 }}>
                        <Text style={{ fontSize: 14, fontWeight: '600', color: '#fff', marginBottom: 8 }}>
                            Email Address
                        </Text>
                        <View style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            backgroundColor: '#1f2937',
                            borderRadius: 12,
                            borderWidth: 1,
                            borderColor: '#374151',
                            paddingHorizontal: 16,
                        }}>
                            <Ionicons name="mail-outline" size={20} color="#9ca3af" />
                            <TextInput
                                style={{
                                    flex: 1,
                                    height: 56,
                                    marginLeft: 12,
                                    color: '#fff',
                                    fontSize: 16
                                }}
                                placeholder="Enter your email"
                                placeholderTextColor="#6b7280"
                                value={email}
                                onChangeText={setEmail}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                autoCorrect={false}
                                editable={!loading}
                            />
                        </View>
                    </View>

                    {/* Password Input */}
                    <View style={{ marginBottom: 24 }}>
                        <Text style={{ fontSize: 14, fontWeight: '600', color: '#fff', marginBottom: 8 }}>
                            Password
                        </Text>
                        <View style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            backgroundColor: '#1f2937',
                            borderRadius: 12,
                            borderWidth: 1,
                            borderColor: '#374151',
                            paddingHorizontal: 16,
                        }}>
                            <Ionicons name="lock-closed-outline" size={20} color="#9ca3af" />
                            <TextInput
                                style={{
                                    flex: 1,
                                    height: 56,
                                    marginLeft: 12,
                                    color: '#fff',
                                    fontSize: 16
                                }}
                                placeholder="Enter your password"
                                placeholderTextColor="#6b7280"
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry={!showPassword}
                                editable={!loading}
                            />
                            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                                <Ionicons
                                    name={showPassword ? "eye-outline" : "eye-off-outline"}
                                    size={20}
                                    color="#9ca3af"
                                />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Login Button */}
                    <TouchableOpacity
                        style={{
                            backgroundColor: '#ef4444',
                            borderRadius: 12,
                            height: 56,
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginBottom: 20,
                            shadowColor: '#ef4444',
                            shadowOffset: { width: 0, height: 4 },
                            shadowOpacity: 0.3,
                            shadowRadius: 8,
                            elevation: 8
                        }}
                        onPress={handleLogin}
                        disabled={loading}
                        activeOpacity={0.8}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>
                                Sign In
                            </Text>
                        )}
                    </TouchableOpacity>

                    {/* Signup Link */}
                    <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
                        <Text style={{ color: '#9ca3af', fontSize: 16 }}>
                            Don't have an account?{' '}
                        </Text>
                        <TouchableOpacity onPress={() => router.push('/(auth)/signup')} disabled={loading}>
                            <Text style={{ color: '#ef4444', fontSize: 16, fontWeight: 'bold' }}>
                                Sign Up
                            </Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
