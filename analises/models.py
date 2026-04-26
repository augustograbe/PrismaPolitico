from django.db import models
from deputados.models import Deputado


class DeputadoAnalise(models.Model):
    deputado = models.ForeignKey(Deputado, on_delete=models.CASCADE, related_name='analises')
    legislatura = models.IntegerField()
    presenca_percentual = models.FloatField(help_text='Percentual de presenca nas votacoes (0 a 100)')
    votacoes_presente = models.IntegerField(help_text='Qtd de votacoes em que o deputado votou')
    votacoes_total = models.IntegerField(help_text='Total de votacoes na legislatura')

    class Meta:
        db_table = 'deputados_analise'
        unique_together = ('deputado', 'legislatura')
        ordering = ['-presenca_percentual']
        verbose_name = 'Analise de Deputado'
        verbose_name_plural = 'Analises de Deputados'

    def __str__(self):
        return f'{self.deputado.nome} | Leg {self.legislatura}: {self.presenca_percentual}%'
