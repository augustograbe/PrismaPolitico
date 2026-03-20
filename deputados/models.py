from django.db import models

class Partido(models.Model):
    id = models.IntegerField(primary_key=True)
    sigla = models.CharField(max_length=15, unique=True)
    nome = models.CharField(max_length=100, null=True, blank=True)
    uri = models.URLField(null=True, blank=True)
    
    def __str__(self):
        return self.sigla

class Deputado(models.Model):
    id = models.IntegerField(primary_key=True)
    uri = models.URLField(null=True, blank=True)
    nome = models.CharField(max_length=200)
    sigla_partido = models.CharField(max_length=15, null=True, blank=True)
    partido = models.ForeignKey(Partido, on_delete=models.SET_NULL, null=True, blank=True)
    sigla_uf = models.CharField(max_length=2, null=True, blank=True)
    id_legislatura = models.IntegerField(null=True, blank=True)
    url_foto = models.URLField(null=True, blank=True)
    email = models.EmailField(null=True, blank=True)
    
    # Novos campos detalhados
    cpf = models.CharField(max_length=14, null=True, blank=True)
    data_nascimento = models.DateField(null=True, blank=True)
    data_falecimento = models.DateField(null=True, blank=True)
    escolaridade = models.CharField(max_length=100, null=True, blank=True)
    municipio_nascimento = models.CharField(max_length=100, null=True, blank=True)
    nome_civil = models.CharField(max_length=200, null=True, blank=True)
    sexo = models.CharField(max_length=1, null=True, blank=True)
    uf_nascimento = models.CharField(max_length=2, null=True, blank=True)
    condicao_eleitoral = models.CharField(max_length=100, null=True, blank=True)
    situacao = models.CharField(max_length=50, null=True, blank=True)

    class Meta:
        ordering = ['nome']

    def __str__(self):
        return f'{self.nome} ({self.sigla_partido}-{self.sigla_uf})'

class Orgao(models.Model):
    id = models.IntegerField(primary_key=True)
    uri = models.URLField(null=True, blank=True)
    sigla = models.CharField(max_length=50)
    nome = models.CharField(max_length=300)
    tipo_orgao = models.CharField(max_length=100, null=True, blank=True) 

    def __str__(self):
        return self.sigla

class FrenteParlamentar(models.Model):
    id = models.IntegerField(primary_key=True)
    uri = models.URLField(null=True, blank=True)
    titulo = models.CharField(max_length=300)
    id_legislatura = models.IntegerField(null=True, blank=True)

    def __str__(self):
        return self.titulo

class Proposicao(models.Model):
    id = models.IntegerField(primary_key=True)
    uri = models.URLField(null=True, blank=True)
    sigla_tipo = models.CharField(max_length=10, null=True, blank=True)
    numero = models.IntegerField(null=True, blank=True)
    ano = models.IntegerField(null=True, blank=True)
    ementa = models.TextField(null=True, blank=True)

    def __str__(self):
        return f'{self.sigla_tipo} {self.numero}/{self.ano}'

class Votacao(models.Model):
    id = models.CharField(max_length=100, primary_key=True)
    uri = models.URLField(null=True, blank=True)
    data = models.DateField(null=True, blank=True)
    data_hora = models.DateTimeField(null=True, blank=True)
    orgao = models.ForeignKey(Orgao, on_delete=models.SET_NULL, null=True, blank=True)
    proposicao = models.ForeignKey(Proposicao, on_delete=models.SET_NULL, null=True, blank=True)
    descricao = models.TextField(null=True, blank=True)
    aprovada = models.IntegerField(null=True, blank=True)

    def __str__(self):
        return f'Votação {self.id} em {self.data}'

class Voto(models.Model):
    votacao = models.ForeignKey(Votacao, on_delete=models.CASCADE, related_name='votos')
    deputado = models.ForeignKey(Deputado, on_delete=models.CASCADE, related_name='votos')
    tipo_voto = models.CharField(max_length=30) # Sim, Não, Abstenção, Obstrução, Art. 17, etc
    data_registro = models.DateTimeField(null=True, blank=True)

    class Meta:
        unique_together = ('votacao', 'deputado')

    def __str__(self):
        return f'{self.deputado.nome} -> {self.tipo_voto} ({self.votacao.id})'
