from django.core.management.base import BaseCommand
from deputados.models import Deputado, Voto, Votacao
from grafos.models import GrafoAresta
from tqdm import tqdm
from itertools import combinations

class Command(BaseCommand):
    help = 'Calcula e salva as arestas do grafo de similaridade de votos entre deputados.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--legislatura',
            type=int,
            default=57,
            help='ID da Legislatura para calcular o grafo (padrão: 57)'
        )

    def handle(self, *args, **options):
        leg = options['legislatura']
        self.stdout.write(f"Iniciando cálculo de similaridade para a Legislatura {leg}...\n")

        deputados = list(Deputado.objects.filter(id_legislatura=leg))
        if len(deputados) < 2:
            self.stdout.write(self.style.ERROR("Menos de 2 deputados encontrados para esta legislatura."))
            return
            
        self.stdout.write("Carregando votos na memória para otimização...")
        
        # Ignorar abstenção, ausências ("Não compareceu"), etc. (Conforme instrução: somente os que estiveram presentes e sem abstenção)
        votos_invalidos = ['Abstenção', 'Não compareceu', 'Art. 17']
        
        # Estrutura: { deputado_id: { votacao_id: tipo_voto } }
        votos_por_deputado = {d.id: {} for d in deputados}
        
        # Pegar todos os votos válidos dos deputados dessa legislatura
        todos_votos = Voto.objects.filter(deputado__in=deputados).exclude(tipo_voto__in=votos_invalidos)
        for voto in todos_votos:
            votos_por_deputado[voto.deputado_id][voto.votacao_id] = voto.tipo_voto

        pares_deputados = list(combinations(deputados, 2))
        total_pares = len(pares_deputados)
        self.stdout.write(f"Calculando similaridade para {total_pares} pares de deputados...\n")

        arestas_para_criar = []
        batch_size = 5000

        # Limpar arestas antigas dessa legislatura
        GrafoAresta.objects.filter(legislatura=leg).delete()

        for d1, d2 in tqdm(pares_deputados, desc="Analisando Pares"):
            votos_d1 = set(votos_por_deputado[d1.id].keys())
            votos_d2 = set(votos_por_deputado[d2.id].keys())
            
            # Votações onde ambos participaram com votos válidos
            votacoes_em_comum = votos_d1.intersection(votos_d2)
            total_comum = len(votacoes_em_comum)
            
            if total_comum == 0:
                continue
                
            votos_iguais = 0
            for v_id in votacoes_em_comum:
                if votos_por_deputado[d1.id][v_id] == votos_por_deputado[d2.id][v_id]:
                    votos_iguais += 1
                    
            similaridade_pct = round((votos_iguais / total_comum) * 100, 2)
            
            arestas_para_criar.append(
                GrafoAresta(
                    deputado_1=d1,
                    deputado_2=d2,
                    legislatura=leg,
                    similaridade=similaridade_pct,
                    votos_em_comum=total_comum
                )
            )
            
            if len(arestas_para_criar) >= batch_size:
                GrafoAresta.objects.bulk_create(arestas_para_criar)
                arestas_para_criar.clear()
                
        # Salvar o restante
        if arestas_para_criar:
            GrafoAresta.objects.bulk_create(arestas_para_criar)

        self.stdout.write(self.style.SUCCESS(f"\nGrafo gerado com sucesso! Total de arestas criadas: {GrafoAresta.objects.filter(legislatura=leg).count()}"))
