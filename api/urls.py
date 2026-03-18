from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import DeputadoViewSet, GrafoArestaViewSet

router = DefaultRouter()
router.register(r'deputados', DeputadoViewSet)
router.register(r'arestas', GrafoArestaViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
