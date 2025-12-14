// components/Gradient.js
import { LinearGradient } from 'expo-linear-gradient';

const GRADIENTS = {
    red: ['#b91c1c', '#991b1b'],
    yellow: ['#f59e0b', '#d97706'],
    redYellow: ['#ef4444', '#f59e0b'],
};

export default function Gradient({ type = 'red', children, className = '' }) {
    return (
        <LinearGradient
            colors={GRADIENTS[type]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className={className}
        >
            {children}
        </LinearGradient>
    );
}
