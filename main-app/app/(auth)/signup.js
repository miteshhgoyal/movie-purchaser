// app/(auth)/signup.js
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

export default function SignupScreen() {
    const router = useRouter();
    const { signup } = useAuth();

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSignup = async () => {
        // Validation
        if (!name.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        if (name.trim().length < 2) {
            Alert.alert('Error', 'Name must be at least 2 characters long');
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            Alert.alert('Error', 'Please enter a valid email address');
            return;
        }

        if (password.length < 6) {
            Alert.alert('Error', 'Password must be at least 6 characters long');
            return;
        }

        if (password !== confirmPassword) {
            Alert.alert('Error', 'Passwords do not match');
            return;
        }

        try {
            setLoading(true);
            const deviceId = Device.osInternalBuildId || Device.modelId || 'unknown_device';

            const result = await signup(name, email, password, deviceId);

            if (result.success) {
                Alert.alert('Success', 'Account created successfully!', [
                    { text: 'OK', onPress: () => router.replace('/(tabs)') }
                ]);
            } else {
                Alert.alert('Signup Failed', result.message || 'Could not create account');
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
                    {/* Back Button */}
                    <TouchableOpacity
                        style={{
                            width: 40,
                            height: 40,
                            borderRadius: 20,
                            backgroundColor: '#1f2937',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginBottom: 20
                        }}
                        onPress={() => router.back()}
                    >
                        <Ionicons name="arrow-back" size={24} color="#fff" />
                    </TouchableOpacity>

                    {/* Title */}
                    <View style={{ marginBottom: 32 }}>
                        <Text style={{ fontSize: 32, fontWeight: 'bold', color: '#fff', marginBottom: 8 }}>
                            Create Account
                        </Text>
                        <Text style={{ fontSize: 16, color: '#9ca3af' }}>
                            Sign up to start watching movies
                        </Text>
                    </View>

                    {/* Name Input */}
                    <View style={{ marginBottom: 20 }}>
                        <Text style={{ fontSize: 14, fontWeight: '600', color: '#fff', marginBottom: 8 }}>
                            Full Name
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
                            <Ionicons name="person-outline" size={20} color="#9ca3af" />
                            <TextInput
                                style={{
                                    flex: 1,
                                    height: 56,
                                    marginLeft: 12,
                                    color: '#fff',
                                    fontSize: 16
                                }}
                                placeholder="Enter your name"
                                placeholderTextColor="#6b7280"
                                value={name}
                                onChangeText={setName}
                                editable={!loading}
                            />
                        </View>
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
                    <View style={{ marginBottom: 20 }}>
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
                                placeholder="Create a password"
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

                    {/* Confirm Password Input */}
                    <View style={{ marginBottom: 24 }}>
                        <Text style={{ fontSize: 14, fontWeight: '600', color: '#fff', marginBottom: 8 }}>
                            Confirm Password
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
                                placeholder="Confirm your password"
                                placeholderTextColor="#6b7280"
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                                secureTextEntry={!showConfirmPassword}
                                editable={!loading}
                            />
                            <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                                <Ionicons
                                    name={showConfirmPassword ? "eye-outline" : "eye-off-outline"}
                                    size={20}
                                    color="#9ca3af"
                                />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Signup Button */}
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
                        onPress={handleSignup}
                        disabled={loading}
                        activeOpacity={0.8}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>
                                Create Account
                            </Text>
                        )}
                    </TouchableOpacity>

                    {/* Login Link */}
                    <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
                        <Text style={{ color: '#9ca3af', fontSize: 16 }}>
                            Already have an account?{' '}
                        </Text>
                        <TouchableOpacity onPress={() => router.back()} disabled={loading}>
                            <Text style={{ color: '#ef4444', fontSize: 16, fontWeight: 'bold' }}>
                                Sign In
                            </Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
