from django.core.management.base import BaseCommand
from deputados.models import Deputado, ProposicaoAutor, Proposicao
from grafos.models import GrafoAresta
from tqdm import tqdm
from itertools import combinations
from collections import defaultdict


class Command(BaseCommand):
    help = 'Calcula e salva as arestas de coautoria de Projetos de Lei entre deputados.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--legislatura',
            type=int,
            default=57,
            help='ID da Legislatura para calcular o grafo (padrão: 57)'
        )

    def handle(self, *args, **options):
        leg = options['legislatura']
        self.stdout.write(f"Iniciando cálculo de coautoria para a Legislatura {leg}...\n")

        deputados = list(Deputado.objects.filter(id_legislatura=leg))
        deps_ids = set(d.id for d in deputados)

        if len(deputados) < 2:
            self.stdout.write(self.style.ERROR("Menos de 2 deputados encontrados para esta legislatura."))
            return

        # Buscar todas as proposições PL que têm autores deputados desta legislatura
        self.stdout.write("Carregando relações proposição-autor na memória...")

        # Estrutura: { proposicao_id: set(deputado_ids) }
        proposicao_autores = defaultdict(set)

        # Pegar apenas PLs
        pls_ids = set(Proposicao.objects.filter(sigla_tipo='PL').values_list('id', flat=True))

        autores_qs = ProposicaoAutor.objects.filter(
            proposicao_id__in=pls_ids,
            deputado_id__in=deps_ids
        ).values_list('proposicao_id', 'deputado_id')

        for prop_id, dep_id in autores_qs:
            proposicao_autores[prop_id].add(dep_id)

        self.stdout.write(f"Total de PLs com autores deputados: {len(proposicao_autores)}")

        # Contar coautorias para cada par de deputados
        self.stdout.write("Calculando coautorias entre pares de deputados...\n")

        # Estrutura: { (dep_id_menor, dep_id_maior): count }
        coautoria_count = defaultdict(int)

        for prop_id, autores in tqdm(proposicao_autores.items(), desc="Analisando PLs"):
            # Filtrar apenas deputados válidos da legislatura
            autores_validos = autores.intersection(deps_ids)
            if len(autores_validos) < 2:
                continue

            # Para cada par de autores desta proposição, incrementar contador
            for d1_id, d2_id in combinations(sorted(autores_validos), 2):
                coautoria_count[(d1_id, d2_id)] += 1

        total_pares_com_coautoria = len(coautoria_count)
        self.stdout.write(f"Pares com pelo menos 1 coautoria: {total_pares_com_coautoria}")

        if total_pares_com_coautoria == 0:
            self.stdout.write(self.style.WARNING("Nenhuma coautoria encontrada."))
            return

        # Atualizar ou criar arestas com o valor de coautoria
        self.stdout.write("Salvando coautorias nas arestas...\n")

        # Criar mapa de deputados por id para lookup rápido
        dep_map = {d.id: d for d in deputados}

        atualizados = 0
        criados = 0
        batch_criar = []
        batch_size = 5000

        for (d1_id, d2_id), count in tqdm(coautoria_count.items(), desc="Salvando Arestas"):
            # Tentar atualizar aresta existente (criada pelo grafo de similaridade)
            updated = GrafoAresta.objects.filter(
                deputado_1_id=d1_id,
                deputado_2_id=d2_id,
                legislatura=leg
            ).update(coautoria=count)

            if updated == 0:
                # Tentar na ordem inversa
                updated = GrafoAresta.objects.filter(
                    deputado_1_id=d2_id,
                    deputado_2_id=d1_id,
                    legislatura=leg
                ).update(coautoria=count)

            if updated > 0:
                atualizados += 1
            else:
                # Criar nova aresta (par que não tinha similaridade)
                batch_criar.append(
                    GrafoAresta(
                        deputado_1=dep_map[d1_id],
                        deputado_2=dep_map[d2_id],
                        legislatura=leg,
                        similaridade=0,
                        votos_em_comum=0,
                        coautoria=count,
                    )
                )
                criados += 1

                if len(batch_criar) >= batch_size:
                    GrafoAresta.objects.bulk_create(batch_criar, ignore_conflicts=True)
                    batch_criar.clear()

        if batch_criar:
            GrafoAresta.objects.bulk_create(batch_criar, ignore_conflicts=True)

        max_coautoria = max(coautoria_count.values()) if coautoria_count else 0

        self.stdout.write(self.style.SUCCESS(
            f"\nGrafo de coautoria gerado com sucesso!"
            f"\n  Arestas atualizadas: {atualizados}"
            f"\n  Arestas novas criadas: {criados}"
            f"\n  Maior coautoria entre 2 deputados: {max_coautoria}"
        ))
