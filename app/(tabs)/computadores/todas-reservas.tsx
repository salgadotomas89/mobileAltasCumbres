import { StyleSheet, FlatList, RefreshControl, Platform, View } from 'react-native';
import { Stack } from 'expo-router';
import React, { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

interface Reserva {
  id: number;
  alumno_nombre: string;
  alumno_apellido: string;
  fecha_reserva: string;
  bloque_reserva: string;
  created_at: string;
}

const BASE_URL = 'https://altascumbressanclemente.cl';
const RESERVAS_URL = '/api/reservas-computador/';

export default function TodasReservasScreen() {
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const obtenerReservas = async () => {
    setRefreshing(true);
    setError(null);

    try {
      const token = await AsyncStorage.getItem('userToken');
      
      if (!token) {
        setError('No se encontró el token de autenticación');
        return;
      }

      const url = `${BASE_URL}${RESERVAS_URL}`;
      console.log('Intentando obtener reservas desde:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      console.log('Código de respuesta:', response.status);
      const responseText = await response.text();
      console.log('Respuesta del servidor:', responseText);

      if (!response.ok) {
        if (response.status === 401) {
          setError('Sesión expirada. Por favor, inicie sesión nuevamente.');
          // Aquí podrías redirigir al login si lo deseas
          return;
        }
        throw new Error(`Error al obtener las reservas: ${response.status} - ${responseText}`);
      }

      let data;
      try {
        data = JSON.parse(responseText);
        console.log('Estructura de la respuesta:', JSON.stringify(data, null, 2));
        
        // Verificar si la respuesta es un objeto con una propiedad que contiene las reservas
        if (data && typeof data === 'object') {
          // Si data.results existe y es un array, úsalo
          if (Array.isArray(data.results)) {
            data = data.results;
          } else if (Array.isArray(data)) {
            // Si data ya es un array, úsalo directamente
            data = data;
          } else {
            // Si hay una propiedad que contiene las reservas
            const possibleArrayProps = Object.values(data).find(value => Array.isArray(value));
            if (possibleArrayProps) {
              data = possibleArrayProps;
            } else {
              throw new Error('No se encontró una lista de reservas en la respuesta');
            }
          }
        }

        if (!Array.isArray(data)) {
          throw new Error('La respuesta del servidor no es una lista de reservas');
        }

        // Validar la estructura de cada reserva
        const reservasValidas = data.filter(reserva => {
          return (
            reserva &&
            typeof reserva === 'object' &&
            'id' in reserva &&
            'alumno_nombre' in reserva &&
            'alumno_apellido' in reserva &&
            'fecha_reserva' in reserva &&
            'bloque_reserva' in reserva
          );
        });

        console.log('Número de reservas válidas encontradas:', reservasValidas.length);
        setReservas(reservasValidas);
      } catch (e: unknown) {
        console.error('Error al procesar la respuesta:', e);
        const errorMessage = e instanceof Error ? e.message : 'Error desconocido';
        throw new Error('Error al procesar la respuesta del servidor: ' + errorMessage);
      }
    } catch (error: any) {
      console.error('Error detallado:', error);
      setError(error.message || 'Error al obtener las reservas');
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    obtenerReservas();
  }, []);

  const renderItem = ({ item }: { item: Reserva }) => (
    <ThemedView style={styles.reservaCard}>
      {/* Header de la tarjeta */}
      <ThemedView style={styles.cardHeader}>
        <View style={styles.userIconContainer}>
          <Ionicons name="person" size={24} color="#4dabf7" />
        </View>
        <View style={styles.headerTextContainer}>
          <ThemedText style={styles.nombreAlumno}>
            {item.alumno_nombre} {item.alumno_apellido}
          </ThemedText>
          <ThemedText style={styles.fechaCreacion}>
            Creada: {new Date(item.created_at).toLocaleDateString('es-ES')}
          </ThemedText>
        </View>
      </ThemedView>

      {/* Contenido de la tarjeta */}
      <ThemedView style={styles.cardContent}>
        <ThemedView style={styles.infoRow}>
          <ThemedView style={styles.infoItem}>
            <Ionicons name="calendar-outline" size={20} color="#4dabf7" />
            <ThemedText style={styles.infoLabel}>Fecha</ThemedText>
            <ThemedText style={styles.infoValue}>
              {new Date(item.fecha_reserva).toLocaleDateString('es-ES')}
            </ThemedText>
          </ThemedView>

          <View style={styles.verticalDivider} />

          <ThemedView style={styles.infoItem}>
            <Ionicons name="time-outline" size={20} color="#4dabf7" />
            <ThemedText style={styles.infoLabel}>Bloque</ThemedText>
            <ThemedText style={styles.infoValue}>
              {item.bloque_reserva}
            </ThemedText>
          </ThemedView>
        </ThemedView>
      </ThemedView>
    </ThemedView>
  );

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: 'Todas las Reservas',
          headerShown: true,
          headerStyle: {
            backgroundColor: '#ffffff',
          },
          headerTintColor: '#2196F3',
          headerTitleStyle: {
            fontWeight: 'bold',
            color: '#333',
          },
        }} 
      />

      {error ? (
        <ThemedView style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={40} color="#ff6b6b" />
          <ThemedText style={styles.error}>{error}</ThemedText>
        </ThemedView>
      ) : (
        <FlatList
          data={reservas}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={obtenerReservas}
              tintColor="#2196F3"
            />
          }
          ListEmptyComponent={
            <ThemedView style={styles.emptyContainer}>
              <Ionicons name="calendar" size={50} color="#9e9e9e" />
              <ThemedText style={styles.emptyText}>
                No hay reservas disponibles
              </ThemedText>
            </ThemedView>
          }
          contentContainerStyle={styles.listContent}
        />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  listContent: {
    padding: 16,
    paddingBottom: 20,
  },
  reservaCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  userIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(33, 150, 243, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerTextContainer: {
    flex: 1,
  },
  nombreAlumno: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  fechaCreacion: {
    fontSize: 12,
    color: '#757575',
  },
  cardContent: {
    padding: 16,
    backgroundColor: '#ffffff',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  infoItem: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
    padding: 8,
  },
  verticalDivider: {
    width: 1,
    height: '80%',
    backgroundColor: '#e0e0e0',
    marginHorizontal: 16,
  },
  infoLabel: {
    fontSize: 12,
    color: '#757575',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    gap: 12,
    backgroundColor: '#fff',
  },
  error: {
    color: '#dc3545',
    textAlign: 'center',
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    gap: 16,
    marginTop: 100,
    backgroundColor: '#fff',
    borderRadius: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  emptyText: {
    color: '#757575',
    fontSize: 16,
    textAlign: 'center',
  },
}); 