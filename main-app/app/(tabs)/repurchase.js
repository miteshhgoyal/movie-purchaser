// app/(tabs)/repurchase.js
import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StatusBar,
    Image,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Device from 'expo-device';
import api from "@/services/api";
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function RepurchaseScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const [loading, setLoading] = useState(false);

    const handleRepurchase = async () => {
        try {
            setLoading(true);
            const deviceId = Device.osInternalBuildId || Device.modelId || 'unknown_device';

            // Create payment order
            const orderResponse = await api.post('/payments/create-order', {
                movieId: params.movieId,
                deviceId: deviceId
            });

            if (!orderResponse.data.success) {
                throw new Error('Failed to create payment order');
            }

            const { orderId, razorpayOrderId } = orderResponse.data;

            // Simulate payment
            Alert.alert(
                'Payment Simulation',
                'Simulating successful payment...',
                [
                    {
                        text: 'Confirm Payment',
                        onPress: async () => {
                            await verifyPayment(orderId, razorpayOrderId);
                        }
                    },
                    {
                        text: 'Cancel',
                        style: 'cancel',
                        onPress: () => setLoading(false)
                    }
                ]
            );
        } catch (error) {
            console.error('Repurchase error:', error);
            Alert.alert('Error', 'Failed to process payment. Please try again.');
            setLoading(false);
        }
    };

    const verifyPayment = async (orderId, razorpayOrderId) => {
        try {
            const response = await api.post('/payments/verify', {
                orderId,
                razorpayOrderId,
                razorpayPaymentId: 'simulated_payment_id',
                razorpaySignature: 'simulated_signature'
            });

            if (response.data.success) {
                const { access } = response.data;

                // Store new access
                const accessKey = `movie_access_${params.movieId}`;
                await AsyncStorage.setItem(accessKey, JSON.stringify(access));

                Alert.alert('Success', 'Payment successful! You can now watch the movie.', [
                    {
                        text: 'Watch Now',
                        onPress: () => {
                            router.replace({
                                pathname: '/video-player',
                                params: {
                                    movieId: params.movieId,
                                    title: params.title,
                                    accessToken: access.token,
                                    videoUrl: access.moviePath
                                }
                            });
                        }
                    }
                ]);
            }
        } catch (error) {
            console.error('Verify payment error:', error);
            Alert.alert('Error', 'Payment verification failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-gray-900">
            <StatusBar barStyle="light-content" backgroundColor="#111827" />

            {/* Header */}
            <View className="flex-row items-center px-4 pt-3 pb-4 border-b border-gray-800">
                <TouchableOpacity
                    className="w-10 h-10 rounded-full bg-gray-800 items-center justify-center mr-3"
                    onPress={() => router.back()}
                >
                    <Ionicons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                <Text className="text-white text-xl font-bold">Rent Again</Text>
            </View>

            {/* Content */}
            <View className="flex-1 items-center justify-center px-6">
                {/* Movie Poster */}
                <View className="w-48 h-72 rounded-2xl overflow-hidden mb-6"
                    style={{
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 8 },
                        shadowOpacity: 0.5,
                        shadowRadius: 16,
                        elevation: 16
                    }}
                >
                    {params.posterPath ? (
                        <Image
                            source={{ uri: params.posterPath }}
                            className="w-full h-full"
                            resizeMode="cover"
                        />
                    ) : (
                        <View className="w-full h-full bg-gray-800 items-center justify-center">
                            <Ionicons name="film-outline" size={80} color="#6b7280" />
                        </View>
                    )}
                </View>

                {/* Expired Badge */}
                <View className="bg-red-600/20 border-2 border-red-600 rounded-full px-6 py-2 mb-4">
                    <Text className="text-red-400 font-bold">Access Expired</Text>
                </View>

                <Text className="text-white text-2xl font-bold text-center mb-3">
                    {params.title}
                </Text>

                <Text className="text-gray-400 text-center text-base mb-8 leading-6">
                    Your watch time has expired. Rent this movie again to continue watching.
                </Text>

                {/* Price Card */}
                <View className="bg-yellow-500 rounded-2xl px-8 py-4 mb-8">
                    <Text className="text-gray-900 text-center font-semibold mb-1">Rental Price</Text>
                    <Text className="text-gray-900 text-4xl font-bold text-center">₹{params.price}</Text>
                </View>

                {/* Rent Button */}
                <TouchableOpacity
                    className="bg-red-600 rounded-xl py-4 px-8 w-full mb-4"
                    onPress={handleRepurchase}
                    disabled={loading}
                    activeOpacity={0.8}
                    style={{
                        shadowColor: '#ef4444',
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.4,
                        shadowRadius: 8,
                        elevation: 8
                    }}
                >
                    {loading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <View className="flex-row items-center justify-center">
                            <Ionicons name="refresh" size={24} color="#fff" />
                            <Text className="text-white font-bold text-lg ml-2">
                                Rent Again
                            </Text>
                        </View>
                    )}
                </TouchableOpacity>

                {/* Go Back Button */}
                <TouchableOpacity
                    className="py-3"
                    onPress={() => router.back()}
                >
                    <Text className="text-gray-400 font-semibold">Go Back</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}
