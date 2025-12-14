// app/(tabs)/movie-details.js
import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    StatusBar,
    Image,
    Alert,
    Modal,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Device from 'expo-device';
import api from "@/services/api";

export default function MovieDetailsScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const [movie, setMovie] = useState(null);
    const [loading, setLoading] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [processingPayment, setProcessingPayment] = useState(false);
    const [hasAccess, setHasAccess] = useState(false);
    const [accessInfo, setAccessInfo] = useState(null);

    // Fetch movie details from API
    const fetchMovieDetails = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/movies/${params.movieId}`);

            if (response.data.success) {
                setMovie(response.data.movie);
            }
        } catch (error) {
            console.error('Error fetching movie details:', error);
        } finally {
            setLoading(false);
        }
    };

    // Check if user has active access
    const checkAccess = async () => {
        try {
            const accessKey = `movie_access_${params.movieId}`;
            const storedAccess = await AsyncStorage.getItem(accessKey);

            if (storedAccess) {
                const access = JSON.parse(storedAccess);
                const now = new Date().getTime();
                const expiryTime = new Date(access.expiryTime).getTime();

                if (now < expiryTime) {
                    setHasAccess(true);
                    setAccessInfo(access);
                    return true;
                } else {
                    // Access expired, remove it
                    await AsyncStorage.removeItem(accessKey);
                    setHasAccess(false);
                    setAccessInfo(null);
                    return false;
                }
            }
            return false;
        } catch (error) {
            console.error('Error checking access:', error);
            return false;
        }
    };

    useEffect(() => {
        if (params.movieId) {
            fetchMovieDetails();
            checkAccess();
        }
    }, [params.movieId]);

    // Re-check access when screen is focused
    useEffect(() => {
        const unsubscribe = router.addListener?.('focus', () => {
            checkAccess();
        });
        return unsubscribe;
    }, []);

    // Format duration
    const formatDuration = (seconds) => {
        if (!seconds) return 'N/A';
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        }
        return `${minutes}m`;
    };

    // Get remaining time
    const getRemainingTime = () => {
        if (!accessInfo) return '';
        const now = new Date().getTime();
        const expiryTime = new Date(accessInfo.expiryTime).getTime();
        const remainingMs = expiryTime - now;

        if (remainingMs <= 0) return 'Expired';

        const hours = Math.floor(remainingMs / (1000 * 60 * 60));
        const minutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));

        return `${hours}h ${minutes}m remaining`;
    };

    // Handle play movie
    const handlePlayMovie = async () => {
        // Re-check access before playing
        const hasValidAccess = await checkAccess();

        if (hasValidAccess && accessInfo) {
            // Navigate to video player
            router.push({
                pathname: '/video-player',
                params: {
                    movieId: displayMovie.movieId || displayMovie._id,
                    title: displayMovie.title,
                    accessToken: accessInfo.token,
                    videoUrl: displayMovie.filePath // Pass video URL directly
                }
            });
        } else {
            // Show payment modal
            setShowPaymentModal(true);
        }
    };

    // Handle payment
    const handlePayment = async () => {
        try {
            setProcessingPayment(true);

            // Get device ID
            const deviceId = Device.osInternalBuildId || Device.modelId || 'unknown_device';

            // Create payment order
            const orderResponse = await api.post('/payments/create-order', {
                movieId: displayMovie.movieId,
                deviceId: deviceId
            });

            if (!orderResponse.data.success) {
                throw new Error('Failed to create payment order');
            }

            const { orderId, amount, razorpayOrderId } = orderResponse.data;

            // TODO: Integrate Razorpay SDK here
            // For now, simulate successful payment
            Alert.alert(
                'Payment Simulation',
                'In production, Razorpay payment gateway will open here.\n\nSimulating successful payment...',
                [
                    {
                        text: 'Simulate Success',
                        onPress: async () => {
                            await verifyPayment(orderId, razorpayOrderId, 'simulated_payment_id');
                        }
                    },
                    {
                        text: 'Cancel',
                        style: 'cancel',
                        onPress: () => setProcessingPayment(false)
                    }
                ]
            );

        } catch (error) {
            console.error('Payment error:', error);
            Alert.alert('Error', error.response?.data?.message || 'Payment failed. Please try again.');
            setProcessingPayment(false);
        }
    };

    // Verify payment and get access
    const verifyPayment = async (orderId, razorpayOrderId, razorpayPaymentId) => {
        try {
            const response = await api.post('/payments/verify', {
                orderId: orderId,
                razorpayOrderId: razorpayOrderId,
                razorpayPaymentId: razorpayPaymentId,
                razorpaySignature: 'simulated_signature'
            });

            if (response.data.success) {
                const { access } = response.data;

                // Store access token locally
                const accessKey = `movie_access_${params.movieId}`;
                await AsyncStorage.setItem(accessKey, JSON.stringify(access));

                setHasAccess(true);
                setAccessInfo(access);
                setShowPaymentModal(false);
                setProcessingPayment(false);

                // Immediately navigate to video player
                router.push({
                    pathname: '/video-player',
                    params: {
                        movieId: displayMovie.movieId || displayMovie._id,
                        title: displayMovie.title,
                        accessToken: access.token,
                        videoUrl: displayMovie.filePath
                    }
                });
            } else {
                throw new Error('Payment verification failed');
            }
        } catch (error) {
            console.error('Verification error:', error);
            Alert.alert('Error', 'Payment verification failed. Please contact support.');
            setProcessingPayment(false);
        }
    };

    const displayMovie = {
        movieId: params.movieId,
        title: params.title,
        description: params.description,
        price: params.price,
        durationSeconds: params.duration,
        posterPath: params.posterPath,
        status: params.status,
        filePath: params.filePath,
        ...(movie || {})
    };

    return (
        <SafeAreaView className="flex-1 bg-gray-900" edges={['top', 'bottom']}>
            <StatusBar barStyle="light-content" backgroundColor="#111827" />

            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Header with Poster */}
                <View className="relative" style={{ height: 500 }}>
                    <View className="absolute inset-0 bg-gray-800">
                        {displayMovie.posterPath && displayMovie.posterPath !== 'null' ? (
                            <Image
                                source={{ uri: displayMovie.posterPath }}
                                className="w-full h-full"
                                resizeMode="cover"
                            />
                        ) : (
                            <View className="w-full h-full bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 items-center justify-center">
                                <Ionicons name="film-outline" size={100} color="rgba(255,255,255,0.3)" />
                            </View>
                        )}
                    </View>

                    <View className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/60 to-transparent" />

                    {/* Back Button */}
                    <TouchableOpacity
                        className="absolute left-4 bg-black/50 w-12 h-12 rounded-full items-center justify-center"
                        style={{ top: 60 }}
                        onPress={() => router.back()}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="arrow-back" size={24} color="#fff" />
                    </TouchableOpacity>

                    {/* Play Button */}
                    <View className="absolute inset-0 items-center justify-center">
                        <TouchableOpacity
                            className="bg-red-600 w-20 h-20 rounded-full items-center justify-center"
                            onPress={handlePlayMovie}
                            activeOpacity={0.8}
                            style={{
                                shadowColor: '#ef4444',
                                shadowOffset: { width: 0, height: 0 },
                                shadowOpacity: 0.8,
                                shadowRadius: 15,
                                elevation: 15
                            }}
                        >
                            <Ionicons name="play" size={40} color="#fff" style={{ marginLeft: 4 }} />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Movie Info */}
                <View className="px-6 py-6">
                    {/* Title */}
                    <Text className="text-white text-3xl font-bold mb-4">
                        {displayMovie.title}
                    </Text>

                    {/* Meta Info */}
                    <View className="flex-row items-center mb-6 flex-wrap">
                        <View className="bg-yellow-500 px-3 py-1.5 rounded-lg mr-3 mb-2">
                            <Text className="text-gray-900 font-bold text-base">
                                ₹{displayMovie.price}
                            </Text>
                        </View>

                        <View className="flex-row items-center bg-gray-800 px-3 py-1.5 rounded-lg mr-3 mb-2">
                            <Ionicons name="time-outline" size={18} color="#9ca3af" />
                            <Text className="text-gray-300 ml-2 font-semibold">
                                {formatDuration(displayMovie.durationSeconds)}
                            </Text>
                        </View>

                        {displayMovie.movieId && (
                            <View className="flex-row items-center bg-gray-800 px-3 py-1.5 rounded-lg mb-2">
                                <Ionicons name="code-outline" size={18} color="#9ca3af" />
                                <Text className="text-gray-300 ml-2 font-semibold text-sm">
                                    {displayMovie.movieId}
                                </Text>
                            </View>
                        )}
                    </View>

                    {/* Access Status */}
                    {hasAccess && accessInfo && (
                        <View className="bg-green-900/30 border border-green-500 rounded-xl p-4 mb-6">
                            <View className="flex-row items-center mb-2">
                                <Ionicons name="checkmark-circle" size={24} color="#22c55e" />
                                <Text className="text-green-400 font-bold text-lg ml-2">Active Access</Text>
                            </View>
                            <Text className="text-green-300 text-sm">
                                {getRemainingTime()}
                            </Text>
                        </View>
                    )}

                    {/* Description Section */}
                    <View className="mb-6">
                        <Text className="text-white text-xl font-bold mb-3">Overview</Text>
                        <Text className="text-gray-300 text-base leading-6">
                            {displayMovie.description || 'No description available for this movie.'}
                        </Text>
                    </View>

                    {/* Play Button */}
                    <TouchableOpacity
                        className="bg-red-600 rounded-xl py-4 flex-row items-center justify-center mb-6"
                        onPress={handlePlayMovie}
                        activeOpacity={0.8}
                        style={{
                            shadowColor: '#ef4444',
                            shadowOffset: { width: 0, height: 4 },
                            shadowOpacity: 0.4,
                            shadowRadius: 8,
                            elevation: 8
                        }}
                    >
                        <Ionicons name="play-circle" size={24} color="#fff" />
                        <Text className="text-white font-bold text-lg ml-2">
                            {hasAccess ? 'Watch Now' : 'Rent & Watch'}
                        </Text>
                    </TouchableOpacity>

                    {/* Info Cards */}
                    <View>
                        <View className="bg-gray-800 rounded-xl p-4 flex-row items-center justify-between mb-3">
                            <View className="flex-row items-center">
                                <View className="bg-blue-600 w-12 h-12 rounded-lg items-center justify-center mr-3">
                                    <Ionicons name="videocam" size={24} color="#fff" />
                                </View>
                                <View>
                                    <Text className="text-white font-bold text-base">Quality</Text>
                                    <Text className="text-gray-400 text-sm">HD Available</Text>
                                </View>
                            </View>
                            <Ionicons name="checkmark-circle" size={24} color="#22c55e" />
                        </View>

                        <View className="bg-gray-800 rounded-xl p-4 flex-row items-center justify-between mb-3">
                            <View className="flex-row items-center">
                                <View className="bg-purple-600 w-12 h-12 rounded-lg items-center justify-center mr-3">
                                    <Ionicons name="language" size={24} color="#fff" />
                                </View>
                                <View>
                                    <Text className="text-white font-bold text-base">Language</Text>
                                    <Text className="text-gray-400 text-sm">Multiple Audio Tracks</Text>
                                </View>
                            </View>
                            <Ionicons name="checkmark-circle" size={24} color="#22c55e" />
                        </View>

                        <View className="bg-gray-800 rounded-xl p-4 flex-row items-center justify-between mb-3">
                            <View className="flex-row items-center">
                                <View className="bg-pink-600 w-12 h-12 rounded-lg items-center justify-center mr-3">
                                    <Ionicons name="text" size={24} color="#fff" />
                                </View>
                                <View>
                                    <Text className="text-white font-bold text-base">Subtitles</Text>
                                    <Text className="text-gray-400 text-sm">Available</Text>
                                </View>
                            </View>
                            <Ionicons name="checkmark-circle" size={24} color="#22c55e" />
                        </View>
                    </View>
                </View>

                <View className="h-10" />
            </ScrollView>

            {/* Payment Modal */}
            <Modal
                visible={showPaymentModal}
                transparent
                animationType="slide"
                onRequestClose={() => !processingPayment && setShowPaymentModal(false)}
            >
                <View className="flex-1 bg-black/70 justify-end">
                    <View className="bg-gray-900 rounded-t-3xl p-6" style={{ maxHeight: '80%' }}>
                        <View className="flex-row items-center justify-between mb-6">
                            <Text className="text-white text-2xl font-bold">Rent Movie</Text>
                            <TouchableOpacity
                                onPress={() => !processingPayment && setShowPaymentModal(false)}
                                disabled={processingPayment}
                            >
                                <Ionicons name="close-circle" size={32} color="#9ca3af" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false}>
                            {/* Price Card */}
                            <View className="bg-gradient-to-br from-yellow-500 to-orange-500 rounded-2xl p-6 mb-6 items-center">
                                <Text className="text-gray-100 text-lg font-semibold mb-2">Rental Price</Text>
                                <Text className="text-gray-100 text-5xl font-bold">₹{displayMovie.price}</Text>
                            </View>

                            {/* Access Duration */}
                            <View className="bg-gray-800 rounded-xl p-4 mb-6">
                                <View className="flex-row items-center mb-3">
                                    <Ionicons name="time" size={24} color="#22c55e" />
                                    <Text className="text-white font-bold text-lg ml-2">Access Duration</Text>
                                </View>
                                <Text className="text-gray-300 text-base">
                                    Watch for {formatDuration((displayMovie.durationSeconds || 0) + 1800)} after payment
                                </Text>
                                <Text className="text-gray-400 text-sm mt-2">
                                    (Movie duration + 30 minutes extra)
                                </Text>
                            </View>

                            {/* Important Guidelines */}
                            <View className="bg-red-900/20 border border-red-500 rounded-xl p-4 mb-6">
                                <View className="flex-row items-center mb-3">
                                    <Ionicons name="warning" size={24} color="#ef4444" />
                                    <Text className="text-red-400 font-bold text-lg ml-2">Important Guidelines</Text>
                                </View>
                                <View>
                                    <View className="flex-row mb-2">
                                        <Text className="text-red-300 mr-2">•</Text>
                                        <Text className="text-gray-300 flex-1">Access is device-specific and cannot be transferred</Text>
                                    </View>
                                    <View className="flex-row mb-2">
                                        <Text className="text-red-300 mr-2">•</Text>
                                        <Text className="text-gray-300 flex-1">Do NOT uninstall the app during your access period</Text>
                                    </View>
                                    <View className="flex-row mb-2">
                                        <Text className="text-red-300 mr-2">•</Text>
                                        <Text className="text-gray-300 flex-1">You can pause and resume playback unlimited times</Text>
                                    </View>
                                    <View className="flex-row mb-2">
                                        <Text className="text-red-300 mr-2">•</Text>
                                        <Text className="text-gray-300 flex-1">Access expires automatically after the time limit</Text>
                                    </View>
                                    <View className="flex-row mb-2">
                                        <Text className="text-red-300 mr-2">•</Text>
                                        <Text className="text-gray-300 flex-1">No refunds after payment is successful</Text>
                                    </View>
                                    <View className="flex-row">
                                        <Text className="text-red-300 mr-2">•</Text>
                                        <Text className="text-gray-300 flex-1">Internet connection required for streaming</Text>
                                    </View>
                                </View>
                            </View>

                            {/* Payment Button */}
                            <TouchableOpacity
                                className="bg-green-600 rounded-xl py-4 items-center mb-4"
                                onPress={handlePayment}
                                disabled={processingPayment}
                                activeOpacity={0.8}
                                style={{
                                    opacity: processingPayment ? 0.5 : 1,
                                    shadowColor: '#22c55e',
                                    shadowOffset: { width: 0, height: 4 },
                                    shadowOpacity: 0.4,
                                    shadowRadius: 8,
                                    elevation: 8
                                }}
                            >
                                {processingPayment ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <View className="flex-row items-center">
                                        <Ionicons name="card" size={24} color="#fff" />
                                        <Text className="text-white font-bold text-lg ml-2">
                                            Proceed to Payment
                                        </Text>
                                    </View>
                                )}
                            </TouchableOpacity>

                            <Text className="text-gray-500 text-xs text-center">
                                Secured by Razorpay Payment Gateway
                            </Text>
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}
