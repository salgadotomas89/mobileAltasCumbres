import { Stack, router } from 'expo-router';
import { useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function DashboardLayout() {
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = await AsyncStorage.getItem('userToken');
        const userData = await AsyncStorage.getItem('userData');
        
        if (!token || !userData) {
          // Si no hay token o datos de usuario, redirigir al login
          router.replace('/(tabs)/auth/login');
        }
      } catch (error) {
        console.error('Error al verificar autenticación:', error);
        router.replace('/(tabs)/auth/login');
      }
    };
    
    checkAuth();
  }, []);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" options={{ gestureEnabled: false }} />
    </Stack>
  );
} 