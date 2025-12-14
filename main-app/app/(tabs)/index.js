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
    TextInput,
    Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import api from "@/services/api";

const { width: screenWidth } = Dimensions.get('window');

export default function Index() {
    const router = useRouter();
    const [movies, setMovies] = useState([]);
    const [filteredMovies, setFilteredMovies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // Fetch movies from API
    const fetchMovies = async () => {
        try {
            setLoading(true);
            const response = await api.get("/movies");

            if (response.data.success) {
                setMovies(response.data.movies);
                setFilteredMovies(response.data.movies);
            } else {
                Alert.alert('Error', 'Failed to fetch movies');
            }
        } catch (error) {
            console.error('Error fetching movies:', error);
            Alert.alert('Error', 'Failed to load movies. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMovies();
    }, []);

    // Search handler
    const handleSearch = (text) => {
        setSearchQuery(text);
        if (text.trim() === '') {
            setFilteredMovies(movies);
        } else {
            const filtered = movies.filter(movie =>
                movie.title.toLowerCase().includes(text.toLowerCase()) ||
                movie.description?.toLowerCase().includes(text.toLowerCase())
            );
            setFilteredMovies(filtered);
        }
    };

    // Pull to refresh
    const onRefresh = async () => {
        setRefreshing(true);
        await fetchMovies();
        setSearchQuery('');
        setRefreshing(false);
    };

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

    // Navigate to movie details
    const navigateToDetails = (movie) => {
        router.push({
            pathname: '/movie-details',
            params: {
                movieId: movie.movieId,
                title: movie.title,
                description: movie.description,
                price: movie.price,
                duration: movie.durationSeconds,
                posterPath: movie.posterPath,
                status: movie.status,
                filePath: movie.filePath // Add this line
            }
        });
    };

    // Render movie card
    const renderMovieCard = ({ item }) => (
        <TouchableOpacity
            className="mx-4 mb-5"
            onPress={() => navigateToDetails(item)}
            activeOpacity={0.7}
        >
            <View className="bg-gray-800 rounded-2xl overflow-hidden"
                style={{
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.4,
                    shadowRadius: 8,
                    elevation: 8
                }}
            >
                {/* Thumbnail */}
                <View className="bg-gray-700 relative" style={{ height: 220 }}>
                    {item.posterPath ? (
                        <Image
                            source={{ uri: item.posterPath }}
                            className="w-full h-full"
                            resizeMode="cover"
                        />
                    ) : (
                        <View className="w-full h-full bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 items-center justify-center">
                            <Ionicons name="film-outline" size={70} color="rgba(255,255,255,0.3)" />
                            <Text className="text-white/30 mt-3 font-semibold">No Thumbnail</Text>
                        </View>
                    )}

                    {/* Status Badge */}
                    <View className={`absolute top-3 left-3 px-3 py-1.5 rounded-lg ${item.status === 'published' ? 'bg-green-500' : 'bg-gray-600'
                        }`}>
                        <Text className="text-white font-bold text-xs uppercase">
                            {item.status}
                        </Text>
                    </View>

                    {/* Price Badge */}
                    <View className="absolute top-3 right-3 bg-yellow-500 px-3 py-1.5 rounded-lg">
                        <Text className="text-gray-900 font-bold text-sm">₹{item.price}</Text>
                    </View>

                    {/* Play Button Overlay */}
                    <View className="absolute inset-0 items-center justify-center">
                        <View className="bg-black/40 backdrop-blur-sm w-16 h-16 rounded-full items-center justify-center">
                            <Ionicons name="play" size={32} color="#fff" />
                        </View>
                    </View>
                </View>

                {/* Movie Info */}
                <View className="p-4">
                    <Text className="text-white text-xl font-bold mb-2" numberOfLines={2}>
                        {item.title}
                    </Text>

                    <Text className="text-gray-400 text-sm mb-3 leading-5" numberOfLines={3}>
                        {item.description || 'No description available'}
                    </Text>

                    <View className="flex-row items-center justify-between pt-3 border-t border-gray-700">
                        <View className="flex-row items-center">
                            <Ionicons name="time-outline" size={18} color="#9ca3af" />
                            <Text className="text-gray-400 text-sm ml-2">
                                {formatDuration(item.durationSeconds)}
                            </Text>
                        </View>

                        <View className="flex-row items-center">
                            <Ionicons name="code-outline" size={18} color="#9ca3af" />
                            <Text className="text-gray-400 text-sm ml-2">
                                {item.movieId}
                            </Text>
                        </View>
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    );

    // Empty state
    const renderEmptyState = () => (
        <View className="items-center justify-center py-20 px-6">
            <View className="bg-gray-800 w-32 h-32 rounded-full items-center justify-center mb-6">
                <Ionicons name="search-outline" size={60} color="#6b7280" />
            </View>
            <Text className="text-white text-2xl font-bold mb-3">No Movies Found</Text>
            <Text className="text-gray-400 text-center text-base">
                {searchQuery ? 'Try different keywords to find movies' : 'Check back later for new content'}
            </Text>
        </View>
    );

    // Loading state
    if (loading && !refreshing) {
        return (
            <SafeAreaView className="flex-1 bg-gray-900">
                <StatusBar barStyle="light-content" backgroundColor="#111827" />
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color="#ef4444" />
                    <Text className="text-gray-400 mt-4 text-lg">Loading movies...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-gray-900">
            <StatusBar barStyle="light-content" backgroundColor="#111827" />

            {/* Header */}
            <View className="bg-gray-900 px-4 pt-3 pb-4 border-b border-gray-800">
                <View className="mb-4">
                    <Text className="text-white text-3xl font-bold">Movies</Text>
                    <Text className="text-gray-400 text-sm mt-1">
                        {filteredMovies.length} movies available
                    </Text>
                </View>

                {/* Search Bar */}
                <View className="flex-row items-center bg-gray-800 rounded-xl px-4 py-3.5 border border-gray-700">
                    <Ionicons name="search" size={22} color="#9ca3af" />
                    <TextInput
                        className="flex-1 ml-3 text-white text-base"
                        placeholder="Search movies..."
                        placeholderTextColor="#6b7280"
                        value={searchQuery}
                        onChangeText={handleSearch}
                        keyboardAppearance="dark"
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => handleSearch('')}>
                            <Ionicons name="close-circle" size={22} color="#6b7280" />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* Movies List */}
            <FlatList
                data={filteredMovies}
                renderItem={renderMovieCard}
                keyExtractor={(item) => item._id}
                contentContainerStyle={{ paddingTop: 20, paddingBottom: 20 }}
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
