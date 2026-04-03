import { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { SigmaContainer } from '@react-sigma/core';
import Graph from 'graphology';
import forceAtlas2 from 'graphology-layout-forceatlas2';
import { circular, random } from 'graphology-layout';
import noverlap from 'graphology-layout-noverlap';
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
export default function GraphContainer({ filters, graphType = 'similaridade', selectedNode, onNodeClick, onDeputiesLoaded, onMaxCoautoriaLoaded, pinnedIds = [], highlightPinned = true }) {
    const graph = useMemo(() => new Graph(), []);
    const sigmaRef = useRef(null);
    const [dataLoaded, setDataLoaded] = useState(false);
    const [edgesVersion, setEdgesVersion] = useState(0);
    const lastLayoutRef = useRef(null);
    const lastGraphTypeRef = useRef(null);

    // Inicializar o grafo uma vez buscando deputados da API
    useEffect(() => {
        let isMounted = true;
        async function loadNodes() {
            try {
                const depReq = await fetch('http://localhost:8000/api/deputados/');
                const deputados = await depReq.json();

                if (!isMounted) return;

                // Adicionar todos os nós
                deputados.forEach((dep) => {
                    if (!graph.hasNode(String(dep.id))) {
                        graph.addNode(String(dep.id), {
                            label: dep.nome,
                            x: Math.random() * 100,
                            y: Math.random() * 100,
                            size: 8,
                            color: getNodeColor(dep, 'partido'),
                            deputyData: dep,
                        });
                    }
                });

                setDataLoaded(true);
                if (onDeputiesLoaded) onDeputiesLoaded(deputados);

            } catch (error) {
                console.error("Erro ao carregar deputados:", error);
            }
        }

        loadNodes();
        return () => { isMounted = false; };
    }, [graph, onDeputiesLoaded]);

    // Carregar arestas quando o tipo de grafo muda
    const loadEdges = useCallback(async (type) => {
        if (graph.order === 0) return;

        // Remover todas as arestas atuais
        graph.clearEdges();

        const edgeUrl = type === 'coautoria'
            ? 'http://localhost:8000/api/arestas-coautoria/'
            : 'http://localhost:8000/api/arestas/';

        try {
            const res = await fetch(edgeUrl);
            const arestas = await res.json();
            
            let maxC = 0;

            arestas.forEach((sim) => {
                const edgeId = `${sim.deputado_1}-${sim.deputado_2}`;
                const n1 = String(sim.deputado_1);
                const n2 = String(sim.deputado_2);
                
                const cVal = Number(sim.coautoria || 0);
                if (cVal > maxC) maxC = cVal;

                if (graph.hasNode(n1) && graph.hasNode(n2) && !graph.hasEdge(edgeId)) {
                    graph.addEdge(n1, n2, {
                        id: edgeId,
                        size: 1,
                        color: COLORS.edgeDefault,
                        similaridade: Number(sim.similaridade || 0),
                        coautoria: cVal,
                    });
                }
            });

            lastGraphTypeRef.current = type;
            // Forçar re-layout após troca de arestas
            lastLayoutRef.current = null;
            if (type === 'coautoria' && onMaxCoautoriaLoaded) {
                onMaxCoautoriaLoaded(maxC > 0 ? maxC : 50);
            }
            setEdgesVersion(v => v + 1);
        } catch (error) {
            console.error("Erro ao carregar arestas:", error);
        }
    }, [graph, onMaxCoautoriaLoaded]);

    // Efeito: carregar arestas quando dados estiverem prontos ou graphType mudar
    useEffect(() => {
        if (!dataLoaded) return;
        if (lastGraphTypeRef.current !== graphType) {
            loadEdges(graphType);
        }
    }, [dataLoaded, graphType, loadEdges]);

    // Função para aplicar layout ao grafo
    const applyLayout = useCallback((layoutType) => {
        if (graph.order === 0) return;

        try {
            switch (layoutType) {
                case 'forceatlas2_spread': {
                    // Versão espalhada: gravidade muito baixa, repulsion alta (linLogMode) e anti-sobreposição
                    random.assign(graph);
                    const settingsSpread = forceAtlas2.inferSettings(graph);
                    forceAtlas2.assign(graph, {
                        iterations: 200,
                        settings: {
                            ...settingsSpread,
                            gravity: 0.5,
                            scalingRatio: 80,
                            strongGravityMode: false,
                            barnesHutOptimize: true,
                            //linLogMode: true,           // clusters mais separados
                            //adjustSizes: true,          // tenta não sobrepor muito baseado no tamanho
                            edgeWeightInfluence: 0.1,   // reduz atração excessiva de nós com muitas arestas
                        },
                    });
                    // Remove sobreposições com margem maior para espalhar
                    noverlap.assign(graph, {
                        maxIterations: 300,
                        settings: {
                            margin: 180,
                            ratio: 80,
                        },
                    });
                    break;
                }
                case 'forceatlas2_clusters': 
                default: {
                    // Versão com clusters mais definidos - gravidade forte
                    random.assign(graph);
                    const settingsClusters = forceAtlas2.inferSettings(graph);
                    forceAtlas2.assign(graph, {
                        iterations: 200,
                        settings: {
                            ...settingsClusters,
                            gravity: 3,
                            scalingRatio: 10,
                            //strongGravityMode: true,
                            //barnesHutOptimize: true,
                        },
                    });
                    // Pequeno noverlap para os clusters não ficarem 100% ocultos
                    noverlap.assign(graph, {
                        maxIterations: 50,
                        settings: {
                            margin: 1,
                            ratio: 1.2
                        }
                    });
                    break;
                }
            }
        } catch (e) {
            console.error('Erro ao aplicar layout:', e);
        }

        lastLayoutRef.current = layoutType;
    }, [graph]);

    // Aplicar filtros quando mudam
    const applyFilters = useCallback(() => {
        if (!filters || !dataLoaded) return;

        const { separateBy, onlyActive, onlyWithConnections, presence, voteSimilarity, vertexSize, graphLayout } = filters;

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

        // Atualizar arestas baseado no tipo de grafo
        graph.forEachEdge((edgeId, attrs, source, target) => {
            const sourceHidden = graph.getNodeAttribute(source, 'hidden');
            const targetHidden = graph.getNodeAttribute(target, 'hidden');

            let hidden = sourceHidden || targetHidden;

            if (!hidden) {
                if (graphType === 'coautoria') {
                    // Filtrar por coautorias
                    const coaut = attrs.coautoria || 0;
                    const coautoriaRange = filters.coautoria || { min: 1, max: 999 };
                    hidden = coaut < coautoriaRange.min || coaut > coautoriaRange.max;
                } else {
                    // Filtrar por similaridade
                    const sim = attrs.similaridade;
                    hidden = sim < voteSimilarity.min || sim > voteSimilarity.max;
                }
            }

            graph.setEdgeAttribute(edgeId, 'hidden', hidden);
        });

        // Contar arestas válidas por nó (útil para filtro e tamanho)
        const connectionCounts = {};
        graph.forEachEdge((edgeId, attrs, source, target) => {
            if (attrs.hidden) return;
            connectionCounts[source] = (connectionCounts[source] || 0) + 1;
            connectionCounts[target] = (connectionCounts[target] || 0) + 1;
        });

        // Ocultar nós isolados se o filtro estiver ativo
        if (onlyWithConnections) {
            graph.forEachNode((nodeId) => {
                if (graph.getNodeAttribute(nodeId, 'hidden')) return;
                const count = connectionCounts[nodeId] || 0;
                if (count === 0) {
                    graph.setNodeAttribute(nodeId, 'hidden', true);
                }
            });
        }

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
            // Tamanho proporcional ao número de arestas visíveis conectadas ao nó (já calculado acima)

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

        // Aplicar layout se mudou
        const layoutToApply = graphLayout || 'forceatlas2';
        if (lastLayoutRef.current !== layoutToApply) {
            setTimeout(() => applyLayout(layoutToApply), 50);
        }
    }, [graph, filters, dataLoaded, applyLayout, graphType, edgesVersion]);

    useEffect(() => {
        applyFilters();
    }, [applyFilters]);

    // Aplicar layout inicial quando dados carregam
    useEffect(() => {
        if (dataLoaded && !lastLayoutRef.current) {
            setTimeout(() => applyLayout('forceatlas2'), 50);
        }
    }, [dataLoaded, applyLayout]);

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
                // Count visible edges connected to this node
                let conexoes = 0;
                graph.forEachEdge(nodeId, (edgeId) => {
                    if (!graph.getEdgeAttribute(edgeId, 'hidden')) {
                        conexoes++;
                    }
                });
                // Find max connections among all visible nodes
                let maxConexoes = 0;
                graph.forEachNode((nId) => {
                    if (graph.getNodeAttribute(nId, 'hidden')) return;
                    let count = 0;
                    graph.forEachEdge(nId, (eId) => {
                        if (!graph.getEdgeAttribute(eId, 'hidden')) count++;
                    });
                    if (count > maxConexoes) maxConexoes = count;
                });
                onNodeClick({ ...dep, nodeColor: color, nodeId, conexoes, maxConexoes });
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
                    <GraphSettingsController selectedNode={selectedNode} pinnedIds={pinnedIds} highlightPinned={highlightPinned} />
                </SigmaContainer>
            ) : (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                    Carregando dados da API...
                </div>
            )}
        </div>
    );
}
