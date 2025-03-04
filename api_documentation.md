# Documentación de la API de Reservas de Computador - Altas Cumbres

## Información General

- **URL Base**: `https://altascumbressanclemente.cl/`
- **Versión de la API**: 1.0
- **Formato de datos**: JSON
- **Autenticación**: Token-based (REST Framework Token Authentication)

## Autenticación

Todas las solicitudes a la API (excepto la obtención del token) requieren autenticación mediante token.

### Obtener Token de Autenticación

**Endpoint**: `/api-token-auth/`

**Método**: POST

**Parámetros**:
```json
{
  "username": "tu_usuario",
  "password": "tu_contraseña"
}
```

**Respuesta exitosa**:
```json
{
  "token": "9944b09199c62bcf9418ad846dd0e4bbdfc6ee4b"
}
```

**Códigos de respuesta**:
- 200: OK - Token generado correctamente
- 400: Bad Request - Datos inválidos
- 401: Unauthorized - Credenciales incorrectas

### Uso del Token

Incluye el token en el encabezado HTTP `Authorization` en todas las solicitudes:

```
Authorization: Token 9944b09199c62bcf9418ad846dd0e4bbdfc6ee4b
```

## Endpoints de la API

### Reservas de Computador

#### Listar todas las reservas

**Endpoint**: `/api/reservas-computador/`

**Método**: GET

**Parámetros**: Ninguno

**Respuesta exitosa**:
```json
[
  {
    "id": 1,
    "alumno_nombre": "Juan",
    "alumno_apellido": "Pérez",
    "fecha_reserva": "2024-08-15",
    "bloque_reserva": "Mañana",
    "created_at": "2024-08-10T15:30:45Z"
  },
  {
    "id": 2,
    "alumno_nombre": "María",
    "alumno_apellido": "González",
    "fecha_reserva": "2024-08-16",
    "bloque_reserva": "Tarde",
    "created_at": "2024-08-10T16:20:30Z"
  }
]
```

#### Obtener una reserva específica

**Endpoint**: `/api/reservas-computador/{id}/`

**Método**: GET

**Parámetros**: ID de la reserva en la URL

**Respuesta exitosa**:
```json
{
  "id": 1,
  "alumno_nombre": "Juan",
  "alumno_apellido": "Pérez",
  "fecha_reserva": "2024-08-15",
  "bloque_reserva": "Mañana",
  "created_at": "2024-08-10T15:30:45Z"
}
```

#### Crear una nueva reserva

**Endpoint**: `/api/reservas-computador/`

**Método**: POST

**Parámetros**:
```json
{
  "alumno_nombre": "Pedro",
  "alumno_apellido": "Sánchez",
  "fecha_reserva": "2024-08-20",
  "bloque_reserva": "Mañana"
}
```

**Respuesta exitosa**:
```json
{
  "id": 3,
  "alumno_nombre": "Pedro",
  "alumno_apellido": "Sánchez",
  "fecha_reserva": "2024-08-20",
  "bloque_reserva": "Mañana",
  "created_at": "2024-08-11T10:15:22Z"
}
```

#### Actualizar una reserva existente

**Endpoint**: `/api/reservas-computador/{id}/`

**Método**: PUT

**Parámetros**:
```json
{
  "alumno_nombre": "Pedro",
  "alumno_apellido": "Sánchez",
  "fecha_reserva": "2024-08-21",
  "bloque_reserva": "Tarde"
}
```

**Respuesta exitosa**:
```json
{
  "id": 3,
  "alumno_nombre": "Pedro",
  "alumno_apellido": "Sánchez",
  "fecha_reserva": "2024-08-21",
  "bloque_reserva": "Tarde",
  "created_at": "2024-08-11T10:15:22Z"
}
```

#### Actualizar parcialmente una reserva

**Endpoint**: `/api/reservas-computador/{id}/`

**Método**: PATCH

**Parámetros** (ejemplo de actualización parcial):
```json
{
  "bloque_reserva": "Tarde"
}
```

**Respuesta exitosa**:
```json
{
  "id": 3,
  "alumno_nombre": "Pedro",
  "alumno_apellido": "Sánchez",
  "fecha_reserva": "2024-08-21",
  "bloque_reserva": "Tarde",
  "created_at": "2024-08-11T10:15:22Z"
}
```

#### Eliminar una reserva

**Endpoint**: `/api/reservas-computador/{id}/`

**Método**: DELETE

**Parámetros**: Ninguno

**Respuesta exitosa**: 204 No Content

