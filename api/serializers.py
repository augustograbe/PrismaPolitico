from rest_framework import serializers
from deputados.models import Deputado, Orgao, Proposicao, Votacao
from grafos.models import GrafoAresta
from analises.models import DeputadoPresenca


class DeputadoSerializer(serializers.ModelSerializer):
    presenca = serializers.SerializerMethodField()

    class Meta:
        model = Deputado
        fields = '__all__'

    def get_presenca(self, obj):
        try:
            p = DeputadoPresenca.objects.get(deputado=obj, legislatura=obj.id_legislatura)
            return p.presenca_percentual
        except DeputadoPresenca.DoesNotExist:
            return None


class GrafoArestaSerializer(serializers.ModelSerializer):
    class Meta:
        model = GrafoAresta
        fields = '__all__'
