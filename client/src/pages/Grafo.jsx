import { useState, useCallback } from 'react';
import TopBar from '../components/layout/TopBar';
import FiltersPanel from '../components/FiltersPanel';
import InfoFrame from '../components/layout/InfoFrame';
import DeputyCard from '../components/DeputyCard';
import GraphContainer from '../components/graph/GraphContainer';
import { COLORS } from '../constants/theme';

/**
 * Grafo - Página principal com visualização de grafos
 * Orquestra todos os componentes: grafo no fundo + frames flutuantes por cima
 */
export default function Grafo() {
    const [selectedDeputy, setSelectedDeputy] = useState(null);
    const [filters, setFilters] = useState({
        separateBy: 'partido',
        onlyActive: true,
        highlightPinned: true,
        presence: { min: 0, max: 100 },
        voteSimilarity: { min: 80, max: 100 },
    });

    const pageStyle = {
        width: '100vw',
        height: '100vh',
        backgroundColor: COLORS.backgroundLight,
        position: 'relative',
        overflow: 'hidden',
    };

    const handleNodeClick = useCallback((deputyData) => {
        setSelectedDeputy(deputyData);
    }, []);

    const handleApplyFilters = useCallback((newFilters) => {
        setFilters(newFilters);
        // Deselect ao aplicar filtros
        setSelectedDeputy(null);
    }, []);

    const handleCloseCard = useCallback(() => {
        setSelectedDeputy(null);
    }, []);

    return (
        <div style={pageStyle}>
            {/* Grafo no fundo - ocupa toda a tela */}
            <GraphContainer
                filters={filters}
                selectedNode={selectedDeputy ? String(selectedDeputy.nodeId || selectedDeputy.id) : null}
                onNodeClick={handleNodeClick}
            />

            {/* Barra superior */}
            <TopBar />

            {/* Painel de filtros - canto superior direito */}
            <FiltersPanel onApply={handleApplyFilters} />

            {/* Card de deputado - canto superior esquerdo (aparece ao clicar num vértice) */}
            <DeputyCard
                deputy={selectedDeputy}
                visible={!!selectedDeputy}
                onClose={handleCloseCard}
            />

            {/* Info frame - canto inferior esquerdo */}
            <InfoFrame />
        </div>
    );
}