## Ejemplos de Código para App Móvil

### Android (Kotlin con Retrofit)

#### Configuración de Retrofit

```kotlin
// ApiService.kt
import retrofit2.Call
import retrofit2.http.*

data class TokenRequest(val username: String, val password: String)
data class TokenResponse(val token: String)

data class Reserva(
    val id: Int? = null,
    val alumno_nombre: String,
    val alumno_apellido: String,
    val fecha_reserva: String,
    val bloque_reserva: String,
    val created_at: String? = null
)

interface ApiService {
    @POST("api-token-auth/")
    fun getToken(@Body request: TokenRequest): Call<TokenResponse>
    
    @GET("api/reservas-computador/")
    fun getReservas(@Header("Authorization") token: String): Call<List<Reserva>>
    
    @GET("api/reservas-computador/{id}/")
    fun getReserva(@Path("id") id: Int, @Header("Authorization") token: String): Call<Reserva>
    
    @POST("api/reservas-computador/")
    fun createReserva(@Body reserva: Reserva, @Header("Authorization") token: String): Call<Reserva>
    
    @PUT("api/reservas-computador/{id}/")
    fun updateReserva(@Path("id") id: Int, @Body reserva: Reserva, @Header("Authorization") token: String): Call<Reserva>
    
    @DELETE("api/reservas-computador/{id}/")
    fun deleteReserva(@Path("id") id: Int, @Header("Authorization") token: String): Call<Void>
}

// RetrofitClient.kt
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory

object RetrofitClient {
    private const val BASE_URL = "https://altascumbressanclemente.cl/"
    
    val retrofit = Retrofit.Builder()
        .baseUrl(BASE_URL)
        .addConverterFactory(GsonConverterFactory.create())
        .build()
    
    val apiService: ApiService = retrofit.create(ApiService::class.java)
}
```

#### Ejemplo de uso

```kotlin
// Obtener token
val tokenRequest = TokenRequest("tu_usuario", "tu_contraseña")
val call = RetrofitClient.apiService.getToken(tokenRequest)
call.enqueue(object : Callback<TokenResponse> {
    override fun onResponse(call: Call<TokenResponse>, response: Response<TokenResponse>) {
        if (response.isSuccessful) {
            val token = "Token ${response.body()?.token}"
            // Guardar token para futuras solicitudes
            saveToken(token)
        } else {
            // Manejar error
        }
    }
    
    override fun onFailure(call: Call<TokenResponse>, t: Throwable) {
        // Manejar error de conexión
    }
})

// Listar reservas
val token = getStoredToken() // Recuperar token almacenado
val call = RetrofitClient.apiService.getReservas(token)
call.enqueue(object : Callback<List<Reserva>> {
    override fun onResponse(call: Call<List<Reserva>>, response: Response<List<Reserva>>) {
        if (response.isSuccessful) {
            val reservas = response.body()
            // Mostrar reservas en la UI
        } else {
            // Manejar error
        }
    }
    
    override fun onFailure(call: Call<List<Reserva>>, t: Throwable) {
        // Manejar error de conexión
    }
})

// Crear reserva
val nuevaReserva = Reserva(
    alumno_nombre = "Ana",
    alumno_apellido = "Martínez",
    fecha_reserva = "2024-08-25",
    bloque_reserva = "Mañana"
)
val token = getStoredToken()
val call = RetrofitClient.apiService.createReserva(nuevaReserva, token)
call.enqueue(object : Callback<Reserva> {
    override fun onResponse(call: Call<Reserva>, response: Response<Reserva>) {
        if (response.isSuccessful) {
            val reservaCreada = response.body()
            // Procesar reserva creada
        } else {
            // Manejar error
        }
    }
    
    override fun onFailure(call: Call<Reserva>, t: Throwable) {
        // Manejar error de conexión
    }
})
```

### iOS (Swift con URLSession)

