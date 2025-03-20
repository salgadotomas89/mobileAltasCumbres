import React, { createContext, useState, useEffect } from 'react';
import { authService } from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

// Crear el contexto
export const AuthContext = createContext();

// Proveedor del contexto
export const AuthProvider = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [userToken, setUserToken] = useState(null);
  const [loginError, setLoginError] = useState(null);
  const [userData, setUserData] = useState(null);
  const [userType, setUserType] = useState(null);

  // Verificar si hay un token almacenado al cargar la app
  useEffect(() => {
    const bootstrapAsync = async () => {
      try {
        console.log('Verificando autenticación al iniciar...');
        const storedToken = await AsyncStorage.getItem('userToken');
        const storedUserData = await AsyncStorage.getItem('userData');
        const storedUserType = await AsyncStorage.getItem('userType');
        
        if (storedToken) {
          setUserToken(storedToken);
          setUserType(storedUserType);
          if (storedUserData) {
            setUserData(JSON.parse(storedUserData));
          }
          console.log('Token encontrado, manteniendo sesión');
        } else {
          console.log('No se encontró token, redirigiendo a login');
        }
      } catch (e) {
        console.error('Error al verificar autenticación:', e);
      } finally {
        setIsLoading(false);
      }
    };

    bootstrapAsync();
  }, []);

  // Funciones de autenticación
  const authContext = {
    login: async (username, password) => {
      setIsLoading(true);
      setLoginError(null);
      try {
        // Validar formato del RUT
        if (!username || !password) {
          setLoginError('Por favor, ingresa tu RUT y los dígitos de verificación');
          setIsLoading(false);
          return false;
        }
        
        // Validar que los dígitos de verificación tengan 4 dígitos
        if (!/^\d{4}$/.test(password)) {
          setLoginError('Los dígitos de verificación deben ser 4 números');
          setIsLoading(false);
          return false;
        }
        
        console.log('Intentando login con RUT:', username, 'y dígitos:', password);
        
        try {
          const response = await authService.login(username, password);
          
          if (response && response.token) {
            console.log('Login exitoso, token recibido');
            setUserToken(response.token);
            
            // Si hay datos del usuario
            if (response.userData) {
              console.log('Datos del usuario recibidos:', response.userData);
              setUserData(response.userData);
              await AsyncStorage.setItem('userData', JSON.stringify(response.userData));
            } else {
              console.log('No se recibieron datos del usuario en la respuesta');
              setLoginError('Error: No se recibieron los datos del usuario');
              return false;
            }
            
            return true;
          } else {
            console.log('Login falló - respuesta sin token');
            setLoginError('No se recibió un token válido');
            return false;
          }
        } catch (apiError) {
          console.error('Error de API en login:', apiError.message);
          
          // Manejar errores específicos
          if (apiError.response) {
            console.log('Detalles del error:', JSON.stringify(apiError.response.data));
            
            switch (apiError.response.status) {
              case 400:
                // Mostrar mensaje más específico si está disponible en la respuesta
                if (apiError.response.data && apiError.response.data.non_field_errors) {
                  setLoginError(apiError.response.data.non_field_errors[0]);
                } else if (apiError.response.data && apiError.response.data.mensaje) {
                  setLoginError(apiError.response.data.mensaje);
                } else {
                  setLoginError('Datos incorrectos. Revisa tu RUT y los dígitos de verificación');
                }
                break;
              case 401:
                setLoginError('Credenciales inválidas');
                break;
              case 404:
                // Si el error es 404, podría ser que el endpoint es incorrecto o que el alumno no existe
                if (apiError.response.data && apiError.response.data.mensaje) {
                  setLoginError(apiError.response.data.mensaje);
                } else if (apiError.response.data && apiError.response.data.error) {
                  setLoginError(apiError.response.data.error);
                } else {
                  setLoginError('Alumno no encontrado o servicio no disponible');
                }
                break;
              default:
                setLoginError(`Error de servidor: ${apiError.response.status}`);
            }
          } else if (apiError.request) {
            // Error de red - sin respuesta
            setLoginError('Error de conexión. Verifica tu red');
          } else {
            setLoginError('Error al procesar la solicitud');
          }
          
          return false;
        }
      } catch (error) {
        console.error('Error general en login:', error);
        setLoginError('Error inesperado. Inténtalo de nuevo');
        return false;
      } finally {
        setIsLoading(false);
      }
    },

    loginProfesor: async (username, password) => {
      setIsLoading(true);
      setLoginError(null);
      try {
        if (!username || !password) {
          setLoginError('Por favor, ingresa tu usuario y contraseña');
          setIsLoading(false);
          return false;
        }
        
        console.log('Intentando login de profesor con:', username);
        
        try {
          const response = await authService.loginProfesor(username, password);
          
          if (response && response.token) {
            console.log('Login de profesor exitoso, token recibido');
            setUserToken(response.token);
            setUserType('profesor');
            
            if (response.userData) {
              console.log('Datos del profesor recibidos:', response.userData);
              setUserData(response.userData);
              return true;
            } else {
              console.log('No se recibieron datos del profesor en la respuesta');
              setLoginError('Error: No se recibieron los datos del profesor');
              return false;
            }
          } else {
            console.log('Login falló - respuesta sin token');
            setLoginError('Credenciales inválidas');
            return false;
          }
        } catch (apiError) {
          console.error('Error de API en login de profesor:', apiError.message);
          
          if (apiError.response) {
            switch (apiError.response.status) {
              case 400:
                setLoginError('Datos incorrectos. Revisa tu usuario y contraseña');
                break;
              case 401:
                setLoginError('Credenciales inválidas');
                break;
              case 404:
                setLoginError('Servicio no disponible');
                break;
              default:
                setLoginError(`Error de servidor: ${apiError.response.status}`);
            }
          } else if (apiError.request) {
            setLoginError('Error de conexión. Verifica tu red');
          } else {
            setLoginError('Error al procesar la solicitud');
          }
          
          return false;
        }
      } catch (error) {
        console.error('Error general en login de profesor:', error);
        setLoginError('Error inesperado. Inténtalo de nuevo');
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    
    logout: async () => {
      console.log('Iniciando proceso de logout desde AuthContext');
      setIsLoading(true);
      try {
        console.log('Cerrando sesión...');
        
        // Primero limpiar el almacenamiento
        try {
          console.log('Intentando limpiar AsyncStorage...');
          await AsyncStorage.removeItem('userToken');
          await AsyncStorage.removeItem('userData');
          await AsyncStorage.removeItem('userType');
          console.log('AsyncStorage limpiado correctamente');
        } catch (storageError) {
          console.error('Error al limpiar AsyncStorage:', storageError);
        }
        
        // Luego limpiar el estado (incluso si hay error en AsyncStorage)
        console.log('Limpiando estado del contexto...');
        setUserToken(null);
        setUserData(null);
        setUserType(null);
        
        // Intentar llamar al servicio pero no esperar por él (por si falla)
        try {
          console.log('Intentando llamar al servicio de logout...');
          authService.logout().catch(err => console.error('Error en servicio logout:', err));
        } catch (serviceError) {
          console.error('Error al llamar servicio logout:', serviceError);
        }
        
        console.log('Sesión cerrada correctamente');
        Alert.alert('Sesión cerrada', 'Has cerrado sesión correctamente');
      } catch (error) {
        console.error('Error general al cerrar sesión:', error);
        // Incluso si hay error, asegurarse de limpiar todo
        setUserToken(null);
        setUserData(null);
        setUserType(null);
        try {
          await AsyncStorage.removeItem('userToken');
          await AsyncStorage.removeItem('userData');
          await AsyncStorage.removeItem('userType');
        } catch (e) {
          console.error('Error al limpiar storage durante error:', e);
        }
      } finally {
        setIsLoading(false);
        console.log('Proceso de logout completado');
      }
    },
    
    isLoading,
    userToken,
    userData,
    loginError,
    userType
  };

  return (
    <AuthContext.Provider value={authContext}>
      {children}
    </AuthContext.Provider>
  );
};