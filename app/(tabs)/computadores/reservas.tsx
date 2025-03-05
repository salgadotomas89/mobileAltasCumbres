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

// Simulated data
const datosSimulados: Reserva[] = [
  {
    id: 1,
    alumno_nombre: 'Juan',
    alumno_apellido: 'Pérez',
    fecha_reserva: '2024-08-15',
    bloque_reserva: 'Mañana',
    created_at: '2024-08-10T15:30:45Z'
  },
  {
    id: 2,
    alumno_nombre: 'María',
    alumno_apellido: 'González',
    fecha_reserva: '2024-08-16',
    bloque_reserva: 'Tarde',
    created_at: '2024-08-10T16:20:30Z'
  },
  {
    id: 3,
    alumno_nombre: 'Pedro',
    alumno_apellido: 'Sánchez',
    fecha_reserva: '2024-08-17',
    bloque_reserva: 'Mañana',
    created_at: '2024-08-11T10:15:22Z'
  }
];

export default function ReservarComputadorScreen() {
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [rut, setRut] = useState('');
  const [digitosVerificacion, setDigitosVerificacion] = useState('');
  const [token, setToken] = useState<string | null>(null);
  const [alumnoInfo, setAlumnoInfo] = useState<{ id: number, nombre: string, curso: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [modoSimulacion, setModoSimulacion] = useState(true);
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
        // Si hay error, activar modo simulación
        setModoSimulacion(true);
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
      if (modoSimulacion) {
        // Modo simulación: autenticación simulada
        console.log('Modo simulación activado - Login simulado');
        const simulatedToken = 'simulated-token-12345';
        
        // Simular que recibimos datos del alumno
        const simulatedAlumnoInfo = {
          id: 123,
          nombre: "Alumno Simulado",
          curso: "Simulación 101"
        };
        
        await AsyncStorage.setItem('userToken', simulatedToken);
        await AsyncStorage.setItem('userData', JSON.stringify(simulatedAlumnoInfo));
        
        setToken(simulatedToken);
        setAlumnoInfo(simulatedAlumnoInfo);
        setAuthenticated(true);
        setReservas(datosSimulados);
      } else {
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
      }
    } catch (error: any) {
      console.error('Error en inicio de sesión:', error);
      
      // Si el error parece ser de CORS, activar automáticamente modo simulación
      if (error.message.includes('CORS') || error.message.includes('Failed to fetch')) {
        setError('Problemas de conexión con el servidor. Modo simulación activado automáticamente.');
        setModoSimulacion(true);
        
        // Intentar iniciar sesión de nuevo en modo simulación
        setTimeout(() => {
          iniciarSesion();
        }, 500);
      } else {
        setError('Error: ' + error.message);
      }
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
      if (modoSimulacion) {
        // En modo simulación, usar datos de ejemplo
        console.log('Modo simulación activado - Usando datos simulados');
        setReservas(datosSimulados);
      } else if (tokenToUse) {
        // En modo real, obtener datos de la API
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
      
      // Si el error parece ser de conexión, activar modo simulación
      if (error.message.includes('CORS') || error.message.includes('Failed to fetch')) {
        setError('Problemas de conexión. Usando datos simulados.');
        setModoSimulacion(true);
        setReservas(datosSimulados);
      } else {
        setError('Error al obtener las reservas: ' + error.message);
      }
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
      <ThemedText style={styles.loginTitle}>Iniciar Sesión</ThemedText>
      
      {error && <ThemedText style={styles.error}>{error}</ThemedText>}
      
      <ThemedView style={styles.infoContainer}>
        <ThemedText style={styles.infoText}>
          Ingresa tu RUT con guión y dígito verificador (ej: 12345678-9)
        </ThemedText>
      </ThemedView>
      
      <TextInput
        style={styles.input}
        placeholder="RUT (ej: 12345678-9)"
        value={rut}
        onChangeText={setRut}
        autoCapitalize="none"
      />
      
      <ThemedView style={styles.infoContainer}>
        <ThemedText style={styles.infoText}>
          Ingresa los 4 primeros dígitos del RUT sin puntos
        </ThemedText>
      </ThemedView>
      
      <TextInput
        style={styles.input}
        placeholder="4 primeros dígitos de tu RUT"
        value={digitosVerificacion}
        onChangeText={setDigitosVerificacion}
        keyboardType="number-pad"
        maxLength={4}
        secureTextEntry={true}
      />
      
      <ThemedView style={styles.checkboxContainer}>
        <TouchableOpacity 
          style={[styles.checkbox, modoSimulacion ? styles.checkboxChecked : {}]}
          onPress={() => setModoSimulacion(!modoSimulacion)}
        />
        <ThemedText style={styles.checkboxLabel}>
          Modo simulación (usar datos de ejemplo)
        </ThemedText>
      </ThemedView>
      
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
      <Stack.Screen options={{ title: 'Laboratorio de Computación', headerShown: true }} />
      <ThemedText type="title" style={styles.mainTitle}>Laboratorio de Computación</ThemedText>
      
      {authenticated ? (
        <Fragment>
          <ThemedView style={styles.header}>
            <ThemedText style={styles.headerTitle}>Reservas de Computadores</ThemedText>
            {modoSimulacion && (
              <ThemedView style={styles.simulationBadge}>
                <ThemedText style={styles.simulationText}>Datos Simulados</ThemedText>
              </ThemedView>
            )}
            {alumnoInfo && (
              <ThemedView style={styles.alumnoInfo}>
                <ThemedText style={styles.nombreAlumno}>{alumnoInfo.nombre}</ThemedText>
                <ThemedText style={styles.alumnoCurso}>{alumnoInfo.curso}</ThemedText>
              </ThemedView>
            )}
            <TouchableOpacity style={styles.botonCerrarSesion} onPress={cerrarSesion}>
              <ThemedText style={styles.textoBoton}>Cerrar </ThemedText>
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
  simulationBadge: {
    backgroundColor: '#ff9800',
    padding: 5,
    borderRadius: 5,
    marginLeft: 10,
  },
  simulationText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: 'white',
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
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginBottom: 15,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    marginRight: 10,
  },
  checkboxChecked: {
    backgroundColor: '#2196F3',
  },
  checkboxLabel: {
    fontSize: 14,
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
