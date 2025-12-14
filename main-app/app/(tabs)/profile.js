// app/(tabs)/profile.js
import React from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    StatusBar,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import Gradient from '@/components/Gradient';

export default function ProfileScreen() {
    const router = useRouter();
    const { user, logout } = useAuth();

    const handleLogout = () => {
        Alert.alert(
            'Logout',
            'Are you sure you want to logout?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Logout',
                    style: 'destructive',
                    onPress: async () => {
                        await logout();
                        router.replace('/(auth)/login');
                    }
                }
            ]
        );
    };

    const MenuItem = ({ icon, title, subtitle, onPress, iconColor = "#ef4444" }) => (
        <TouchableOpacity
            className="bg-gray-800 rounded-xl p-4 mb-3 flex-row items-center"
            onPress={onPress}
            activeOpacity={0.7}
        >
            <View className="w-12 h-12 rounded-full items-center justify-center mr-4" style={{ backgroundColor: `${iconColor}20` }}>
                <Ionicons name={icon} size={24} color={iconColor} />
            </View>
            <View className="flex-1">
                <Text className="text-white font-bold text-base">{title}</Text>
                {subtitle && (
                    <Text className="text-gray-400 text-sm mt-1">{subtitle}</Text>
                )}
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
        </TouchableOpacity>
    );

    return (
        <SafeAreaView className="flex-1 bg-gray-900">
            <StatusBar barStyle="light-content" backgroundColor="#111827" />

            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Header */}
                <View className="px-6 pt-6 pb-8">
                    <Text className="text-white text-3xl font-bold mb-2">Profile</Text>
                    <Text className="text-gray-400 text-sm">Manage your account settings</Text>
                </View>

                {/* User Info Card */}
                <View className="mx-4 mb-6">
                    <View className="rounded-2xl overflow-hidden">
                        <Gradient type="red" className="p-6">
                            <View className="flex-row items-center mb-4">
                                <View className="w-16 h-16 rounded-full bg-white/20 items-center justify-center mr-4">
                                    <Text className="text-white text-2xl font-bold">
                                        {user?.name?.charAt(0).toUpperCase()}
                                    </Text>
                                </View>
                                <View className="flex-1">
                                    <Text className="text-white text-xl font-bold">{user?.name}</Text>
                                    <Text className="text-white/80 text-sm mt-1">{user?.email}</Text>
                                </View>
                            </View>
                            <View className="flex-row items-center">
                                <Ionicons name="shield-checkmark" size={16} color="#fff" />
                                <Text className="text-white text-xs ml-2">ID: {user?.userId}</Text>
                            </View>
                        </Gradient>
                    </View>
                </View>

                {/* Menu Items */}
                <View className="px-4">
                    <Text className="text-gray-400 text-sm font-bold mb-3 px-2">ACCOUNT</Text>

                    <MenuItem
                        icon="person-outline"
                        title="Edit Profile"
                        subtitle="Update your personal information"
                        onPress={() => Alert.alert('Coming Soon', 'This feature will be available soon')}
                        iconColor="#3b82f6"
                    />

                    <MenuItem
                        icon="library-outline"
                        title="My Library"
                        subtitle="View your purchased movies"
                        onPress={() => router.push('/my-library')}
                        iconColor="#8b5cf6"
                    />

                    <MenuItem
                        icon="card-outline"
                        title="Payment History"
                        subtitle="View all your transactions"
                        onPress={() => Alert.alert('Coming Soon', 'This feature will be available soon')}
                        iconColor="#10b981"
                    />

                    <Text className="text-gray-400 text-sm font-bold mb-3 px-2 mt-6">SUPPORT</Text>

                    <MenuItem
                        icon="help-circle-outline"
                        title="Help & Support"
                        subtitle="Get help with your account"
                        onPress={() => Alert.alert('Coming Soon', 'This feature will be available soon')}
                        iconColor="#6366f1"
                    />

                    <MenuItem
                        icon="document-text-outline"
                        title="Terms & Privacy"
                        subtitle="Read our policies"
                        onPress={() => Alert.alert('Coming Soon', 'This feature will be available soon')}
                        iconColor="#ec4899"
                    />

                    <MenuItem
                        icon="information-circle-outline"
                        title="About"
                        subtitle="Version 1.0.0"
                        onPress={() => Alert.alert('About', 'OTT Movie App v1.0.0')}
                        iconColor="#14b8a6"
                    />

                    {/* Logout Button */}
                    <TouchableOpacity
                        className="bg-red-600/20 border border-red-600 rounded-xl p-4 mt-6 mb-8 flex-row items-center justify-center"
                        onPress={handleLogout}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="log-out-outline" size={24} color="#ef4444" />
                        <Text className="text-red-500 font-bold text-base ml-3">Logout</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
