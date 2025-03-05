import { StyleSheet, FlatList, ActivityIndicator, RefreshControl, TextInput, TouchableOpacity, Alert, Platform, Linking, Image, Animated, Keyboard, Easing } from 'react-native';
import { Stack, router } from 'expo-router';
import React, { useState, useEffect, Fragment, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

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

// Color principal para botones e iconos
const PRIMARY_COLOR = '#E01C1C';

export default function ReservarComputadorScreen() {
  const colorScheme = useColorScheme();
  const tintColor = PRIMARY_COLOR; // Usando el color rojo definido
  
  // Animaciones
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const logoAnim = useRef(new Animated.Value(1)).current;
  const inputAnim1 = useRef(new Animated.Value(0)).current;
  const inputAnim2 = useRef(new Animated.Value(0)).current;
  const buttonAnim = useRef(new Animated.Value(0)).current;
  const buttonScaleAnim = useRef(new Animated.Value(1)).current;
  const spinValue = useRef(new Animated.Value(0)).current;
  
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
  const [secureTextEntry, setSecureTextEntry] = useState(true);

  // Crear animación de rotación para el logo
  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
  });

  // Animación de entrada
  useEffect(() => {
    // Secuencia de animaciones
    Animated.sequence([
      // Fade in y slide up del contenedor
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        })
      ]),
      
      // Animación suave del logo
      Animated.timing(logoAnim, {
        toValue: 1.1,
        duration: 500,
        useNativeDriver: true,
      }),
      
      Animated.timing(logoAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      
      // Animación secuencial de los campos
      Animated.stagger(200, [
        Animated.timing(inputAnim1, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(inputAnim2, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(buttonAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ])
    ]).start();
    
    // Animación de pulso para el logo
    const pulseAnimation = () => {
      Animated.sequence([
        Animated.timing(logoAnim, {
          toValue: 1.05,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(logoAnim, {
          toValue: 1,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        })
      ]).start(() => pulseAnimation());
    };
    
    pulseAnimation();
  }, []);

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

  // Animación del botón al presionar
  const animateButtonPress = () => {
    Animated.sequence([
      Animated.timing(buttonScaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(buttonScaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      })
    ]).start();
  };

  // Iniciar sesión y obtener token
  const iniciarSesion = async () => {
    Keyboard.dismiss();
    animateButtonPress();
    
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
    
    // Iniciar animación de rotación
    Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 1000,
        easing: Easing.linear,
        useNativeDriver: true
      })
    ).start();

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
      
      // Redirigir al dashboard después de iniciar sesión exitosamente
      router.replace('/dashboard');
      
    } catch (error: any) {
      console.error('Error en inicio de sesión:', error);
      setError('Error: ' + error.message);
    } finally {
      setLoading(false);
      // Detener animación de rotación
      spinValue.setValue(0);
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
    <Animated.View 
      style={[
        styles.loginContainer, 
        { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
      ]}
    >
      <Animated.Image 
        source={require('@/assets/images/logo.png')} 
        style={[
          styles.logo, 
          { transform: [{ scale: logoAnim }] }
        ]} 
        resizeMode="contain"
      />
      
      <ThemedText style={styles.loginSubtitle}>
        Ingresa con tu RUT para acceder a tu cuenta
      </ThemedText>
      
      {error && (
        <ThemedView style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={20} color="#f44336" />
          <ThemedText style={styles.error}>{error}</ThemedText>
        </ThemedView>
      )}
      
      <Animated.View 
        style={[
          styles.inputContainer,
          { opacity: inputAnim1, transform: [{ translateX: inputAnim1.interpolate({
            inputRange: [0, 1],
            outputRange: [-20, 0]
          })}] }
        ]}
      >
        <Ionicons name="person-outline" size={20} color={tintColor} style={styles.inputIcon} />
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
          placeholderTextColor="#999"
        />
      </Animated.View>
      
      <Animated.View 
        style={[
          styles.inputContainer,
          { opacity: inputAnim2, transform: [{ translateX: inputAnim2.interpolate({
            inputRange: [0, 1],
            outputRange: [20, 0]
          })}] }
        ]}
      >
        <Ionicons name="lock-closed-outline" size={20} color={tintColor} style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          placeholder="4 primeros dígitos de tu RUT"
          value={digitosVerificacion}
          onChangeText={setDigitosVerificacion}
          keyboardType="number-pad"
          maxLength={4}
          secureTextEntry={secureTextEntry}
          placeholderTextColor="#999"
        />
        <TouchableOpacity 
          style={styles.visibilityIcon} 
          onPress={() => setSecureTextEntry(!secureTextEntry)}
        >
          <Ionicons 
            name={secureTextEntry ? "eye-outline" : "eye-off-outline"} 
            size={20} 
            color="#999" 
          />
        </TouchableOpacity>
      </Animated.View>
      
      <Animated.View
        style={[
          { opacity: buttonAnim, transform: [
            { translateY: buttonAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [20, 0]
            })},
            { scale: buttonScaleAnim }
          ]}
        ]}
      >
        <TouchableOpacity 
          style={[
            styles.botonLogin, 
            { backgroundColor: tintColor },
            loading && styles.botonDeshabilitado
          ]} 
          onPress={iniciarSesion}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <Animated.View style={{ transform: [{ rotate: spin }] }}>
              <Ionicons name="refresh" size={24} color="#fff" />
            </Animated.View>
          ) : (
            <ThemedText style={styles.textoBoton}>
              Iniciar Sesión
            </ThemedText>
          )}
        </TouchableOpacity>
      </Animated.View>
      
      <ThemedText style={styles.ayudaText}>
        Si tienes problemas para iniciar sesión, contacta a soporte técnico.
      </ThemedText>
    </Animated.View>
  );

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ 
        title: 'Iniciar Sesión', 
        headerShown: false,
      }} />
      
      {authenticated ? (
        <Fragment>
          <ThemedView style={styles.header}>
            {alumnoInfo && (
              <ThemedView style={styles.alumnoInfo}>
                <ThemedText style={styles.nombreAlumno}>{alumnoInfo.nombre}</ThemedText>
                <ThemedText style={styles.alumnoCurso}>{alumnoInfo.curso}</ThemedText>
              </ThemedView>
            )}
            <TouchableOpacity 
              style={[styles.botonCerrarSesion, { backgroundColor: PRIMARY_COLOR }]} 
              onPress={cerrarSesion}
              activeOpacity={0.8}
            >
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
              <ThemedView style={styles.emptyContainer}>
                <Ionicons name="calendar-outline" size={50} color={PRIMARY_COLOR} />
                <ThemedText style={styles.mensaje}>No hay reservas disponibles</ThemedText>
              </ThemedView>
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
  logo: {
    width: 150,
    height: 150,
    marginBottom: 20,
  },
  loginContainer: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  loginSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    color: '#666',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    height: 55,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    marginBottom: 16,
    paddingHorizontal: 15,
    backgroundColor: '#fff',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  inputIcon: {
    marginRight: 10,
  },
  visibilityIcon: {
    padding: 5,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 16,
    color: '#333',
  },
  botonLogin: {
    width: 280,
    height: 55,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  botonDeshabilitado: {
    opacity: 0.7,
  },
  textoBoton: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    width: '100%',
  },
  error: {
    color: '#f44336',
    marginLeft: 8,
    flex: 1,
  },
  ayudaText: {
    marginTop: 30,
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    marginBottom: 15,
  },
  alumnoInfo: {
    flex: 1,
  },
  nombreAlumno: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  alumnoCurso: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  botonCerrarSesion: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  tarjeta: {
    padding: 16,
    marginVertical: 8,
    borderRadius: 12,
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
  fechaCreacion: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
    fontStyle: 'italic',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  mensaje: {
    textAlign: 'center',
    marginTop: 15,
    color: '#888',
    fontSize: 16,
  },
}); 