// Dados estáticos dos deputados fictícios para funcionar sem backend
// Esses dados espelham o que está no banco de dados Django

export const DEPUTIES = [
    { id: 1, nome: 'Ana Souza', partido: 'PT', estado: 'SP', sexo: 'F', presenca: 87.5, em_exercicio: true },
    { id: 2, nome: 'Carlos Silva', partido: 'PL', estado: 'RJ', sexo: 'M', presenca: 92.3, em_exercicio: true },
    { id: 3, nome: 'Maria Oliveira', partido: 'MDB', estado: 'MG', sexo: 'F', presenca: 78.1, em_exercicio: true },
    { id: 4, nome: 'João Santos', partido: 'PSOL', estado: 'RS', sexo: 'M', presenca: 95.0, em_exercicio: true },
    { id: 5, nome: 'Fernanda Lima', partido: 'PT', estado: 'BA', sexo: 'F', presenca: 65.4, em_exercicio: true },
    { id: 6, nome: 'Roberto Almeida', partido: 'PL', estado: 'SP', sexo: 'M', presenca: 88.9, em_exercicio: true },
    { id: 7, nome: 'Juliana Costa', partido: 'PSDB', estado: 'PR', sexo: 'F', presenca: 73.2, em_exercicio: true },
    { id: 8, nome: 'Pedro Ferreira', partido: 'PP', estado: 'SC', sexo: 'M', presenca: 91.7, em_exercicio: true },
    { id: 9, nome: 'Camila Rodrigues', partido: 'MDB', estado: 'GO', sexo: 'F', presenca: 82.0, em_exercicio: true },
    { id: 10, nome: 'Lucas Martins', partido: 'UNIÃO', estado: 'CE', sexo: 'M', presenca: 56.8, em_exercicio: false },
    { id: 11, nome: 'Beatriz Nascimento', partido: 'PT', estado: 'PE', sexo: 'F', presenca: 90.3, em_exercicio: true },
    { id: 12, nome: 'André Barbosa', partido: 'PL', estado: 'MG', sexo: 'M', presenca: 84.6, em_exercicio: true },
    { id: 13, nome: 'Patrícia Gomes', partido: 'PSOL', estado: 'RJ', sexo: 'F', presenca: 97.1, em_exercicio: true },
    { id: 14, nome: 'Rafael Pereira', partido: 'PP', estado: 'RS', sexo: 'M', presenca: 71.5, em_exercicio: true },
    { id: 15, nome: 'Gabriela Araújo', partido: 'MDB', estado: 'MT', sexo: 'F', presenca: 62.9, em_exercicio: false },
    { id: 16, nome: 'Thiago Monteiro', partido: 'PL', estado: 'BA', sexo: 'M', presenca: 89.4, em_exercicio: true },
    { id: 17, nome: 'Larissa Cardoso', partido: 'PSDB', estado: 'SP', sexo: 'F', presenca: 76.8, em_exercicio: true },
    { id: 18, nome: 'Marcos Vieira', partido: 'PT', estado: 'PA', sexo: 'M', presenca: 93.2, em_exercicio: true },
    { id: 19, nome: 'Isabela Freitas', partido: 'UNIÃO', estado: 'AM', sexo: 'F', presenca: 50.3, em_exercicio: false },
    { id: 20, nome: 'Diego Correia', partido: 'PP', estado: 'GO', sexo: 'M', presenca: 85.7, em_exercicio: true },
    { id: 21, nome: 'Renata Campos', partido: 'MDB', estado: 'PE', sexo: 'F', presenca: 79.4, em_exercicio: true },
    { id: 22, nome: 'Felipe Lopes', partido: 'PL', estado: 'PR', sexo: 'M', presenca: 94.1, em_exercicio: true },
    { id: 23, nome: 'Carolina Teixeira', partido: 'PT', estado: 'MG', sexo: 'F', presenca: 88.0, em_exercicio: true },
    { id: 24, nome: 'Gustavo Ramos', partido: 'PSOL', estado: 'SP', sexo: 'M', presenca: 96.5, em_exercicio: true },
    { id: 25, nome: 'Vanessa Dias', partido: 'PSDB', estado: 'RJ', sexo: 'F', presenca: 67.2, em_exercicio: true },
    { id: 26, nome: 'Bruno Carvalho', partido: 'UNIÃO', estado: 'SC', sexo: 'M', presenca: 81.3, em_exercicio: true },
    { id: 27, nome: 'Aline Moreira', partido: 'PP', estado: 'BA', sexo: 'F', presenca: 74.9, em_exercicio: true },
    { id: 28, nome: 'Eduardo Nunes', partido: 'PL', estado: 'CE', sexo: 'M', presenca: 90.8, em_exercicio: true },
    { id: 29, nome: 'Tatiana Ribeiro', partido: 'MDB', estado: 'RS', sexo: 'F', presenca: 83.6, em_exercicio: true },
    { id: 30, nome: 'Alex Pimentel', partido: 'PT', estado: 'DF', sexo: 'O', presenca: 77.2, em_exercicio: true },
];

// Gerar similaridades determinísticas baseadas em seed
function seededRandom(seed) {
    let x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
}

function generateSimilarities() {
    const similarities = [];
    let seed = 42;

    for (let i = 0; i < DEPUTIES.length; i++) {
        for (let j = i + 1; j < DEPUTIES.length; j++) {
            const dep1 = DEPUTIES[i];
            const dep2 = DEPUTIES[j];
            seed++;

            let sim;
            if (dep1.partido === dep2.partido) {
                sim = 60 + seededRandom(seed) * 40; // 60-100
            } else {
                sim = 5 + seededRandom(seed) * 75; // 5-80
            }

            similarities.push({
                deputado_1: dep1.id,
                deputado_2: dep2.id,
                similaridade: Math.round(sim * 10) / 10,
            });
        }
    }

    return similarities;
}

export const SIMILARITIES = generateSimilarities();
