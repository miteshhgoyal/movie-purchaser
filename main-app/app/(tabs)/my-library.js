// app/(tabs)/my-library.js
import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    StatusBar,
    ActivityIndicator,
    Image,
    RefreshControl,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from "@/services/api";
import { useAuth } from '../../contexts/AuthContext';

export default function MyLibraryScreen() {
    const router = useRouter();
    const { user } = useAuth();
    const [purchases, setPurchases] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [filter, setFilter] = useState('all'); // all, active, expired

    // Fetch user purchases
    const fetchPurchases = async () => {
        try {
            setLoading(true);

            // Get all stored access tokens
            const allKeys = await AsyncStorage.getAllKeys();
            const accessKeys = allKeys.filter(key => key.startsWith('movie_access_'));

            const accessPromises = accessKeys.map(async (key) => {
                const data = await AsyncStorage.getItem(key);
                return data ? JSON.parse(data) : null;
            });

            const allAccess = await Promise.all(accessPromises);
            const validAccess = allAccess.filter(a => a !== null);

            // Fetch movie details for each access
            const purchasesWithMovies = await Promise.all(
                validAccess.map(async (access) => {
                    try {
                        const response = await api.get(`/movies/${access.movieId}`);
                        return {
                            ...access,
                            movie: response.data.movie,
                            isActive: new Date(access.expiryTime) > new Date()
                        };
                    } catch (error) {
                        return null;
                    }
                })
            );

            const filtered = purchasesWithMovies.filter(p => p !== null);
            setPurchases(filtered);
        } catch (error) {
            console.error('Error fetching purchases:', error);
            Alert.alert('Error', 'Failed to load your library');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPurchases();
    }, []);

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchPurchases();
        setRefreshing(false);
    };

    const formatDuration = (seconds) => {
        if (!seconds) return 'N/A';
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
    };

    const getRemainingTime = (expiryTime) => {
        const now = new Date().getTime();
        const expiry = new Date(expiryTime).getTime();
        const remainingMs = expiry - now;

        if (remainingMs <= 0) return 'Expired';

        const hours = Math.floor(remainingMs / (1000 * 60 * 60));
        const minutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
        return `${hours}h ${minutes}m left`;
    };

    const handlePlayMovie = (purchase) => {
        if (!purchase.isActive) {
            // Navigate to repurchase screen
            router.push({
                pathname: '/repurchase',
                params: {
                    movieId: purchase.movie.movieId,
                    title: purchase.movie.title,
                    price: purchase.movie.price,
                    posterPath: purchase.movie.posterPath
                }
            });
        } else {
            // Navigate to video player
            router.push({
                pathname: '/video-player',
                params: {
                    movieId: purchase.movie.movieId,
                    title: purchase.movie.title,
                    accessToken: purchase.token,
                    videoUrl: purchase.movie.filePath
                }
            });
        }
    };

    const getFilteredPurchases = () => {
        switch (filter) {
            case 'active':
                return purchases.filter(p => p.isActive);
            case 'expired':
                return purchases.filter(p => !p.isActive);
            default:
                return purchases;
        }
    };

    const renderPurchaseCard = ({ item }) => (
        <TouchableOpacity
            className="mx-4 mb-4"
            onPress={() => handlePlayMovie(item)}
            activeOpacity={0.7}
        >
            <View className="bg-gray-800 rounded-xl overflow-hidden flex-row"
                style={{
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.3,
                    shadowRadius: 4,
                    elevation: 4
                }}
            >
                {/* Thumbnail */}
                <View className="w-28 h-40 bg-gray-700">
                    {item.movie?.posterPath ? (
                        <Image
                            source={{ uri: item.movie.posterPath }}
                            className="w-full h-full"
                            resizeMode="cover"
                        />
                    ) : (
                        <View className="w-full h-full items-center justify-center">
                            <Ionicons name="film-outline" size={40} color="rgba(255,255,255,0.3)" />
                        </View>
                    )}

                    {/* Status Badge */}
                    <View className={`absolute bottom-2 left-2 px-2 py-1 rounded ${item.isActive ? 'bg-green-500' : 'bg-red-500'
                        }`}>
                        <Text className="text-white text-xs font-bold">
                            {item.isActive ? 'Active' : 'Expired'}
                        </Text>
                    </View>
                </View>

                {/* Info */}
                <View className="flex-1 p-4 justify-between">
                    <View>
                        <Text className="text-white text-lg font-bold mb-1" numberOfLines={2}>
                            {item.movie?.title}
                        </Text>
                        <Text className="text-gray-400 text-sm mb-2">
                            {formatDuration(item.movie?.durationSeconds)}
                        </Text>
                    </View>

                    <View>
                        <View className="flex-row items-center mb-2">
                            <Ionicons
                                name={item.isActive ? "time-outline" : "close-circle"}
                                size={16}
                                color={item.isActive ? "#22c55e" : "#ef4444"}
                            />
                            <Text className={`ml-2 text-sm font-semibold ${item.isActive ? 'text-green-400' : 'text-red-400'
                                }`}>
                                {getRemainingTime(item.expiryTime)}
                            </Text>
                        </View>

                        <TouchableOpacity
                            className={`flex-row items-center justify-center py-2 px-3 rounded-lg ${item.isActive ? 'bg-red-600' : 'bg-yellow-500'
                                }`}
                            onPress={() => handlePlayMovie(item)}
                        >
                            <Ionicons
                                name={item.isActive ? "play" : "refresh"}
                                size={16}
                                color={item.isActive ? "#fff" : "#000"}
                            />
                            <Text className={`ml-2 font-bold text-sm ${item.isActive ? 'text-white' : 'text-gray-900'
                                }`}>
                                {item.isActive ? 'Watch Now' : 'Rent Again'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    );

    const renderEmptyState = () => (
        <View className="items-center justify-center py-20 px-6">
            <View className="bg-gray-800 w-32 h-32 rounded-full items-center justify-center mb-6">
                <Ionicons name="film-outline" size={60} color="#6b7280" />
            </View>
            <Text className="text-white text-2xl font-bold mb-3">No Purchases Yet</Text>
            <Text className="text-gray-400 text-center text-base mb-6">
                Start watching amazing movies today
            </Text>
            <TouchableOpacity
                className="bg-red-600 px-6 py-3 rounded-lg"
                onPress={() => router.push('/')}
            >
                <Text className="text-white font-bold">Browse Movies</Text>
            </TouchableOpacity>
        </View>
    );

    if (loading && !refreshing) {
        return (
            <SafeAreaView className="flex-1 bg-gray-900">
                <StatusBar barStyle="light-content" backgroundColor="#111827" />
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color="#ef4444" />
                    <Text className="text-gray-400 mt-4 text-lg">Loading your library...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-gray-900">
            <StatusBar barStyle="light-content" backgroundColor="#111827" />

            {/* Header */}
            <View className="bg-gray-900 px-4 pt-3 pb-4 border-b border-gray-800">
                <Text className="text-white text-3xl font-bold mb-1">My Library</Text>
                <Text className="text-gray-400 text-sm">
                    {getFilteredPurchases().length} movies
                </Text>
            </View>

            {/* Filter Tabs */}
            <View className="flex-row px-4 py-3 bg-gray-900 border-b border-gray-800">
                <TouchableOpacity
                    className={`px-4 py-2 rounded-lg mr-2 ${filter === 'all' ? 'bg-red-600' : 'bg-gray-800'}`}
                    onPress={() => setFilter('all')}
                >
                    <Text className={`font-bold ${filter === 'all' ? 'text-white' : 'text-gray-400'}`}>
                        All ({purchases.length})
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    className={`px-4 py-2 rounded-lg mr-2 ${filter === 'active' ? 'bg-red-600' : 'bg-gray-800'}`}
                    onPress={() => setFilter('active')}
                >
                    <Text className={`font-bold ${filter === 'active' ? 'text-white' : 'text-gray-400'}`}>
                        Active ({purchases.filter(p => p.isActive).length})
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    className={`px-4 py-2 rounded-lg ${filter === 'expired' ? 'bg-red-600' : 'bg-gray-800'}`}
                    onPress={() => setFilter('expired')}
                >
                    <Text className={`font-bold ${filter === 'expired' ? 'text-white' : 'text-gray-400'}`}>
                        Expired ({purchases.filter(p => !p.isActive).length})
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Purchases List */}
            <FlatList
                data={getFilteredPurchases()}
                renderItem={renderPurchaseCard}
                keyExtractor={(item) => item.token}
                contentContainerStyle={{ paddingTop: 16, paddingBottom: 20 }}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor="#ef4444"
                        colors={['#ef4444']}
                    />
                }
                ListEmptyComponent={renderEmptyState}
            />
        </SafeAreaView>
    );
}
