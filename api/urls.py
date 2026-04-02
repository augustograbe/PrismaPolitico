from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import DeputadoViewSet, GrafoArestaViewSet, ArestaCoautoriaViewSet

router = DefaultRouter()
router.register(r'deputados', DeputadoViewSet)
router.register(r'arestas', GrafoArestaViewSet)
router.register(r'arestas-coautoria', ArestaCoautoriaViewSet, basename='arestas-coautoria')

urlpatterns = [
    path('', include(router.urls)),
]
