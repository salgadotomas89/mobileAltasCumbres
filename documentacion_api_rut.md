# Documentación de la API de Autenticación con RUT

## Descripción
Esta API permite a los alumnos autenticarse utilizando su RUT y los 4 primeros dígitos del mismo como verificación, sin necesidad de recordar un nombre de usuario y contraseña adicionales.

## Endpoint de Autenticación
- **URL**: `https://altascumbressanclemente.cl/api/alumno-auth/`
- **Método**: POST
- **Datos requeridos**:
  ```json
  {
    "rut": "12345678-9",
    "digitos_verificacion": "1234"
  }
  ```

## Respuesta exitosa
```json
{
  "token": "9944b09199c62bcf9418ad846dd0e4bbdfc6ee4b",
  "alumno_id": 123,
  "nombre": "Juan Pérez",
  "curso": "4° Básico"
}
```

## Respuestas de error
- **No se encuentra el alumno (404)**:
  ```json
  {
    "error": "No se encontró un alumno con este RUT"
  }
  ```
- **RUT no proporcionado (400)**:
  ```json
  {
    "rut": ["El RUT es requerido"]
  }
  ```
- **Dígitos de verificación incorrectos (400)**:
  ```json
  {
    "non_field_errors": ["Los dígitos de verificación no coinciden"]
  }
  ```

## Ejemplo de implementación en React Native

```javascript
// LoginScreen.js
import React, { useState } from 'react';
import { View, TextInput, Button, Text, Alert, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LoginScreen = ({ navigation }) => {
  const [rut, setRut] = useState('');
  const [digitos, setDigitos] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!rut) {
      Alert.alert('Error', 'Por favor ingresa tu RUT');
      return;
    }
    
    if (!digitos) {
      Alert.alert('Error', 'Por favor ingresa los 4 primeros dígitos de tu RUT');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('https://altascumbressanclemente.cl/api/alumno-auth/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          rut, 
          digitos_verificacion: digitos 
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.non_field_errors?.[0] || 'Error al iniciar sesión');
      }

      // Guardar el token en AsyncStorage
      await AsyncStorage.setItem('userToken', data.token);
      await AsyncStorage.setItem('userData', JSON.stringify({
        id: data.alumno_id,
        nombre: data.nombre,
        curso: data.curso
      }));

      // Navegar a la pantalla principal
      navigation.reset({
        index: 0,
        routes: [{ name: 'Home' }],
      });
    } catch (error) {
      Alert.alert('Error', error.message || 'No se pudo iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Iniciar Sesión</Text>
      <TextInput
        style={styles.input}
        placeholder="Ingresa tu RUT (ej: 12345678-9)"
        value={rut}
        onChangeText={setRut}
        keyboardType="default"
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Ingresa los 4 primeros dígitos de tu RUT"
        value={digitos}
        onChangeText={setDigitos}
        keyboardType="number-pad"
        maxLength={4}
        secureTextEntry={true}
      />
      <Button
        title={loading ? "Cargando..." : "Iniciar Sesión"}
        onPress={handleLogin}
        disabled={loading}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    marginBottom: 15,
    paddingHorizontal: 10,
  },
});

export default LoginScreen;
```

## Uso del token para peticiones autenticadas

Una vez obtenido el token, debe incluirse en todas las peticiones a endpoints protegidos.

Ejemplo para recuperar los datos de una reserva:

```javascript
// Función para obtener reservas de computador
const fetchReservas = async () => {
  try {
    // Recuperar el token guardado
    const token = await AsyncStorage.getItem('userToken');
    
    if (!token) {
      // Redirigir al login si no hay token
      return;
    }
    
    const response = await fetch('https://altascumbressanclemente.cl/api/reservas-computador/', {
      method: 'GET',
      headers: {
        'Authorization': `Token ${token}`,
        'Content-Type': 'application/json',
      },
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.detail || 'Error al obtener reservas');
    }
    
    // Usar los datos...
    console.log(data);
    return data;
    
  } catch (error) {
    console.error('Error:', error);
    Alert.alert('Error', 'No se pudieron cargar las reservas');
  }
};
```

## Seguridad
- El token tiene una validez indefinida hasta que se elimine manualmente.
- El sistema utiliza los 4 primeros dígitos del RUT como factor de verificación simple.
- El sistema automáticamente crea usuarios de Django para los alumnos la primera vez que se autentican. 