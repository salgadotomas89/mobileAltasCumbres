import { Redirect } from 'expo-router';

export default function IndexScreen() {
  // Redirigir directamente a la página de login
  return <Redirect href="/(tabs)/auth/login" />;
} 