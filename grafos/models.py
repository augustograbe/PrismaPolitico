from django.db import models
from deputados.models import Deputado

class GrafoAresta(models.Model):
    deputado_1 = models.ForeignKey(
        Deputado, on_delete=models.CASCADE, related_name='arestas_como_1'
    )
    deputado_2 = models.ForeignKey(
        Deputado, on_delete=models.CASCADE, related_name='arestas_como_2'
    )
    legislatura = models.IntegerField()
    similaridade = models.FloatField(help_text='Percentual de similaridade de votos (0 a 100)')
    votos_em_comum = models.IntegerField(default=0, help_text='Qtd de votações em que ambos participaram')
    coautoria = models.IntegerField(default=0, help_text='Qtd de projetos de lei coautorados pelo par')

    class Meta:
        unique_together = ('deputado_1', 'deputado_2', 'legislatura')
        ordering = ['-similaridade']
        verbose_name_plural = 'Arestas do Grafo'

        indexes = [
            models.Index(fields=['legislatura', 'similaridade']),
        ]

    def __str__(self):
        return f'Leg {self.legislatura} | {self.deputado_1.nome} ↔ {self.deputado_2.nome}: {self.similaridade}%'
