import { StyleSheet, FlatList, ActivityIndicator, RefreshControl, TextInput, TouchableOpacity, Alert, Platform, Linking } from 'react-native';
import { Stack } from 'expo-router';
import React, { useState, useEffect, Fragment } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

// Definimos la interfaz para las reservas basada en la estructura de la tabla mostrada
interface Reserva {
  id: number;
  alumno_nombre: string;
  alumno_apellido: string;
  fecha_reserva: string;
  bloque_reserva: string;
  created_at?: string;
}

// Modificando las interfaces para la nueva autenticación con RUT
interface RutAuthRequest {
  rut: string;
  digitos_verificacion: string;
}

interface RutAuthResponse {
  token: string;
  alumno_id: number;
  nombre: string;
  curso: string;
}

// URLs de la API según la documentación
const BASE_URL = 'https://altascumbressanclemente.cl';
const AUTH_URL = '/api/alumno-auth/';
const RESERVAS_URL = '/api/reservas-computador/';

export default function ReservarComputadorScreen() {
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [rut, setRut] = useState('');
  const [digitosVerificacion, setDigitosVerificacion] = useState('');
  const [token, setToken] = useState<string | null>(null);
  const [alumnoInfo, setAlumnoInfo] = useState<{ id: number, nombre: string, curso: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [customBaseUrl] = useState(BASE_URL);  // Mantener como estado pero sin permitir cambios

  // Verificar estado de autenticación al iniciar
  useEffect(() => {
    const verificarAutenticacion = async () => {
      try {
        // Verificar si hay un token guardado
        const storedToken = await AsyncStorage.getItem('userToken');
        const storedAlumnoInfo = await AsyncStorage.getItem('userData');
        
        if (storedToken) {
          setToken(storedToken);
          if (storedAlumnoInfo) {
            setAlumnoInfo(JSON.parse(storedAlumnoInfo));
          }
          setAuthenticated(true);
          obtenerReservas(storedToken);
        }
      } catch (error) {
        console.error('Error al verificar autenticación:', error);
        setError('Error al verificar la autenticación');
      }
    };

    verificarAutenticacion();
  }, []);

  // Iniciar sesión y obtener token
  const iniciarSesion = async () => {
    if (!rut) {
      setError('Por favor ingresa tu RUT');
      return;
    }
    
    if (!digitosVerificacion) {
      setError('Por favor ingresa los 4 primeros dígitos de tu RUT');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Modo real: autenticación con la API
      console.log('Intentando obtener token desde:', customBaseUrl + AUTH_URL);
      console.log('Datos enviados:', JSON.stringify({
        rut: rut,
        digitos_verificacion: digitosVerificacion
      }));
      
      const response = await fetch(customBaseUrl + AUTH_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rut: rut,
          digitos_verificacion: digitosVerificacion
        })
      });

      // Obtener el texto completo de la respuesta para depuración
      const responseText = await response.text();
      console.log('Respuesta del servidor (texto):', responseText);
      
      // Intentar parsear la respuesta como JSON
      let errorData;
      try {
        errorData = JSON.parse(responseText);
        console.log('Respuesta del servidor (JSON):', errorData);
      } catch (e) {
        console.log('La respuesta no es JSON válido');
      }

      if (!response.ok) {
        // Si obtenemos un error de la API, analizar el mensaje
        let errorMessage = 'Error al iniciar sesión';
        
        if (errorData) {
          errorMessage = 
            errorData.error || 
            (errorData.non_field_errors ? errorData.non_field_errors[0] : null) ||
            (errorData.rut ? errorData.rut[0] : null) ||
            'Error al iniciar sesión';
        }
        
        // Mostrar información más detallada sobre el error
        const detailedError = `Error (${response.status}): ${errorMessage}\nDetalles: ${responseText.substring(0, 150)}`;
        console.error(detailedError);
        
        throw new Error(errorMessage);
      }

      // Si la respuesta fue exitosa, ya tenemos el responseText
      // Necesitamos parsearlo como JSON si aún no lo hemos hecho
      const data = errorData || JSON.parse(responseText);
      console.log('Token recibido:', data.token);
      
      // Guardar token y datos del alumno
      await AsyncStorage.setItem('userToken', data.token);
      await AsyncStorage.setItem('userData', JSON.stringify({
        id: data.alumno_id,
        nombre: data.nombre,
        curso: data.curso
      }));
      
      setToken(data.token);
      setAlumnoInfo({
        id: data.alumno_id,
        nombre: data.nombre,
        curso: data.curso
      });
      setAuthenticated(true);
      
      // Obtener las reservas después de autenticarse exitosamente
      obtenerReservas(data.token);
    } catch (error: any) {
      console.error('Error en inicio de sesión:', error);
      setError('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Cerrar sesión
  const cerrarSesion = async () => {
    try {
      await AsyncStorage.removeItem('userToken');
      await AsyncStorage.removeItem('userData');
      setToken(null);
      setAuthenticated(false);
      setReservas([]);
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  // Obtener reservas de la API
  const obtenerReservas = async (currentToken?: string) => {
    setRefreshing(true);
    const tokenToUse = currentToken || token;
    
    try {
      if (tokenToUse) {
        // Obtener datos de la API
        console.log('Obteniendo reservas desde:', customBaseUrl + RESERVAS_URL);
        
        const response = await fetch(customBaseUrl + RESERVAS_URL, {
          method: 'GET',
          headers: {
            'Authorization': `Token ${tokenToUse}`,
            'Content-Type': 'application/json',
          }
        });

        if (!response.ok) {
          if (response.status === 401) {
            // Token inválido o expirado
            setError('Sesión expirada. Por favor inicia sesión nuevamente.');
            setAuthenticated(false);
            await AsyncStorage.removeItem('userToken');
            await AsyncStorage.removeItem('userData');
            setToken(null);
            setAlumnoInfo(null);
            return;
          }
          throw new Error('Error al obtener reservas: ' + response.status);
        }

        const data = await response.json() as Reserva[];
        console.log('Reservas recibidas:', data.length);
        setReservas(data);
      }
    } catch (error: any) {
      console.error('Error al obtener reservas:', error);
      setError('Error al obtener las reservas: ' + error.message);
    } finally {
      setRefreshing(false);
    }
  };

  const actualizarDatos = () => {
    obtenerReservas();
  };

  const renderItem = ({ item }: { item: Reserva }) => (
    <ThemedView style={styles.tarjeta}>
      <ThemedText style={styles.nombreAlumno}>{item.alumno_nombre} {item.alumno_apellido}</ThemedText>
      <ThemedText>Fecha: {new Date(item.fecha_reserva).toLocaleDateString('es-ES')}</ThemedText>
      <ThemedText>Bloque: {item.bloque_reserva}</ThemedText>
      {item.created_at && (
        <ThemedText style={styles.fechaCreacion}>
          Creada: {new Date(item.created_at).toLocaleDateString('es-ES')}
        </ThemedText>
      )}
    </ThemedView>
  );

  // Renderizar el formulario de login con RUT
  const renderLogin = () => (
    <ThemedView style={styles.loginContainer}>
      
      {error && <ThemedText style={styles.error}>{error}</ThemedText>}
      
   
      
      <TextInput
        style={styles.input}
        placeholder="RUT (ej: 12345678-9)"
        value={rut}
        onChangeText={(text) => {
          setRut(text);
          // Extraer solo los dígitos del RUT
          const digitsOnly = text.replace(/\D/g, '');
          // Tomar los primeros 4 dígitos si hay suficientes
          if (digitsOnly.length >= 4) {
            setDigitosVerificacion(digitsOnly.substring(0, 4));
          }
        }}
        autoCapitalize="none"
      />
      
    
      <TextInput
        style={styles.input}
        placeholder="4 primeros dígitos de tu RUT"
        value={digitosVerificacion}
        onChangeText={setDigitosVerificacion}
        keyboardType="number-pad"
        maxLength={4}
        secureTextEntry={true}
      />
      
      <TouchableOpacity 
        style={styles.botonLogin} 
        onPress={iniciarSesion}
        disabled={loading}
      >
        <ThemedText style={styles.textoBoton}>
          {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
        </ThemedText>
      </TouchableOpacity>
    </ThemedView>
  );

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: 'Reserva de Computador', headerShown: true }} />
      <ThemedText type="title" style={styles.mainTitle}>Inicio de sesión</ThemedText>
      
      {authenticated ? (
        <Fragment>
          <ThemedView style={styles.header}>
            {alumnoInfo && (
              <ThemedView style={styles.alumnoInfo}>
                <ThemedText style={styles.nombreAlumno}>{alumnoInfo.nombre}</ThemedText>
                <ThemedText style={styles.alumnoCurso}>{alumnoInfo.curso}</ThemedText>
              </ThemedView>
            )}
            <TouchableOpacity style={styles.botonCerrarSesion} onPress={cerrarSesion}>
              <ThemedText style={styles.textoBoton}>Cerrar Sesión</ThemedText>
            </TouchableOpacity>
          </ThemedView>
          
          <FlatList
            data={reservas}
            renderItem={renderItem}
            keyExtractor={(item) => item.id.toString()}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={actualizarDatos} />
            }
            ListEmptyComponent={
              <ThemedText style={styles.mensaje}>No hay reservas disponibles</ThemedText>
            }
          />
        </Fragment>
      ) : (
        renderLogin()
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  mainTitle: {
    fontSize: 24,
    marginBottom: 20,
    textAlign: 'center',
  },
  lista: {
    width: '100%',
    flex: 1,
  },
  reservaItem: {
    padding: 15,
    marginVertical: 8,
    borderRadius: 8,
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
    backgroundColor: '#fff',
  },
  reservaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  alumnoNombre: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  fechaReserva: {
    fontSize: 14,
    color: '#666',
    marginLeft: 10,
  },
  bloqueReserva: {
    fontSize: 14,
    color: '#666',
  },
  createdAt: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
    fontStyle: 'italic',
  },
  mensaje: {
    textAlign: 'center',
    marginTop: 20,
  },
  error: {
    color: 'red',
    textAlign: 'center',
    marginBottom: 10,
  },
  authContainer: {
    width: '100%',
    padding: 20,
    alignItems: 'center',
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    marginTop: 20,
  },
  input: {
    width: '100%',
    height: 50,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    marginBottom: 15,
    paddingHorizontal: 10,
    backgroundColor: '#fff',
  },
  button: {
    width: '100%',
    backgroundColor: '#2196F3',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  configButton: {
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  configButtonText: {
    color: '#555',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 10,
  },
  logoutButton: {
    backgroundColor: '#f44336',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginLeft: 10,
  },
  logoutButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 20,
  },
  loginContainer: {
    width: '100%',
    padding: 20,
    alignItems: 'center',
  },
  loginTitle: {
    fontSize: 18,
    marginBottom: 20,
    textAlign: 'center',
  },
  label: {
    alignSelf: 'flex-start',
    marginBottom: 5,
    fontWeight: 'bold',
  },
  botonLogin: {
    width: '100%',
    backgroundColor: '#2196F3',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  textoBoton: {
    color: 'white',
    fontWeight: 'bold',
  },
  alumnoInfo: {
    marginTop: 10,
    marginBottom: 15,
    alignItems: 'center',
  },
  alumnoCurso: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  tarjeta: {
    padding: 15,
    marginVertical: 8,
    borderRadius: 8,
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
    backgroundColor: '#fff',
  },
  nombreAlumno: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  fechaCreacion: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
    fontStyle: 'italic',
  },
  botonCerrarSesion: {
    backgroundColor: '#f44336',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginLeft: 10,
  },
  infoContainer: {
    backgroundColor: '#e3f2fd',
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
    width: '100%',
  },
  infoText: {
    fontSize: 12,
    color: '#0d47a1',
    textAlign: 'center',
  },
}); 