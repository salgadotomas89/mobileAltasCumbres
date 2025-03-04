from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .api import ReservaComputadorViewSet

# Configurar el router para ReservaComputador
router = DefaultRouter()
router.register('reservas-computador', ReservaComputadorViewSet)

# URLs de la API
urlpatterns = [
    path('api/', include(router.urls)),
] 
