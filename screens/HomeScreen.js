import React, { useContext, useEffect, useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator,
  RefreshControl,
  Alert,
  Modal,
  TextInput,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthContext } from '../context/AuthContext';
import { reservasService } from '../services/api';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Función para formatear fecha (para reutilizarla en varios lugares)
const formatDate = (dateString) => {
  try {
    if (!dateString) return 'Fecha no disponible';
    
    // Verificar si es una fecha ISO o un formato diferente
    const fecha = new Date(dateString);
    if (isNaN(fecha.getTime())) {
      // Si no se puede convertir, devolver el string original
      return dateString;
    }
    
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return fecha.toLocaleDateString('es-ES', options);
  } catch (error) {
    console.error('Error al formatear fecha:', error);
    return dateString || 'Fecha no disponible';
  }
};

// Componente para mostrar cada reserva
const ReservaCard = ({ reserva, onPress }) => {
  // Obtener valores directamente de la estructura de la base de datos
  const nombre = reserva.alumno_nombre || 'No disponible';
  const apellido = reserva.alumno_apellido || 'No disponible';
  const fecha = formatDate(reserva.fecha_reserva);
  
  // Formato del bloque horario
  let bloque = reserva.bloque_reserva || 'No especificado';
  // Verificar si es uno de los bloques específicos
  const bloquesValidos = ['10:00 a 10:20', '11:45 a 12:00', '13:30 a 13:50', '13:50 a 14:15'];
  if (!bloquesValidos.includes(bloque)) {
    // Si no es uno de los bloques específicos, intentar interpretarlo
    if (bloque.toLowerCase().includes('mañana')) {
      bloque = '10:00 a 10:20';
    } else if (bloque.toLowerCase().includes('tarde') && bloque.toLowerCase().includes('1')) {
      bloque = '13:30 a 13:50';
    } else if (bloque.toLowerCase().includes('tarde') && bloque.toLowerCase().includes('2')) {
      bloque = '13:50 a 14:15';
    } else if (bloque.toLowerCase().includes('tarde')) {
      bloque = '13:30 a 13:50';
    }
  }
  
  const id = reserva.id || '0';
  
  // Para compatibilidad con implementaciones anteriores, asignamos valores por defecto
  const estado = reserva.estado || 'Confirmada'; // Por defecto asumimos confirmada

  // Color según estado
  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'confirmada': return '#4caf50';
      case 'pendiente': return '#ff9800';
      case 'cancelada': return '#f44336';
      default: return '#4caf50'; // Por defecto verde (confirmada)
    }
  };

  // Icono según estado
  const getStatusIcon = (status) => {
    switch (status.toLowerCase()) {
      case 'confirmada': return 'checkmark-circle';
      case 'pendiente': return 'time';
      case 'cancelada': return 'close-circle';
      default: return 'checkmark-circle'; // Por defecto confirmada
    }
  };

  return (
    <TouchableOpacity style={styles.reservaCard} onPress={onPress}>
      <View style={styles.reservaHeader}>
        <View style={styles.statusContainer}>
          <View 
            style={[
              styles.statusIndicator, 
              { backgroundColor: getStatusColor(estado) }
            ]} 
          />
          <Text style={styles.statusText}>{estado}</Text>
        </View>
        <Ionicons 
          name={getStatusIcon(estado)} 
          size={20} 
          color={getStatusColor(estado)} 
        />
      </View>
      
      <View style={styles.reservaBody}>
        <View style={styles.infoRow}>
          <Ionicons name="person-outline" size={16} color="#666" />
          <Text style={styles.infoText}>Alumno: {nombre} {apellido}</Text>
        </View>
        
        <View style={styles.infoRow}>
          <Ionicons name="calendar-outline" size={16} color="#666" />
          <Text style={styles.infoText}>Fecha: {fecha}</Text>
        </View>
        
        <View style={styles.infoRow}>
          <Ionicons name="time-outline" size={16} color="#666" />
          <Text style={styles.infoText}>Bloque: {bloque}</Text>
        </View>
        
        <View style={styles.reservaFooter}>
          <Text style={styles.idText}>ID: {id}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default function HomeScreen() {
  const { logout, userData } = useContext(AuthContext);
  const [reservas, setReservas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  // Función para obtener el próximo día laborable (lunes a viernes)
  const getNextWorkingDate = () => {
    const hoy = new Date();
    const diaSemana = hoy.getDay(); // 0 = domingo, 6 = sábado
    
    let diasASumar = 1; // Por defecto sumamos 1 día
    
    // Si hoy es viernes (5) o sábado (6), no hay próximo día laborable disponible
    if (diaSemana === 5 || diaSemana === 6) {
      return null; // No hay próximo día laborable disponible
    }
    
    // Si hoy es domingo (0), el próximo día laborable es mañana (lunes)
    if (diaSemana === 0) {
      diasASumar = 1;
    }
    
    // Calcular la próxima fecha
    const proximaFecha = new Date();
    proximaFecha.setDate(hoy.getDate() + diasASumar);
    
    return proximaFecha.toISOString().split('T')[0]; // Formato YYYY-MM-DD
  };

  // Variables de estado para el formulario de nueva reserva
  const [newReserva, setNewReserva] = useState({
    alumno_nombre: '',
    alumno_apellido: '',
    fecha_reserva: getNextWorkingDate() || '', // Próximo día laborable si está disponible
    bloque_reserva: '10:00 a 10:20'
  });

  // Bloques horarios disponibles
  const bloquesHorarios = [
    '10:00 a 10:20',
    '11:45 a 12:00',
    '13:30 a 13:50',
    '13:50 a 14:15'
  ];

  // Cargar reservas
  const loadReservas = async () => {
    try {
      setLoading(true);
      console.log('Cargando reservas...');
      const data = await reservasService.getReservas();
      
      if (Array.isArray(data)) {
        console.log(`Se cargaron ${data.length} reservas`);
        
        // Ordenar las reservas por fecha (más futuras primero)
        const reservasOrdenadas = [...data].sort((a, b) => {
          // Si no tienen fecha, colocarlas al final
          if (!a.fecha_reserva) return 1;
          if (!b.fecha_reserva) return -1;
          
          // Convertir a objetos Date para comparar
          const fechaA = new Date(a.fecha_reserva);
          const fechaB = new Date(b.fecha_reserva);
          
          // Ordenar de más futura a más antigua
          return fechaB - fechaA;
        });
        
        setReservas(reservasOrdenadas);
        
        if (data.length === 0) {
          Alert.alert(
            'Sin reservas', 
            'No tienes reservas activas. Puedes crear una nueva reserva pulsando el botón "+"',
            [{ text: 'Entendido' }]
          );
        }
      } else {
        console.error('Formato de datos incorrecto:', data);
        Alert.alert(
          'Error de formato', 
          'Los datos recibidos no tienen el formato esperado',
          [{ text: 'Reintentar', onPress: loadReservas }]
        );
        setReservas([]);
      }
    } catch (error) {
      console.error('Error al cargar reservas:', error);
      Alert.alert(
        'Error', 
        'No se pudieron cargar las reservas. Por favor, inténtalo de nuevo.',
        [{ text: 'Reintentar', onPress: loadReservas }]
      );
      setReservas([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Cargar al iniciar
  useEffect(() => {
    loadReservas();
  }, []);

  // Pull to refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await loadReservas();
    setRefreshing(false);
  };

  // Cerrar sesión
  const handleLogout = () => {
    Alert.alert(
      'Cerrar sesión',
      '¿Estás seguro que deseas cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Salir', 
          style: 'destructive', 
          onPress: async () => {
            console.log('Usuario confirmó cerrar sesión');
            try {
              // Primero intentamos limpiar manualmente AsyncStorage como respaldo
              await AsyncStorage.removeItem('userToken');
              await AsyncStorage.removeItem('userData');
              console.log('Token eliminado manualmente');
            } catch (e) {
              console.error('Error al eliminar token manualmente:', e);
            }
            // Luego llamamos a logout del contexto
            logout();
          }
        }
      ]
    );
  };

  // Ver detalles de una reserva
  const handleReservaPress = (reserva) => {
    // Formatear la fecha para mejor visualización
    const fechaFormateada = formatDate(reserva.fecha_reserva);
    
    // Obtener el bloque horario
    let bloque = reserva.bloque_reserva || 'No especificado';
    
    Alert.alert(
      `Reserva #${reserva.id}`,
      `Alumno: ${reserva.alumno_nombre} ${reserva.alumno_apellido}\nFecha: ${fechaFormateada}\nHorario: ${bloque}`,
      [
        { text: 'Cerrar', style: 'cancel' },
        { 
          text: 'Cancelar Reserva', 
          style: 'destructive', 
          onPress: () => handleCancelReserva(reserva.id) 
        }
      ]
    );
  };

  // Cancelar una reserva
  const handleCancelReserva = async (id) => {
    try {
      setLoading(true);
      await reservasService.cancelReserva(id);
      Alert.alert('Éxito', 'Reserva cancelada correctamente');
      loadReservas();
    } catch (error) {
      console.error('Error al cancelar reserva:', error);
      let mensaje = 'No se pudo cancelar la reserva';
      
      if (error.response && error.response.data) {
        mensaje += ': ' + JSON.stringify(error.response.data);
      }
      
      Alert.alert('Error', mensaje);
    } finally {
      setLoading(false);
    }
  };

  // Mensaje de disponibilidad de reservas según el día
  const getMensajeDisponibilidad = () => {
    const hoy = new Date();
    const diaSemana = hoy.getDay(); // 0 = domingo, 6 = sábado
    
    if (diaSemana === 5) {
      return "Hoy es viernes. Intenta el domingo para reservar el lunes.";
    } else if (diaSemana === 6) {
      return "Hoy es sábado. Intenta mañana para reservar el lunes.";
    } else {
      const proximoDia = getNextWorkingDate();
      return proximoDia 
        ? `Puedes reservar para mañana: ${formatDate(proximoDia)}` 
        : "No hay días disponibles para reservar en este momento.";
    }
  };

  // Crear nueva reserva
  const handleCreateReserva = async () => {
    // Verificar si hay un próximo día laborable disponible
    const proximoDia = getNextWorkingDate();
    if (!proximoDia) {
      Alert.alert(
        'No disponible',
        'No se pueden hacer reservas hoy. Las reservas solo están disponibles de lunes a jueves (para el día siguiente) y domingo (para el lunes).',
        [{ text: 'Entendido' }]
      );
      return;
    }
    
    // Validar datos
    if (!newReserva.alumno_nombre || !newReserva.alumno_apellido || !newReserva.fecha_reserva) {
      Alert.alert('Error', 'Por favor, rellena todos los campos');
      return;
    }

    // Validar que la fecha sea para el próximo día laborable
    if (!verificarFechaValida(newReserva.fecha_reserva)) {
      Alert.alert(
        'Fecha no válida',
        'Solo puedes hacer reservas para el próximo día laborable (lunes a viernes).',
        [{ text: 'Entendido' }]
      );
      return;
    }
    
    // Validar que el alumno no tenga otra reserva el mismo día
    if (verificarReservaDuplicada(
      newReserva.alumno_nombre, 
      newReserva.alumno_apellido, 
      newReserva.fecha_reserva
    )) {
      Alert.alert(
        'Reserva duplicada',
        'Ya tienes una reserva para ese día. Solo se permite una reserva por alumno por día.',
        [{ text: 'Entendido' }]
      );
      return;
    }
    
    // Validar que haya computadores disponibles en ese bloque
    if (!verificarDisponibilidadBloque(newReserva.fecha_reserva, newReserva.bloque_reserva)) {
      Alert.alert(
        'Bloque sin disponibilidad',
        'Lo sentimos, ya no hay computadores disponibles en ese bloque horario. Por favor, selecciona otro bloque.',
        [{ text: 'Entendido' }]
      );
      return;
    }

    try {
      setLoading(true);
      
      // Crear objeto de datos para la API
      const reservaData = {
        alumno_nombre: newReserva.alumno_nombre,
        alumno_apellido: newReserva.alumno_apellido,
        fecha_reserva: newReserva.fecha_reserva,
        bloque_reserva: newReserva.bloque_reserva || '10:00 a 10:20'
      };
      
      console.log('Enviando datos de reserva:', reservaData);
      
      // Enviar a la API
      const result = await reservasService.createReserva(reservaData);
      
      if (result && result.id) {
        Alert.alert('Éxito', 'Reserva creada correctamente');
        
        // Restablecer formulario
        setNewReserva({
          alumno_nombre: '',
          alumno_apellido: '',
          fecha_reserva: getNextWorkingDate() || '', // Próximo día laborable si está disponible
          bloque_reserva: '10:00 a 10:20'
        });
        
        // Cerrar modal y recargar reservas
        setModalVisible(false);
        loadReservas();
      } else {
        Alert.alert('Error', 'No se pudo crear la reserva');
      }
    } catch (error) {
      console.error('Error al crear reserva:', error);
      let mensaje = 'No se pudo crear la reserva';
      
      if (error.response && error.response.data) {
        mensaje += ': ' + JSON.stringify(error.response.data);
      }
      
      Alert.alert('Error', mensaje);
    } finally {
      setLoading(false);
    }
  };

  // Función para verificar si ya existe una reserva para el mismo alumno en el mismo día
  const verificarReservaDuplicada = (nombre, apellido, fecha) => {
    return reservas.some(reserva => 
      reserva.alumno_nombre.toLowerCase() === nombre.toLowerCase() &&
      reserva.alumno_apellido.toLowerCase() === apellido.toLowerCase() &&
      reserva.fecha_reserva === fecha
    );
  };

  // Función para verificar si un bloque ya tiene el máximo de reservas (3)
  const verificarDisponibilidadBloque = (fecha, bloque) => {
    const reservasEnBloque = reservas.filter(reserva => 
      reserva.fecha_reserva === fecha && 
      reserva.bloque_reserva === bloque
    );
    return reservasEnBloque.length < 3; // true si hay menos de 3 reservas
  };

  // Función para verificar si la fecha es válida (próximo día laborable)
  const verificarFechaValida = (fecha) => {
    if (!fecha) return false;
    
    const fechaSeleccionada = new Date(fecha);
    const hoy = new Date();
    const diaSemanaHoy = hoy.getDay(); // 0 = domingo, 6 = sábado
    const diaSemanaSeleccionado = fechaSeleccionada.getDay();
    
    // Primero verificamos que la fecha seleccionada sea un día laborable (lunes a viernes)
    if (diaSemanaSeleccionado === 0 || diaSemanaSeleccionado === 6) {
      return false; // No se permite reservar para sábado o domingo
    }
    
    // Si hoy es viernes o sábado, no se permite reservar
    if (diaSemanaHoy === 5 || diaSemanaHoy === 6) {
      return false;
    }
    
    // Si hoy es domingo, verificamos que sea para el lunes
    if (diaSemanaHoy === 0) {
      const lunes = new Date();
      lunes.setDate(hoy.getDate() + 1);
      return fechaSeleccionada.getFullYear() === lunes.getFullYear() &&
             fechaSeleccionada.getMonth() === lunes.getMonth() &&
             fechaSeleccionada.getDate() === lunes.getDate();
    }
    
    // Para lunes a jueves, verificamos que sea para el día siguiente
    const manana = new Date();
    manana.setDate(hoy.getDate() + 1);
    return fechaSeleccionada.getFullYear() === manana.getFullYear() &&
           fechaSeleccionada.getMonth() === manana.getMonth() &&
           fechaSeleccionada.getDate() === manana.getDate();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Mis Reservas</Text>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
            <Ionicons name="log-out-outline" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#007bff']}
            tintColor="#007bff"
          />
        }
      >
        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#007bff" />
            <Text style={styles.loadingText}>Cargando reservas...</Text>
          </View>
        ) : reservas.length > 0 ? (
          <>
            <Text style={styles.totalReservas}>
              Mostrando {reservas.length} {reservas.length === 1 ? 'reserva' : 'reservas'}
            </Text>
            {reservas.map((reserva) => (
              <ReservaCard 
                key={reserva.id.toString()}
                reserva={reserva}
                onPress={() => handleReservaPress(reserva)}
              />
            ))}
          </>
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="calendar-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No tienes reservas</Text>
            <Text style={styles.emptySubText}>
              Toca el botón "+" para crear una nueva reserva
            </Text>
          </View>
        )}
      </ScrollView>

      <TouchableOpacity 
        style={styles.addButton}
        onPress={() => setModalVisible(true)}
      >
        <Ionicons name="add" size={24} color="#fff" />
      </TouchableOpacity>

      {/* Modal para crear nueva reserva */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Nueva Reserva</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            
            {/* Mensaje de disponibilidad */}
            <View style={styles.disponibilidadContainer}>
              <Text style={styles.disponibilidadMessage}>{getMensajeDisponibilidad()}</Text>
            </View>
            
            {getNextWorkingDate() ? (
              <ScrollView style={styles.modalFormContainer}>
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Alumno Nombre</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="Nombre del alumno"
                    value={newReserva.alumno_nombre}
                    onChangeText={(text) => setNewReserva({...newReserva, alumno_nombre: text})}
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Alumno Apellido</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="Apellido del alumno"
                    value={newReserva.alumno_apellido}
                    onChangeText={(text) => setNewReserva({...newReserva, alumno_apellido: text})}
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Fecha de Reserva</Text>
                  <View style={styles.dateContainer}>
                    <TextInput
                      style={[styles.formInput, styles.dateInput]}
                      value={formatDate(newReserva.fecha_reserva)}
                      editable={false}
                    />
                    <Text style={styles.dateHint}>
                      Solo se permiten reservas para el próximo día laborable
                    </Text>
                  </View>
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Bloque de Reserva</Text>
                  <View style={styles.bloqueSelector}>
                    {bloquesHorarios.map((bloque) => {
                      // Calcular cuántos computadores quedan disponibles en este bloque
                      const disponibles = 3 - reservas.filter(r => 
                        r.fecha_reserva === newReserva.fecha_reserva && 
                        r.bloque_reserva === bloque
                      ).length;
                      
                      // Determinar si este bloque está lleno
                      const bloqueDisponible = disponibles > 0;
                      
                      return (
                        <TouchableOpacity
                          key={bloque}
                          style={[
                            styles.bloqueButton,
                            newReserva.bloque_reserva === bloque && styles.bloqueButtonActive,
                            !bloqueDisponible && styles.bloqueButtonDisabled
                          ]}
                          onPress={() => {
                            if (bloqueDisponible) {
                              setNewReserva({...newReserva, bloque_reserva: bloque});
                            } else {
                              Alert.alert(
                                'Bloque no disponible',
                                'No hay computadores disponibles en este bloque horario.'
                              );
                            }
                          }}
                          disabled={!bloqueDisponible}
                        >
                          <Text 
                            style={[
                              styles.bloqueButtonText,
                              newReserva.bloque_reserva === bloque && styles.bloqueButtonTextActive,
                              !bloqueDisponible && styles.bloqueButtonTextDisabled
                            ]}
                          >
                            {bloque}
                          </Text>
                          <Text style={styles.disponibilidadText}>
                            {bloqueDisponible 
                              ? `${disponibles} ${disponibles === 1 ? 'computador disponible' : 'computadores disponibles'}` 
                              : 'No hay disponibilidad'}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                <TouchableOpacity 
                  style={styles.submitButton}
                  onPress={handleCreateReserva}
                >
                  <Text style={styles.submitButtonText}>Crear Reserva</Text>
                </TouchableOpacity>
              </ScrollView>
            ) : (
              <View style={styles.noDisponibleContainer}>
                <Ionicons name="calendar-outline" size={48} color="#999" />
                <Text style={styles.noDisponibleText}>
                  Lo sentimos, no hay días disponibles para reservar hoy.
                </Text>
                <Text style={styles.noDisponibleSubtext}>
                  Las reservas solo están disponibles de lunes a jueves (para el día siguiente)
                  y domingo (para el lunes).
                </Text>
              </View>
            )}
          </View>
        </View>
      </Modal>
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
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  logoutButton: {
    padding: 5,
  },
  scrollContent: {
    flex: 1,
    padding: 15,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
  },
  
  // Estilos de tarjeta de reserva
  reservaCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  reservaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  reservaBody: {
    marginTop: 5,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  infoText: {
    marginLeft: 8,
    color: '#666',
  },
  reservaFooter: {
    marginTop: 5,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  idText: {
    color: '#666',
  },
  
  // Estilos para mensaje de lista vacía
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#555',
    marginTop: 20,
  },
  emptySubText: {
    fontSize: 14,
    color: '#888',
    marginTop: 8,
    textAlign: 'center',
  },
  
  // Botón flotante
  addButton: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#007bff',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  
  // Modal
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalFormContainer: {
    marginBottom: 20,
  },
  formGroup: {
    marginBottom: 15,
  },
  formLabel: {
    fontSize: 14,
    marginBottom: 5,
    fontWeight: '500',
  },
  formInput: {
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 10,
    fontSize: 16,
  },
  submitButton: {
    backgroundColor: '#007bff',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  totalReservas: {
    textAlign: 'center',
    marginVertical: 10,
    color: '#666',
    fontSize: 14,
  },
  bloqueSelector: {
    flexDirection: 'column',
    marginTop: 5,
  },
  bloqueButton: {
    padding: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 8,
    backgroundColor: '#f9f9f9',
  },
  bloqueButtonActive: {
    backgroundColor: '#007bff',
    borderColor: '#0056b3',
  },
  bloqueButtonDisabled: {
    backgroundColor: '#f0f0f0',
    borderColor: '#ccc',
    opacity: 0.7,
  },
  bloqueButtonText: {
    textAlign: 'center',
    fontSize: 14,
    color: '#333',
  },
  bloqueButtonTextActive: {
    color: '#fff',
    fontWeight: 'bold',
  },
  bloqueButtonTextDisabled: {
    color: '#999',
  },
  disponibilidadText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
  dateContainer: {
    marginBottom: 10,
  },
  dateInput: {
    backgroundColor: '#f0f0f0',
  },
  dateHint: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    fontStyle: 'italic',
  },
  disponibilidadContainer: {
    backgroundColor: '#e3f2fd',
    padding: 10,
    borderRadius: 6,
    marginBottom: 15,
    borderLeftWidth: 4,
    borderLeftColor: '#2196f3',
  },
  disponibilidadMessage: {
    color: '#0d47a1',
    fontSize: 14,
  },
  noDisponibleContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noDisponibleText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 15,
    fontWeight: 'bold',
  },
  noDisponibleSubtext: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginTop: 10,
    marginHorizontal: 20,
  },
});