from django.urls import path, include 
from django.contrib import admin
from django.conf import settings
from django.conf.urls.static import static
from colegio import views
from rest_framework.authtoken.views import obtain_auth_token

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # API URLs - Solo para ReservaComputador
    path('', include('colegio.urls')),
    
    # Endpoints de autenticación para DRF
    path('api-auth/', include('rest_framework.urls')),
    path('api-token-auth/', obtain_auth_token, name='api_token_auth'),
    
    # Resto de URLs existentes
    path('', views.index, name = 'index'),
    path('torneos', views.torneos),
    path('ranking', views.ranking, name='ranking'),
    path('lirmi/', views.lirmi, name='lirmi'),

    path('buscar', views.buscar, name='buscar'),
    path("search/", views.SearchResultsView.as_view(), name="search_results"),
    path('tutor/<int:id>/', views.tutor, name='tutor'),
    path('select/madre/<int:idMadre>/<int:idAlumno>', views.selectMadre),
    path('select/padre/<int:idPadre>/<int:idAlumno>', views.selectPadre),
    path('select/tutor/<int:idTutor>/<int:idAlumno>', views.selectTutor),
    
    path('madre/<int:id>/', views.madre),
    path('padre/<int:id>/', views.padre),
    path('agregar_alumno/', views.agregar_alumno, name='agregar_alumno'),
    path('actualizar_alumno/', views.actualizar_alumno, name='actualizar_alumno'),
    path('info/<int:id>', views.infoAlumnos),
    path('info/alumno/<int:id>', views.info),
    path('fichaMatricula', views.fichaMatricula, name='fichaMatricula'),
    path('alumno', views.savealumno, name='alumno'),
    path('delete/alumno/<int:id>', views.destroy_alumno),
    path('exalumnos', views.exalumnos, name='exalumnos'),
    path('apoderado', views.apoderado, name='apoderado'),

    path('blog/<int:idnotice>', views.blog, name='blog'),
    path('directiva', views.directiva, name="directiva"),
    path('calendar', views.calendar, name="calendar"),
    path('evaluaciones', views.evaluaciones, name="evaluaciones"),
    path('download/calendario/<int:id>', views.descargarCalendario),
    path('upload/archivo/', views.addEvaluacion, name='upload_archivo'),

    path('contabilidad', views.contabilidad, name='contabilidad'),
    path('mision', views.mision, name="mision"),
    path('vision', views.vision, name="vision"),
    path('contacto', views.contacto, name="contacto"),
    path('noticia', views.noticia, name="noticia"),
    path('evento', views.evento, name="evento"),
    path('noticias', views.noticias, name="noticias"),
    path('admision', views.admision, name="admision"),
    path('colegio', views.colegio, name="colegio"),
    path('profesores', views.profesores, name="profesores"),
    path('profesor', views.profesor, name='profesor'),
    path('direccion', views.direccion, name='direccion'),
    path('valores', views.valores, name='valores'),
    path('pie', views.pie, name='pie'),
    path('covid', views.covid, name='covid'),
    path('reglamentos', views.reglamentos, name='reglamentos'),
    path('proyecto', views.show_pdf, name='proyecto'),
    path('documentos', views.proyecto, name='documentos'),

    path('convivencia', views.show_rc, name='convivencia'),

    path('reglamentointerno', views.show_rice, name='reglamentointerno'),


    path('cargar_convivencia/', views.cargar_convivencia, name='cargar_convivencia'),
    path('cargar_reglamentoInterno/', views.cargar_reglamentoInterno, name='cargar_reglamentointerno'),
    path('cargar_evaluacion', views.cargar_evaluacion, name='cargar_evaluacion'),
    


    path('archReligion', views.archReligion, name='archReligion'),
    path('convivenciaPDF', views.convivenciaPDF, name='convivenciaPDF'),
    path('evaluacionPDF', views.evaluacionPDF, name='evaluacionPDF'),
    path('proyectoPDF', views.proyectoPDF, name='proyectoPDF'),
    #urls correspondientes al amigo secreto
    path('tabla/amigo', views.tabla_amigo, name='tablaAmigo'),
    path('sorteo', views.sorteo),
    path('amigo', views.amigoSecreto, name='amigo'),
    path('amigo/resultado', views.amigoResultado, name='resultadoAmigo'),

    path('mensaje', views.enviar_mensaje_view),
    path('vulnerabilidad', views.vulnerabilidad, name='vulnerabilidad'),
    path('aceptar/guia/<int:id>', views.aceptar_guia),
    path('rechazar/guia/<int:id>', views.rechazar_guia),
    path('sumar_like/<int:noticia_id>/', views.sumar_like, name='sumar_like'),
    path('evaluacion', views.show_eva, name='evaluacion'),
    path('eventos', views.eventos, name='eventos'),
    path('encuesta', views.encuesta, name='encuesta'),

    
    #urls biblioteca
    

    path('add/boletin', views.add_boletin, name='add_boletin'),
    path('boletin', views.boletin, name="boletin"),
    path('descargar_boletin/<int:boletin_id>/', views.descargar_boletin, name='descargar_boletin'),
    path('reservar-computador/', views.reservar_computador, name='reservar_computador'),
    path('reservas_computadores', views.lista_reserva_computadores, name='lista_reserva_computadores'),
    
    
    path('biblioteca/cine', views.cine, name='cine'),

    path('delete/evento/<int:id>', views.destroy),
    path('delete/noticia/<int:id>', views.destroy_noticia, name='deleteNoticia'),
    path('delete/comunicado/<int:id>', views.destroy_comunicado),
    path('delete/guia/<int:id>', views.destroy_guia),
    path('download/guia/<int:id>', views.download_guia),

    path('prueba', views.prueba),

    path('delete/profesor/<int:id>', views.destroy_profesor),
    path('delete/alumno/<int:id>', views.destroy_alumno),
    path('add/comunicado', views.add_comunicado, name="comunicado"),
    path('galeria', views.galeria, name='galeria'),
    path('guias', views.imprimir, name="guias"),
    path('pedidos', views.pedidos),
    path('obtener_alumnos/', views.obtener_alumnos, name='obtener_alumnos'),
    

    path('alumnos/<int:idCurso>/', views.alumnos, name='alumnos'),
    path('alumnos/perfil/<int:id>', views.perfil, name='perfil'),
    path('prueba', views.prueba),
    path('comunicados', views.comunicados, name="comunicados"),
    path('talleres', views.talleres, name="talleres"),
    path('resultado/taller/<int:id>', views.resultadoTalleres),
    path('add/tenista', views.addTenista),
    path('aniversario', views.aniversario, name='aniversario'),
    path('puntaje', views.puntaje, name="puntaje"),
    path('aniversario/perfil/<str:rey>/', views.perfilAniversario),
    path('aniversario/agregar_actividad/', views.agregar_actividad, name='agregar_actividad'),
    path('aniversario/agregar_multa/', views.agregar_multa, name='agregar_multa'),
    path('velada', views.velada, name="velada"),
    path('calendario/', include("calendario.urls")),

    #urls de la app biblioteca
    path('biblioteca/', include("biblioteca.urls")),

    path('carrera/', views.registrar_carrera, name='registrar_carrera'),
    path('carrera/iniciar_carrera', views.iniciar_carrera, name='iniciar_carrera'),
    path('eliminar_participantes/', views.eliminar_participantes, name='eliminar_participantes'),


    path('pme', views.pme, name='pme'),
    path('ver/pme', views.show_pme, name='show_pme'),


    path('nuevo_calendario', views.nuevo_calendario, name='nuevo_calendario'),
    path('cargar_archivo/<int:curso_id>/', views.cargar_archivo, name='cargar_archivo'),

    path('dia/alumno', views.dia_alumno, name="dia_alumno"),

    path('prefactura', views.prefactura, name='prefactura'),
    path('prefactura/lista', views.lista_prefacturas, name='lista_prefacturas'),
    path('aceptar/compra/<int:id>', views.aceptar_compra, name='aceptar_compra'),
    path('rechazar/compra/<int:id>', views.rechazar_compra, name='rechazar_compra'),

    path('plataforma/', include("plataforma.urls")),

    path('game/', include("game.urls")),

    path('enviar_contacto', views.enviar_contacto, name='enviar_contacto'),


    # ...  otras URLs ...
    path('buscar-alumno/', views.buscar_alumno, name='buscar_alumno'),
    path('subir-video/', views.subir_video, name='subir_video'),
    path('listar-videos/', views.lista_dia_niño, name='listar_videos'),
    path('eliminar-video/<int:video_id>/', views.eliminar_video, name='eliminar_video'),
    path('api/comunicados/', views.api_comunicados, name='api_comunicados'),

    path('reserva-profesor/', views.reserva_profesor, name='reserva_profesor'),
    path('api/profesores/', views.obtener_profesores, name='obtener_profesores'),
    path('api/horarios-disponibles/', views.obtener_horarios_disponibles, name='obtener_horarios_disponibles'),
    path('api/verificar-apoderado/', views.verificar_apoderado, name='verificar_apoderado'),
    path('api/crear-reserva/', views.crear_reserva, name='crear_reserva'),

   
    path('organizar-horario/', views.organizar_horario, name='organizar_horario'),
    path('api/verificar-profesor/', views.verificar_profesor, name='verificar_profesor'),
    path('api/verificar-sesion/', views.verificar_sesion, name='verificar_sesion'),
    path('api/cerrar-sesion/', views.cerrar_sesion, name='cerrar_sesion'),
    path('api/registrar-profesor/', views.registrar_profesor, name='registrar_profesor'),
    path('api/guardar-horario-profesor/', views.guardar_horario_profesor, name='guardar_horario_profesor'),
    path('api/obtener-horarios/', views.obtener_horarios, name='obtener_horarios'),  # Nueva URL
    path('api/eliminar-horario/<int:horario_id>/', views.eliminar_horario, name='eliminar_horario'),  # Nueva URL

    #urls de ajedrez
    path('ajedrez/', views.ajedrez, name='ajedrez'),
    path('agregar-campeonato/', views.agregar_campeonato, name='agregar_campeonato'),
    path('eliminar-campeonato/', views.eliminar_campeonato, name='eliminar_campeonato'),
    path('jugar/', views.jugar, name='jugar'),

    path('diapositiva/', views.diapositiva_view, name='diapositiva'),

    path('reemplazar_foto/<int:foto_id>/', views.reemplazar_foto, name='reemplazar_foto'),
    path('eliminar_foto/<int:foto_id>/', views.eliminar_foto, name='eliminar_foto'),
    
    #urls de actividades
    path('actividades/', include("actividades.urls")),
    path('licitacion/', include("licitacion.urls")),
    path('lista-materiales/', views.lista_materiales, name='lista-materiales'),
    path('lista-materiales/descargar/<int:archivo_id>/', views.descargar_lista, name='descargar_lista'),
    path('lista-materiales/eliminar/<int:archivo_id>/', views.eliminar_lista, name='eliminar_lista'),

] 

handler404 = views.page_not_found_view
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

