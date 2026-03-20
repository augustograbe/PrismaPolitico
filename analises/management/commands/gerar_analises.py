from django.core.management.base import BaseCommand
from django.db.models import Count
from deputados.models import Deputado, Voto, Votacao
from analises.models import DeputadoPresenca
from tqdm import tqdm


class Command(BaseCommand):
    help = 'Calcula e salva análises dos deputados (presença nas votações).'

    def add_arguments(self, parser):
        parser.add_argument(
            '--legislatura',
            type=int,
            default=57,
            help='ID da Legislatura para calcular as análises (padrão: 57)'
        )

    def handle(self, *args, **options):
        leg = options['legislatura']
        self.stdout.write(f"Iniciando cálculo de análises para a Legislatura {leg}...\n")

        self.calcular_presenca(leg)

        self.stdout.write(self.style.SUCCESS(f"\nAnálises geradas com sucesso para a Legislatura {leg}!"))

    def calcular_presenca(self, leg):
        """Calcula a presença de cada deputado nas votações da legislatura."""
        self.stdout.write("Calculando presença dos deputados nas votações...\n")

        deputados = list(Deputado.objects.filter(id_legislatura=leg))
        if not deputados:
            self.stdout.write(self.style.ERROR("Nenhum deputado encontrado para esta legislatura."))
            return

        self.stdout.write(f"  Deputados encontrados: {len(deputados)}")

        # Pegar todas as votações que têm pelo menos um voto de deputados desta legislatura
        votacoes_ids = set(
            Voto.objects.filter(deputado__in=deputados)
            .values_list('votacao_id', flat=True)
            .distinct()
        )
        total_votacoes = len(votacoes_ids)

        if total_votacoes == 0:
            self.stdout.write(self.style.ERROR("Nenhuma votação encontrada para esta legislatura."))
            return

        self.stdout.write(f"  Total de votações na legislatura: {total_votacoes}")

        # Contar votações por deputado de uma vez (otimizado)
        votos_por_deputado = dict(
            Voto.objects.filter(deputado__in=deputados, votacao_id__in=votacoes_ids)
            .values('deputado_id')
            .annotate(total=Count('votacao_id', distinct=True))
            .values_list('deputado_id', 'total')
        )

        # Limpar registros antigos desta legislatura
        DeputadoPresenca.objects.filter(legislatura=leg).delete()

        registros = []
        for dep in tqdm(deputados, desc="Calculando presença"):
            presente = votos_por_deputado.get(dep.id, 0)
            percentual = round((presente / total_votacoes) * 100, 2) if total_votacoes > 0 else 0

            registros.append(
                DeputadoPresenca(
                    deputado=dep,
                    legislatura=leg,
                    presenca_percentual=percentual,
                    votacoes_presente=presente,
                    votacoes_total=total_votacoes,
                )
            )

        DeputadoPresenca.objects.bulk_create(registros)

        self.stdout.write(
            f"  Presença calculada para {len(registros)} deputados. "
            f"Total de registros: {DeputadoPresenca.objects.filter(legislatura=leg).count()}"
        )
