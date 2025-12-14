// app/(tabs)/video-player.js
import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StatusBar,
    Alert,
    ActivityIndicator,
    BackHandler,
} from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Device from 'expo-device';
import * as ScreenOrientation from 'expo-screen-orientation';
import api from "@/services/api";

export default function VideoPlayerScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();

    const [isLoading, setIsLoading] = useState(true);
    const [hasAccess, setHasAccess] = useState(false);
    const [videoUrl, setVideoUrl] = useState(null);
    const [accessInfo, setAccessInfo] = useState(null);

    const playerRef = useRef(null);

    // CRITICAL FIX: Create player ONLY when videoUrl is ready
    const player = useVideoPlayer(videoUrl, (player) => {
        if (videoUrl) {
            playerRef.current = player;
            player.loop = false;
            player.muted = false;
            player.playbackRate = 1.0;
            // Auto-play when ready
            player.play();
        }
    });

    useEffect(() => {
        validateAccess();
        lockOrientation();

        const backHandler = BackHandler.addEventListener('hardwareBackPress', handleBackPress);

        return () => {
            backHandler.remove();
            resetToPortrait();
        };
    }, []);

    const lockOrientation = async () => {
        try {
            await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
        } catch (error) {
            console.log('Orientation lock error:', error);
        }
    };

    const resetToPortrait = async () => {
        try {
            await ScreenOrientation.unlockAsync();
            await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
        } catch (error) {
            console.log('Orientation reset error:', error);
        }
    };

    // Optimize Cloudinary URL for streaming
    const getOptimizedVideoUrl = (url) => {
        if (!url) return null;

        if (url.includes('cloudinary.com')) {
            // Add streaming optimizations: q_auto (quality), f_mp4 (format)
            const urlParts = url.split('/upload/');
            if (urlParts.length === 2) {
                return `${urlParts[0]}/upload/q_auto,f_mp4/${urlParts[1]}`;
            }
        }

        return url;
    };

    const validateAccess = async () => {
        try {
            setIsLoading(true);

            const accessKey = `movie_access_${params.movieId}`;
            const storedAccess = await AsyncStorage.getItem(accessKey);

            if (!storedAccess) {
                Alert.alert('Access Denied', 'You do not have access to this movie.', [
                    {
                        text: 'OK', onPress: async () => {
                            await resetToPortrait();
                            router.back();
                        }
                    }
                ]);
                return;
            }

            const access = JSON.parse(storedAccess);
            const now = new Date().getTime();
            const expiryTime = new Date(access.expiryTime).getTime();

            if (now >= expiryTime) {
                await AsyncStorage.removeItem(accessKey);
                Alert.alert('Access Expired', 'Your access to this movie has expired.', [
                    {
                        text: 'OK', onPress: async () => {
                            await resetToPortrait();
                            router.back();
                        }
                    }
                ]);
                return;
            }

            if (params.videoUrl) {
                const optimizedUrl = getOptimizedVideoUrl(params.videoUrl);
                console.log('Playing video:', optimizedUrl); // Debug log
                setVideoUrl(optimizedUrl);
                setHasAccess(true);
                setAccessInfo(access);
            } else {
                try {
                    const deviceId = Device.osInternalBuildId || Device.modelId || 'unknown_device';
                    const response = await api.post('/payments/validate-access', {
                        token: access.token,
                        deviceId: deviceId
                    });

                    if (response.data.valid) {
                        const optimizedUrl = getOptimizedVideoUrl(response.data.access.moviePath);
                        console.log('Playing video:', optimizedUrl); // Debug log
                        setVideoUrl(optimizedUrl);
                        setHasAccess(true);
                        setAccessInfo(access);
                    } else {
                        await AsyncStorage.removeItem(accessKey);
                        Alert.alert('Access Invalid', response.data.message || 'Access validation failed.', [
                            {
                                text: 'OK', onPress: async () => {
                                    await resetToPortrait();
                                    router.back();
                                }
                            }
                        ]);
                    }
                } catch (networkError) {
                    console.log('Backend validation failed:', networkError.message);
                    Alert.alert('Error', 'Cannot verify access with server.', [
                        {
                            text: 'OK', onPress: async () => {
                                await resetToPortrait();
                                router.back();
                            }
                        }
                    ]);
                }
            }
        } catch (error) {
            console.error('Access validation error:', error);
            Alert.alert('Error', 'Failed to validate access.', [
                {
                    text: 'OK', onPress: async () => {
                        await resetToPortrait();
                        router.back();
                    }
                }
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleBackPress = () => {
        Alert.alert(
            'Exit Video',
            'Are you sure you want to stop watching?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Exit',
                    onPress: async () => {
                        try {
                            if (playerRef.current) {
                                playerRef.current.pause();
                            }
                        } catch (error) {
                            console.log('Pause error:', error);
                        }
                        await resetToPortrait();
                        router.back();
                    }
                }
            ]
        );
        return true;
    };

    if (isLoading) {
        return (
            <View style={{ flex: 1, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center' }}>
                <StatusBar hidden />
                <ActivityIndicator size="large" color="#ef4444" />
                <Text style={{ color: '#fff', fontSize: 18, marginTop: 16 }}>Loading video...</Text>
            </View>
        );
    }

    if (!hasAccess || !videoUrl) {
        return (
            <View style={{ flex: 1, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center' }}>
                <StatusBar hidden />
                <Ionicons name="lock-closed" size={80} color="#ef4444" />
                <Text style={{ color: '#fff', fontSize: 20, fontWeight: 'bold', marginTop: 16 }}>
                    Access Denied
                </Text>
                <Text style={{ color: '#9ca3af', textAlign: 'center', paddingHorizontal: 24, marginTop: 8 }}>
                    Unable to load video. Please try again.
                </Text>
                <TouchableOpacity
                    style={{
                        backgroundColor: '#ef4444',
                        paddingHorizontal: 24,
                        paddingVertical: 12,
                        borderRadius: 8,
                        marginTop: 24
                    }}
                    onPress={async () => {
                        await resetToPortrait();
                        router.back();
                    }}
                >
                    <Text style={{ color: '#fff', fontWeight: 'bold' }}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={{ flex: 1, backgroundColor: '#000' }}>
            <StatusBar hidden />

            {/* FIXED: Removed deprecated props */}
            <VideoView
                player={player}
                style={{ width: '100%', height: '100%' }}
                contentFit="contain"
                nativeControls={true}
                allowsPictureInPicture={false}
            />
        </View>
    );
}
