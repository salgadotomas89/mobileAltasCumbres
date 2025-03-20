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

const ProfesorPerfil = ({ userData, handleLogout }) => {
  return (
    <ScrollView style={styles.content}>
      <View style={styles.profileSection}>
        <View style={styles.avatarContainer}>
          <Ionicons name="person-circle-outline" size={80} color="#007bff" />
          <Text style={styles.nameText}>{`${userData?.first_name || ''} ${userData?.last_name || ''}`}</Text>
          <Text style={styles.emailText}>{userData?.email || 'Email no disponible'}</Text>
        </View>

        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Información del Profesor</Text>
          <InfoRow label="Usuario" value={userData?.username} />
          <InfoRow label="Nombre" value={userData?.first_name} />
          <InfoRow label="Apellido" value={userData?.last_name} />
          <InfoRow label="Email" value={userData?.email} />
          <InfoRow label="Tipo de Usuario" value={userData?.is_staff ? 'Profesor' : 'Usuario'} />
        </View>
      </View>
    </ScrollView>
  );
};

const AlumnoPerfil = ({ alumnoData, formatFecha }) => {
  return (
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
  );
};

export default function PerfilScreen() {
  const { userData, logout, userType } = useContext(AuthContext);
  const [alumnoData, setAlumnoData] = useState(null);
  const [loading, setLoading] = useState(true);

  const cargarDatosAlumno = async () => {
    if (userType === 'profesor') {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const rut = userData?.rut;
      
      if (!rut) {
        throw new Error('No se encontró el RUT del alumno');
      }

      const rutLimpio = rut.replace(/\./g, '').replace(/-/g, '');
      const response = await alumnosService.getAlumnosPorRut(rutLimpio);
      
      if (response && Array.isArray(response) && response.length > 0) {
        setAlumnoData(response[0]);
      } else {
        if (userData) {
          setAlumnoData(userData);
        } else {
          throw new Error('No se encontraron datos del alumno');
        }
      }
    } catch (error) {
      console.error('Error al cargar datos del alumno:', error);
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
        { 
          text: 'Salir', 
          style: 'destructive', 
          onPress: () => logout()
        }
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
          <View style={styles.logoutButtonContent}>
            <Ionicons name="log-out-outline" size={24} color="#fff" />
            <Text style={styles.logoutButtonText}>Cerrar Sesión</Text>
          </View>
        </TouchableOpacity>
      </View>

      {userType === 'profesor' ? (
        <ProfesorPerfil userData={userData} handleLogout={handleLogout} />
      ) : (
        <AlumnoPerfil alumnoData={alumnoData} formatFecha={formatFecha} />
      )}
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
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  logoutButton: {
    backgroundColor: '#dc3545',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoutButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoutButtonText: {
    color: '#fff',
    marginLeft: 8,
    fontWeight: '600',
    fontSize: 14,
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
  },
  sectionContainer: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  nameText: {
    marginTop: 10,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  emailText: {
    marginTop: 5,
    fontSize: 14,
    color: '#666',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  label: {
    fontSize: 16,
    color: '#666',
    flex: 1,
  },
  value: {
    fontSize: 16,
    color: '#333',
    flex: 2,
    textAlign: 'right',
  },
}); 