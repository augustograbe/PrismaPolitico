import { useSigma } from '@react-sigma/core';
import { useEffect, useRef } from 'react';
import { COLORS } from '../../constants/theme';

const NODE_FADE_COLOR = COLORS.nodeFade;
const EDGE_FADE_COLOR = COLORS.edgeFade;
const BORDER_COLOR = COLORS.orange;
const BORDER_SIZE = 3; // pixels

/**
 * Draws a thick border and a pin icon on top of a node using the Canvas 2D API.
 * Called by sigma's afterRenderNodes callback for pinned nodes.
 */
function drawPinnedDecoration(context, x, y, size) {
    // 1. Draw thick orange border
    // The border is drawn around the node (at its boundary)
    context.save();
    context.beginPath();
    context.arc(x, y, size + BORDER_SIZE / 2, 0, Math.PI * 2);
    context.strokeStyle = BORDER_COLOR;
    context.lineWidth = BORDER_SIZE;
    context.stroke();
    context.restore();

    // 2. Draw pin icon (centered)
    const s = size * 0.45;
    context.save();
    context.translate(x, y);

    // Pin body (simple filled shape)
    context.beginPath();
    context.arc(0, -s * 0.15, s * 0.45, 0, Math.PI * 2);
    context.fillStyle = 'rgba(255, 255, 255, 0.95)';
    context.fill();

    // Pin needle
    context.beginPath();
    context.moveTo(0, s * 0.25);
    context.lineTo(0, s * 0.65);
    context.strokeStyle = 'rgba(255, 255, 255, 0.95)';
    context.lineWidth = s * 0.15;
    context.lineCap = 'round';
    context.stroke();

    // Pin head circle outline
    context.beginPath();
    context.arc(0, -s * 0.15, s * 0.45, 0, Math.PI * 2);
    context.strokeStyle = COLORS.orange;
    context.lineWidth = s * 0.12;
    context.stroke();

    context.restore();
}

/**
 * GraphSettingsController - Controla o destaque de vizinhança ao selecionar um nó
 * e o destaque visual dos nós fixados (pinned).
 *
 * Quando um nó é selecionado:
 * - O nó selecionado e seus vizinhos mantêm suas cores
 * - Os outros nós ficam cinza (exceto fixados se highlightPinned)
 * - Apenas arestas conectadas ao nó selecionado são visíveis
 *
 * Quando highlightPinned está ativo:
 * - Nós fixados mantêm sua cor mesmo quando outro nó é selecionado
 * - Nós fixados têm borda laranja grossa (via Canvas)
 * - Nós fixados sempre mostram o label
 * - Nós fixados têm ícone de pin (via Canvas)
 */
export default function GraphSettingsController({ selectedNode, pinnedIds = [], highlightPinned = true }) {
    const sigma = useSigma();
    const graph = sigma.getGraph();
    const cleanupRef = useRef(null);

    useEffect(() => {
        const pinnedSet = new Set(pinnedIds.map(String));
        const shouldHighlightPinned = highlightPinned && pinnedSet.size > 0;

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
                const isPinned = shouldHighlightPinned && pinnedSet.has(node);

                if (node === selectedNode) {
                    return {
                        ...data,
                        zIndex: 2,
                        highlighted: true,
                    };
                }
                if (neighbors.has(node)) {
                    return {
                        ...data,
                        zIndex: 1,
                        forceLabel: isPinned,
                    };
                }
                // Not selected, not neighbor
                if (isPinned) {
                    // Pinned nodes keep color and label visible
                    return {
                        ...data,
                        zIndex: 1,
                        forceLabel: true,
                    };
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
        } else if (shouldHighlightPinned) {
            // No node selected, but pinned highlighting is active
            sigma.setSetting('nodeReducer', (node, data) => {
                if (pinnedSet.has(node)) {
                    return {
                        ...data,
                        forceLabel: true,
                        zIndex: 2,
                    };
                }
                return data;
            });
            sigma.setSetting('edgeReducer', null);
        } else {
            sigma.setSetting('nodeReducer', null);
            sigma.setSetting('edgeReducer', null);
        }

        // Handle the visual decorations (border + pin) on the Canvas layer
        if (cleanupRef.current) {
            cleanupRef.current();
            cleanupRef.current = null;
        }

        if (shouldHighlightPinned) {
            const handler = () => {
                const canvases = sigma.getCanvases();
                const canvas = canvases.labels; // Same canvas layer used for labels
                if (!canvas) return;

                const ctx = canvas.getContext('2d');
                if (!ctx) return;

                pinnedSet.forEach((nodeId) => {
                    if (!graph.hasNode(nodeId)) return;
                    if (graph.getNodeAttribute(nodeId, 'hidden')) return;

                    const nodeDisplayData = sigma.getNodeDisplayData(nodeId);
                    if (!nodeDisplayData) return;

                    drawPinnedDecoration(ctx, nodeDisplayData.x, nodeDisplayData.y, nodeDisplayData.size);
                });
            };

            sigma.on('afterRender', handler);
            cleanupRef.current = () => sigma.off('afterRender', handler);
        }

        sigma.refresh();

        return () => {
            if (cleanupRef.current) {
                cleanupRef.current();
                cleanupRef.current = null;
            }
        };
    }, [selectedNode, pinnedIds, highlightPinned, sigma, graph]);

    return null;
}
