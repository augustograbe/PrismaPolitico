import { useRegisterEvents, useSigma } from '@react-sigma/core';
import { useEffect } from 'react';

/**
 * GraphEventsController - Controla eventos de clique e hover no grafo
 * Props:
 * - setSelectedNode: callback quando um nó é clicado (string | null)
 */
export default function GraphEventsController({ setSelectedNode }) {
    const sigma = useSigma();
    const registerEvents = useRegisterEvents();

    useEffect(() => {
        registerEvents({
            clickNode({ node }) {
                const graph = sigma.getGraph();
                if (!graph.getNodeAttribute(node, 'hidden')) {
                    setSelectedNode(node);
                }
            },
            clickStage() {
                setSelectedNode(null);
            },
            enterNode() {
                const mouseLayer = document.querySelector('.sigma-mouse');
                if (mouseLayer) mouseLayer.classList.add('cursor-pointer');
            },
            leaveNode() {
                const mouseLayer = document.querySelector('.sigma-mouse');
                if (mouseLayer) mouseLayer.classList.remove('cursor-pointer');
            },
        });
    }, [registerEvents, sigma, setSelectedNode]);

    return null;
}
