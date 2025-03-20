import React, { useContext } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

// Pantallas
import LoginScreen from '../screens/LoginScreen';
import AlternativeLoginScreen from '../screens/AlternativeLoginScreen';
import HomeScreen from '../screens/HomeScreen';
import NoticiasScreen from '../screens/NoticiasScreen';
import PerfilScreen from '../screens/PerfilScreen';
import AlumnosScreen from '../screens/AlumnosScreen';
import PerfilAlumnoScreen from '../screens/PerfilAlumnoScreen';

// Contexto de autenticación
import { AuthContext } from '../context/AuthContext';

// Navegación
const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Navegador de alumnos (incluye lista de alumnos y perfil de alumno)
const AlumnosStackNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ListaAlumnos" component={AlumnosScreen} />
      <Stack.Screen name="PerfilAlumno" component={PerfilAlumnoScreen} />
    </Stack.Navigator>
  );
};

// Navegación principal (después del login)
const MainTabs = () => {
  const { userType } = useContext(AuthContext);
  const isProfesor = userType === 'profesor';

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#007bff',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      }}
    >
      <Tab.Screen 
        name="Reservas" 
        component={HomeScreen} 
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen 
        name="Noticias" 
        component={NoticiasScreen} 
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="newspaper" size={size} color={color} />
          ),
        }}
      />
      {isProfesor && (
        <Tab.Screen 
          name="Alumnos" 
          component={AlumnosStackNavigator} 
          options={{
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="people" size={size} color={color} />
            ),
          }}
        />
      )}
      <Tab.Screen 
        name="Perfil" 
        component={PerfilScreen} 
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

// Navegación basada en autenticación
export default function AppNavigation() {
  const { isLoading, userToken } = useContext(AuthContext);

  if (isLoading) {
    // Podríamos mostrar una pantalla de splash aquí
    return null;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {userToken ? (
          // Usuario autenticado
          <Stack.Screen name="Main" component={MainTabs} />
        ) : (
          // Usuario no autenticado
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="AlternativeLogin" component={AlternativeLoginScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}