from rest_framework import viewsets
from deputados.models import Deputado
from grafos.models import GrafoAresta
from .serializers import DeputadoSerializer, GrafoArestaSerializer


class DeputadoViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Deputado.objects.all()
    serializer_class = DeputadoSerializer


class GrafoArestaViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = GrafoAresta.objects.all()
    serializer_class = GrafoArestaSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Opcionalmente filtrar por mínimo de similaridade para não travar o frontend
        min_sim = self.request.query_params.get('min_similaridade', None)
        if min_sim is not None:
            queryset = queryset.filter(similaridade__gte=float(min_sim))
        else:
            # Se não fornecer, retorna um padrão alto para evitar 200 mil arestas de uma vez (ex: 80%)
            queryset = queryset.filter(similaridade__gte=80.0)
            
        return queryset


class ArestaCoautoriaViewSet(viewsets.ReadOnlyModelViewSet):
    """Endpoint para arestas de coautoria (apenas pares com coautoria >= 1)."""
    queryset = GrafoAresta.objects.all()
    serializer_class = GrafoArestaSerializer

    def get_queryset(self):
        queryset = super().get_queryset().filter(coautoria__gte=1)
        
        # Filtro opcional por mínimo de coautorias
        min_coautoria = self.request.query_params.get('min_coautoria', None)
        if min_coautoria is not None:
            queryset = queryset.filter(coautoria__gte=int(min_coautoria))
            
        return queryset
