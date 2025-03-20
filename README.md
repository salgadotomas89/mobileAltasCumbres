# API WebAltasCumbres

## Documentación de Endpoints

### Autenticación

#### Autenticación de Usuarios (auth_user)
- **Endpoint**: `usuarios/api/login/`
- **Método**: POST
- **No requiere autenticación**
- **Datos requeridos**:
  ```json
  {
    "username": "nombre_usuario",
    "password": "contraseña"
  }
  ```
- **Respuesta exitosa**:
  ```json
  {
    "estado": "éxito",
    "mensaje": "Autenticación correcta",
    "usuario": {
      "id": 1,
      "username": "nombre_usuario",
      "email": "correo@ejemplo.com",
      "first_name": "Nombre",
      "last_name": "Apellido",
      "is_staff": false,
      "is_superuser": false
    },
    "token": "tu_token_de_autenticacion"
  }
  ```
- **Respuesta de error**:
  ```json
  {
    "estado": "error",
    "mensaje": "Credenciales inválidas"
  }
  ```

