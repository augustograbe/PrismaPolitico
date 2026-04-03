import { useState, useCallback } from 'react';
import TopBar from '../components/layout/TopBar';
import FiltersPanel from '../components/FiltersPanel';
import InfoFrame from '../components/layout/InfoFrame';
import DeputyCard from '../components/DeputyCard';
import GraphContainer from '../components/graph/GraphContainer';
import Frame from '../components/Frame';
import { COLORS, SPACING, FONTS } from '../constants/theme';

/**
 * Grafo - Página principal com visualização de grafos
 * Orquestra todos os componentes: grafo no fundo + frames flutuantes por cima
 */
export default function Grafo() {
    const [selectedDeputy, setSelectedDeputy] = useState(null);
    const [deputyList, setDeputyList] = useState([]);
    const [graphType, setGraphType] = useState('similaridade');
    const [maxCoautoriaLimit, setMaxCoautoriaLimit] = useState(50);
    const [filters, setFilters] = useState({
        separateBy: 'partido',
        onlyActive: true,
        highlightPinned: true,
        onlyWithConnections: false,
        presence: { min: 0, max: 100 },
        voteSimilarity: { min: 80, max: 100 },
        coautoria: { min: 1, max: 50 },
        vertexSize: 'padrao',
        graphLayout: 'forceatlas2_clusters',
    });

    const graphTypeOptions = [
        { value: 'similaridade', label: 'Similaridade de votos' },
        { value: 'coautoria', label: 'Coautoria' },
    ];

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

    const handleMaxCoautoriaLoaded = useCallback((maxC) => {
        setMaxCoautoriaLimit(maxC);
        setFilters(prev => ({
            ...prev,
            coautoria: { min: 1, max: maxC }
        }));
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

    // Ícone de grafo para o seletor
    const graphIcon = (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={COLORS.orange} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="6" cy="6" r="3" />
            <circle cx="18" cy="6" r="3" />
            <circle cx="12" cy="18" r="3" />
            <line x1="8.5" y1="7.5" x2="10.5" y2="16" />
            <line x1="15.5" y1="7.5" x2="13.5" y2="16" />
            <line x1="9" y1="6" x2="15" y2="6" />
        </svg>
    );

    const selectLargeStyle = {
        appearance: 'none',
        backgroundColor: COLORS.white,
        border: `1px solid ${COLORS.borderMedium}`,
        borderRadius: SPACING.radiusMd,
        padding: `${SPACING.sm} 32px ${SPACING.sm} ${SPACING.md}`,
        fontSize: FONTS.sizeMd,
        fontFamily: FONTS.family,
        color: COLORS.textDark,
        cursor: 'pointer',
        outline: 'none',
        width: '100%',
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1.5L6 6.5L11 1.5' stroke='%23555' stroke-width='2' stroke-linecap='round'/%3E%3C/svg%3E")`,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: `right ${SPACING.md} center`,
    };

    return (
        <div style={pageStyle}>
            {/* Grafo no fundo - ocupa toda a tela */}
            <GraphContainer
                filters={filters}
                graphType={graphType}
                selectedNode={selectedDeputy ? String(selectedDeputy.nodeId || selectedDeputy.id) : null}
                onNodeClick={handleNodeClick}
                onDeputiesLoaded={handleDeputiesLoaded}
                onMaxCoautoriaLoaded={handleMaxCoautoriaLoaded}
            />

            {/* Barra superior */}
            <TopBar
                deputyList={deputyList}
                onSelectDeputy={handleSearchSelectDeputy}
            />

            {/* Painel de filtros - canto superior direito */}
            <FiltersPanel 
                onApply={handleApplyFilters} 
                graphType={graphType} 
                maxCoautoriaLimit={maxCoautoriaLimit}
            />

            {/* Card de deputado - canto superior esquerdo (aparece ao clicar num vértice) */}
            <DeputyCard
                deputy={selectedDeputy}
                visible={!!selectedDeputy}
                onClose={handleCloseCard}
            />

            {/* Info frame - canto inferior esquerdo */}
            <InfoFrame />

            {/* Seletor de grafo - acima dos filtros */}
            <Frame
                width="250px"
                height="auto"
                position={{
                    top: `calc(52px + ${SPACING.frameGap} + ${SPACING.frameGap})`,
                    right: SPACING.frameGap,
                }}
                title={
                    <span style={{ display: 'flex', alignItems: 'center', gap: SPACING.sm }}>
                        {graphIcon} Selecionar grafo
                    </span>
                }
            >
                <div style={{ padding: `0 ${SPACING.lg} ${SPACING.lg}` }}>
                    <select
                        id="graph-type-selector"
                        value={graphType}
                        onChange={(e) => setGraphType(e.target.value)}
                        style={selectLargeStyle}
                    >
                        {graphTypeOptions.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                                {opt.label}
                            </option>
                        ))}
                    </select>
                </div>
            </Frame>
        </div>
    );
}
