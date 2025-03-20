import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function PerfilAlumnoScreen({ route, navigation }) {
  // Obtener los datos del alumno desde los parámetros de navegación
  const { alumno } = route.params || {};

  // Función para formatear una fecha
  const formatearFecha = (fechaStr) => {
    if (!fechaStr) return 'No disponible';
    
    try {
      const fecha = new Date(fechaStr);
      return fecha.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (error) {
      return fechaStr; // Devolver la fecha original si hay error
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header con botón de regreso */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#007bff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Perfil del Alumno</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        {/* Sección con nombre del alumno */}
        <View style={styles.nombreContainer}>
          <Text style={styles.nombreAlumno}>
            {alumno?.nombre || 'Nombre no disponible'}
          </Text>
        </View>

        {/* Tarjeta de información básica */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Información Básica</Text>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>RUT:</Text>
            <Text style={styles.infoValue}>{alumno?.rut || 'No disponible'}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Curso:</Text>
            <Text style={styles.infoValue}>{alumno?.curso_id || 'No asignado'}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Fecha de Nacimiento:</Text>
            <Text style={styles.infoValue}>{formatearFecha(alumno?.fechaNacimiento)}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Edad:</Text>
            <Text style={styles.infoValue}>{alumno?.edad || 'No disponible'}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Sexo:</Text>
            <Text style={styles.infoValue}>{alumno?.sexo || 'No especificado'}</Text>
          </View>
        </View>

        {/* Tarjeta de información familiar */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Información Familiar</Text>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Apellido Materno:</Text>
            <Text style={styles.infoValue}>{alumno?.materno || 'No disponible'}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Dirección:</Text>
            <Text style={styles.infoValue}>{alumno?.direccion || 'No disponible'}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Nacionalidad:</Text>
            <Text style={styles.infoValue}>{alumno?.nacionalidad || 'No disponible'}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Pueblo Originario:</Text>
            <Text style={styles.infoValue}>{alumno?.puebloOriginario || 'No especificado'}</Text>
          </View>
        </View>

        {/* Tarjeta de información académica */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Información Académica</Text>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Procedencia:</Text>
            <Text style={styles.infoValue}>{alumno?.procedencia || 'No disponible'}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Fecha de Incorporación:</Text>
            <Text style={styles.infoValue}>{formatearFecha(alumno?.fechaIncorporacion)}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Reprobado:</Text>
            <Text style={styles.infoValue}>{alumno?.reprobado ? 'Sí' : 'No'}</Text>
          </View>
        </View>

        {/* Tarjeta de información de salud */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Información de Salud</Text>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Alergias:</Text>
            <Text style={styles.infoValue}>{alumno?.alergico || 'No registradas'}</Text>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    paddingVertical: 15,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  content: {
    flex: 1,
    padding: 15,
  },
  nombreContainer: {
    backgroundColor: '#007bff',
    borderRadius: 10,
    padding: 20,
    marginBottom: 20,
    alignItems: 'center',
  },
  nombreAlumno: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 10,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoLabel: {
    fontSize: 15,
    color: '#666',
    flex: 1,
  },
  infoValue: {
    fontSize: 15,
    color: '#333',
    fontWeight: '500',
    flex: 1.5,
    textAlign: 'right',
  },
}); 