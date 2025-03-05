import { StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { Stack, router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

interface UserData {
  id: number;
  nombre: string;
  curso: string;
}

export default function DashboardScreen() {
  const [userData, setUserData] = useState<UserData | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const token = await AsyncStorage.getItem('userToken');
      const storedUserData = await AsyncStorage.getItem('userData');

      if (!token || !storedUserData) {
        router.replace('/auth/login');
        return;
      }

      setUserData(JSON.parse(storedUserData));
    };

    checkAuth();
  }, []);

  const handleLogout = async () => {
    await AsyncStorage.removeItem('userToken');
    await AsyncStorage.removeItem('userData');
    router.replace('/auth/login');
  };

  const menuItems = [
    {
      title: 'Reservar Computador',
      icon: 'desktop-outline',
      onPress: () => router.push('/(tabs)/computadores/reservas'),
    },
    {
      title: 'Mis Reservas',
      icon: 'list-outline',
      onPress: () => router.push('/(tabs)/computadores/reservas'),
    },
    {
      title: 'Horarios Disponibles',
      icon: 'calendar-outline',
      onPress: () => router.push('/(tabs)/computadores/reservas'),
    },
    {
      title: 'Ayuda',
      icon: 'help-circle-outline',
      onPress: () => router.push('/(tabs)/explore'),
    },
    {
      title: 'Ver Todas las Reservas',
      icon: 'grid-outline',
      onPress: () => router.push('/(tabs)/computadores/todas-reservas'),
    },
    {
      title: 'Cerrar Sesión',
      icon: 'log-out-outline',
      onPress: handleLogout,
    },
  ];

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen 
        options={{ 
          headerShown: false
        }} 
      />

      {userData && (
        <ThemedView style={styles.header}>
          <ThemedText style={styles.welcomeText}>
            ¡Bienvenido(a)!
          </ThemedText>
          <ThemedText style={styles.userName}>
            {userData.nombre}
          </ThemedText>
          <ThemedText style={styles.userInfo}>
            {userData.curso}
          </ThemedText>
        </ThemedView>
      )}

      <ScrollView style={styles.menuContainer}>
        {menuItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.menuItem,
              item.title === 'Cerrar Sesión' && styles.logoutMenuItem
            ]}
            onPress={item.onPress}
          >
            <Ionicons 
              name={item.icon as any} 
              size={24} 
              color={item.title === 'Cerrar Sesión' ? '#f44336' : '#2196F3'} 
            />
            <ThemedText 
              style={[
                styles.menuItemText,
                item.title === 'Cerrar Sesión' && styles.logoutText
              ]}
            >
              {item.title}
            </ThemedText>
            <Ionicons 
              name="chevron-forward-outline" 
              size={24} 
              color={item.title === 'Cerrar Sesión' ? '#f44336' : '#666'} 
            />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 10,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#2196F3',
  },
  userName: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 5,
  },
  userInfo: {
    fontSize: 16,
    color: '#666',
  },
  menuContainer: {
    flex: 1,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#fff',
    borderRadius: 10,
    marginBottom: 10,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  menuItemText: {
    flex: 1,
    fontSize: 16,
    marginLeft: 15,
  },
  logoutMenuItem: {
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#f44336',
  },
  logoutText: {
    color: '#f44336',
  },
}); 