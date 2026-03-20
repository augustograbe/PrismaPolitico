from django.db import models
from deputados.models import Deputado


class DeputadoPresenca(models.Model):
    deputado = models.ForeignKey(Deputado, on_delete=models.CASCADE, related_name='presencas')
    legislatura = models.IntegerField()
    presenca_percentual = models.FloatField(help_text='Percentual de presença nas votações (0 a 100)')
    votacoes_presente = models.IntegerField(help_text='Qtd de votações em que o deputado votou')
    votacoes_total = models.IntegerField(help_text='Total de votações na legislatura')

    class Meta:
        unique_together = ('deputado', 'legislatura')
        ordering = ['-presenca_percentual']
        verbose_name = 'Presença de Deputado'
        verbose_name_plural = 'Presenças de Deputados'

    def __str__(self):
        return f'{self.deputado.nome} | Leg {self.legislatura}: {self.presenca_percentual}%'
