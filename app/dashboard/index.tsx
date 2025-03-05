import { StyleSheet, ScrollView, TouchableOpacity, Image, View } from 'react-native';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme } from '@/hooks/useColorScheme';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { ParallaxScrollView } from '@/components/ParallaxScrollView';

// Interfaces para los datos
interface UserData {
  id: number;
  nombre: string;
  curso: string;
}

export default function DashboardScreen() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Cargar información del usuario y verificar autenticación
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = await AsyncStorage.getItem('userToken');
        const userDataString = await AsyncStorage.getItem('userData');
        
        if (!token || !userDataString) {
          router.replace('/(tabs)/auth/login');
          return;
        }

        const parsedUserData = JSON.parse(userDataString);
        setUserData(parsedUserData);
      } catch (error) {
        console.error('Error al verificar autenticación:', error);
        router.replace('/(tabs)/auth/login');
      } finally {
        setLoading(false);
      }
    };
    
    checkAuth();
  }, []);

  const handleMenuItemPress = (route: string) => {
    // Aquí se implementará la navegación a las diferentes secciones
    console.log(`Navegando a: ${route}`);
    // router.push(`/(tabs)/${route}`);
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('userToken');
      await AsyncStorage.removeItem('userData');
      router.replace('/(tabs)/auth/login');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  // Elementos del menú principal
  const menuItems = [
    {
      id: 'eventos',
      title: 'Eventos',
      description: 'Consulta los próximos eventos del colegio',
      icon: '🗓️',
    },
    {
      id: 'comunicados',
      title: 'Comunicados',
      description: 'Revisa los comunicados oficiales',
      icon: '📢',
    },
    {
      id: 'biblioteca',
      title: 'Biblioteca',
      description: 'Accede a recursos educativos',
      icon: '📚',
    },
    {
      id: 'computadores',
      title: 'Reserva de Computadores',
      description: 'Reserva tiempo en la sala de computación',
      icon: '💻',
    },
    {
      id: 'calificaciones',
      title: 'Calificaciones',
      description: 'Consulta tus calificaciones actuales',
      icon: '📝',
    },
    {
      id: 'calendario',
      title: 'Calendario Escolar',
      description: 'Visualiza el calendario académico',
      icon: '📅',
    },
  ];

  if (loading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ThemedText>Cargando...</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
      headerImage={
        <Image
          source={require('@/assets/images/partial-react-logo.png')}
          style={styles.headerLogo}
          resizeMode="contain"
        />
      }>
      <View style={styles.container}>
        {/* Encabezado con información del usuario */}
        <ThemedView style={styles.userInfoContainer}>
          <View>
            <ThemedText type="title" style={styles.welcomeTitle}>
              Bienvenido, {userData?.nombre || 'Estudiante'}
            </ThemedText>
            <ThemedText>{userData?.curso || 'Alumno'}</ThemedText>
          </View>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <ThemedText style={styles.logoutText}>Cerrar Sesión</ThemedText>
          </TouchableOpacity>
        </ThemedView>

        {/* Tarjeta de anuncios o destacados */}
        <ThemedView style={styles.highlightCard}>
          <ThemedText type="subtitle" style={styles.highlightTitle}>
            ¡Destacado!
          </ThemedText>
          <ThemedText style={styles.highlightContent}>
            Próximamente: Semana de aniversario del colegio. ¡Prepárate para actividades especiales!
          </ThemedText>
        </ThemedView>

        {/* Menú principal */}
        <ThemedText type="subtitle" style={styles.sectionTitle}>
          Menú Principal
        </ThemedText>

        <View style={styles.menuGrid}>
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.menuItem}
              onPress={() => handleMenuItemPress(item.id)}>
              <ThemedView style={styles.menuItemContent}>
                <ThemedText style={styles.menuIcon}>{item.icon}</ThemedText>
                <ThemedText style={styles.menuTitle}>{item.title}</ThemedText>
                <ThemedText style={styles.menuDescription} numberOfLines={2}>
                  {item.description}
                </ThemedText>
              </ThemedView>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerLogo: {
    width: 100,
    height: 100,
  },
  userInfoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  welcomeTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  logoutButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(220, 53, 69, 0.15)',
  },
  logoutText: {
    color: '#dc3545',
    fontWeight: '600',
  },
  highlightCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: '#FFD700',
  },
  highlightTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  highlightContent: {
    lineHeight: 20,
  },
  sectionTitle: {
    marginBottom: 16,
    fontSize: 20,
    fontWeight: '600',
  },
  menuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  menuItem: {
    width: '48%',
    marginBottom: 16,
  },
  menuItemContent: {
    borderRadius: 12,
    padding: 16,
    height: 140,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuIcon: {
    fontSize: 28,
    marginBottom: 12,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 6,
    textAlign: 'center',
  },
  menuDescription: {
    fontSize: 12,
    textAlign: 'center',
  },
}); 