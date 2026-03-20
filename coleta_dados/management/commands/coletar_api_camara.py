import requests
import pandas as pd
import io
from django.core.management.base import BaseCommand
from deputados.models import Deputado, Partido, Orgao, Proposicao, Votacao, Voto
from tqdm import tqdm
from datetime import datetime
import warnings

warnings.filterwarnings('ignore', category=RuntimeWarning)

class Command(BaseCommand):
    help = 'Coleta dados reais da API da Câmara (Deputados, Partidos, Órgãos) e via CSV (Votações e Votos) para maior velocidade.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--legislatura',
            type=int,
            default=57,
            help='ID da Legislatura para buscar deputados (padrão: 57)'
        )
        parser.add_argument(
            '--ano-inicio',
            type=int,
            default=2023,
            help='Ano inicial para buscar votações em CSV'
        )
        parser.add_argument(
            '--ano-fim',
            type=int,
            default=datetime.now().year,
            help='Ano final para buscar votações em CSV'
        )

    def get_api_data(self, url, params=None):
        paginas_restantes = True
        current_url = url
        dados_totais = []
        
        while paginas_restantes:
            try:
                response = requests.get(current_url, params=params, timeout=15)
                response.raise_for_status()
                data = response.json()
                
                if 'dados' in data:
                    dados_totais.extend(data['dados'])
                
                params = None 
                next_link = next((link['href'] for link in data.get('links', []) if link['rel'] == 'next'), None)
                if next_link:
                    current_url = next_link
                else:
                    paginas_restantes = False
            except Exception as e:
                self.stderr.write(f"\nErro ao acessar {current_url}: {e}")
                paginas_restantes = False
                
        return dados_totais

    def download_and_read_csv(self, url):
        self.stdout.write(f"Baixando {url} ...")
        try:
            response = requests.get(url, timeout=60)
            response.raise_for_status()
            csv_content = io.StringIO(response.text)
            df = pd.read_csv(csv_content, delimiter=';', dtype=str)
            return df
        except Exception as e:
            self.stderr.write(f"\nErro ao baixar {url}: {e}")
            return pd.DataFrame()

    def handle(self, *args, **options):
        leg = options['legislatura']
        self.stdout.write(f"Iniciando coleta para a Legislatura {leg}...\n")

        # 1. Partidos
        self.stdout.write(self.style.WARNING(">> Baixando Partidos (API)..."))
        partidos_dados = self.get_api_data("https://dadosabertos.camara.leg.br/api/v2/partidos")
        for p in tqdm(partidos_dados, desc="Salvando Partidos"):
            Partido.objects.update_or_create(
                id=p['id'],
                defaults={'sigla': p['sigla'], 'nome': p['nome'], 'uri': p['uri']}
            )
            
        # 2. Deputados
        self.stdout.write(self.style.WARNING("\n>> Baixando Deputados (API)..."))
        deputados_dados = self.get_api_data("https://dadosabertos.camara.leg.br/api/v2/deputados", {'idLegislatura': leg})
        for d in tqdm(deputados_dados, desc="Salvando Deputados"):
            partido = Partido.objects.filter(sigla=d['siglaPartido']).first()
            
            # Buscar dados completos do deputado
            detalhes_url = f"https://dadosabertos.camara.leg.br/api/v2/deputados/{d['id']}"
            try:
                res = requests.get(detalhes_url, timeout=10)
                res.raise_for_status()
                detalhes = res.json().get('dados', {})
                ultimo_status = detalhes.get('ultimoStatus', {})
            except Exception as e:
                self.stderr.write(f"\nErro ao buscar detalhes do deputado {d['id']}: {e}")
                detalhes = {}
                ultimo_status = {}
            
            Deputado.objects.update_or_create(
                id=d['id'],
                defaults={
                    'uri': d['uri'],
                    'nome': d['nome'],
                    'sigla_partido': d['siglaPartido'],
                    'partido': partido,
                    'sigla_uf': d['siglaUf'],
                    'id_legislatura': d['idLegislatura'],
                    'url_foto': d['urlFoto'],
                    'email': d['email'],
                    'cpf': detalhes.get('cpf'),
                    'data_nascimento': detalhes.get('dataNascimento'),
                    'data_falecimento': detalhes.get('dataFalecimento'),
                    'escolaridade': detalhes.get('escolaridade'),
                    'municipio_nascimento': detalhes.get('municipioNascimento'),
                    'nome_civil': detalhes.get('nomeCivil'),
                    'sexo': detalhes.get('sexo'),
                    'uf_nascimento': detalhes.get('ufNascimento'),
                    'condicao_eleitoral': ultimo_status.get('condicaoEleitoral'),
                    'situacao': ultimo_status.get('situacao'),
                }
            )

        # 3. Órgãos
        self.stdout.write(self.style.WARNING("\n>> Baixando Órgãos (API)..."))
        orgaos_dados = self.get_api_data("https://dadosabertos.camara.leg.br/api/v2/orgaos")
        for o in tqdm(orgaos_dados, desc="Salvando Órgãos"):
            Orgao.objects.update_or_create(
                id=o['id'],
                defaults={
                    'uri': o['uri'],
                    'sigla': o['sigla'],
                    'nome': o['nome'],
                    'tipo_orgao': o.get('tipoOrgao', '')
                }
            )

        # 4. Histórico de Votações via CSVs
        self.stdout.write(self.style.WARNING("\n>> Baixando e Processando Votos via CSV..."))
        
        ano_inicio = options['ano_inicio']
        ano_fim = options['ano_fim']
        anos = list(range(ano_inicio, ano_fim + 1))
        
        deps_validos = set(Deputado.objects.values_list('id', flat=True))
        
        for ano in anos:
            self.stdout.write(self.style.WARNING(f"\n--- Ano {ano} ---"))
            
            df_votacoes = self.download_and_read_csv(f'http://dadosabertos.camara.leg.br/arquivos/votacoesVotos/csv/votacoesVotos-{ano}.csv')
            
            if df_votacoes.empty:
                self.stdout.write(self.style.ERROR(f"Arquivo CSV de {ano} vazio ou não acessível."))
                continue
                
            # Extrair Votações únicas
            votacoes_unicas = df_votacoes[['idVotacao', 'uriVotacao', 'dataHoraVoto']].drop_duplicates('idVotacao')
            v_objs = []
            
            for _, row in tqdm(votacoes_unicas.iterrows(), total=len(votacoes_unicas), desc=f"Salvando Cabeçalho Votações {ano}"):
                v_id = str(row['idVotacao'])
                dh = str(row.get('dataHoraVoto', ''))
                if dh == 'nan': dh = None
                
                data_v = None
                if dh and len(dh) >= 10:
                    data_v = dh[:10]
                    
                uri_v = str(row.get('uriVotacao', ''))
                if uri_v == 'nan': uri_v = None

                v_objs.append(
                    Votacao(
                        id=v_id,
                        uri=uri_v,
                        data_hora=dh,
                        data=data_v
                    )
                )
                
            if v_objs:
                Votacao.objects.bulk_create(v_objs, ignore_conflicts=True)
                
            # Salvando os Votos Individuais
            votos_objs = []
            votos_ids_validos = set(Votacao.objects.values_list('id', flat=True))
            
            for _, row in tqdm(df_votacoes.iterrows(), total=len(df_votacoes), desc=f"Salvando Votos Individuais {ano}"):
                v_id = str(row['idVotacao'])
                
                try:
                    d_id = int(float(row['deputado_id']))
                except:
                    continue
                    
                if d_id in deps_validos and v_id in votos_ids_validos:
                    dh = str(row.get('dataHoraVoto', ''))
                    if dh == 'nan': dh = None
                    
                    votos_objs.append(
                        Voto(
                            votacao_id=v_id,
                            deputado_id=d_id,
                            tipo_voto=str(row['voto']),
                            data_registro=dh
                        )
                    )
                    
                    if len(votos_objs) > 20000:
                        Voto.objects.bulk_create(votos_objs, ignore_conflicts=True)
                        votos_objs = []
                        
            if votos_objs:
                Voto.objects.bulk_create(votos_objs, ignore_conflicts=True)

        self.stdout.write(self.style.SUCCESS("\nProcesso concluído com sucesso!"))
