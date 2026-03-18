import random
from itertools import combinations
from django.core.management.base import BaseCommand
from deputados.models import Deputado
from grafos.models import SimilaridadeVotos


DEPUTADOS_DATA = [
    # (nome, partido, estado, sexo, presenca, em_exercicio)
    ('Ana Souza', 'PT', 'SP', 'F', 87.5, True),
    ('Carlos Silva', 'PL', 'RJ', 'M', 92.3, True),
    ('Maria Oliveira', 'MDB', 'MG', 'F', 78.1, True),
    ('João Santos', 'PSOL', 'RS', 'M', 95.0, True),
    ('Fernanda Lima', 'PT', 'BA', 'F', 65.4, True),
    ('Roberto Almeida', 'PL', 'SP', 'M', 88.9, True),
    ('Juliana Costa', 'PSDB', 'PR', 'F', 73.2, True),
    ('Pedro Ferreira', 'PP', 'SC', 'M', 91.7, True),
    ('Camila Rodrigues', 'MDB', 'GO', 'F', 82.0, True),
    ('Lucas Martins', 'UNIÃO', 'CE', 'M', 56.8, False),
    ('Beatriz Nascimento', 'PT', 'PE', 'F', 90.3, True),
    ('André Barbosa', 'PL', 'MG', 'M', 84.6, True),
    ('Patrícia Gomes', 'PSOL', 'RJ', 'F', 97.1, True),
    ('Rafael Pereira', 'PP', 'RS', 'M', 71.5, True),
    ('Gabriela Araújo', 'MDB', 'MT', 'F', 62.9, False),
    ('Thiago Monteiro', 'PL', 'BA', 'M', 89.4, True),
    ('Larissa Cardoso', 'PSDB', 'SP', 'F', 76.8, True),
    ('Marcos Vieira', 'PT', 'PA', 'M', 93.2, True),
    ('Isabela Freitas', 'UNIÃO', 'AM', 'F', 50.3, False),
    ('Diego Correia', 'PP', 'GO', 'M', 85.7, True),
    ('Renata Campos', 'MDB', 'PE', 'F', 79.4, True),
    ('Felipe Lopes', 'PL', 'PR', 'M', 94.1, True),
    ('Carolina Teixeira', 'PT', 'MG', 'F', 88.0, True),
    ('Gustavo Ramos', 'PSOL', 'SP', 'M', 96.5, True),
    ('Vanessa Dias', 'PSDB', 'RJ', 'F', 67.2, True),
    ('Bruno Carvalho', 'UNIÃO', 'SC', 'M', 81.3, True),
    ('Aline Moreira', 'PP', 'BA', 'F', 74.9, True),
    ('Eduardo Nunes', 'PL', 'CE', 'M', 90.8, True),
    ('Tatiana Ribeiro', 'MDB', 'RS', 'F', 83.6, True),
    ('Alex Pimentel', 'PT', 'DF', 'O', 77.2, True),
]


class Command(BaseCommand):
    help = 'Popula o banco com deputados fictícios e similaridades de votos'

    def handle(self, *args, **options):
        self.stdout.write('Removendo dados existentes...')
        SimilaridadeVotos.objects.all().delete()
        Deputado.objects.all().delete()

        self.stdout.write('Criando deputados...')
        deputados = []
        for nome, partido, estado, sexo, presenca, em_exercicio in DEPUTADOS_DATA:
            dep = Deputado.objects.create(
                nome=nome,
                partido=partido,
                estado=estado,
                sexo=sexo,
                presenca=presenca,
                em_exercicio=em_exercicio,
            )
            deputados.append(dep)
            self.stdout.write(f'  ✓ {dep}')

        self.stdout.write(f'\nTotal deputados: {len(deputados)}')

        self.stdout.write('\nCriando similaridades de votos...')
        similaridades = []
        for dep1, dep2 in combinations(deputados, 2):
            # Deputados do mesmo partido tendem a ter maior similaridade
            if dep1.partido == dep2.partido:
                sim = random.uniform(60, 100)
            else:
                sim = random.uniform(5, 80)

            similaridades.append(
                SimilaridadeVotos(
                    deputado_1=dep1,
                    deputado_2=dep2,
                    similaridade=round(sim, 1),
                )
            )

        SimilaridadeVotos.objects.bulk_create(similaridades)
        self.stdout.write(f'Total similaridades: {len(similaridades)}')
        self.stdout.write(self.style.SUCCESS('\n✅ Dados criados com sucesso!'))
