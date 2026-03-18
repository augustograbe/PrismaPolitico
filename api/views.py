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
