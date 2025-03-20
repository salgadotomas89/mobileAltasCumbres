import React, { useState, useContext, useRef } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TextInput, 
  TouchableOpacity, 
  Image, 
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  Pressable
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthContext } from '../context/AuthContext';

// Función auxiliar para formatear RUT
const formatRut = (rut) => {
  // Eliminar puntos y guión si existen
  let value = rut.replace(/\./g, '').replace(/-/g, '');
  
  // Si está vacío, retornar vacío
  if (value.length === 0) return '';
  
  // Separar cuerpo y dígito verificador
  let cuerpo = value.slice(0, -1);
  let dv = value.slice(-1).toUpperCase();
  
  // Formatear RUT con puntos y guión
  if (cuerpo.length > 0) {
    let rutFormateado = '';
    let i = cuerpo.length;
    while (i > 0) {
      const inicio = Math.max(i - 3, 0);
      rutFormateado = '.' + cuerpo.substring(inicio, i) + rutFormateado;
      i = inicio;
    }
    return rutFormateado.substring(1) + '-' + dv;
  }
  
  return value;
};

// Validar RUT Chileno
const validarRut = (rut) => {
  // Si el RUT está en la lista de la base de datos, es válido
  // Pero no tenemos acceso a esa lista, así que hacemos una validación básica
  
  // Eliminar puntos y guión
  const rutLimpio = rut.replace(/\./g, '').replace(/-/g, '');
  
  // Si no tiene el largo mínimo, no es válido
  if (rutLimpio.length < 2) return false;
  
  // Si no tiene guión, también lo consideramos válido para permitir ambos formatos
  if (rut.indexOf('-') === -1) {
    // Es un RUT sin formato, simplemente verificamos que tenga longitud razonable
    return rutLimpio.length >= 7 && rutLimpio.length <= 9;
  }
  
  // Si tiene formato, validamos según algoritmo de RUT chileno
  const cuerpo = rutLimpio.slice(0, -1);
  const dv = rutLimpio.slice(-1).toUpperCase();
  
  // Calcular dígito verificador
  let suma = 0;
  let multiplo = 2;
  
  // Para cada dígito del cuerpo
  for (let i = cuerpo.length - 1; i >= 0; i--) {
    suma += multiplo * parseInt(cuerpo.charAt(i), 10);
    multiplo = multiplo < 7 ? multiplo + 1 : 2;
  }
  
  // Calcular dígito verificador en base a módulo 11
  let dvEsperado = 11 - (suma % 11);
  dvEsperado = dvEsperado === 11 ? '0' : dvEsperado === 10 ? 'K' : dvEsperado.toString();
  
  // Comparar con el dígito verificador ingresado
  return dv === dvEsperado;
};

