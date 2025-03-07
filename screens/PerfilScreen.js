import React, { useContext, useEffect, useState } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../context/AuthContext';
import { alumnosService } from '../services/api';

const InfoRow = ({ label, value }) => (
  <View style={styles.infoRow}>
    <Text style={styles.label}>{label}:</Text>
    <Text style={styles.value}>{value || 'No especificado'}</Text>
  </View>
);

export default function PerfilScreen() {
  const { userData, logout } = useContext(AuthContext);
  const [alumnoData, setAlumnoData] = useState(null);
  const [loading, setLoading] = useState(true);

  const cargarDatosAlumno = async () => {
    try {
      setLoading(true);
      // Obtener el rut del alumno del contexto de autenticación
      const rut = userData?.rut;
      
      console.log('=== Depuración carga de datos alumno ===');
      console.log('RUT del alumno:', rut);
      console.log('Datos completos del usuario:', userData);
      
      if (!rut) {
        console.log('Error: RUT no encontrado en userData');
        throw new Error('No se encontró el RUT del alumno');
      }

      console.log('Intentando obtener datos del alumno con RUT:', rut);
      console.log('URL del servicio:', alumnosService.baseURL);
      
      // Usar el método getAlumnosPorRut para obtener los datos
      const response = await alumnosService.getAlumnosPorRut(rut);
      console.log('Respuesta de la API:', response);
      
      // La API devuelve una lista, pero como el RUT es único, tomamos el primer elemento
      if (response && Array.isArray(response) && response.length > 0) {
        console.log('Datos del alumno encontrados:', response[0]);
        setAlumnoData(response[0]);
      } else {
        console.log('No se encontraron datos para el RUT:', rut);
        throw new Error('No se encontraron datos del alumno');
      }
    } catch (error) {
      console.error('Error detallado al cargar datos del alumno:', error);
      console.error('Stack trace:', error.stack);
      Alert.alert(
        'Error',
        'No se pudieron cargar los datos del alumno. Por favor, intenta de nuevo más tarde.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatosAlumno();
  }, []);

  const handleLogout = () => {
    Alert.alert(
      'Cerrar sesión',
      '¿Estás seguro que deseas cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Salir', style: 'destructive', onPress: logout }
      ]
    );
  };

  const formatFecha = (fecha) => {
    if (!fecha) return 'No especificada';
    return new Date(fecha).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={styles.loadingText}>Cargando datos...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mi Perfil</Text>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Ionicons name="log-out-outline" size={24} color="#666" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            <Ionicons name="person-circle-outline" size={80} color="#007bff" />
            <Text style={styles.rutText}>{alumnoData?.rut || 'RUT no disponible'}</Text>
          </View>

          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Información Personal</Text>
            <InfoRow label="Nombre" value={alumnoData?.nombre} />
            <InfoRow label="Apellido Materno" value={alumnoData?.materno} />
            <InfoRow label="Sexo" value={alumnoData?.sexo} />
            <InfoRow label="Edad" value={alumnoData?.edad?.toString()} />
            <InfoRow label="Fecha de Nacimiento" value={formatFecha(alumnoData?.fechaNacimiento)} />
          </View>

          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Información Académica</Text>
            <InfoRow label="Curso ID" value={alumnoData?.curso_id?.toString()} />
            <InfoRow label="Fecha de Incorporación" value={formatFecha(alumnoData?.fechaIncorporacion)} />
            <InfoRow label="Procedencia" value={alumnoData?.procedencia} />
            <InfoRow label="Reprobado" value={alumnoData?.reprobado} />
          </View>

          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Información Adicional</Text>
            <InfoRow label="Dirección" value={alumnoData?.direccion} />
            <InfoRow label="Nacionalidad" value={alumnoData?.nacionalidad} />
            <InfoRow label="Pueblo Originario" value={alumnoData?.puebloOriginario} />
            <InfoRow label="Alergias" value={alumnoData?.alergico} />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  logoutButton: {
    padding: 5,
  },
  content: {
    flex: 1,
    padding: 15,
  },
  profileSection: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  rutText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  sectionContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 5,
  },
  infoRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  label: {
    flex: 1,
    fontSize: 15,
    color: '#666',
    fontWeight: '500',
  },
  value: {
    flex: 2,
    fontSize: 15,
    color: '#333',
  }
}); 