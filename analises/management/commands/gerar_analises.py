from django.core.management.base import BaseCommand
from django.db.models import Count
from deputados.models import Deputado, Voto, Votacao
from grafos.models import GrafoAresta
from analises.models import DeputadoAnalise
from tqdm import tqdm
import networkx as nx


class Command(BaseCommand):
    help = 'Calcula e salva análises dos deputados (presença e comunidades).'

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
        self.calcular_comunidades(leg)

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
        DeputadoAnalise.objects.filter(legislatura=leg).delete()

        registros = []
        for dep in tqdm(deputados, desc="Calculando presença"):
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
            f"  Presença calculada para {len(registros)} deputados. "
            f"Total de registros: {DeputadoAnalise.objects.filter(legislatura=leg).count()}"
        )

    def _construir_grafo(self, leg, tipo):
        """
        Constrói um grafo NetworkX ponderado a partir das arestas do banco.
        tipo: 'votos' ou 'coautoria'
        """
        G = nx.Graph()

        if tipo == 'votos':
            arestas = GrafoAresta.objects.filter(
                legislatura=leg, similaridade__gt=0
            ).values_list('deputado_1_id', 'deputado_2_id', 'similaridade')
            for d1, d2, peso in arestas:
                G.add_edge(str(d1), str(d2), weight=float(peso))
        else:
            arestas = GrafoAresta.objects.filter(
                legislatura=leg, coautoria__gte=1
            ).values_list('deputado_1_id', 'deputado_2_id', 'coautoria')
            for d1, d2, peso in arestas:
                G.add_edge(str(d1), str(d2), weight=float(peso))

        return G

    def _executar_louvain(self, G):
        """Executa o algoritmo de Louvain e retorna {node_id: community_id}."""
        import community as community_louvain

        if G.number_of_nodes() == 0:
            return {}

        partition = community_louvain.best_partition(G, weight='weight', random_state=42)
        return partition

    def _executar_leiden(self, G):
        """Executa o algoritmo de Leiden e retorna {node_id: community_id}."""
        import igraph as ig
        import leidenalg

        if G.number_of_nodes() == 0:
            return {}

        # Converter NetworkX → igraph
        nodes = list(G.nodes())
        node_to_idx = {n: i for i, n in enumerate(nodes)}

        ig_graph = ig.Graph()
        ig_graph.add_vertices(len(nodes))
        ig_graph.vs['name'] = nodes

        edges = []
        weights = []
        for u, v, data in G.edges(data=True):
            edges.append((node_to_idx[u], node_to_idx[v]))
            weights.append(data.get('weight', 1.0))

        ig_graph.add_edges(edges)
        ig_graph.es['weight'] = weights

        # Executar Leiden
        partition = leidenalg.find_partition(
            ig_graph,
            leidenalg.ModularityVertexPartition,
            weights=weights,
            seed=42,
        )

        result = {}
        for community_id, members in enumerate(partition):
            for node_idx in members:
                result[nodes[node_idx]] = community_id

        return result

    def calcular_comunidades(self, leg):
        """Calcula comunidades Louvain e Leiden para os grafos de votos e coautoria."""
        self.stdout.write("\nCalculando comunidades...\n")

        for tipo in ['votos', 'coautoria']:
            self.stdout.write(f"  Construindo grafo de {tipo}...")
            G = self._construir_grafo(leg, tipo)
            self.stdout.write(f"    Nós: {G.number_of_nodes()}, Arestas: {G.number_of_edges()}")

            if G.number_of_nodes() == 0:
                self.stdout.write(self.style.WARNING(f"    Grafo de {tipo} vazio, pulando."))
                continue

            # Louvain
            self.stdout.write(f"  Executando Louvain no grafo de {tipo}...")
            louvain_partition = self._executar_louvain(G)
            n_louvain = len(set(louvain_partition.values())) if louvain_partition else 0
            self.stdout.write(f"    Comunidades Louvain encontradas: {n_louvain}")

            # Leiden
            self.stdout.write(f"  Executando Leiden no grafo de {tipo}...")
            leiden_partition = self._executar_leiden(G)
            n_leiden = len(set(leiden_partition.values())) if leiden_partition else 0
            self.stdout.write(f"    Comunidades Leiden encontradas: {n_leiden}")

            # Salvar no banco
            campo_louvain = f'louvain_{tipo}'
            campo_leiden = f'leiden_{tipo}'

            analises = DeputadoAnalise.objects.filter(legislatura=leg)
            updates = []
            for analise in analises:
                dep_id = str(analise.deputado_id)
                changed = False

                louvain_val = louvain_partition.get(dep_id)
                if louvain_val is not None:
                    setattr(analise, campo_louvain, louvain_val)
                    changed = True

                leiden_val = leiden_partition.get(dep_id)
                if leiden_val is not None:
                    setattr(analise, campo_leiden, leiden_val)
                    changed = True

                if changed:
                    updates.append(analise)

            if updates:
                DeputadoAnalise.objects.bulk_update(updates, [campo_louvain, campo_leiden])
                self.stdout.write(f"    Atualizado {len(updates)} registros para {tipo}.")
            else:
                self.stdout.write(self.style.WARNING(f"    Nenhum registro atualizado para {tipo}."))

        self.stdout.write(self.style.SUCCESS("  Comunidades calculadas com sucesso!"))
