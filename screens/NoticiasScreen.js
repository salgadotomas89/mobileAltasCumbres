import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  ScrollView, 
  RefreshControl,
  TouchableOpacity,
  Dimensions 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const NoticiaCard = ({ titulo, fecha, tipo, descripcion }) => {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Ionicons 
          name={tipo === 'evento' ? 'calendar' : tipo === 'noticia' ? 'newspaper' : 'megaphone'} 
          size={24} 
          color="#007bff" 
        />
        <Text style={styles.fecha}>{fecha}</Text>
      </View>
      <Text style={styles.titulo}>{titulo}</Text>
      <Text style={styles.descripcion}>{descripcion}</Text>
    </View>
  );
};

const SegmentedControl = ({ selectedIndex, onSelect }) => {
  const segments = ['Noticias', 'Eventos', 'Comunicados'];
  
  return (
    <View style={styles.segmentedControl}>
      {segments.map((segment, index) => (
        <TouchableOpacity
          key={index}
          style={[
            styles.segment,
            selectedIndex === index && styles.segmentSelected,
            index === 0 && styles.segmentFirst,
            index === segments.length - 1 && styles.segmentLast,
          ]}
          onPress={() => onSelect(index)}
        >
          <Text style={[
            styles.segmentText,
            selectedIndex === index && styles.segmentTextSelected
          ]}>
            {segment}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

export default function NoticiasScreen() {
  const [selectedTab, setSelectedTab] = useState(0);
  const [noticias, setNoticias] = useState([]);
  const [eventos, setEventos] = useState([]);
  const [comunicados, setComunicados] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const cargarDatos = async () => {
    try {
      // Aquí irán las llamadas a la API para obtener los datos
      // Por ahora usamos datos de ejemplo
      const ejemploNoticias = [
        {
          id: 1,
          tipo: 'noticia',
          titulo: 'Logro Académico',
          fecha: '5 de Mayo 2024',
          descripcion: 'Nuestros estudiantes obtuvieron el primer lugar en la competencia regional.'
        },
        {
          id: 2,
          tipo: 'noticia',
          titulo: 'Nuevo Laboratorio',
          fecha: '3 de Mayo 2024',
          descripcion: 'Se inaugura el nuevo laboratorio de ciencias.'
        }
      ];

      const ejemploEventos = [
        {
          id: 1,
          tipo: 'evento',
          titulo: 'Reunión de Apoderados',
          fecha: '15 de Mayo 2024',
          descripcion: 'Reunión general de apoderados para discutir el progreso académico.'
        },
        {
          id: 2,
          tipo: 'evento',
          titulo: 'Día del Alumno',
          fecha: '11 de Mayo 2024',
          descripcion: 'Celebración del día del alumno con actividades recreativas.'
        }
      ];

      const ejemploComunicados = [
        {
          id: 1,
          tipo: 'comunicado',
          titulo: 'Actualización de Protocolos',
          fecha: '10 de Mayo 2024',
          descripcion: 'Nuevas medidas de seguridad implementadas en el establecimiento.'
        },
        {
          id: 2,
          tipo: 'comunicado',
          titulo: 'Calendario de Evaluaciones',
          fecha: '8 de Mayo 2024',
          descripcion: 'Se ha publicado el calendario de evaluaciones del segundo trimestre.'
        }
      ];

      setNoticias(ejemploNoticias);
      setEventos(ejemploEventos);
      setComunicados(ejemploComunicados);
    } catch (error) {
      console.error('Error al cargar datos:', error);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await cargarDatos();
    setRefreshing(false);
  };

  const renderContent = () => {
    let data = [];
    let titulo = '';

    switch (selectedTab) {
      case 0:
        data = noticias;
        titulo = 'Noticias';
        break;
      case 1:
        data = eventos;
        titulo = 'Eventos';
        break;
      case 2:
        data = comunicados;
        titulo = 'Comunicados';
        break;
    }

    return (
      <>
        <Text style={styles.sectionTitle}>{titulo}</Text>
        {data.length > 0 ? (
          data.map((item) => (
            <NoticiaCard
              key={item.id}
              tipo={item.tipo}
              titulo={item.titulo}
              fecha={item.fecha}
              descripcion={item.descripcion}
            />
          ))
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="information-circle-outline" size={48} color="#999" />
            <Text style={styles.emptyStateText}>No hay {titulo.toLowerCase()} disponibles</Text>
          </View>
        )}
      </>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Información</Text>
      </View>

      <SegmentedControl
        selectedIndex={selectedTab}
        onSelect={setSelectedTab}
      />

      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#007bff']}
          />
        }
      >
        {renderContent()}
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
    padding: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 8,
    marginHorizontal: 15,
    marginVertical: 10,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  segment: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  segmentSelected: {
    backgroundColor: '#007bff',
    borderRadius: 6,
  },
  segmentText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  segmentTextSelected: {
    color: '#fff',
  },
  content: {
    flex: 1,
    padding: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  fecha: {
    color: '#666',
    fontSize: 14,
  },
  titulo: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  descripcion: {
    color: '#444',
    fontSize: 14,
    lineHeight: 20,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  emptyStateText: {
    marginTop: 10,
    color: '#666',
    fontSize: 16,
    textAlign: 'center',
  }
}); 