import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  ScrollView, 
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { noticiasService } from '../services/api';

const NoticiaCard = ({ titulo, subtitulo, fecha, tipo, descripcion, autor, tituloDestacado, destacado, tema }) => {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderLeft}>
          <Ionicons 
            name={tipo === 'evento' ? 'calendar' : tipo === 'noticia' ? 'newspaper' : 'megaphone'} 
            size={24} 
            color="#007bff" 
          />
          {tema && <Text style={styles.tema}>{tema}</Text>}
        </View>
        <Text style={styles.fecha}>{fecha}</Text>
      </View>
      {tituloDestacado ? (
        <Text style={styles.tituloDestacado}>{tituloDestacado}</Text>
      ) : (
        <Text style={styles.titulo}>{titulo}</Text>
      )}
      {subtitulo && <Text style={styles.subtitulo}>{subtitulo}</Text>}
      {autor && <Text style={styles.autor}>Por: {autor}</Text>}
      {destacado ? (
        <Text style={styles.destacado}>{destacado}</Text>
      ) : (
        <Text style={styles.descripcion}>{descripcion}</Text>
      )}
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const formatearFecha = (fecha) => {
    if (!fecha) return '';
    return new Date(fecha).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const cargarDatos = async () => {
    setError(null);
    setLoading(true);
    try {
      // Cargar noticias
      try {
        const noticiasData = await noticiasService.getNoticias();
        console.log('Respuesta de noticias:', JSON.stringify(noticiasData, null, 2));
        
        let noticiasArray = [];
        if (noticiasData) {
          if (noticiasData.results && Array.isArray(noticiasData.results)) {
            noticiasArray = noticiasData.results;
          } else if (Array.isArray(noticiasData)) {
            noticiasArray = noticiasData;
          } else if (noticiasData.noticias && Array.isArray(noticiasData.noticias)) {
            noticiasArray = noticiasData.noticias;
          } else if (typeof noticiasData === 'object' && noticiasData.id) {
            noticiasArray = [noticiasData];
          }
        }

        console.log('Noticias procesadas:', noticiasArray);
        
        const noticiasFormateadas = noticiasArray.map(noticia => ({
          id: noticia.id || Math.random().toString(),
          tipo: 'noticia',
          titulo: noticia.titulo || 'Sin título',
          subtitulo: noticia.subtitulo,
          fecha: formatearFecha(noticia.date),
          descripcion: noticia.texto || 'Sin descripción',
          autor: noticia.redactor,
          tituloDestacado: noticia.tituloDestacado,
          destacado: noticia.destacado,
          tema: noticia.tema,
          galeria: noticia.galeria === 1,
          noticia: noticia.noticia === 1,
          audio: noticia.audio,
          likes: noticia.likes || 0
        }));
        
        console.log('Noticias formateadas:', noticiasFormateadas);
        setNoticias(noticiasFormateadas);
      } catch (error) {
        console.error('Error al cargar noticias:', error);
        console.error('Detalles del error:', error.response?.data);
        setNoticias([]);
      }

      // Cargar eventos
      try {
        const eventosData = await noticiasService.getEventos();
        console.log('Respuesta de eventos:', JSON.stringify(eventosData, null, 2));
        
        let eventosArray = [];
        if (eventosData) {
          if (eventosData.results && Array.isArray(eventosData.results)) {
            eventosArray = eventosData.results;
          } else if (Array.isArray(eventosData)) {
            eventosArray = eventosData;
          } else if (eventosData.eventos && Array.isArray(eventosData.eventos)) {
            eventosArray = eventosData.eventos;
          } else if (typeof eventosData === 'object' && eventosData.id) {
            eventosArray = [eventosData];
          }
        }

        console.log('Eventos procesados:', eventosArray);
        
        const eventosFormateados = eventosArray.map(evento => ({
          id: evento.id || Math.random().toString(),
          tipo: 'evento',
          titulo: evento.titulo || 'Sin título',
          fecha: formatearFecha(evento.fecha),
          descripcion: evento.texto || 'Sin descripción'
        }));
        
        console.log('Eventos formateados:', eventosFormateados);
        setEventos(eventosFormateados);
      } catch (error) {
        console.error('Error al cargar eventos:', error);
        console.error('Detalles del error:', error.response?.data);
        setEventos([]);
      }

      // Cargar comunicados
      try {
        const comunicadosData = await noticiasService.getComunicados();
        console.log('Respuesta de comunicados:', JSON.stringify(comunicadosData, null, 2));
        
        let comunicadosArray = [];
        if (comunicadosData) {
          if (comunicadosData.results && Array.isArray(comunicadosData.results)) {
            comunicadosArray = comunicadosData.results;
          } else if (Array.isArray(comunicadosData)) {
            comunicadosArray = comunicadosData;
          } else if (comunicadosData.comunicados && Array.isArray(comunicadosData.comunicados)) {
            comunicadosArray = comunicadosData.comunicados;
          } else if (typeof comunicadosData === 'object' && comunicadosData.id) {
            comunicadosArray = [comunicadosData];
          }
        }

        console.log('Comunicados procesados:', comunicadosArray);
        
        const comunicadosFormateados = comunicadosArray.map(comunicado => ({
          id: comunicado.id || Math.random().toString(),
          tipo: 'comunicado',
          titulo: comunicado.titulo || 'Sin título',
          fecha: formatearFecha(comunicado.fecha),
          descripcion: comunicado.texto || 'Sin contenido',
          autor: comunicado.autor || 'Anónimo'
        }));
        
        console.log('Comunicados formateados:', comunicadosFormateados);
        setComunicados(comunicadosFormateados);
      } catch (error) {
        console.error('Error al cargar comunicados:', error);
        console.error('Detalles del error:', error.response?.data);
        setComunicados([]);
      }

    } catch (error) {
      console.error('Error general al cargar datos:', error);
      setError('No se pudieron cargar los datos. Por favor, intenta de nuevo más tarde.');
    } finally {
      setLoading(false);
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
    if (loading && !refreshing) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007bff" />
          <Text style={styles.loadingText}>Cargando información...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color="#dc3545" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={cargarDatos}>
            <Text style={styles.retryButtonText}>Intentar de nuevo</Text>
          </TouchableOpacity>
        </View>
      );
    }

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
              subtitulo={item.subtitulo}
              fecha={item.fecha}
              descripcion={item.descripcion}
              autor={item.autor}
              tituloDestacado={item.tituloDestacado}
              destacado={item.destacado}
              tema={item.tema}
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
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tema: {
    marginLeft: 8,
    color: '#007bff',
    fontSize: 12,
    fontWeight: '500',
    backgroundColor: '#e6f2ff',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
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
  subtitulo: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    fontStyle: 'italic',
  },
  autor: {
    color: '#666',
    fontSize: 14,
    fontStyle: 'italic',
    marginBottom: 8,
  },
  descripcion: {
    color: '#444',
    fontSize: 14,
    lineHeight: 20,
  },
  tituloDestacado: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#007bff',
  },
  destacado: {
    color: '#444',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
    backgroundColor: '#f8f9fa',
    padding: 10,
    borderRadius: 4,
    marginTop: 8,
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
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    marginTop: 10,
    color: '#dc3545',
    fontSize: 16,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 20,
    backgroundColor: '#007bff',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  }
}); 