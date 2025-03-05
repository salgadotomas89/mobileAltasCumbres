import { Image, StyleSheet, Platform, TouchableOpacity, View } from 'react-native';
import { router, useRouter } from 'expo-router';

import { HelloWave } from '@/components/HelloWave';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const buttonColor = colorScheme === 'dark' ? '#1D3D47' : '#A1CEDC';
  const router = useRouter();
  
  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
      headerImage={
        <Image
          source={require('@/assets/images/partial-react-logo.png')}
          style={styles.reactLogo}
          resizeMode="contain"
        />
      }>
      <View style={styles.container}>
        {/* Encabezado con animación */}
        <ThemedView style={styles.welcomeContainer}>
          <ThemedText type="title" style={styles.title}>Colegio Altas Cumbres</ThemedText>
        <HelloWave />
      </ThemedView>
      
        {/* Mensaje de bienvenida */}
        <ThemedView style={styles.welcomeMessage}>
          <ThemedText style={styles.welcomeText}>
            Bienvenido a la aplicación oficial del Colegio Altas Cumbres. Aquí podrás acceder a 
            toda la información importante sobre el colegio y gestionar tus actividades académicas.
          </ThemedText>
        </ThemedView>
        
        {/* Botón de inicio de sesión mejorado */}
      <TouchableOpacity 
          style={[styles.actionButton, { backgroundColor: buttonColor }]}
        onPress={() => router.push('/(tabs)/auth/login')}>
          <ThemedText style={styles.buttonText}>INICIAR SESIÓN</ThemedText>
      </TouchableOpacity>

        {/* Tarjetas informativas */}
        <ThemedText type="subtitle" style={styles.sectionTitle}>Explora nuestros servicios</ThemedText>
        
        <View style={styles.cardsContainer}>
          <ThemedView style={styles.card}>
            <ThemedText style={styles.cardTitle}>Noticias</ThemedText>
            <ThemedText style={styles.cardContent}>Mantente informado de todas las novedades y eventos importantes de nuestra institución.</ThemedText>
          </ThemedView>
          
          <ThemedView style={styles.card}>
            <ThemedText style={styles.cardTitle}>Calendario</ThemedText>
            <ThemedText style={styles.cardContent}>Consulta el calendario escolar y las actividades programadas para el año académico.</ThemedText>
          </ThemedView>
          
          <ThemedView style={styles.card}>
            <ThemedText style={styles.cardTitle}>Contacto</ThemedText>
            <ThemedText style={styles.cardContent}>Encuentra información de contacto y ubica nuestras instalaciones fácilmente.</ThemedText>
          </ThemedView>
        </View>
      </View>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  welcomeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  welcomeMessage: {
    backgroundColor: 'rgba(161, 206, 220, 0.2)',
    borderRadius: 10,
    padding: 16,
    marginBottom: 24,
  },
  welcomeText: {
    lineHeight: 22,
    textAlign: 'center',
  },
  actionButton: {
    borderRadius: 30,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonText: {
    fontWeight: 'bold',
    fontSize: 16,
    textTransform: 'uppercase',
  },
  sectionTitle: {
    marginBottom: 16,
    fontSize: 20,
    fontWeight: '600',
  },
  cardsContainer: {
    gap: 16,
  },
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  cardContent: {
    lineHeight: 20,
  },
  reactLogo: {
    width: 100,
    height: 100,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepContainer: {
    gap: 8,
    marginBottom: 8,
  },
});

