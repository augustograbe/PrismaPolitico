import { useSigma } from '@react-sigma/core';
import { useEffect } from 'react';
import { COLORS } from '../../constants/theme';

const NODE_FADE_COLOR = COLORS.nodeFade;
const EDGE_FADE_COLOR = COLORS.edgeFade;

/**
 * GraphSettingsController - Controla o destaque de vizinhança ao selecionar um nó
 * Quando um nó é selecionado:
 * - O nó selecionado e seus vizinhos mantêm suas cores
 * - Os outros nós ficam cinza
 * - Apenas arestas conectadas ao nó selecionado são visíveis
 */
export default function GraphSettingsController({ selectedNode }) {
    const sigma = useSigma();
    const graph = sigma.getGraph();

    useEffect(() => {
        if (selectedNode) {
            const selectedColor = graph.getNodeAttribute(selectedNode, 'color') || COLORS.orange;

            // Pegar vizinhos apenas por arestas visíveis (não hidden)
            const neighbors = new Set();
            graph.forEachEdge(selectedNode, (edge, attrs, source, target) => {
                if (!attrs.hidden) {
                    const neighbor = source === selectedNode ? target : source;
                    if (!graph.getNodeAttribute(neighbor, 'hidden')) {
                        neighbors.add(neighbor);
                    }
                }
            });

            sigma.setSetting('nodeReducer', (node, data) => {
                if (node === selectedNode) {
                    return { ...data, zIndex: 2, highlighted: true };
                }
                if (neighbors.has(node)) {
                    return { ...data, zIndex: 1 };
                }
                return {
                    ...data,
                    zIndex: 0,
                    label: '',
                    color: NODE_FADE_COLOR,
                    highlighted: false,
                };
            });

            sigma.setSetting('edgeReducer', (edge, data) => {
                if (graph.hasExtremity(edge, selectedNode) && !data.hidden) {
                    return { ...data, color: selectedColor, size: 2 };
                }
                return { ...data, color: EDGE_FADE_COLOR, hidden: true };
            });
        } else {
            sigma.setSetting('nodeReducer', null);
            sigma.setSetting('edgeReducer', null);
        }

        sigma.refresh();
    }, [selectedNode, sigma, graph]);

    return null;
}
