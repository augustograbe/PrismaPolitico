from django.core.management.base import BaseCommand
from django.db.models import Count
from deputados.models import Deputado, Voto
from analises.models import DeputadoAnalise
from tqdm import tqdm


class Command(BaseCommand):
    help = 'Calcula e salva analises dos deputados.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--legislatura',
            type=int,
            default=57,
            help='ID da Legislatura para calcular as analises (padrao: 57)'
        )

    def handle(self, *args, **options):
        leg = options['legislatura']
        self.stdout.write(f"Iniciando calculo de analises para a Legislatura {leg}...\n")

        self.calcular_presenca(leg)

        self.stdout.write(self.style.SUCCESS(f"\nAnalises geradas com sucesso para a Legislatura {leg}!"))

    def calcular_presenca(self, leg):
        """Calcula a presenca de cada deputado nas votacoes da legislatura."""
        self.stdout.write("Calculando presenca dos deputados nas votacoes...\n")

        deputados = list(Deputado.objects.filter(id_legislatura=leg))
        if not deputados:
            self.stdout.write(self.style.ERROR("Nenhum deputado encontrado para esta legislatura."))
            return

        self.stdout.write(f"  Deputados encontrados: {len(deputados)}")

        votacoes_ids = set(
            Voto.objects.filter(deputado__in=deputados)
            .values_list('votacao_id', flat=True)
            .distinct()
        )
        total_votacoes = len(votacoes_ids)

        if total_votacoes == 0:
            self.stdout.write(self.style.ERROR("Nenhuma votacao encontrada para esta legislatura."))
            return

        self.stdout.write(f"  Total de votacoes na legislatura: {total_votacoes}")

        votos_por_deputado = dict(
            Voto.objects.filter(deputado__in=deputados, votacao_id__in=votacoes_ids)
            .values('deputado_id')
            .annotate(total=Count('votacao_id', distinct=True))
            .values_list('deputado_id', 'total')
        )

        DeputadoAnalise.objects.filter(legislatura=leg).delete()

        registros = []
        for dep in tqdm(deputados, desc="Calculando presenca"):
            presente = votos_por_deputado.get(dep.id, 0)
            percentual = round((presente / total_votacoes) * 100, 2) if total_votacoes > 0 else 0

            registros.append(
                DeputadoAnalise(
                    deputado=dep,
                    legislatura=leg,
                    presenca_percentual=percentual,
                    votacoes_presente=presente,
                    votacoes_total=total_votacoes,
                )
            )

        DeputadoAnalise.objects.bulk_create(registros)

        self.stdout.write(
            f"  Presenca calculada para {len(registros)} deputados. "
            f"Total de registros: {DeputadoAnalise.objects.filter(legislatura=leg).count()}"
        )
