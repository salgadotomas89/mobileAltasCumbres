# API WebAltasCumbres

## Documentación de Endpoints

### Autenticación
La mayoría de los endpoints requieren autenticación mediante token. Para incluir el token en las peticiones, agregar el siguiente header:
```
Authorization: Token tu_token_aquí
```

#### Autenticación de Alumnos
- **Endpoint**: `/api/alumno-auth/`
- **Método**: POST
- **No requiere autenticación**
- **Datos requeridos**:
  ```json
  {
    "rut": "12345678-9",
    "digitos_verificacion": "1234"
  }
  ```
- **Respuesta exitosa**:
  ```json
  {
    "estado": "éxito",
    "mensaje": "Autenticación correcta",
    "alumno": {
      "id": 1,
      "nombre": "Juan",
      "apellido": "Pérez"
    },
    "token": "token_de_autenticacion"
  }
  ```

### Alumnos
- **Endpoint Base**: `/api/alumnos/`
- **Métodos permitidos**: GET
- **Requiere autenticación**: Sí
- **Filtros disponibles**:
  - `rut`: Filtrar por RUT del alumno
  - `curso`: Filtrar por nombre del curso
- **Ejemplos**:
  - Lista de alumnos: `GET /api/alumnos/`
  - Alumno específico: `GET /api/alumnos/1/`
  - Filtrar por RUT: `GET /api/alumnos/?rut=12345678-9`
  - Filtrar por curso: `GET /api/alumnos/?curso=Primero%20Básico`

### Noticias
- **Endpoint Base**: `/api/noticias/`
- **Métodos permitidos**: GET
- **No requiere autenticación**
- **Parámetros opcionales**:
  - `con_imagenes`: Incluir imágenes relacionadas
- **Ejemplos**:
  - Lista de noticias: `GET /api/noticias/`
  - Noticia específica: `GET /api/noticias/1/`
  - Noticia con imágenes: `GET /api/noticias/?con_imagenes=true`

### Imágenes de Noticias
- **Endpoint Base**: `/api/imagenes-noticias/`
- **Métodos permitidos**: GET
- **No requiere autenticación**
- **Filtros disponibles**:
  - `noticia_id`: Filtrar por ID de noticia
- **Ejemplos**:
  - Todas las imágenes: `GET /api/imagenes-noticias/`
  - Imágenes de una noticia: `GET /api/imagenes-noticias/?noticia_id=1`

### Comunicados
- **Endpoint Base**: `/api/comunicados/`
- **Métodos permitidos**: GET
- **No requiere autenticación**
- **Parámetros opcionales**:
  - `con_archivos`: Incluir archivos adjuntos
- **Ejemplos**:
  - Lista de comunicados: `GET /api/comunicados/`
  - Comunicado específico: `GET /api/comunicados/1/`
  - Comunicado con archivos: `GET /api/comunicados/?con_archivos=true`

### Archivos de Comunicados
- **Endpoint Base**: `/api/archivos-comunicados/`
- **Métodos permitidos**: GET
- **No requiere autenticación**
- **Filtros disponibles**:
  - `comunicado_id`: Filtrar por ID de comunicado
- **Ejemplos**:
  - Todos los archivos: `GET /api/archivos-comunicados/`
  - Archivos de un comunicado: `GET /api/archivos-comunicados/?comunicado_id=1`

### Eventos
- **Endpoint Base**: `/api/eventos/`
- **Métodos permitidos**: GET
- **No requiere autenticación**
- **Ejemplos**:
  - Lista de eventos: `GET /api/eventos/`
  - Evento específico: `GET /api/eventos/1/`

### Reservas de Computador
- **Endpoint Base**: `/api/reservas-computador/`
- **Métodos permitidos**: GET, POST, PUT, DELETE
- **Requiere autenticación**: Sí
- **Estructura para crear/actualizar**:
  ```json
  {
    "alumno_nombre": "Juan",
    "alumno_apellido": "Pérez",
    "fecha_reserva": "2024-03-20",
    "bloque_reserva": "Bloque 1"
  }
  ```

## Respuestas de Error Comunes

### Error de Autenticación (401)
```json
{
    "detail": "Las credenciales de autenticación no se proveyeron."
}
```

### Error de Permisos (403)
```json
{
    "detail": "No tiene permiso para realizar esta acción."
}
```

### Recurso No Encontrado (404)
```json
{
    "detail": "No encontrado."
}
```

## Notas Importantes
1. Todas las fechas deben enviarse en formato ISO: `YYYY-MM-DD`
2. Las horas deben enviarse en formato 24h: `HH:MM:SS`
3. Los archivos adjuntos (imágenes, documentos) se devuelven como URLs completas
4. La paginación está habilitada por defecto (20 elementos por página)
5. Para acceder a páginas adicionales usar el parámetro `page`: `?page=2` 