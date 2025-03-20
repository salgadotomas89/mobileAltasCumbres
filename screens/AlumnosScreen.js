import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Alert,
  RefreshControl,
  Modal
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { alumnosService } from '../services/api';
import { debounce } from 'lodash';

const AlumnoCard = ({ alumno, onPerfil, onEdicionRapida }) => (
  <View style={styles.alumnoCard}>
    <View style={styles.alumnoInfo}>
      <Text style={styles.nombreText}>
        {alumno.nombre || 'Nombre no disponible'}
      </Text>
      <Text style={styles.rutText}>
        RUT: {alumno.rut || 'No disponible'}
      </Text>
      <Text style={styles.cursoText}>
        Curso: {alumno.curso_id || 'No asignado'}
      </Text>
    </View>
    <View style={styles.botonesContainer}>
      <TouchableOpacity 
        style={styles.botonEdicion}
        onPress={() => onEdicionRapida(alumno)}
      >
        <Ionicons name="create-outline" size={22} color="#007bff" />
      </TouchableOpacity>
      <TouchableOpacity 
        style={styles.botonPerfil}
        onPress={() => onPerfil(alumno)}
      >
        <Ionicons name="person" size={22} color="#28a745" />
      </TouchableOpacity>
    </View>
  </View>
);

export default function AlumnosScreen({ navigation }) {
  const [alumnos, setAlumnos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [allAlumnos, setAllAlumnos] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [alumnoActual, setAlumnoActual] = useState(null);
  const [datosRapidos, setDatosRapidos] = useState({
    asistencia: '',
    comentario: ''
  });

  const cargarAlumnos = async (pageNumber = 1, shouldRefresh = false) => {
    try {
      if (shouldRefresh) {
        setLoading(true);
      } else if (pageNumber > 1) {
        setLoadingMore(true);
      }

      const response = await alumnosService.getAlumnos(pageNumber);
      
      if (shouldRefresh) {
        setAlumnos(response.alumnos);
        setAllAlumnos(response.alumnos);
      } else {
        setAlumnos(prev => [...prev, ...response.alumnos]);
        setAllAlumnos(prev => [...prev, ...response.alumnos]);
      }

      setHasMore(response.hasMore);
      setPage(response.currentPage);
    } catch (error) {
      console.error('Error al cargar alumnos:', error);
      Alert.alert(
        'Error',
        'No se pudieron cargar los alumnos. Por favor, intenta de nuevo más tarde.'
      );
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    setPage(1);
    cargarAlumnos(1, true);
  };

  const handleLoadMore = () => {
    if (!loadingMore && hasMore && !searchQuery) {
      cargarAlumnos(page + 1);
    }
  };

  const debouncedSearch = useCallback(
    debounce((text) => {
      if (!text.trim()) {
        setAlumnos(allAlumnos);
        return;
      }

      const searchLower = text.toLowerCase();
      const filtered = allAlumnos.filter(alumno => {
        const nombreMatch = alumno.nombre?.toLowerCase().includes(searchLower);
        const rutMatch = alumno.rut?.toLowerCase().includes(searchLower);
        const cursoMatch = alumno.curso_id?.toString().includes(searchLower);
        return nombreMatch || rutMatch || cursoMatch;
      });
      setAlumnos(filtered);
    }, 300),
    [allAlumnos]
  );

  const handleSearch = (text) => {
    setSearchQuery(text);
    debouncedSearch(text);
  };

  useEffect(() => {
    cargarAlumnos(1, true);
  }, []);

  const handleVerPerfil = (alumno) => {
    navigation.navigate('PerfilAlumno', { alumno });
  };

  const handleEdicionRapida = (alumno) => {
    setAlumnoActual(alumno);
    setDatosRapidos({
      asistencia: '',
      comentario: ''
    });
    setModalVisible(true);
  };

  const guardarDatosRapidos = async () => {
    try {
      // Aquí implementarías la lógica para guardar los datos rápidos
      // por ejemplo, usando alumnosService.actualizarDatosRapidos(alumnoActual.id, datosRapidos)
      
      Alert.alert(
        'Éxito', 
        'Datos guardados correctamente',
        [{ text: 'OK', onPress: () => setModalVisible(false) }]
      );
    } catch (error) {
      Alert.alert('Error', 'No se pudieron guardar los datos');
    }
  };

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color="#007bff" />
        <Text style={styles.footerText}>Cargando más alumnos...</Text>
      </View>
    );
  };

  const renderHeader = () => (
    <View style={styles.searchContainer}>
      <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
      <TextInput
        style={styles.searchInput}
        placeholder="Buscar por nombre, RUT o curso..."
        value={searchQuery}
        onChangeText={handleSearch}
        autoCapitalize="none"
      />
      {searchQuery !== '' && (
        <TouchableOpacity 
          onPress={() => handleSearch('')}
          style={styles.clearButton}
        >
          <Ionicons name="close-circle" size={20} color="#666" />
        </TouchableOpacity>
      )}
    </View>
  );

  const renderModal = () => (
    <Modal
      visible={modalVisible}
      transparent
      animationType="slide"
      onRequestClose={() => setModalVisible(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>
            Datos rápidos - {alumnoActual?.nombre}
          </Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Asistencia:</Text>
            <View style={styles.asistenciaContainer}>
              <TouchableOpacity 
                style={[
                  styles.asistenciaBtn, 
                  datosRapidos.asistencia === 'presente' && styles.asistenciaSelected
                ]}
                onPress={() => setDatosRapidos({...datosRapidos, asistencia: 'presente'})}
              >
                <Text style={styles.asistenciaBtnText}>Presente</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[
                  styles.asistenciaBtn, 
                  datosRapidos.asistencia === 'ausente' && styles.asistenciaSelectedRed
                ]}
                onPress={() => setDatosRapidos({...datosRapidos, asistencia: 'ausente'})}
              >
                <Text style={styles.asistenciaBtnText}>Ausente</Text>
              </TouchableOpacity>
            </View>
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Comentario rápido:</Text>
            <TextInput
              style={styles.comentarioInput}
              value={datosRapidos.comentario}
              onChangeText={(text) => setDatosRapidos({...datosRapidos, comentario: text})}
              placeholder="Agregar comentario..."
              multiline
            />
          </View>
          
          <View style={styles.modalButtonsContainer}>
            <TouchableOpacity 
              style={styles.cancelarBtn}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.cancelarBtnText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.guardarBtn}
              onPress={guardarDatosRapidos}
            >
              <Text style={styles.guardarBtnText}>Guardar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={styles.loadingText}>Cargando alumnos...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Alumnos</Text>
        <TouchableOpacity 
          style={styles.refreshButton}
          onPress={handleRefresh}
        >
          <Ionicons name="refresh" size={24} color="#007bff" />
        </TouchableOpacity>
      </View>

      {renderHeader()}

      <FlatList
        data={alumnos}
        renderItem={({ item }) => (
          <AlumnoCard 
            alumno={item}
            onPerfil={handleVerPerfil}
            onEdicionRapida={handleEdicionRapida}
          />
        )}
        keyExtractor={(item) => item.id?.toString() || item.rut}
        contentContainerStyle={styles.listContainer}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#007bff']}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {searchQuery 
                ? 'No se encontraron alumnos que coincidan con la búsqueda'
                : 'No hay alumnos disponibles'}
            </Text>
          </View>
        }
      />

      {renderModal()}
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
  refreshButton: {
    padding: 5,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    margin: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
  },
  clearButton: {
    padding: 5,
  },
  listContainer: {
    padding: 10,
  },
  alumnoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  alumnoInfo: {
    flex: 1,
  },
  nombreText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  rutText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  cursoText: {
    fontSize: 14,
    color: '#666',
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
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  footerLoader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
  },
  footerText: {
    marginLeft: 10,
    fontSize: 14,
    color: '#666',
  },
  botonesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  botonEdicion: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#f0f8ff',
    marginRight: 8
  },
  botonPerfil: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#f0fff0',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    width: '85%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 15,
  },
  inputLabel: {
    fontSize: 16,
    marginBottom: 5,
    color: '#333',
  },
  asistenciaContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  asistenciaBtn: {
    flex: 1,
    padding: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  asistenciaSelected: {
    backgroundColor: '#d4edda',
    borderColor: '#28a745',
  },
  asistenciaSelectedRed: {
    backgroundColor: '#f8d7da',
    borderColor: '#dc3545',
  },
  asistenciaBtnText: {
    fontSize: 14,
  },
  comentarioInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 10,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  modalButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  cancelarBtn: {
    flex: 1,
    padding: 12,
    borderRadius: 5,
    backgroundColor: '#f8f9fa',
    marginRight: 10,
    alignItems: 'center',
  },
  guardarBtn: {
    flex: 1,
    padding: 12,
    borderRadius: 5,
    backgroundColor: '#007bff',
    alignItems: 'center',
  },
  cancelarBtnText: {
    color: '#6c757d',
    fontWeight: 'bold',
  },
  guardarBtnText: {
    color: 'white',
    fontWeight: 'bold',
  },
}); 