export default function LoginScreen({ navigation }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { login, isLoading, loginError } = useContext(AuthContext);
  const passwordInputRef = useRef(null);

  const handleRutChange = (text) => {
    // Permitir solo números, k/K y caracteres de formato
    const rutFiltrado = text.replace(/[^0-9kK\.\-]/g, '');
    setUsername(rutFiltrado);
    
    // Autocompletar los 4 primeros dígitos como contraseña
    if (rutFiltrado) {
      // Extraer solo los números del RUT
      const soloNumeros = rutFiltrado.replace(/[^0-9]/g, '');
      // Tomar los primeros 4 dígitos si hay suficientes
      if (soloNumeros.length >= 4) {
        const primerosCuatro = soloNumeros.substring(0, 4);
        setPassword(primerosCuatro);
      }
    }
  };

  const handleLogin = async () => {
    // Validar campos
    if (!username || !password) {
      Alert.alert('Error', 'Por favor, ingresa tu RUT y los dígitos de verificación');
      return;
    }
    
    // Limpiar RUT para validación
    const rutLimpio = username.replace(/\./g, '').replace(/-/g, '');
    
    // Validar formato de RUT - menos estricto ahora
    if (!validarRut(username)) {
      Alert.alert('Error', 'El RUT ingresado no es válido');
      return;
    }
    
    // Validar que la contraseña tenga 4 dígitos
    if (!/^\d{4}$/.test(password)) {
      Alert.alert('Error', 'Los dígitos de verificación deben ser 4 números');
      return;
    }
    
    // Intentar login
    try {
      console.log('Enviando datos:', { 
        rut: username, // Primero intentamos con el formato original que ingresó el usuario
        digitos: password 
      });
      
      let success = false;
      
      // Intentar con el formato original (como lo ingresó el usuario)
      try {
        success = await login(username, password);
        if (success) return;
      } catch (error) {
        console.log('Primer intento fallido, probando otro formato...');
      }
      
      // Si falla, intentar con formato limpio (sin puntos ni guiones)
      if (!success) {
        try {
          console.log('Intentando con RUT limpio:', rutLimpio);
          success = await login(rutLimpio, password);
          if (success) return;
        } catch (error) {
          console.log('Segundo intento fallido...');
        }
      }
      
      // Si ambos intentos fallan y no hay un error específico
      if (!success && !loginError) {
        Alert.alert('Error', 'No se pudo iniciar sesión con ningún formato de RUT');
      }
    } catch (error) {
      console.error('Error en handleLogin:', error);
      Alert.alert('Error', 'Ocurrió un error inesperado. Intenta nuevamente.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.logoContainer}>
            <Image
              source={require('../assets/logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.versionText}>Versión: 1.0.2</Text>
          </View>
          
          <TouchableOpacity 
            style={styles.alternativeLoginButton}
            onPress={() => navigation.navigate('AlternativeLogin')}
          >
            <Text style={styles.alternativeLoginButtonText}>+</Text>
          </TouchableOpacity>

          <View style={styles.formContainer}>
            <Text style={styles.title}>Iniciar Sesión</Text>
            <Text style={styles.subtitle}>Ingresa con tu RUT y los 4 primeros dígitos como contraseña</Text>
            
            {loginError && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{loginError}</Text>
              </View>
            )}
            
            <View style={styles.inputContainer}>
              <Text style={styles.label}>RUT</Text>
              <View style={styles.inputWithHint}>
                <TextInput
                  style={styles.input}
                  placeholder="Ej: 25.520.231-6"
                  value={username}
                  onChangeText={handleRutChange}
                  autoCapitalize="none"
                  keyboardType="default"
                  returnKeyType="next"
                  onSubmitEditing={() => passwordInputRef.current?.focus()}
                />
              </View>
              <Text style={styles.hint}>Ingresa tu RUT con puntos y guión (ejemplo: 25.520.231-6)</Text>
            </View>
            
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Dígitos de Verificación</Text>
              <TextInput
                style={styles.input}
                placeholder="Ej: 2552"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
                keyboardType="numeric"
                maxLength={4}
                ref={passwordInputRef}
                returnKeyType="done"
                onSubmitEditing={handleLogin}
              />
              <Text style={styles.hint}>Ingresa los primeros 4 dígitos de tu RUT sin puntos (ejemplo: 2552)</Text>
            </View>
            
            <TouchableOpacity 
              style={styles.loginButton} 
              onPress={handleLogin}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.loginButtonText}>Ingresar</Text>
              )}
            </TouchableOpacity>

            
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    width: 150,
    height: 150,
    marginBottom: 10,
  },
  logoText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#007bff',
  },
  versionText: {
    fontSize: 12,
    color: '#999',
    marginTop: 5,
  },
  formContainer: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  errorContainer: {
    backgroundColor: '#ffeeee',
    borderRadius: 5,
    padding: 10,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#ff0000',
  },
  errorText: {
    color: '#ff0000',
  },
  inputContainer: {
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    marginBottom: 5,
    fontWeight: '500',
  },
  inputWithHint: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 10,
    fontSize: 16,
  },
  hint: {
    fontSize: 12,
    color: '#888',
    marginTop: 5,
  },
  loginButton: {
    backgroundColor: '#007bff',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 20,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  testButtonsContainer: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  testTitle: {
    textAlign: 'center',
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  testButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  testButton: {
    backgroundColor: '#e9ecef',
    padding: 10,
    borderRadius: 5,
    margin: 5,
  },
  testButtonText: {
    fontSize: 12,
    color: '#495057',
  },
  alternativeLoginButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FF0000',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  alternativeLoginButtonText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
});