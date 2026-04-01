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
    const [deputyList, setDeputyList] = useState([]);
    const [filters, setFilters] = useState({
        separateBy: 'partido',
        onlyActive: true,
        highlightPinned: true,
        presence: { min: 0, max: 100 },
        voteSimilarity: { min: 80, max: 100 },
        vertexSize: 'padrao',
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

    const handleDeputiesLoaded = useCallback((deputies) => {
        setDeputyList(deputies);
    }, []);

    // Quando um deputado é selecionado pela pesquisa no TopBar,
    // simula o mesmo comportamento de clicar no vértice dele
    const handleSearchSelectDeputy = useCallback((dep) => {
        const nodeId = String(dep.id);
        // Usar os mesmos dados que o grafo usa ao clicar num nó
        setSelectedDeputy({
            ...dep,
            nodeId,
        });
    }, []);

    return (
        <div style={pageStyle}>
            {/* Grafo no fundo - ocupa toda a tela */}
            <GraphContainer
                filters={filters}
                selectedNode={selectedDeputy ? String(selectedDeputy.nodeId || selectedDeputy.id) : null}
                onNodeClick={handleNodeClick}
                onDeputiesLoaded={handleDeputiesLoaded}
            />

            {/* Barra superior */}
            <TopBar
                deputyList={deputyList}
                onSelectDeputy={handleSearchSelectDeputy}
            />

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
