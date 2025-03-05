import { StyleSheet, FlatList, RefreshControl, Platform } from 'react-native';
import { Stack } from 'expo-router';
import React, { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
      } catch (e) {
        console.error('Error al procesar la respuesta:', e);
        throw new Error('Error al procesar la respuesta del servidor: ' + e.message);
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
      <ThemedView style={styles.reservaHeader}>
        <ThemedText style={styles.nombreAlumno}>
          {item.alumno_nombre} {item.alumno_apellido}
        </ThemedText>
      </ThemedView>
      
      <ThemedView style={styles.reservaDetails}>
        <ThemedView style={styles.detailRow}>
          <ThemedText style={styles.label}>Fecha:</ThemedText>
          <ThemedText style={styles.value}>
            {new Date(item.fecha_reserva).toLocaleDateString('es-ES')}
          </ThemedText>
        </ThemedView>
        
        <ThemedView style={styles.detailRow}>
          <ThemedText style={styles.label}>Bloque:</ThemedText>
          <ThemedText style={styles.value}>{item.bloque_reserva}</ThemedText>
        </ThemedView>

        {item.created_at && (
          <ThemedView style={styles.detailRow}>
            <ThemedText style={styles.label}>Creada:</ThemedText>
            <ThemedText style={styles.value}>
              {new Date(item.created_at).toLocaleDateString('es-ES')}
            </ThemedText>
          </ThemedView>
        )}
      </ThemedView>
    </ThemedView>
  );

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: 'Todas las Reservas',
          headerShown: true,
        }} 
      />

      {error ? (
        <ThemedText style={styles.error}>{error}</ThemedText>
      ) : (
        <FlatList
          data={reservas}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={obtenerReservas}
            />
          }
          ListEmptyComponent={
            <ThemedText style={styles.emptyText}>
              No hay reservas disponibles
            </ThemedText>
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
    padding: 16,
    backgroundColor: '#1a1a1a',
  },
  listContent: {
    paddingBottom: 20,
  },
  reservaCard: {
    backgroundColor: '#2a2a2a',
    borderRadius: 10,
    marginBottom: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#3a3a3a',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  reservaHeader: {
    borderBottomWidth: 1,
    borderBottomColor: '#3a3a3a',
    paddingBottom: 8,
    marginBottom: 8,
  },
  nombreAlumno: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4dabf7',
  },
  reservaDetails: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: 14,
    color: '#9e9e9e',
    fontWeight: '500',
  },
  value: {
    fontSize: 14,
    color: '#ffffff',
  },
  error: {
    color: '#ff6b6b',
    textAlign: 'center',
    margin: 20,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 40,
    color: '#9e9e9e',
    fontSize: 16,
  },
}); 