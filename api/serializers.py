from rest_framework import serializers
from deputados.models import Deputado, Orgao, Proposicao, Votacao
from grafos.models import GrafoAresta


class DeputadoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Deputado
        fields = '__all__'


class GrafoArestaSerializer(serializers.ModelSerializer):
    class Meta:
        model = GrafoAresta
        fields = '__all__'
