import { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { SigmaContainer } from '@react-sigma/core';
import Graph from 'graphology';
import forceAtlas2 from 'graphology-layout-forceatlas2';
import '@react-sigma/core/lib/style.css';

import { PARTY_COLORS, STATE_COLORS, SEX_COLORS, COLORS } from '../../constants/theme';
import GraphEventsController from './GraphEventsController';
import GraphSettingsController from './GraphSettingsController';

/**
 * Retorna a cor de um deputado baseado no critério de separação
 */
function getNodeColor(deputy, separateBy) {
    const partido = deputy.sigla_partido || deputy.partido;
    const estado = deputy.sigla_uf || deputy.estado;
    const sexo = deputy.sexo;

    switch (separateBy) {
        case 'partido':
            return PARTY_COLORS[partido] || COLORS.textMedium;
        case 'estado':
            return STATE_COLORS[estado] || COLORS.textMedium;
        case 'sexo':
            return SEX_COLORS[sexo] || COLORS.textMedium;
        default:
            return PARTY_COLORS[partido] || COLORS.textMedium;
    }
}

/**
 * GraphContainer - Componente principal do grafo com React Sigma
 * Props:
 * - filters: { separateBy, onlyActive, presence, voteSimilarity }
 * - selectedNode: id do nó selecionado (string | null)
 * - onNodeClick: callback quando um nó é clicado
 */
export default function GraphContainer({ filters, selectedNode, onNodeClick, onDeputiesLoaded }) {
    const graph = useMemo(() => new Graph(), []);
    const sigmaRef = useRef(null);
    const [dataLoaded, setDataLoaded] = useState(false);

    // Inicializar o grafo uma vez buscando da API
    useEffect(() => {
        let isMounted = true;
        async function loadData() {
            try {
                const [depReq, arestasReq] = await Promise.all([
                    fetch('http://localhost:8000/api/deputados/'),
                    fetch('http://localhost:8000/api/arestas/')
                ]);
                
                const deputados = await depReq.json();
                const arestas = await arestasReq.json();

                if (!isMounted) return;

                // Adicionar todos os nós
                deputados.forEach((dep) => {
                    graph.addNode(String(dep.id), {
                        label: dep.nome,
                        x: Math.random() * 100,
                        y: Math.random() * 100,
                        size: 8,
                        color: getNodeColor(dep, 'partido'),
                        // Dados customizados
                        deputyData: dep,
                    });
                });

                // Adicionar arestas (O script gera similaridade precalculada)
                arestas.forEach((sim) => {
                    const edgeId = `${sim.deputado_1}-${sim.deputado_2}`;
                    const n1 = String(sim.deputado_1);
                    const n2 = String(sim.deputado_2);
                    
                    if (graph.hasNode(n1) && graph.hasNode(n2) && !graph.hasEdge(edgeId)) {
                        graph.addEdge(n1, n2, {
                            id: edgeId,
                            size: 1,
                            color: COLORS.edgeDefault,
                            similaridade: Number(sim.similaridade),
                        });
                    }
                });

                // Somente aplicar o ForceAtlas2 se houver nós
                if (graph.order > 0) {
                    setTimeout(() => {
                        try {
                            const settings = forceAtlas2.inferSettings(graph);
                            forceAtlas2.assign(graph, {
                                iterations: 50,
                                settings: {
                                    ...settings,
                                    gravity: 5,
                                    scalingRatio: 10,
                                },
                            });
                        } catch (e) {
                            console.error("Erro no ForceAtlas2:", e);
                        }
                    }, 50);
                }
                
                setDataLoaded(true);
                if (onDeputiesLoaded) onDeputiesLoaded(deputados);

            } catch (error) {
                console.error("Erro ao carregar dados do grafo:", error);
            }
        }
        
        loadData();
        return () => { isMounted = false; };
    }, [graph, onDeputiesLoaded]);

    // Aplicar filtros quando mudam
    const applyFilters = useCallback(() => {
        if (!filters || !dataLoaded) return;

        const { separateBy, onlyActive, presence, voteSimilarity, vertexSize } = filters;

        // Atualizar nós (cor e visibilidade)
        graph.forEachNode((nodeId) => {
            const dep = graph.getNodeAttribute(nodeId, 'deputyData');
            if (!dep) return;

            // Cor baseada no critério de separação
            const color = getNodeColor(dep, separateBy);
            graph.setNodeAttribute(nodeId, 'color', color);

            // Visibilidade baseada nos filtros
            let hidden = false;

            // Filtro: apenas em exercício (baseado no campo situacao da tabela deputados_deputado)
            if (onlyActive && dep.situacao && dep.situacao !== 'Exercício') {
                hidden = true;
            }

            // Filtro: presença dentro do range. Se a API real não tiver, ignoramos.
            if (!hidden && dep.presenca !== undefined && (dep.presenca < presence.min || dep.presenca > presence.max)) {
                hidden = true;
            }

            graph.setNodeAttribute(nodeId, 'hidden', hidden);
        });

        // Atualizar arestas baseado na similaridade de votos
        graph.forEachEdge((edgeId, attrs, source, target) => {
            const sim = attrs.similaridade;
            const sourceHidden = graph.getNodeAttribute(source, 'hidden');
            const targetHidden = graph.getNodeAttribute(target, 'hidden');

            // Esconder aresta se algum dos nós está oculto ou se similaridade fora do range
            const hidden =
                sourceHidden ||
                targetHidden ||
                sim < voteSimilarity.min ||
                sim > voteSimilarity.max;

            graph.setEdgeAttribute(edgeId, 'hidden', hidden);
        });

        // Aplicar tamanho dos vértices baseado no critério selecionado
        const DEFAULT_SIZE = 8;
        const MIN_SIZE = 4;
        const MAX_SIZE = 20;

        if (vertexSize === 'padrao' || !vertexSize) {
            // Tamanho padrão uniforme
            graph.forEachNode((nodeId) => {
                graph.setNodeAttribute(nodeId, 'size', DEFAULT_SIZE);
            });
        } else if (vertexSize === 'presenca') {
            // Tamanho proporcional à presença do deputado
            // Coletar os valores de presença dos nós visíveis para normalizar
            let minPresenca = Infinity;
            let maxPresenca = -Infinity;

            graph.forEachNode((nodeId) => {
                if (graph.getNodeAttribute(nodeId, 'hidden')) return;
                const dep = graph.getNodeAttribute(nodeId, 'deputyData');
                if (dep && dep.presenca !== undefined) {
                    const p = Number(dep.presenca);
                    if (p < minPresenca) minPresenca = p;
                    if (p > maxPresenca) maxPresenca = p;
                }
            });

            // Se não há variação, usar tamanho padrão
            if (minPresenca === Infinity || maxPresenca === minPresenca) {
                graph.forEachNode((nodeId) => {
                    graph.setNodeAttribute(nodeId, 'size', DEFAULT_SIZE);
                });
            } else {
                const range = maxPresenca - minPresenca;
                graph.forEachNode((nodeId) => {
                    if (graph.getNodeAttribute(nodeId, 'hidden')) {
                        graph.setNodeAttribute(nodeId, 'size', DEFAULT_SIZE);
                        return;
                    }
                    const dep = graph.getNodeAttribute(nodeId, 'deputyData');
                    if (dep && dep.presenca !== undefined) {
                        const normalized = (Number(dep.presenca) - minPresenca) / range;
                        const size = MIN_SIZE + normalized * (MAX_SIZE - MIN_SIZE);
                        graph.setNodeAttribute(nodeId, 'size', size);
                    } else {
                        graph.setNodeAttribute(nodeId, 'size', DEFAULT_SIZE);
                    }
                });
            }
        } else if (vertexSize === 'conexoes') {
            // Tamanho proporcional ao número de arestas visíveis conectadas ao nó
            const connectionCounts = {};

            // Contar apenas arestas não-escondidas para cada nó visível
            graph.forEachEdge((edgeId, attrs, source, target) => {
                if (graph.getEdgeAttribute(edgeId, 'hidden')) return;

                connectionCounts[source] = (connectionCounts[source] || 0) + 1;
                connectionCounts[target] = (connectionCounts[target] || 0) + 1;
            });

            // Encontrar min e max para normalizar
            let minConn = Infinity;
            let maxConn = -Infinity;
            graph.forEachNode((nodeId) => {
                if (graph.getNodeAttribute(nodeId, 'hidden')) return;
                const count = connectionCounts[nodeId] || 0;
                if (count < minConn) minConn = count;
                if (count > maxConn) maxConn = count;
            });

            if (minConn === Infinity || maxConn === minConn) {
                graph.forEachNode((nodeId) => {
                    graph.setNodeAttribute(nodeId, 'size', DEFAULT_SIZE);
                });
            } else {
                const range = maxConn - minConn;
                graph.forEachNode((nodeId) => {
                    if (graph.getNodeAttribute(nodeId, 'hidden')) {
                        graph.setNodeAttribute(nodeId, 'size', DEFAULT_SIZE);
                        return;
                    }
                    const count = connectionCounts[nodeId] || 0;
                    const normalized = (count - minConn) / range;
                    const size = MIN_SIZE + normalized * (MAX_SIZE - MIN_SIZE);
                    graph.setNodeAttribute(nodeId, 'size', size);
                });
            }
        }
    }, [graph, filters, dataLoaded]);

    useEffect(() => {
        applyFilters();
    }, [applyFilters]);

    const containerStyle = {
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 0,
        backgroundColor: COLORS.backgroundLight,
    };

    const sigmaSettings = useMemo(
        () => ({
            labelDensity: 0.07,
            labelGridCellSize: 60,
            labelRenderedSizeThreshold: 10,
            labelFont: "'Inter', sans-serif",
            labelColor: { color: COLORS.textDark },
            defaultEdgeType: 'line',
            renderEdgeLabels: false,
            zoomingRatio: 1.15,
            zIndex: true,
            minCameraRatio: 0.2,
            maxCameraRatio: 5,
        }),
        [],
    );

    const handleNodeClick = useCallback(
        (nodeId) => {
            if (nodeId === null) {
                onNodeClick(null);
                return;
            }
            const dep = graph.getNodeAttribute(nodeId, 'deputyData');
            const color = graph.getNodeAttribute(nodeId, 'color');
            if (dep) {
                onNodeClick({ ...dep, nodeColor: color, nodeId });
            }
        },
        [graph, onNodeClick],
    );

    return (
        <div style={containerStyle}>
            {dataLoaded ? (
                <SigmaContainer
                    ref={sigmaRef}
                    graph={graph}
                    settings={sigmaSettings}
                    style={{ width: '100%', height: '100%' }}
                >
                    <GraphEventsController setSelectedNode={handleNodeClick} />
                    <GraphSettingsController selectedNode={selectedNode} />
                </SigmaContainer>
            ) : (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                    Carregando dados da API...
                </div>
            )}
        </div>
    );
}
