from django.db import models
from deputados.models import Deputado


class DeputadoAnalise(models.Model):
    deputado = models.ForeignKey(Deputado, on_delete=models.CASCADE, related_name='analises')
    legislatura = models.IntegerField()
    presenca_percentual = models.FloatField(help_text='Percentual de presença nas votações (0 a 100)')
    votacoes_presente = models.IntegerField(help_text='Qtd de votações em que o deputado votou')
    votacoes_total = models.IntegerField(help_text='Total de votações na legislatura')
    louvain_votos = models.IntegerField(null=True, blank=True, help_text='Comunidade Louvain (grafo de votos)')
    leiden_votos = models.IntegerField(null=True, blank=True, help_text='Comunidade Leiden (grafo de votos)')
    louvain_coautoria = models.IntegerField(null=True, blank=True, help_text='Comunidade Louvain (grafo de coautoria)')
    leiden_coautoria = models.IntegerField(null=True, blank=True, help_text='Comunidade Leiden (grafo de coautoria)')

    class Meta:
        db_table = 'deputados_analise'
        unique_together = ('deputado', 'legislatura')
        ordering = ['-presenca_percentual']
        verbose_name = 'Análise de Deputado'
        verbose_name_plural = 'Análises de Deputados'

    def __str__(self):
        return f'{self.deputado.nome} | Leg {self.legislatura}: {self.presenca_percentual}%'
