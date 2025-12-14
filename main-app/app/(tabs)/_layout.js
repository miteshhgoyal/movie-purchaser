// app/(tabs)/_layout.js
import { Tabs, useSegments } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';


export default function TabLayout() {
    const segments = useSegments();

    // Hide tab bar when on video-player, movie-details, or repurchase screens
    const hideTabBar = segments.includes('video-player') ||
        segments.includes('movie-details') ||
        segments.includes('repurchase');

    return (
        <Tabs
            screenOptions={{
                // Dark theme with red/yellow accent colors
                tabBarActiveTintColor: '#ef4444', // Red color for active tab
                tabBarInactiveTintColor: '#6b7280', // Gray for inactive
                tabBarStyle: {
                    backgroundColor: '#111827',
                    borderTopColor: '#1f2937',
                    borderTopWidth: 1,
                    height: 70,
                    paddingBottom: 16,
                    paddingTop: 8,
                    // Conditionally hide tab bar
                    display: hideTabBar ? 'none' : 'flex',
                },
                tabBarLabelStyle: {
                    fontSize: 12,
                    fontWeight: '600',
                },
                headerStyle: {
                    backgroundColor: '#111827',
                },
                headerTintColor: '#fff',
                headerShadowVisible: false,
            }}
        >
            {/* Index/Movies Tab - VISIBLE */}
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Movies',
                    headerShown: false,
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="film" size={size} color={color} />
                    ),
                }}
            />

            {/* Profile Tab - VISIBLE */}
            <Tabs.Screen
                name="profile"
                options={{
                    title: 'Profile',
                    headerShown: false,
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="person" size={size} color={color} />
                    ),
                }}
            />

            {/* My Library Tab - VISIBLE */}
            <Tabs.Screen
                name="my-library"
                options={{
                    title: 'My Library',
                    headerShown: false,
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="library" size={size} color={color} />
                    ),
                }}
            />

            {/* Movie Details - HIDDEN (not shown in tab bar) */}
            <Tabs.Screen
                name="movie-details"
                options={{
                    href: null, // This hides the tab from the tab bar
                    title: 'Movie Details',
                    headerShown: false,
                }}
            />

            {/* Video Player - HIDDEN (not shown in tab bar) */}
            <Tabs.Screen
                name="video-player"
                options={{
                    href: null, // This hides the tab from the tab bar
                    title: 'Video Player',
                    headerShown: false,
                }}
            />

            {/* Repurchase - HIDDEN (not shown in tab bar) */}
            <Tabs.Screen
                name="repurchase"
                options={{
                    href: null,
                    title: 'Re-Purchase',
                    headerShown: false,
                }}
            />
        </Tabs>
    );
}
