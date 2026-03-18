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
export default function GraphContainer({ filters, selectedNode, onNodeClick }) {
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

            } catch (error) {
                console.error("Erro ao carregar dados do grafo:", error);
            }
        }
        
        loadData();
        return () => { isMounted = false; };
    }, [graph]);

    // Aplicar filtros quando mudam
    const applyFilters = useCallback(() => {
        if (!filters || !dataLoaded) return;

        const { separateBy, onlyActive, presence, voteSimilarity } = filters;

        // Atualizar nós
        graph.forEachNode((nodeId) => {
            const dep = graph.getNodeAttribute(nodeId, 'deputyData');
            if (!dep) return;

            // Cor baseada no critério de separação
            const color = getNodeColor(dep, separateBy);
            graph.setNodeAttribute(nodeId, 'color', color);

            // Visibilidade baseada nos filtros
            let hidden = false;

            // Filtro: apenas em exercício. Se a API real não tiver, consideramos true.
            const isEmExercicio = dep.em_exercicio !== undefined ? dep.em_exercicio : true;
            if (onlyActive && !isEmExercicio) {
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
            hideEdgesOnMove: true,
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