```swift
// ReservaModel.swift
struct TokenRequest: Codable {
    let username: String
    let password: String
}

struct TokenResponse: Codable {
    let token: String
}

struct Reserva: Codable {
    let id: Int?
    let alumno_nombre: String
    let alumno_apellido: String
    let fecha_reserva: String
    let bloque_reserva: String
    let created_at: String?
}

// APIService.swift
class APIService {
    static let shared = APIService()
    private let baseURL = "https://altascumbressanclemente.cl/"
    private var authToken: String?
    
    // Obtener token
    func getToken(username: String, password: String, completion: @escaping (Result<String, Error>) -> Void) {
        let tokenRequest = TokenRequest(username: username, password: password)
        
        guard let url = URL(string: baseURL + "api-token-auth/") else {
            completion(.failure(NSError(domain: "URLError", code: -1, userInfo: nil)))
            return
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.addValue("application/json", forHTTPHeaderField: "Content-Type")
        
        do {
            let jsonData = try JSONEncoder().encode(tokenRequest)
            request.httpBody = jsonData
            
            URLSession.shared.dataTask(with: request) { data, response, error in
                if let error = error {
                    completion(.failure(error))
                    return
                }
                
                guard let data = data else {
                    completion(.failure(NSError(domain: "DataError", code: -2, userInfo: nil)))
                    return
                }
                
                do {
                    let tokenResponse = try JSONDecoder().decode(TokenResponse.self, from: data)
                    self.authToken = "Token " + tokenResponse.token
                    completion(.success(tokenResponse.token))
                } catch {
                    completion(.failure(error))
                }
            }.resume()
        } catch {
            completion(.failure(error))
        }
    }
    
    // Obtener todas las reservas
    func getReservas(completion: @escaping (Result<[Reserva], Error>) -> Void) {
        guard let token = authToken else {
            completion(.failure(NSError(domain: "AuthError", code: -3, userInfo: nil)))
            return
        }
        
        guard let url = URL(string: baseURL + "api/reservas-computador/") else {
            completion(.failure(NSError(domain: "URLError", code: -1, userInfo: nil)))
            return
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        request.addValue(token, forHTTPHeaderField: "Authorization")
        
        URLSession.shared.dataTask(with: request) { data, response, error in
            if let error = error {
                completion(.failure(error))
                return
            }
            
            guard let data = data else {
                completion(.failure(NSError(domain: "DataError", code: -2, userInfo: nil)))
                return
            }
            
            do {
                let reservas = try JSONDecoder().decode([Reserva].self, from: data)
                completion(.success(reservas))
            } catch {
                completion(.failure(error))
            }
        }.resume()
    }
    
    // Crear una reserva
    func createReserva(reserva: Reserva, completion: @escaping (Result<Reserva, Error>) -> Void) {
        guard let token = authToken else {
            completion(.failure(NSError(domain: "AuthError", code: -3, userInfo: nil)))
            return
        }
        
        guard let url = URL(string: baseURL + "api/reservas-computador/") else {
            completion(.failure(NSError(domain: "URLError", code: -1, userInfo: nil)))
            return
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.addValue("application/json", forHTTPHeaderField: "Content-Type")
        request.addValue(token, forHTTPHeaderField: "Authorization")
        
        do {
            let jsonData = try JSONEncoder().encode(reserva)
            request.httpBody = jsonData
            
            URLSession.shared.dataTask(with: request) { data, response, error in
                if let error = error {
                    completion(.failure(error))
                    return
                }
                
                guard let data = data else {
                    completion(.failure(NSError(domain: "DataError", code: -2, userInfo: nil)))
                    return
                }
                
                do {
                    let nuevaReserva = try JSONDecoder().decode(Reserva.self, from: data)
                    completion(.success(nuevaReserva))
                } catch {
                    completion(.failure(error))
                }
            }.resume()
        } catch {
            completion(.failure(error))
        }
    }
}
```

## Manejo de errores

### Códigos de error comunes

- **400 Bad Request**: Datos inválidos o faltantes
- **401 Unauthorized**: Token inválido o expirado
- **403 Forbidden**: Permiso denegado
- **404 Not Found**: Recurso no encontrado
- **500 Internal Server Error**: Error del servidor

### Recomendaciones para manejo de errores

1. Implementa reintentos para errores de red temporales
2. Actualiza el token si recibes un 401 (Unauthorized)
3. Muestra mensajes de error amigables al usuario
4. Registra los errores para análisis posterior

## Consideraciones de seguridad

1. Nunca almacenes contraseñas en texto plano en la aplicación
2. Usa almacenamiento seguro para los tokens (Keychain en iOS, EncryptedSharedPreferences en Android)
3. Considera implementar HTTPS para todas las comunicaciones
4. Implementa timeout en las solicitudes para evitar bloqueos
5. Limpia los tokens al cerrar sesión

## Limitaciones y consideraciones

- La API tiene un límite de 100 solicitudes por minuto por usuario
- Las reservas solo pueden hacerse para fechas futuras
- Los bloques disponibles son "Mañana" y "Tarde" 