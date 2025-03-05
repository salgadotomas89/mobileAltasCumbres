import { Stack, Redirect } from 'expo-router';
import React, { useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useColorScheme } from '@/hooks/useColorScheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  // Redirigir directamente a la página de login
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="auth" />
      <Stack.Screen name="computadores" />
      <Stack.Screen name="explore" />
      
      {/* Redirigir a la página de login por defecto */}
      <Stack.Screen name="auth/login" options={{ headerShown: false }} />
    </Stack>
  );
}
