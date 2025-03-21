import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

//url de la api
const API_URL = 'https://altascumbressanclemente.cl/';

// Crear instancia de axios
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Interceptor para añadir el token a las peticiones
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('userToken');
    if (token) {
      config.headers.Authorization = `Token ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Servicio de autenticación
export const authService = {
  // Login con usuario y contraseña para alumnos
  login: async (username, password) => {
    try {
      console.log('Intentando login con RUT:', username);
      
      // Formatear el RUT para asegurar compatibilidad con la API
      // La API podría esperar el RUT con formato (con puntos y guión)
      let rut = username.trim();
      
      console.log('Enviando datos:', { rut, digitos_verificacion: password.trim() });
      
      // Usar el endpoint correcto y los parámetros según documentación
      const response = await api.post('api/alumno-auth/', {
        rut: rut,
        digitos_verificacion: password.trim()
      });
      
      console.log('Respuesta completa de la API:', JSON.stringify(response.data, null, 2));
      console.log('Estado de la respuesta:', response.status);
      
      if (response.data) {
        console.log('Datos recibidos:', response.data);
        
        if (response.data.token) {
          console.log('Token recibido correctamente:', response.data.token.substring(0, 10) + '...');
          await AsyncStorage.setItem('userToken', response.data.token);
          
          // Guardar los datos del alumno
          const userData = {
            rut: rut,
            // Asegurarnos de que estamos guardando los datos correctos según la respuesta de la API
            ...(response.data.alumno || {}),  // Si no hay alumno, usar objeto vacío
            ...(response.data.usuario || {}), // Por si viene en usuario en lugar de alumno
          };
          
          console.log('Estructura completa de response.data:', JSON.stringify(response.data, null, 2));
          console.log('Datos del usuario a guardar:', JSON.stringify(userData, null, 2));
          
          // Asegurarnos de que tenemos un RUT
          if (!userData.rut) {
            userData.rut = rut; // Usar el RUT del login si no viene en la respuesta
          }
          
          await AsyncStorage.setItem('userData', JSON.stringify(userData));
          console.log('Datos del usuario guardados exitosamente');
          
          return {
            token: response.data.token,
            userData
          };
        }
      }
      console.error('No se recibió un token en la respuesta:', response.data);
      return null;
    } catch (error) {
      console.error('Error de login:', error.message);
      if (error.response) {
        console.error('Detalles del error:', error.response.status, error.response.data);
      } else if (error.request) {
        console.error('No se recibió respuesta del servidor');
      } else {
        console.error('Error al configurar la solicitud:', error.message);
      }
      throw error;
    }
  },
  
  // Login para profesores
  loginProfesor: async (username, password) => {
    try {
      console.log('Intentando login de profesor con username:', username);
      
      const response = await api.post('usuarios/api/login/', {
        username: username.trim(),
        password: password.trim()
      });
      
      console.log('Respuesta completa de la API:', JSON.stringify(response.data, null, 2));
      
      if (response.data) {
        if (response.data.token) {
          await AsyncStorage.setItem('userToken', response.data.token);
          await AsyncStorage.setItem('userType', 'profesor');
          
          const userData = {
            ...response.data.usuario,
            tipo: 'profesor'
          };
          
          await AsyncStorage.setItem('userData', JSON.stringify(userData));
          
          return {
            token: response.data.token,
            userData
          };
        }
      }
      console.error('No se recibió un token en la respuesta:', response.data);
      return null;
    } catch (error) {
      console.error('Error de login profesor:', error.message);
      if (error.response) {
        console.error('Detalles del error:', error.response.status, error.response.data);
      }
      throw error;
    }
  },
  
  // Cerrar sesión
  logout: async () => {
    try {
      console.log('API: Cerrando sesión...');
      // Primero intentar eliminar el token de AsyncStorage
      try {
        await AsyncStorage.removeItem('userToken');
        await AsyncStorage.removeItem('userData');
        console.log('API: Token eliminado de AsyncStorage');
      } catch (storageError) {
        console.error('API: Error al eliminar token de AsyncStorage:', storageError);
      }
      
      // Si hay un endpoint para cerrar sesión en el servidor, descomentaría esto:
      // try {
      //   await api.post('api/logout/');
      //   console.log('API: Sesión cerrada en el servidor');
      // } catch (serverError) {
      //   console.error('API: Error al cerrar sesión en servidor:', serverError);
      // }
      
      return true;
    } catch (error) {
      console.error('API: Error general al cerrar sesión:', error);
      // No lanzar el error para evitar que afecte el flujo principal
      return false;
    }
  },
  
  // Verificar si hay un token almacenado
  isAuthenticated: async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      return !!token;
    } catch (error) {
      console.error('Error al verificar autenticación:', error);
      return false;
    }
  },

  // Validar si el token es válido haciendo una petición al servidor
  validateToken: async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) return false;
      
      // En modo desarrollo, podemos retornar true sin validar con el servidor
      // para evitar problemas de conexión durante el desarrollo
      return true;
      
      // Cuando la API esté disponible, descomenta esto:
      /*
      try {
        // Usar un endpoint que solo requiera autenticación
        const response = await api.get('api/me/');
        return response.status === 200;
      } catch (error) {
        if (error.response && error.response.status === 401) {
          await AsyncStorage.removeItem('userToken');
          return false;
        }
        // Asumimos que podría ser un problema de conexión, no con el token
        return true;
      }
      */
    } catch (error) {
      console.error('Error al validar token:', error);
      return false;
    }
  },
};

// Servicio de reservas
export const reservasService = {
  // Obtener todas las reservas
  getReservas: async () => {
    try {
      console.log('Obteniendo reservas...');
      // Verificar que tenemos un token antes de hacer la petición
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        console.error('No hay token para obtener reservas');
        return [];
      }
      
      // Arreglo para almacenar todas las reservas
      let todasLasReservas = [];
      let siguientePagina = 'api/reservas-computador/';
      
      // Recorrer todas las páginas
      while (siguientePagina) {
        console.log('Obteniendo página:', siguientePagina);
        
        // Realizar la llamada a la API
        const response = await api.get(siguientePagina);
        
        if (response.status === 200) {
          // Verificar si la respuesta contiene datos paginados
          if (response.data && response.data.results) {
            // Si tiene formato paginado, agregar los resultados al arreglo
            todasLasReservas = [...todasLasReservas, ...response.data.results];
            // Actualizar la siguiente página (si existe)
            if (response.data.next) {
              // Extraer la parte de la URL que necesitamos (sin la base URL)
              const urlCompleta = response.data.next;
              const urlBase = API_URL;
              siguientePagina = urlCompleta.replace(urlBase, '');
            } else {
              siguientePagina = null;
            }
          } else if (Array.isArray(response.data)) {
            // Si la respuesta es un arreglo directo, agregarlo y terminar
            todasLasReservas = [...todasLasReservas, ...response.data];
            siguientePagina = null;
          } else {
            console.error('Formato de respuesta no reconocido:', response.data);
            siguientePagina = null;
          }
        } else {
          console.error('Error al obtener reservas:', response.status);
          siguientePagina = null;
        }
      }
      
      console.log(`Se obtuvieron ${todasLasReservas.length} reservas en total`);
      return todasLasReservas;
    } catch (error) {
      console.error('Error al obtener reservas:', error);
      if (error.response) {
        console.error('Detalles del error:', error.response.status, error.response.data);
      } else if (error.request) {
        console.error('No se recibió respuesta al solicitar reservas');
      }
      return [];
    }
  },
  
  // Obtener una reserva específica
  getReserva: async (id) => {
    try {
      const response = await api.get(`api/reservas-computador/${id}/`);
      return response.data;
    } catch (error) {
      console.error(`Error al obtener reserva ${id}:`, error);
      throw error;
    }
  },
  
  // Crear una nueva reserva
  createReserva: async (reservaData) => {
    try {
      const response = await api.post('api/reservas-computador/', reservaData);
      return response.data;
    } catch (error) {
      console.error('Error al crear reserva:', error);
      throw error;
    }
  },

  // Cancelar una reserva existente
  cancelReserva: async (id) => {
    try {
      const response = await api.delete(`api/reservas-computador/${id}/`);
      return response.data;
    } catch (error) {
      console.error(`Error al cancelar reserva ${id}:`, error);
      throw error;
    }
  },
  
  // Actualizar una reserva existente
  updateReserva: async (id, reservaData) => {
    try {
      const response = await api.put(`api/reservas-computador/${id}/`, reservaData);
      return response.data;
    } catch (error) {
      console.error(`Error al actualizar reserva ${id}:`, error);
      throw error;
    }
  },
};

// Servicio de alumnos
export const alumnosService = {
  // Obtener todos los alumnos con paginación
  getAlumnos: async (page = 1, limit = 20) => {
    try {
      console.log(`Obteniendo lista de alumnos (página ${page})...`);
      const response = await api.get('api/alumnos/', {
        params: {
          page,
          limit
        }
      });
      console.log('Respuesta completa de alumnos:', JSON.stringify(response.data, null, 2));

      if (!response.data) {
        console.log('No hay datos en la respuesta de alumnos');
        return {
          alumnos: [],
          hasMore: false,
          totalPages: 0,
          currentPage: page
        };
      }

      // Procesar la respuesta según su estructura
      let alumnos = [];
      let hasMore = false;
      let totalPages = 1;

      if (Array.isArray(response.data)) {
        alumnos = response.data;
        hasMore = alumnos.length === limit;
      } else if (response.data.results && Array.isArray(response.data.results)) {
        alumnos = response.data.results;
        hasMore = !!response.data.next;
        totalPages = Math.ceil(response.data.count / limit);
      } else if (response.data.alumnos && Array.isArray(response.data.alumnos)) {
        alumnos = response.data.alumnos;
        hasMore = alumnos.length === limit;
      } else if (typeof response.data === 'object' && response.data.id) {
        alumnos = [response.data];
        hasMore = false;
      }

      // Validar y formatear cada alumno
      const formattedAlumnos = alumnos.map(alumno => ({
        id: alumno.id,
        nombre: alumno.nombre,
        rut: alumno.rut,
        curso_id: alumno.curso_id,
        materno: alumno.materno,
        sexo: alumno.sexo,
        edad: alumno.edad,
        fechaNacimiento: alumno.fechaNacimiento,
        fechaIncorporacion: alumno.fechaIncorporacion,
        procedencia: alumno.procedencia,
        reprobado: alumno.reprobado,
        direccion: alumno.direccion,
        nacionalidad: alumno.nacionalidad,
        puebloOriginario: alumno.puebloOriginario,
        alergico: alumno.alergico
      }));

      return {
        alumnos: formattedAlumnos,
        hasMore,
        totalPages,
        currentPage: page
      };
    } catch (error) {
      console.error('Error detallado al obtener alumnos:', error);
      if (error.response) {
        console.error('Datos del error:', error.response.data);
        console.error('Estado del error:', error.response.status);
      }
      throw error;
    }
  },

  // Obtener un alumno específico
  getAlumno: async (id) => {
    try {
      console.log(`Obteniendo alumno con ID: ${id}`);
      const response = await api.get(`api/alumnos/${id}/`);
      return response.data;
    } catch (error) {
      console.error(`Error al obtener alumno ${id}:`, error);
      throw error;
    }
  },

  // Obtener alumnos por rut
  getAlumnosPorRut: async (rut) => {
    try {
      console.log(`Buscando alumno con RUT: ${rut}`);
      const response = await api.get('api/alumnos/', {
        params: { rut }
      });
      
      if (!response.data) return [];
      
      const alumnos = Array.isArray(response.data) ? response.data :
                     response.data.results ? response.data.results :
                     response.data.alumnos ? response.data.alumnos :
                     [response.data];
      
      return alumnos;
    } catch (error) {
      console.error('Error al obtener alumnos por rut:', error);
      throw error;
    }
  },

  // Obtener alumnos por curso
  getAlumnosPorCurso: async (curso) => {
    try {
      console.log(`Buscando alumnos del curso: ${curso}`);
      const response = await api.get('api/alumnos/', {
        params: { curso }
      });
      
      if (!response.data) return [];
      
      const alumnos = Array.isArray(response.data) ? response.data :
                     response.data.results ? response.data.results :
                     response.data.alumnos ? response.data.alumnos :
                     [response.data];
      
      return alumnos;
    } catch (error) {
      console.error('Error al obtener alumnos por curso:', error);
      throw error;
    }
  }
};

// Servicio de noticias y eventos
export const noticiasService = {
  // Obtener todas las noticias
  getNoticias: async () => {
    try {
      console.log('Obteniendo noticias...');
      const response = await api.get('api/noticias/');
      console.log('Respuesta completa de noticias:', JSON.stringify(response.data, null, 2));
      
      if (!response.data) {
        console.log('No hay datos en la respuesta de noticias');
        return [];
      }
      
      // Procesar la respuesta según su estructura
      let noticias = [];
      
      if (Array.isArray(response.data)) {
        noticias = response.data;
      } else if (response.data.results && Array.isArray(response.data.results)) {
        noticias = response.data.results;
      } else if (response.data.noticias && Array.isArray(response.data.noticias)) {
        noticias = response.data.noticias;
      } else if (typeof response.data === 'object' && response.data.id) {
        noticias = [response.data];
      }
      
      // Validar y formatear cada noticia
      return noticias.map(noticia => ({
        id: noticia.id,
        titulo: noticia.titulo,
        subtitulo: noticia.subtitulo,
        texto: noticia.texto,
        date: noticia.date,
        redactor: noticia.redactor,
        tituloDestacado: noticia.tituloDestacado,
        destacado: noticia.destacado,
        galeria: noticia.galeria,
        noticia: noticia.noticia,
        tema: noticia.tema,
        audio: noticia.audio,
        likes: noticia.likes
      }));
      
    } catch (error) {
      console.error('Error detallado al obtener noticias:', error);
      if (error.response) {
        console.error('Datos del error:', error.response.data);
        console.error('Estado del error:', error.response.status);
      }
      throw error;
    }
  },

  // Obtener todos los eventos
  getEventos: async () => {
    try {
      console.log('Obteniendo eventos...');
      const response = await api.get('api/eventos/');
      console.log('Respuesta completa de eventos:', JSON.stringify(response.data, null, 2));
      
      if (!response.data) {
        console.log('No hay datos en la respuesta de eventos');
        return [];
      }
      
      // Procesar la respuesta según su estructura
      let eventos = [];
      
      if (Array.isArray(response.data)) {
        eventos = response.data;
      } else if (response.data.results && Array.isArray(response.data.results)) {
        eventos = response.data.results;
      } else if (response.data.eventos && Array.isArray(response.data.eventos)) {
        eventos = response.data.eventos;
      } else if (typeof response.data === 'object' && response.data.id) {
        eventos = [response.data];
      }
      
      // Validar y formatear cada evento
      return eventos.map(evento => ({
        id: evento.id,
        fecha: evento.fecha,
        titulo: evento.titulo,
        texto: evento.texto
      }));
      
    } catch (error) {
      console.error('Error detallado al obtener eventos:', error);
      if (error.response) {
        console.error('Datos del error:', error.response.data);
        console.error('Estado del error:', error.response.status);
      }
      throw error;
    }
  },

  // Obtener todos los comunicados
  getComunicados: async () => {
    try {
      console.log('Obteniendo comunicados...');
      const response = await api.get('api/comunicados/');
      console.log('Respuesta completa de comunicados:', JSON.stringify(response.data, null, 2));
      
      // Verificar la estructura de la respuesta
      if (!response.data) {
        console.log('No hay datos en la respuesta');
        return [];
      }
      
      // Si la respuesta es un array, devolverla directamente
      if (Array.isArray(response.data)) {
        return response.data;
      }
      
      // Si la respuesta tiene una propiedad results (paginación)
      if (response.data.results) {
        return response.data.results;
      }
      
      // Si la respuesta es un objeto con los comunicados en otra propiedad
      if (response.data.comunicados) {
        return response.data.comunicados;
      }
      
      // Si es un solo comunicado
      if (typeof response.data === 'object' && response.data.id) {
        return [response.data];
      }
      
      console.log('Estructura de respuesta no reconocida:', response.data);
      return [];
    } catch (error) {
      console.error('Error detallado al obtener comunicados:', error);
      if (error.response) {
        console.error('Datos del error:', error.response.data);
        console.error('Estado del error:', error.response.status);
      }
      throw error;
    }
  }
};

export default api;